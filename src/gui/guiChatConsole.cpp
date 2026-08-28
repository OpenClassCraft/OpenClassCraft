// Luanti
// SPDX-License-Identifier: LGPL-2.1-or-later
// Copyright (C) 2013 celeron55, Perttu Ahola <celeron55@gmail.com>

#include "guiChatConsole.h"
#include "chat.h"
#include "client/client.h"
#include "client/keycode.h"
#include "settings.h"
#include "porting.h"
#include "client/texturesource.h"
#include "client/fontengine.h"
#include "log.h"
#include "gettext.h"
#include "irrlicht_changes/CGUITTFont.h"
#include "util/string.h"
#include "guiScrollBar.h"
#include <IOSOperator.h>
#include <IVideoDriver.h>
#include <string>

inline u32 clamp_u8(s32 value)
{
	return (u32) MYMIN(MYMAX(value, 0), 255);
}

inline bool isInCtrlKeys(const EKEY_CODE& kc)
{
	return kc == KEY_LCONTROL || kc == KEY_RCONTROL || kc == KEY_CONTROL;
}

inline u32 getScrollbarSize(IGUIEnvironment* env)
{
	return env->getSkin()->getSize(gui::EGDS_SCROLLBAR_SIZE);
}

GUIChatConsole::GUIChatConsole(
		gui::IGUIEnvironment* env,
		gui::IGUIElement* parent,
		s32 id,
		ChatBackend* backend,
		Client* client,
		IMenuManager* menumgr
):
	IGUIElement(gui::EGUIET_ELEMENT, env, parent, id,
			core::rect<s32>(0,0,100,100)),
	m_chat_backend(backend),
	m_client(client),
	m_menumgr(menumgr),
	m_animate_time_old(porting::getTimeMs())
{
	// load background settings
	s32 console_alpha = g_settings->getS32("console_alpha");
	m_background_color.setAlpha(clamp_u8(console_alpha));

	// load the background texture depending on settings
	ITextureSource *tsrc = client->getTextureSource();
	if (tsrc->isKnownSourceImage("background_chat.jpg")) {
		m_background = tsrc->getTexture("background_chat.jpg");
		m_background_color.setRed(255);
		m_background_color.setGreen(255);
		m_background_color.setBlue(255);
	} else {
		v3f console_color = g_settings->getV3F("console_color").value_or(v3f());
		m_background_color.setRed(clamp_u8(myround(console_color.X)));
		m_background_color.setGreen(clamp_u8(myround(console_color.Y)));
		m_background_color.setBlue(clamp_u8(myround(console_color.Z)));
	}

	const u16 chat_font_size = g_settings->getU16("chat_font_size");
	m_font.grab(g_fontengine->getFont(chat_font_size != 0 ?
		rangelim(chat_font_size, 5, 72) : FONT_SIZE_UNSPECIFIED, FM_Mono));

	if (!m_font) {
		errorstream << "GUIChatConsole: Unable to load mono font" << std::endl;
	} else {
		core::dimension2d<u32> dim = m_font->getDimension(L"M");
		m_fontsize = v2u32(dim.Width, dim.Height);
	}
	m_fontsize.X = MYMAX(m_fontsize.X, 1);
	m_fontsize.Y = MYMAX(m_fontsize.Y, 1);

	// set default cursor options
	setCursor(true, true, 2.0, 0.1);

	// track ctrl keys for mouse event
	m_is_ctrl_down = false;
	m_cache_clickable_chat_weblinks = g_settings->getBool("clickable_chat_weblinks");

	m_scrollbar.reset(new GUIScrollBar(env, this, -1, core::rect<s32>(0, 0, 30, m_height), false, tsrc));
	m_scrollbar->setSubElement(true);
	m_scrollbar->setLargeStep(1);
	m_scrollbar->setSmallStep(1);
}

void GUIChatConsole::openConsole(f32 scale)
{
	if (m_open)
		return;

	assert(scale > 0.0f && scale <= 1.0f);

	m_open = true;

	m_desired_height_fraction = scale;
	m_desired_height = scale * m_screensize.Y;
	reformatConsole();
	m_animate_time_old = porting::getTimeMs();
	IGUIElement::setVisible(true);
	m_menumgr->createdMenu(this);
}

