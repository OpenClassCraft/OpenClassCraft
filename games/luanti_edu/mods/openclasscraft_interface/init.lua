-- OpenClassCraft-native chat and actions.
-- Students use visible buttons instead of memorizing slash commands.

local FORMNAME = "openclasscraft_interface:hub"
local ROLE_FORMNAME = "openclasscraft_interface:roles"
local MAX_CHAT_ENTRIES = 60
local chat_history = {"OpenClassCraft class chat is ready."}
local notices = {}

local function trim(value)
	return (value or ""):match("^%s*(.-)%s*$")
end

local function clean_text(value, limit)
	return trim(value):gsub("[%z\1-\31\127]", " "):gsub("%s+", " "):sub(1, limit)
end

local function add_chat_entry(text)
	chat_history[#chat_history + 1] = clean_text(text, 420)
	while #chat_history > MAX_CHAT_ENTRIES do
		table.remove(chat_history, 1)
	end
end

local function recent_chat()
	local lines = {}
	local first = math.max(1, #chat_history - 10)
	for index = first, #chat_history do
		lines[#lines + 1] = chat_history[index]
	end
	return table.concat(lines, "\n")
end

local function role_for(player)
	if player_api and player_api.get_openclasscraft_role then
		return player_api.get_openclasscraft_role(player)
	end
	return "student"
end

local function can_manage_class(player)
	return role_for(player) == "educator" or
		minetest.check_player_privs(player:get_player_name(), {server = true})
end

local function can_set_roles(player)
	return minetest.check_player_privs(player:get_player_name(), {server = true})
end

local function connected_player_names()
	local names = {}
	for _, connected in ipairs(minetest.get_connected_players()) do
		names[#names + 1] = connected:get_player_name()
	end
	table.sort(names, function(a, b)
		return a:lower() < b:lower()
	end)
	return names
end

local function run_action(player, command, parameter)
	local definition = minetest.registered_chatcommands[command]
	if not definition or type(definition.func) ~= "function" then
		return false, "That action is not available in this world."
	end
	local name = player:get_player_name()
	local allowed, missing = minetest.check_player_privs(name, definition.privs or {})
	if not allowed then
		return false, "This action needs educator permission: " .. table.concat(missing, ", ")
	end
	local ok, message = definition.func(name, parameter or "")
	return ok ~= false, message or (ok == false and "The action could not be completed." or "Done.")
end

local function hub_formspec(player, context, standalone)
	local esc = minetest.formspec_escape
	local role = role_for(player)
	local notice = notices[player:get_player_name()] or
		"Choose an action. No command names need to be typed."
	local top = standalone and 0 or 0.62
	local height = standalone and 9.2 or 9.82
	local nav = ""
	if not standalone and context then
		nav = sfinv.get_nav_fs(player, context, context.nav_titles, context.nav_idx)
	end
	local close_button = standalone and
		("button[12.35," .. (0.28 + top) .. ";1.05,0.55;occ_close;Close]") or ""
	local catalog_button =
		"button[9.4," .. (8.25 + top) .. ";3.7,0.65;occ_catalog;Open learning catalog]"
	local educator_buttons = can_set_roles(player) and table.concat({
		"button[10.53,", 7.23 + top, ";1.2,0.65;occ_roles;Roles]",
		"button[11.88,", 7.23 + top, ";1.22,0.65;occ_teacher_sync;Sync]",
	}) or ""

	return table.concat({
		"formspec_version[6]size[14,", height, "]no_prepend[]bgcolor[#00000088;true]",
		"box[0,", top, ";14,9.2;#F4F7F2FF]",
		nav,
		"style_type[button;border=false;bgimg=button_hover_semitrans.png^[noalpha^[colorize:#E3EEE7:255;bgimg_hovered=button_hover_semitrans.png^[noalpha^[colorize:#CEE4D6:255;bgimg_pressed=button_hover_semitrans.png^[noalpha^[colorize:#B6D6C1:255;textcolor=#183B2A;font_size=16]",
		"style[occ_send;bgimg=button_hover_semitrans.png^[noalpha^[colorize:#16784A:255;textcolor=#FFFFFFFF]",
		"style[occ_close;bgimg=button_hover_semitrans.png^[noalpha^[colorize:#EDF1EC:255;textcolor=#536159;font_size=14]",
		"style_type[field,textarea;border=false;bgcolor=#FFFFFFFF;textcolor=#18251F]",
		"box[0.28,", 0.22 + top, ";13.44,0.78;#153D2AFF]",
		"label[0.68,", 0.45 + top, ";", minetest.colorize("#FFFFFF", "OPENCLASSCRAFT"), "]",
		"label[4.0,", 0.45 + top, ";", minetest.colorize("#BFE8CE", "CLASS CHAT & ACTIONS"), "]",
		"box[10.65,", 0.37 + top, ";1.35,0.42;#E6F4EAFF]",
		"label[10.86,", 0.48 + top, ";", minetest.colorize("#1E6A43", role:upper()), "]",
		close_button,

		"box[9.15,", 1.12 + top, ";4.15,7.15;#FAFCFAFF]",
		"label[0.48,", 1.25 + top, ";", minetest.colorize("#183B2A", "CLASS CONVERSATION"), "]",
		"box[0.42,", 1.55 + top, ";8.55,4.9;#E7EEE9FF]",
		"textarea[0.68,", 1.75 + top, ";8.05,4.5;;;", esc(recent_chat()), "]",
		"box[0.55,", 6.98 + top, ";6.7,0.48;#FFFFFFFF]",
		"field[0.55,", 6.78 + top, ";6.7,0.72;occ_message;Message your class;]",
		"field_close_on_enter[occ_message;false]",
		"button[7.42,", 6.65 + top, ";1.55,0.72;occ_send;Send]",
		"box[0.42,", 7.55 + top, ";8.55,0.78;#FDFEFEFF]",
		"label[0.68,", 7.78 + top, ";", minetest.colorize("#397253", esc(notice)), "]",

		"label[9.38,", 1.25 + top, ";", minetest.colorize("#183B2A", "QUICK ACTIONS"), "]",
		"button[9.38,", 1.55 + top, ";1.75,0.82;occ_starter;Starter kit]",
		"button[11.28,", 1.55 + top, ";1.82,0.82;occ_role;My role]",
		"button[9.38,", 2.52 + top, ";1.75,0.82;occ_sky;Refresh sky]",
		"button[11.28,", 2.52 + top, ";1.82,0.82;occ_music;Restart music]",
		"button[9.38,", 3.49 + top, ";1.75,0.82;occ_student_skin;Student look]",
		can_manage_class(player) and
			("button[11.28," .. (3.49 + top) .. ";1.82,0.82;occ_educator_skin;Educator look]") or "",

		"label[9.38,", 4.65 + top, ";", minetest.colorize("#183B2A", "JOIN A CLASS"), "]",
		"box[9.38,", 5.36 + top, ";2.3,0.48;#FFFFFFFF]",
		"field[9.38,", 5.18 + top, ";2.3,0.7;occ_class_code;Class code;]",
		"button[11.86,", 5.05 + top, ";1.24,0.7;occ_join;Join]",
		"label[9.38,", 6.08 + top, ";", minetest.colorize("#183B2A", "SUBMIT YOUR BUILD"), "]",
		"box[9.38,", 6.79 + top, ";3.72,0.42;#FFFFFFFF]",
		"field[9.38,", 6.61 + top, ";3.72,0.7;occ_build_note;Short note;]",
		"button[9.38,", 7.23 + top, ";1.02,0.65;occ_submit;Submit]",
		educator_buttons,
		standalone and ("label[9.4," .. (8.55 + top) .. ";" ..
			minetest.colorize("#536159", "I opens the learning catalog") .. "]") or catalog_button,
		"label[0.48,", 8.7 + top, ";", minetest.colorize("#718078",
			"T opens chat   / opens Actions   I opens the catalog"), "]",
	})
end

local function role_formspec(player, notice)
	local esc = minetest.formspec_escape
	local names = connected_player_names()
	local dropdown_names = {}
	for _, name in ipairs(names) do
		dropdown_names[#dropdown_names + 1] = esc(name)
	end
	if #dropdown_names == 0 then
		dropdown_names[1] = esc(player:get_player_name())
	end
	return table.concat({
		"formspec_version[6]size[8.8,5.25]no_prepend[]bgcolor[#00000088;true]",
		"box[0,0;8.8,5.25;#F4F7F2FF]",
		"style_type[button;border=false;bgimg=button_hover_semitrans.png^[noalpha^[colorize:#E3EEE7:255;bgimg_hovered=button_hover_semitrans.png^[noalpha^[colorize:#CEE4D6:255;bgimg_pressed=button_hover_semitrans.png^[noalpha^[colorize:#B6D6C1:255;textcolor=#183B2A;font_size=16]",
		"style_type[field,dropdown;border=false;bgcolor=#FFFFFFFF;textcolor=#18251F]",
		"style[occ_apply_role;bgimg=button_hover_semitrans.png^[noalpha^[colorize:#16784A:255;textcolor=#FFFFFFFF]",
		"box[0.28,0.22;8.24,0.82;#153D2AFF]",
		"label[0.65,0.48;", minetest.colorize("#FFFFFF", "OPENCLASSCRAFT"), "]",
		"label[3.0,0.48;", minetest.colorize("#BFE8CE", "CLASS ROLES"), "]",
		"label[0.55,1.45;", minetest.colorize("#183B2A", "Choose a connected learner and their classroom role."), "]",
		"dropdown[0.55,2.12;3.7,0.72;occ_role_target;",
			table.concat(dropdown_names, ","), ";1;false]",
		"dropdown[4.55,2.12;3.7,0.72;occ_role_value;Student,Educator,Observer;1;false]",
		"button[4.55,3.15;3.7,0.76;occ_apply_role;Apply role]",
		"button[0.55,3.15;2.1,0.76;occ_roles_back;Back to Actions]",
		"box[0.55,4.23;7.7,0.55;#E7EEE9FF]",
		"label[0.82,4.39;", minetest.colorize("#397253",
			esc(notice or "Only the classroom host can change roles.")), "]",
	})
end

local function set_notice(player, ok, message)
	local prefix = ok and "Done: " or "Needs attention: "
	notices[player:get_player_name()] = prefix .. clean_text(message, 150)
	minetest.chat_send_player(player:get_player_name(),
		"[OpenClassCraft] " .. notices[player:get_player_name()])
end

local function report_class_message(player, message)
	if openclasscraft_classroom and openclasscraft_classroom.report_chat_message then
		openclasscraft_classroom.report_chat_message(player, message)
	end
end

local function send_class_message(player, raw_message)
	local message = clean_text(raw_message, 300)
	if message == "" then
		set_notice(player, false, "Type a message first.")
		return
	end
	local name = player:get_player_name()
	if not minetest.check_player_privs(name, {shout = true}) then
		set_notice(player, false, "Chat is not enabled for this account.")
		return
	end
	add_chat_entry(name .. "  ·  " .. message)
	report_class_message(player, message)
	minetest.chat_send_all(minetest.colorize("#72D49B", name) .. "  ·  " .. message)
	notices[name] = "Message sent to the class."
end

local function handle_fields(player, fields, context, standalone)
	if fields.occ_close then
		minetest.close_formspec(player:get_player_name(), FORMNAME)
		return true
	end
	if fields.occ_catalog and context then
		sfinv.set_page(player, "creative:build")
		return true
	end
	if fields.occ_send or fields.key_enter_field == "occ_message" then
		send_class_message(player, fields.occ_message)
	elseif fields.occ_starter then
		set_notice(player, run_action(player, "givetools", ""))
	elseif fields.occ_role then
		set_notice(player, run_action(player, "occ_role", player:get_player_name()))
	elseif fields.occ_sky then
		set_notice(player, run_action(player, "sky", ""))
	elseif fields.occ_music then
		set_notice(player, run_action(player, "music", ""))
	elseif fields.occ_student_skin then
		set_notice(player, run_action(player, "student_skin", ""))
	elseif fields.occ_educator_skin and can_manage_class(player) then
		set_notice(player, run_action(player, "educator_skin", ""))
	elseif fields.occ_join then
		set_notice(player, run_action(player, "occ_join", clean_text(fields.occ_class_code, 32)))
	elseif fields.occ_submit then
		set_notice(player, run_action(player, "occ_submit_build", clean_text(fields.occ_build_note, 180)))
	elseif fields.occ_roles and can_set_roles(player) then
		minetest.show_formspec(player:get_player_name(), ROLE_FORMNAME,
			role_formspec(player))
		return true
	elseif fields.occ_teacher_sync and can_manage_class(player) then
		set_notice(player, run_action(player, "occ_teacher_sync", ""))
	else
		return false
	end

	if standalone then
		minetest.show_formspec(player:get_player_name(), FORMNAME,
			hub_formspec(player, nil, true))
	elseif context then
		sfinv.set_player_inventory_formspec(player, context)
	end
	return true
end

-- The class chat and action centre opens separately with the / key. Keep both
-- it and the generic survival inventory out of the learning catalog so Build
-- remains the first visible inventory page.
sfinv.override_page("sfinv:inventory", {
	is_in_nav = function()
		return false
	end,
})

minetest.register_chatcommand("occ_actions", {
	description = "Open the visual OpenClassCraft action center",
	func = function(name)
		local player = minetest.get_player_by_name(name)
		if not player then
			return false, "Player is not online."
		end
		minetest.show_formspec(name, FORMNAME, hub_formspec(player, nil, true))
		return true
	end,
})

minetest.register_on_player_receive_fields(function(player, formname, fields)
	if formname == ROLE_FORMNAME then
		if fields.occ_roles_back then
			minetest.show_formspec(player:get_player_name(), FORMNAME,
				hub_formspec(player, nil, true))
			return true
		end
		if fields.occ_apply_role and can_set_roles(player) then
			local target = clean_text(fields.occ_role_target, 64)
			local role = clean_text(fields.occ_role_value, 16):lower()
			local ok, message = run_action(player, "occ_set_role", target .. " " .. role)
			minetest.show_formspec(player:get_player_name(), ROLE_FORMNAME,
				role_formspec(player, (ok and "Done: " or "Needs attention: ") ..
					clean_text(message, 140)))
			return true
		end
		return false
	end
	if formname ~= FORMNAME then
		return false
	end
	return handle_fields(player, fields, nil, true)
end)

minetest.register_on_chat_message(function(name, message)
	if message:sub(1, 1) ~= "/" then
		add_chat_entry(name .. "  ·  " .. message)
		local player = minetest.get_player_by_name(name)
		if player then report_class_message(player, message) end
	end
	return false
end)

minetest.register_on_joinplayer(function(player)
	local name = player:get_player_name()
	add_chat_entry(name .. " joined the class.")
	minetest.after(1.4, function()
		if player and player:is_player() then
			minetest.chat_send_player(name,
				"[OpenClassCraft] Press / for clickable Actions. No command names need to be memorized.")
		end
	end)
end)

minetest.register_on_leaveplayer(function(player)
	local name = player:get_player_name()
	add_chat_entry(name .. " left the class.")
	notices[name] = nil
end)

minetest.log("action", "[OpenClassCraft Interface] Loaded visual chat actions")