bool GUIChatConsole::isOpen() const
{
	return m_open;
}

bool GUIChatConsole::isOpenInhibited() const
{
	return m_open_inhibited > 0;
}

void GUIChatConsole::closeConsole()
{
	m_open = false;
	m_menumgr->deletingMenu(this);
	m_scrollbar->setVisible(false);
}

void GUIChatConsole::closeConsoleAtOnce()
{
	closeConsole();
	m_height = 0;
	recalculateConsolePosition();
}

void GUIChatConsole::replaceAndAddToHistory(const std::wstring &line)
{
	ChatPrompt& prompt = m_chat_backend->getPrompt();
	prompt.addToHistory(prompt.getLine());
	prompt.replace(line);
}


void GUIChatConsole::setCursor(
	bool visible, bool blinking, f32 blink_speed, f32 relative_height)
{
	if (visible)
	{
		if (blinking)
		{
			// leave m_cursor_blink unchanged
			m_cursor_blink_speed = blink_speed;
		}
		else
		{
			m_cursor_blink = 0x8000;  // on
			m_cursor_blink_speed = 0.0;
		}
	}
	else
	{
		m_cursor_blink = 0;  // off
		m_cursor_blink_speed = 0.0;
	}
	m_cursor_height = relative_height;
}

void GUIChatConsole::draw()
{
	if(!IsVisible)
		return;

	video::IVideoDriver* driver = Environment->getVideoDriver();

	// Check screen size
	v2u32 screensize = driver->getScreenSize();
	if (screensize != m_screensize)
	{
		// screen size has changed
		// scale current console height to new window size
		if (m_screensize.Y != 0)
			m_height = m_height * screensize.Y / m_screensize.Y;
		m_screensize = screensize;
		m_desired_height = m_desired_height_fraction * m_screensize.Y;
		reformatConsole();
	} else if (!m_scrollbar->getAbsolutePosition().isPointInside(core::vector2di(screensize.X, m_height))) {
		// the height of the chat window is no longer the height of the scrollbar
		// happens while opening/closing the window
		updateScrollbar(true);
	}

	// Animation
	u64 now = porting::getTimeMs();
	animate(now - m_animate_time_old);
	m_animate_time_old = now;

	// Draw console elements if visible
	if (m_height > 0)
	{
		drawBackground();
		drawText();
		drawPrompt();
	}

	gui::IGUIElement::draw();
}

void GUIChatConsole::reformatConsole()
{
	const s32 margin = getCardMargin();
	const s32 padding = getPanelPadding();
	const s32 scrollbar = getScrollbarSize(Environment);
	const s32 message_width = (s32)m_screensize.X - 2 * margin -
			2 * padding - scrollbar;
	const s32 message_height = (s32)m_desired_height - 2 * margin -
			getHeaderHeight() - getInputHeight() - padding;

	// Reserve a few columns for the visible "MESSAGE" label in the composer.
	// The output uses the same width, keeping wrapping predictable.
	s32 cols = message_width / (s32)m_fontsize.X - 10;
	s32 rows = message_height / (s32)m_fontsize.Y;
	if (cols <= 0 || rows <= 0)
		cols = rows = 0;

	updateScrollbar(true);

	recalculateConsolePosition();
	m_chat_backend->reformat(cols, rows);
}

s32 GUIChatConsole::getCardMargin() const
{
	return MYMAX(14, (s32)m_fontsize.Y);
}

s32 GUIChatConsole::getPanelPadding() const
{
	return MYMAX(10, (s32)m_fontsize.Y / 2);
}

s32 GUIChatConsole::getHeaderHeight() const
{
	return (s32)m_fontsize.Y + 22;
}

s32 GUIChatConsole::getInputHeight() const
{
	return (s32)m_fontsize.Y + 22;
}

core::rect<s32> GUIChatConsole::getCardRect() const
{
	const s32 margin = getCardMargin();
	const s32 slide = m_height - (s32)m_desired_height;
	return core::rect<s32>(margin, margin + slide,
			(s32)m_screensize.X - margin, m_height - margin);
}

core::rect<s32> GUIChatConsole::getMessageRect() const
{
	const core::rect<s32> card = getCardRect();
	const s32 padding = getPanelPadding();
	return core::rect<s32>(card.UpperLeftCorner.X + padding,
			card.UpperLeftCorner.Y + getHeaderHeight(),
			card.LowerRightCorner.X - padding,
			card.LowerRightCorner.Y - getInputHeight() - padding);
}

core::rect<s32> GUIChatConsole::getInputRect() const
{
	const core::rect<s32> card = getCardRect();
	return core::rect<s32>(card.UpperLeftCorner.X,
			card.LowerRightCorner.Y - getInputHeight(),
			card.LowerRightCorner.X, card.LowerRightCorner.Y);
}

void GUIChatConsole::recalculateConsolePosition()
{
	core::rect<s32> rect(0, 0, m_screensize.X, m_height);
	DesiredRect = rect;
	recalculateAbsolutePosition(false);
}

void GUIChatConsole::animate(u32 msec)
{
	// animate the console height
	s32 goal = m_open ? m_desired_height : 0;

	// Set invisible if close animation finished (reset by openConsole)
	// This function (animate()) is never called once its visibility becomes false so do not
	//		actually set visible to false before the inhibited period is over
	if (!m_open && m_height == 0 && m_open_inhibited == 0)
		IGUIElement::setVisible(false);

	if (m_height != goal)
	{
		s32 max_change = msec * m_screensize.Y * (m_height_speed / 1000.0);
		if (max_change == 0)
			max_change = 1;

		if (m_height < goal)
		{
			// increase height
			if (m_height + max_change < goal)
				m_height += max_change;
			else
				m_height = goal;
		}
		else
		{
			// decrease height
			if (m_height > goal + max_change)
				m_height -= max_change;
			else
				m_height = goal;
		}

		recalculateConsolePosition();
	}

	// blink the cursor
	if (m_cursor_blink_speed != 0.0)
	{
		u32 blink_increase = 0x10000 * msec * (m_cursor_blink_speed / 1000.0);
		if (blink_increase == 0)
			blink_increase = 1;
		m_cursor_blink = ((m_cursor_blink + blink_increase) & 0xffff);
	}

	// decrease open inhibit counter
	if (m_open_inhibited > msec)
		m_open_inhibited -= msec;
	else
		m_open_inhibited = 0;
}

void GUIChatConsole::drawBackground()
{
	video::IVideoDriver* driver = Environment->getVideoDriver();
	const bool high_contrast = g_settings->getBool("openclasscraft_high_contrast");
	const core::rect<s32> card = getCardRect();
	if (card.LowerRightCorner.Y <= card.UpperLeftCorner.Y)
		return;

	core::rect<s32> shadow = card;
	shadow.UpperLeftCorner += v2s32(5, 6);
	shadow.LowerRightCorner += v2s32(5, 6);
	driver->draw2DRectangle(video::SColor(82, 0, 0, 0), shadow,
			&AbsoluteClippingRect);

	const video::SColor panel = high_contrast ?
			video::SColor(255, 0, 0, 0) : video::SColor(247, 20, 39, 30);
	const video::SColor conversation = high_contrast ?
			video::SColor(255, 0, 0, 0) : video::SColor(238, 27, 51, 40);
	const video::SColor surface = high_contrast ?
			video::SColor(255, 255, 255, 255) : video::SColor(255, 242, 247, 243);

	driver->draw2DRectangle(panel, card, &AbsoluteClippingRect);

	core::rect<s32> header = card;
	header.LowerRightCorner.Y = header.UpperLeftCorner.Y + getHeaderHeight();
	driver->draw2DRectangle(surface, header, &AbsoluteClippingRect);

	const core::rect<s32> messages = getMessageRect();
	if (messages.LowerRightCorner.Y > messages.UpperLeftCorner.Y)
		driver->draw2DRectangle(conversation, messages, &AbsoluteClippingRect);

	const core::rect<s32> input = getInputRect();
	if (input.LowerRightCorner.Y > input.UpperLeftCorner.Y)
		driver->draw2DRectangle(surface, input, &AbsoluteClippingRect);

	core::rect<s32> accent = card;
	accent.LowerRightCorner.X = accent.UpperLeftCorner.X + 5;
	driver->draw2DRectangle(high_contrast ? video::SColor(255, 255, 211, 0) :
			video::SColor(255, 46, 166, 103), accent, &AbsoluteClippingRect);
}

void GUIChatConsole::drawText()
{
	if (!m_font)
		return;

	ChatBuffer& buf = m_chat_backend->getConsoleBuffer();
	const core::rect<s32> card = getCardRect();
	const core::rect<s32> messages = getMessageRect();
	if (messages.LowerRightCorner.Y <= messages.UpperLeftCorner.Y)
		return;

	const bool high_contrast = g_settings->getBool("openclasscraft_high_contrast");
	const s32 padding = getPanelPadding();
	const video::SColor heading_color = high_contrast ?
			video::SColor(255, 0, 0, 0) : video::SColor(255, 20, 65, 43);
	const video::SColor hint_color = high_contrast ?
			video::SColor(255, 0, 0, 0) : video::SColor(255, 67, 101, 82);
	const std::wstring title = L"OPENCLASSCRAFT   CLASS CHAT";
	const std::wstring hint = L"/  ACTIONS";
	const s32 header_y = card.UpperLeftCorner.Y +
			(getHeaderHeight() - (s32)m_fontsize.Y) / 2;
	core::rect<s32> title_rect(card.UpperLeftCorner.X + padding, header_y,
			card.LowerRightCorner.X - padding, header_y + m_fontsize.Y);
	m_font->draw(title.c_str(), title_rect, heading_color, false, false,
			&AbsoluteClippingRect);

	const u32 hint_width = m_font->getDimension(hint.c_str()).Width;
	core::rect<s32> hint_rect(card.LowerRightCorner.X - padding - hint_width,
			header_y, card.LowerRightCorner.X - padding,
			header_y + m_fontsize.Y);
	m_font->draw(hint.c_str(), hint_rect, hint_color, false, false,
			&AbsoluteClippingRect);

	core::rect<s32> text_clip = messages;
	if (m_scrollbar->isVisible())
		text_clip.LowerRightCorner.X -= getScrollbarSize(Environment);

	for (u32 row = 0; row < buf.getRows(); ++row)
	{
		const ChatFormattedLine& line = buf.getFormattedLine(row);
		if (line.fragments.empty())
			continue;

		s32 line_height = m_fontsize.Y;
		s32 y = messages.UpperLeftCorner.Y + row * line_height;
		if (y + line_height < messages.UpperLeftCorner.Y ||
				y >= messages.LowerRightCorner.Y)
			continue;

		for (const ChatFormattedFragment &fragment : line.fragments) {
			s32 x = messages.UpperLeftCorner.X +
					(fragment.column + 1) * m_fontsize.X;
			core::rect<s32> destrect(
				x, y, x + m_fontsize.X * fragment.text.size(), y + m_fontsize.Y);

			if (m_font->getType() == gui::EGFT_CUSTOM) {
				// Draw colored text if possible
				auto *tmp = static_cast<gui::CGUITTFont*>(m_font.get());
				tmp->draw(
					fragment.text,
					destrect,
					false,
					false,
					&text_clip);
			} else {
				// Otherwise use standard text
				m_font->draw(
					fragment.text.c_str(),
					destrect,
					video::SColor(255, 255, 255, 255),
					false,
					false,
					&text_clip);
			}
		}
	}

	updateScrollbar();
}

void GUIChatConsole::drawPrompt()
{
	if (!m_font)
		return;

	ChatPrompt& prompt = m_chat_backend->getPrompt();
	std::wstring prompt_text = prompt.getVisiblePortion();
	if (!prompt_text.empty() && prompt_text[0] == L']')
		prompt_text.erase(0, 1);

	u32 font_width  = m_fontsize.X;
	u32 font_height = m_fontsize.Y;

	core::dimension2d<u32> size = m_font->getDimension(prompt_text.c_str());
	u32 text_width = size.Width;
	if (size.Height > font_height)
		font_height = size.Height;

	const bool high_contrast = g_settings->getBool("openclasscraft_high_contrast");
	const core::rect<s32> input = getInputRect();
	if (input.LowerRightCorner.Y <= input.UpperLeftCorner.Y)
		return;
	const s32 padding = getPanelPadding();
	const std::wstring label = L"MESSAGE";
	const u32 label_width = m_font->getDimension(label.c_str()).Width;
	const s32 y = input.UpperLeftCorner.Y +
			(input.getHeight() - (s32)font_height) / 2;
	const video::SColor label_color = high_contrast ?
			video::SColor(255, 0, 0, 0) : video::SColor(255, 24, 121, 75);
	const video::SColor text_color = video::SColor(255, 20, 37, 29);
	core::rect<s32> label_rect(input.UpperLeftCorner.X + padding, y,
			input.UpperLeftCorner.X + padding + label_width, y + font_height);
	m_font->draw(label.c_str(), label_rect, label_color, false, false, &input);
	const s32 text_x = label_rect.LowerRightCorner.X + padding;

	core::rect<s32> destrect(
		text_x, y, text_x + text_width, y + font_height);
	m_font->draw(
		prompt_text.c_str(),
		destrect,
		text_color,
		false,
		false,
		&input);

	// Draw the cursor during on periods
	if ((m_cursor_blink & 0x8000) != 0)
	{
		s32 cursor_pos = prompt.getVisibleCursorPosition() - 1;

		if (cursor_pos >= 0)
		{

			u32 text_to_cursor_pos_width = m_font->getDimension(prompt_text.substr(0, cursor_pos).c_str()).Width;

			s32 cursor_len = prompt.getCursorLength();
			video::IVideoDriver* driver = Environment->getVideoDriver();
			s32 x = text_x + text_to_cursor_pos_width;
			core::rect<s32> destrect(
				x,
				y + font_height * (1.0 - m_cursor_height),
				x + font_width * MYMAX(cursor_len, 1),
				y + font_height * (cursor_len ? m_cursor_height+1 : 1)
			);
			video::SColor cursor_color = high_contrast ?
					video::SColor(255, 0, 0, 0) : video::SColor(255, 24, 121, 75);
			driver->draw2DRectangle(
				cursor_color,
				destrect,
				&input);
		}
	}

}

bool GUIChatConsole::OnEvent(const SEvent& event)
{

	ChatPrompt &prompt = m_chat_backend->getPrompt();

	if (event.EventType == EET_KEY_INPUT_EVENT && !event.KeyInput.PressedDown)
	{
		// CTRL up
		if (isInCtrlKeys(event.KeyInput.Key))
		{
			m_is_ctrl_down = false;
		}
	}
	else if(event.EventType == EET_KEY_INPUT_EVENT && event.KeyInput.PressedDown)
	{
		// CTRL down
		if (isInCtrlKeys(event.KeyInput.Key)) {
			m_is_ctrl_down = true;
		}

		// Key input
		if (keySettingHasMatch("keymap_console", event.KeyInput)) {
			closeConsole();

			// inhibit open so the_game doesn't reopen immediately
			m_open_inhibited = 50;
			m_close_on_enter = false;
			return true;
		}

		// Mac OS sends private use characters along with some keys.
		bool has_char = event.KeyInput.Char && !event.KeyInput.Control &&
				!iswcntrl(event.KeyInput.Char) && !IS_PRIVATE_USE_CHAR(event.KeyInput.Char);

		if (event.KeyInput.Key == KEY_ESCAPE) {
			closeConsoleAtOnce();
			m_close_on_enter = false;
			// inhibit open so the_game doesn't reopen immediately
			m_open_inhibited = 1; // so the ESCAPE button doesn't open the "pause menu"
			return true;
		}
		else if(event.KeyInput.Key == KEY_PRIOR)
		{
			if (!has_char) { // no num lock
				m_chat_backend->scrollPageUp();
				return true;
			}
		}
		else if(event.KeyInput.Key == KEY_NEXT)
		{
			if (!has_char) { // no num lock
				m_chat_backend->scrollPageDown();
				return true;
			}
		}
		else if(event.KeyInput.Key == KEY_RETURN)
		{
			prompt.addToHistory(prompt.getLine());
			std::wstring text = prompt.replace(L"");
			m_client->typeChatMessage(text);
			if (m_close_on_enter) {
				closeConsoleAtOnce();
				m_close_on_enter = false;
			}
			return true;
		}
		else if(event.KeyInput.Key == KEY_UP)
		{
			if (!has_char) { // no num lock
				// Up pressed
				// Move back in history
				prompt.historyPrev();
				return true;
			}
		}
		else if(event.KeyInput.Key == KEY_DOWN)
		{
			if (!has_char) { // no num lock
				// Down pressed
				// Move forward in history
				prompt.historyNext();
				return true;
			}
		}
		else if(event.KeyInput.Key == KEY_LEFT || event.KeyInput.Key == KEY_RIGHT)
		{
			if (!has_char) { // no num lock
				// Left/right pressed
				// Move/select character/word to the left depending on control and shift keys
				ChatPrompt::CursorOp op = event.KeyInput.Shift ?
					ChatPrompt::CURSOROP_SELECT :
					ChatPrompt::CURSOROP_MOVE;
				ChatPrompt::CursorOpDir dir = event.KeyInput.Key == KEY_LEFT ?
					ChatPrompt::CURSOROP_DIR_LEFT :
					ChatPrompt::CURSOROP_DIR_RIGHT;
				ChatPrompt::CursorOpScope scope = event.KeyInput.Control ?
					ChatPrompt::CURSOROP_SCOPE_WORD :
					ChatPrompt::CURSOROP_SCOPE_CHARACTER;
				prompt.cursorOperation(op, dir, scope);

				if (op == ChatPrompt::CURSOROP_SELECT)
					updatePrimarySelection();
				return true;
			}
		}
		else if(event.KeyInput.Key == KEY_HOME)
		{
			if (!has_char) { // no num lock
				// Home pressed
				// move to beginning of line
				prompt.cursorOperation(
					ChatPrompt::CURSOROP_MOVE,
					ChatPrompt::CURSOROP_DIR_LEFT,
					ChatPrompt::CURSOROP_SCOPE_LINE);
				return true;
			}
		}
		else if(event.KeyInput.Key == KEY_END)
		{
			if (!has_char) { // no num lock
				// End pressed
				// move to end of line
				prompt.cursorOperation(
					ChatPrompt::CURSOROP_MOVE,
					ChatPrompt::CURSOROP_DIR_RIGHT,
					ChatPrompt::CURSOROP_SCOPE_LINE);
				return true;
			}
		}
		else if(event.KeyInput.Key == KEY_BACK)
		{
			// Backspace or Ctrl-Backspace pressed
			// delete character / word to the left
			ChatPrompt::CursorOpScope scope =
				event.KeyInput.Control ?
				ChatPrompt::CURSOROP_SCOPE_WORD :
				ChatPrompt::CURSOROP_SCOPE_CHARACTER;
			prompt.cursorOperation(
				ChatPrompt::CURSOROP_DELETE,
				ChatPrompt::CURSOROP_DIR_LEFT,
				scope);
			return true;
		}
		else if(event.KeyInput.Key == KEY_DELETE)
		{
			if (!has_char) { // no num lock
				// Delete or Ctrl-Delete pressed
				// delete character / word to the right
				ChatPrompt::CursorOpScope scope =
					event.KeyInput.Control ?
					ChatPrompt::CURSOROP_SCOPE_WORD :
					ChatPrompt::CURSOROP_SCOPE_CHARACTER;
				prompt.cursorOperation(
					ChatPrompt::CURSOROP_DELETE,
					ChatPrompt::CURSOROP_DIR_RIGHT,
					scope);
				return true;
			}
		}
		else if(event.KeyInput.Key == KEY_KEY_A && event.KeyInput.Control)
		{
			// Ctrl-A pressed
			// Select all text
			prompt.cursorOperation(
				ChatPrompt::CURSOROP_SELECT,
				ChatPrompt::CURSOROP_DIR_LEFT, // Ignored
				ChatPrompt::CURSOROP_SCOPE_LINE);

			updatePrimarySelection();
			return true;
		}
		else if(event.KeyInput.Key == KEY_KEY_C && event.KeyInput.Control)
		{
			// Ctrl-C pressed
			// Copy text to clipboard
			if (prompt.getCursorLength() <= 0)
				return true;
			std::wstring wselected = prompt.getSelection();
			std::string selected = wide_to_utf8(wselected);
			Environment->getOSOperator()->copyToClipboard(selected.c_str());
			return true;
		}
		else if(event.KeyInput.Key == KEY_KEY_V && event.KeyInput.Control)
		{
			// Ctrl-V pressed
			// paste text from clipboard
			if (prompt.getCursorLength() > 0) {
				// Delete selected section of text
				prompt.cursorOperation(
					ChatPrompt::CURSOROP_DELETE,
					ChatPrompt::CURSOROP_DIR_LEFT, // Ignored
					ChatPrompt::CURSOROP_SCOPE_SELECTION);
			}
			IOSOperator *os_operator = Environment->getOSOperator();
			const c8 *text = os_operator->getTextFromClipboard();
			if (!text)
				return true;
			prompt.input(utf8_to_wide(text));
			return true;
		}
		else if(event.KeyInput.Key == KEY_KEY_X && event.KeyInput.Control)
		{
			// Ctrl-X pressed
			// Cut text to clipboard
			if (prompt.getCursorLength() <= 0)
				return true;
			std::wstring wselected = prompt.getSelection();
			std::string selected = wide_to_utf8(wselected);
			Environment->getOSOperator()->copyToClipboard(selected.c_str());
			prompt.cursorOperation(
				ChatPrompt::CURSOROP_DELETE,
				ChatPrompt::CURSOROP_DIR_LEFT, // Ignored
				ChatPrompt::CURSOROP_SCOPE_SELECTION);
			return true;
		}
		else if(event.KeyInput.Key == KEY_KEY_U && event.KeyInput.Control)
		{
			// Ctrl-U pressed
			// kill line to left end
			prompt.cursorOperation(
				ChatPrompt::CURSOROP_DELETE,
				ChatPrompt::CURSOROP_DIR_LEFT,
				ChatPrompt::CURSOROP_SCOPE_LINE);
			return true;
		}
		else if(event.KeyInput.Key == KEY_KEY_K && event.KeyInput.Control)
		{
			// Ctrl-K pressed
			// kill line to right end
			prompt.cursorOperation(
				ChatPrompt::CURSOROP_DELETE,
				ChatPrompt::CURSOROP_DIR_RIGHT,
				ChatPrompt::CURSOROP_SCOPE_LINE);
			return true;
		}
		else if(event.KeyInput.Key == KEY_TAB)
		{
			// Tab or Shift-Tab pressed
			// Nick completion
			auto names = m_client->getConnectedPlayerNames();
			bool backwards = event.KeyInput.Shift;
			prompt.nickCompletion(names, backwards);
			return true;
		}

		if (has_char) {
			prompt.input(event.KeyInput.Char);
			return true;
		}
	}
	else if(event.EventType == EET_MOUSE_INPUT_EVENT)
	{
		if (event.MouseInput.Event == EMIE_MOUSE_WHEEL)
		{
			s32 rows = myround(-3.0 * event.MouseInput.Wheel);
			m_chat_backend->scroll(rows);
		}
		// Middle click or ctrl-click opens weblink, if enabled in config
		// Otherwise, middle click pastes primary selection
		else if (event.MouseInput.Event == EMIE_MMOUSE_PRESSED_DOWN ||
				(event.MouseInput.Event == EMIE_LMOUSE_PRESSED_DOWN && m_is_ctrl_down))
		{
			const core::rect<s32> messages = getMessageRect();
			const v2s32 mouse_pos(event.MouseInput.X, event.MouseInput.Y);
			// If clicked within the inset conversation region.
			if (messages.isPointInside(mouse_pos))
			{
				// Translate pixel position to font position
				const s32 col = (event.MouseInput.X - messages.UpperLeftCorner.X) /
						(s32)m_fontsize.X;
				const s32 row = (event.MouseInput.Y - messages.UpperLeftCorner.Y) /
						(s32)m_fontsize.Y;
				bool was_url_pressed = m_cache_clickable_chat_weblinks &&
						row >= 0 &&
						row < (s32)m_chat_backend->getConsoleBuffer().getRows() &&
						weblinkClick(col, row);

				if (!was_url_pressed
						&& event.MouseInput.Event == EMIE_MMOUSE_PRESSED_DOWN) {
					// Paste primary selection at cursor pos
					const c8 *text = Environment->getOSOperator()
							->getTextFromPrimarySelection();
					if (text)
						prompt.input(utf8_to_wide(text));
				}
			}
		}
	}
	else if(event.EventType == EET_STRING_INPUT_EVENT)
	{
		prompt.input(std::wstring(event.StringInput.Str->c_str()));
		return true;
	}
	else if (event.EventType == EET_GUI_EVENT && event.GUIEvent.EventType == EGET_SCROLL_BAR_CHANGED &&
			(void*) event.GUIEvent.Caller == (void*) m_scrollbar.get())
	{
		m_chat_backend->getConsoleBuffer().scrollAbsolute(m_scrollbar->getPos());
	}

	return Parent ? Parent->OnEvent(event) : false;
}

void GUIChatConsole::setVisible(bool visible)
{
	m_open = visible;
	IGUIElement::setVisible(visible);
	if (!visible) {
		m_height = 0;
		recalculateConsolePosition();
	}
	m_scrollbar->setVisible(visible);
}

bool GUIChatConsole::weblinkClick(s32 col, s32 row)
{
	// Prevent accidental rapid clicking
	static u64 s_oldtime = 0;
	u64 newtime = porting::getTimeMs();

	// 0.6 seconds should suffice
	if (newtime - s_oldtime < 600)
		return false;
	s_oldtime = newtime;

	const std::vector<ChatFormattedFragment> &
			frags = m_chat_backend->getConsoleBuffer().getFormattedLine(row).fragments;
	std::string weblink = ""; // from frag meta

	// Identify targeted fragment, if exists
	int indx = frags.size() - 1;
	if (indx < 0) {
		// Invalid row, frags is empty
		return false;
	}
	// Scan from right to left, offset by 1 font space because left margin
	while (indx > -1 && (u32)col < frags[indx].column + 1) {
		--indx;
	}
	if (indx > -1) {
		weblink = frags[indx].weblink;
		// Note if(indx < 0) then a frag somehow had a corrupt column field
	}

	/*
	// Debug help. Please keep this in case adjustments are made later.
	std::string ws;
	ws = "Middleclick: (" + std::to_string(col) + ',' + std::to_string(row) + ')' + " frags:";
	// show all frags <position>(<length>) for the clicked row
	for (u32 i=0;i<frags.size();++i) {
		if (indx == int(i))
			// tag the actual clicked frag
			ws += '*';
		ws += std::to_string(frags.at(i).column) + '('
			+ std::to_string(frags.at(i).text.size()) + "),";
	}
	actionstream << ws << std::endl;
	*/

	// User notification
	if (weblink.size() != 0) {
		std::ostringstream msg;
		msg << " * ";
		if (porting::open_url(weblink)) {
			msg << gettext("Opening webpage");
		}
		else {
			msg << gettext("Failed to open webpage");
		}
		msg << " '" << weblink << "'";
		m_chat_backend->addUnparsedMessage(utf8_to_wide(msg.str()));
		return true;
	}

	return false;
}

void GUIChatConsole::updatePrimarySelection()
{
	std::wstring wselected = m_chat_backend->getPrompt().getSelection();
	std::string selected = wide_to_utf8(wselected);
	Environment->getOSOperator()->copyToPrimarySelection(selected.c_str());
}

void GUIChatConsole::updateScrollbar(bool update_size)
{
	ChatBuffer &buf = m_chat_backend->getConsoleBuffer();
	m_scrollbar->setMin(buf.getTopScrollPos());
	m_scrollbar->setMax(buf.getBottomScrollPos());
	m_scrollbar->setPos(buf.getScrollPosition());
	m_scrollbar->setPageSize(m_fontsize.Y * buf.getLineCount());
	m_scrollbar->setVisible(m_scrollbar->getMin() != m_scrollbar->getMax());

	if (update_size) {
		const core::rect<s32> messages = getMessageRect();
		const s32 inset = MYMAX(2, getPanelPadding() / 3);
		const core::rect<s32> rect(messages.LowerRightCorner.X -
				getScrollbarSize(Environment), messages.UpperLeftCorner.Y + inset,
				messages.LowerRightCorner.X, messages.LowerRightCorner.Y - inset);
		m_scrollbar->setRelativePosition(rect);
	}
}
