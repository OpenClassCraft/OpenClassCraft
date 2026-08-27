#!/usr/bin/env python3
"""Generate the OpenClassCraft Fedora school delivery and licensing plan PDF.

The renderer uses only system Pycairo/Pango packages so the result is deterministic,
offline, and does not depend on a browser or remote font service.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import cairo
import gi

gi.require_version("Pango", "1.0")
gi.require_version("PangoCairo", "1.0")
from gi.repository import Pango, PangoCairo  # noqa: E402


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = ROOT / "docs/launch/FEDORA_SCHOOL_DELIVERY_AND_LICENSING_PLAN.pdf"
ICON = ROOT / "games/luanti_edu/menu/icon.png"

PAGE_W = 595.276
PAGE_H = 841.89
MARGIN = 42.0
CONTENT_W = PAGE_W - 2 * MARGIN
CONTENT_BOTTOM = 793.0

NAVY = "#17324d"
INK = "#172235"
MUTED = "#5e6b79"
GREEN = "#4f8b36"
GREEN_DARK = "#285628"
GREEN_PALE = "#eaf3e5"
BLUE = "#2d82a8"
BLUE_PALE = "#eef5f8"
GOLD = "#d99516"
GOLD_PALE = "#fff5df"
RED = "#c64e40"
RED_PALE = "#fcefeb"
LINE = "#d9e2e5"
PAPER = "#ffffff"


def rgb(value: str) -> tuple[float, float, float]:
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) / 255 for index in (0, 2, 4))


class PdfPlan:
    def __init__(self, output: Path) -> None:
        output.parent.mkdir(parents=True, exist_ok=True)
        self.output = output
        self.surface = cairo.PDFSurface(str(output), PAGE_W, PAGE_H)
        self.surface.set_metadata(cairo.PDF_METADATA_TITLE, "OpenClassCraft — Fedora School Delivery and Licensing Plan")
        self.surface.set_metadata(cairo.PDF_METADATA_AUTHOR, "OpenClassCraft")
        self.surface.set_metadata(cairo.PDF_METADATA_SUBJECT, "Fedora release, school fulfilment, offline licensing, expiry, and implementation plan")
        self.surface.set_metadata(cairo.PDF_METADATA_KEYWORDS, "OpenClassCraft, Fedora, schools, offline licensing, implementation")
        self.ctx = cairo.Context(self.surface)
        self.page_number = 0
        self.page_end_positions: list[tuple[int, float]] = []

    def set_color(self, color: str) -> None:
        self.ctx.set_source_rgb(*rgb(color))

    def rounded_rect(self, x: float, y: float, width: float, height: float, radius: float = 7) -> None:
        radius = min(radius, width / 2, height / 2)
        self.ctx.new_sub_path()
        self.ctx.arc(x + width - radius, y + radius, radius, -math.pi / 2, 0)
        self.ctx.arc(x + width - radius, y + height - radius, radius, 0, math.pi / 2)
        self.ctx.arc(x + radius, y + height - radius, radius, math.pi / 2, math.pi)
        self.ctx.arc(x + radius, y + radius, radius, math.pi, 3 * math.pi / 2)
        self.ctx.close_path()

    def fill_rect(self, x: float, y: float, width: float, height: float, color: str, radius: float = 0) -> None:
        self.set_color(color)
        if radius:
            self.rounded_rect(x, y, width, height, radius)
        else:
            self.ctx.rectangle(x, y, width, height)
        self.ctx.fill()

    def stroke_rect(self, x: float, y: float, width: float, height: float, color: str, radius: float = 0, line_width: float = 0.7) -> None:
        self.set_color(color)
        self.ctx.set_line_width(line_width)
        if radius:
            self.rounded_rect(x, y, width, height, radius)
        else:
            self.ctx.rectangle(x, y, width, height)
        self.ctx.stroke()

    def layout(self, text: str, width: float, size: float, *, bold: bool = False,
               family: str = "Noto Sans", spacing: float = 1.1,
               align: Pango.Alignment = Pango.Alignment.LEFT) -> Pango.Layout:
        layout = PangoCairo.create_layout(self.ctx)
        layout.set_width(max(1, int(width * Pango.SCALE)))
        layout.set_wrap(Pango.WrapMode.WORD_CHAR)
        layout.set_alignment(align)
        layout.set_spacing(int(spacing * Pango.SCALE))
        description = Pango.FontDescription(family)
        description.set_absolute_size(size * Pango.SCALE)
        description.set_weight(Pango.Weight.BOLD if bold else Pango.Weight.NORMAL)
        layout.set_font_description(description)
        layout.set_text(text, -1)
        return layout

    @staticmethod
    def layout_height(layout: Pango.Layout) -> float:
        _, logical = layout.get_extents()
        return logical.height / Pango.SCALE

    def measure(self, text: str, width: float, size: float, **kwargs) -> float:
        return self.layout_height(self.layout(text, width, size, **kwargs))

    def text(self, text: str, x: float, y: float, width: float, size: float = 9,
             color: str = INK, *, bold: bool = False, family: str = "Noto Sans",
             spacing: float = 1.1, align: Pango.Alignment = Pango.Alignment.LEFT) -> float:
        layout = self.layout(text, width, size, bold=bold, family=family, spacing=spacing, align=align)
        self.set_color(color)
        self.ctx.move_to(x, y)
        PangoCairo.show_layout(self.ctx, layout)
        return self.layout_height(layout)

    def line(self, x1: float, y1: float, x2: float, y2: float, color: str = LINE, width: float = 0.7) -> None:
        self.set_color(color)
        self.ctx.set_line_width(width)
        self.ctx.move_to(x1, y1)
        self.ctx.line_to(x2, y2)
        self.ctx.stroke()

    def image(self, path: Path, x: float, y: float, width: float, height: float) -> None:
        image = cairo.ImageSurface.create_from_png(str(path))
        self.ctx.save()
        self.ctx.translate(x, y)
        self.ctx.scale(width / image.get_width(), height / image.get_height())
        self.ctx.set_source_surface(image, 0, 0)
        self.ctx.get_source().set_filter(cairo.Filter.BILINEAR)
        self.ctx.paint()
        self.ctx.restore()

    def new_page(self, title: str | None = None, eyebrow: str | None = None) -> float:
        if self.page_number:
            self.ctx.show_page()
        self.page_number += 1
        self.fill_rect(0, 0, PAGE_W, PAGE_H, PAPER)
        if title is None:
            return 0
        self.text(eyebrow.upper(), MARGIN, 31, CONTENT_W - 40, 7.2, BLUE, bold=True, spacing=1.8)
        self.text(f"{self.page_number:02d}", PAGE_W - MARGIN - 24, 31, 24, 7.4, MUTED, align=Pango.Alignment.RIGHT)
        self.text(title, MARGIN, 48, CONTENT_W, 18.5, NAVY, bold=True, spacing=0.4)
        self.line(MARGIN, 77, PAGE_W - MARGIN, 77, GREEN, 1.5)
        return 91

    def footer(self, label: str, end_y: float) -> None:
        if end_y > CONTENT_BOTTOM:
            raise RuntimeError(f"Page {self.page_number} overflows: content ended at {end_y:.1f}pt")
        self.page_end_positions.append((self.page_number, end_y))
        self.line(MARGIN, 810, PAGE_W - MARGIN, 810, LINE, 0.6)
        self.text(f"OpenClassCraft · {label}", MARGIN, 817, CONTENT_W - 55, 6.7, MUTED)
        self.text(f"{self.page_number:02d}", PAGE_W - MARGIN - 30, 817, 30, 6.7, MUTED, align=Pango.Alignment.RIGHT)

    def lead(self, text: str, y: float) -> float:
        height = self.text(text, MARGIN, y, CONTENT_W, 10.3, MUTED, spacing=1.3)
        return y + height + 11

    def section(self, title: str, y: float, x: float = MARGIN, width: float = CONTENT_W) -> float:
        height = self.text(title, x, y, width, 10.4, GREEN_DARK, bold=True, spacing=0.6)
        return y + height + 5

    def bullets(self, items: list[str], x: float, y: float, width: float,
                size: float = 8.2, color: str = INK, gap: float = 3.4) -> float:
        for item in items:
            self.fill_rect(x + 1, y + 4.6, 3.1, 3.1, GREEN, 1.5)
            height = self.text(item, x + 10, y, width - 10, size, color, spacing=0.9)
            y += height + gap
        return y

    def numbered(self, items: list[str], x: float, y: float, width: float, size: float = 8.2) -> float:
        for index, item in enumerate(items, start=1):
            self.fill_rect(x, y, 14, 14, GREEN_PALE, 7)
            self.text(str(index), x, y + 2.1, 14, 7.1, GREEN_DARK, bold=True, align=Pango.Alignment.CENTER)
            height = self.text(item, x + 20, y, width - 20, size, INK, spacing=0.9)
            y += max(14, height) + 4
        return y

    def callout(self, title: str, body: str, y: float, *, kind: str = "blue", x: float = MARGIN,
                width: float = CONTENT_W, size: float = 8.2) -> float:
        colors = {
            "blue": (BLUE_PALE, BLUE),
            "good": (GREEN_PALE, GREEN),
            "warn": (GOLD_PALE, GOLD),
            "danger": (RED_PALE, RED),
            "navy": (NAVY, NAVY),
        }
        background, accent = colors[kind]
        title_h = self.measure(title, width - 26, size, bold=True)
        body_h = self.measure(body, width - 26, size)
        height = 13 + title_h + body_h
        self.fill_rect(x, y, width, height, background, 7)
        self.fill_rect(x, y, 5, height, accent, 2)
        text_color = PAPER if kind == "navy" else INK
        title_color = "#bce68e" if kind == "navy" else (GREEN_DARK if kind == "good" else accent)
        self.text(title, x + 14, y + 7, width - 22, size, title_color, bold=True)
        self.text(body, x + 14, y + 7 + title_h + 2, width - 22, size, text_color)
        return y + height + 9

    def table(self, headers: list[str], rows: list[list[str]], widths: list[float], y: float,
              *, x: float = MARGIN, header_size: float = 7.5, body_size: float = 7.4,
              padding: float = 6, row_gap: float = 0.7) -> float:
        if not math.isclose(sum(widths), 1.0, abs_tol=0.001):
            raise ValueError("Table widths must sum to 1")
        column_widths = [CONTENT_W * fraction for fraction in widths]
        header_heights = [self.measure(text, column_widths[index] - 2 * padding, header_size, bold=True)
                          for index, text in enumerate(headers)]
        row_height = max(header_heights) + 2 * padding
        cursor_x = x
        for index, header in enumerate(headers):
            width = column_widths[index]
            self.fill_rect(cursor_x, y, width, row_height, GREEN_PALE)
            self.stroke_rect(cursor_x, y, width, row_height, "#cfddc9", line_width=0.55)
            self.text(header, cursor_x + padding, y + padding, width - 2 * padding, header_size, GREEN_DARK, bold=True)
            cursor_x += width
        y += row_height
        for row in rows:
            heights = [self.measure(str(text), column_widths[index] - 2 * padding, body_size, spacing=row_gap)
                       for index, text in enumerate(row)]
            row_height = max(heights) + 2 * padding
            cursor_x = x
            for index, value in enumerate(row):
                width = column_widths[index]
                self.fill_rect(cursor_x, y, width, row_height, PAPER)
                self.stroke_rect(cursor_x, y, width, row_height, LINE, line_width=0.5)
                self.text(str(value), cursor_x + padding, y + padding, width - 2 * padding, body_size, INK, spacing=row_gap)
                cursor_x += width
            y += row_height
        return y + 7

    def two_columns(self, left_title: str, left_items: list[str], right_title: str,
                    right_items: list[str], y: float, *, size: float = 8.0) -> float:
        gap = 20
        width = (CONTENT_W - gap) / 2
        left_y = self.section(left_title, y, MARGIN, width)
        left_end = self.bullets(left_items, MARGIN, left_y, width, size=size)
        right_x = MARGIN + width + gap
        right_y = self.section(right_title, y, right_x, width)
        right_end = self.bullets(right_items, right_x, right_y, width, size=size)
        return max(left_end, right_end) + 6

    def flow(self, steps: list[tuple[str, str]], y: float) -> float:
        gap = 7
        width = (CONTENT_W - gap * (len(steps) - 1)) / len(steps)
        heights = []
        for title, body in steps:
            heights.append(14 + self.measure(title, width - 12, 7.5, bold=True) + self.measure(body, width - 12, 6.8))
        height = max(heights) + 5
        for index, (title, body) in enumerate(steps):
            x = MARGIN + index * (width + gap)
            self.fill_rect(x, y, width, height, "#f3f7f1", 6)
            self.stroke_rect(x, y, width, height, "#d5e1d0", 6, 0.6)
            title_h = self.text(title, x + 6, y + 7, width - 12, 7.5, GREEN_DARK, bold=True, align=Pango.Alignment.CENTER)
            self.text(body, x + 6, y + 9 + title_h, width - 12, 6.8, MUTED, align=Pango.Alignment.CENTER)
        return y + height + 10

    def finish(self) -> None:
        self.surface.flush()
        self.surface.finish()


def cover(plan: PdfPlan) -> None:
    plan.new_page()
    plan.fill_rect(0, 0, PAGE_W, 13, GREEN)
    plan.fill_rect(0, 13, PAGE_W, PAGE_H - 13, "#f5f8f2")
    plan.text("OPENCLASSCRAFT", MARGIN, 38, 250, 8.2, GREEN_DARK, bold=True, spacing=1.8)
    plan.text("COMMERCIAL AND TECHNICAL IMPLEMENTATION PLAN", MARGIN, 105, 270, 7.2, BLUE, bold=True, spacing=1.8)
    plan.text("Fedora School\nDelivery and\nOffline Licensing", MARGIN, 132, 275, 29, NAVY, bold=True, spacing=0.5)
    plan.text("How OpenClassCraft will package the Fedora build, fulfil school purchases, verify a campus licence without internet, handle renewal, and end paid entitlements without locking away the free game or school data.", MARGIN, 275, 268, 10.2, MUTED, spacing=1.5)
    plan.fill_rect(MARGIN, 395, 223, 24, GOLD_PALE, 12)
    plan.text("OWNER-REVIEW DRAFT · NOT A LIVE PAID SERVICE", MARGIN + 9, 402, 205, 6.8, "#765004", bold=True)
    plan.image(ICON, 346, 95, 205, 205)
    plan.callout(
        "CORE DECISION",
        "Ship one public Fedora Community RPM that never expires. A school purchases the separately delivered Teacher Console, curriculum delivery, onboarding, eligible updates, and support for a defined campus term.",
        455,
        kind="navy",
        width=CONTENT_W,
        size=9.2,
    )
    y = 560
    metrics = [
        ("PRIMARY PLATFORM", "Fedora 44 x86_64"),
        ("COMMERCIAL UNIT", "One physical campus"),
        ("VERIFICATION", "Offline signed licence"),
        ("RENEWAL", "Manual annual payment"),
        ("EXPIRY SAFETY", "30-day grace; export-only"),
        ("STUDENT SUBSCRIPTION", "None"),
    ]
    card_gap = 9
    card_w = (CONTENT_W - 2 * card_gap) / 3
    for index, (label, value) in enumerate(metrics):
        row, column = divmod(index, 3)
        x = MARGIN + column * (card_w + card_gap)
        card_y = y + row * 74
        plan.fill_rect(x, card_y, card_w, 60, PAPER, 7)
        plan.stroke_rect(x, card_y, card_w, 60, LINE, 7, 0.6)
        plan.text(label, x + 9, card_y + 9, card_w - 18, 6.6, MUTED, bold=True)
        plan.text(value, x + 9, card_y + 29, card_w - 18, 9.0, NAVY, bold=True)
    plan.text("Prepared 27 August 2026 · Audience: project owner, engineering, pilot schools, and professional advisers", MARGIN, 732, CONTENT_W, 7.4, MUTED)
    plan.line(MARGIN, 776, PAGE_W - MARGIN, 776, LINE, 0.6)
    plan.text("OpenClassCraft · Draft v1.0", MARGIN, 786, CONTENT_W - 80, 6.7, MUTED)
    plan.text("01", PAGE_W - MARGIN - 30, 786, 30, 6.7, MUTED, align=Pango.Alignment.RIGHT)
    plan.page_end_positions.append((1, 747))


def product_page(plan: PdfPlan) -> None:
    y = plan.new_page("One game, two ways to adopt it", "Product boundary")
    y = plan.lead("Community and OpenClassCraft for Schools are not incompatible games. They are one core game with different delivery, operations, and support.", y)
    y = plan.table(
        ["Component", "Community", "OpenClassCraft for Schools"],
        [
            ["Fedora game", "Free public RPM; offline play and LAN multiplayer; no expiry.", "The exact same verified RPM. No customer-specific fork."],
            ["Teacher Console", "Not included in the Community release.", "Controlled Fedora-compatible AppImage for the campus term."],
            ["Curriculum", "Public starter material and community contributions.", "Operational lesson packs delivered during the plan term."],
            ["Adoption services", "Self-service documentation.", "Lab readiness, onboarding, teacher training, and agreed support."],
            ["After term", "Everything continues.", "Console becomes export-safe read-only after grace; game continues."],
        ],
        [0.19, 0.36, 0.45], y, body_size=7.5,
    )
    y = plan.two_columns(
        "What the school pays for",
        [
            "A maintained operational Teacher Console.",
            "Lab readiness, onboarding, and teacher training.",
            "Supported curriculum delivery and eligible updates.",
            "Defined support during the campus term.",
            "Dependable adoption—not permission to keep playing the game.",
        ],
        "Non-negotiable product rules",
        [
            "No student-level subscription or per-seat fee.",
            "No mandatory cloud account for classroom play.",
            "No deletion or lock-in of school-owned data at expiry.",
            "No customer-specific game fork or premium LAN protocol.",
            "No production claim before every paid-readiness gate passes.",
        ],
        y,
    )
    y = plan.section("Proposed school offers", y)
    y = plan.table(
        ["Offer", "Price", "Term", "Purpose"],
        [
            ["Community", "₹0", "No expiry", "Families, clubs, and self-supported schools"],
            ["First 3 qualified private pilots", "₹0", "90 days", "Evidence and classroom fit"],
            ["Guided beta", "₹4,999", "8 weeks", "Structured proof-of-fit; proposed credit to annual"],
            ["Founding annual", "₹12,499", "First campus year", "Early converting pilot schools"],
            ["Standard annual", "₹24,999", "Campus/year", "Planned renewal or later new-school price"],
        ],
        [0.33, 0.14, 0.19, 0.34], y, body_size=7.1,
    )
    y = plan.callout("COMMERCIAL GATE", "Prices are proposals. Do not accept a paid annual order until the Console licence, agreement, privacy notice, support scope, refund/cancellation terms, and India-appropriate tax/invoice process are approved.", y, kind="warn")
    plan.footer("Product boundary", y)


def fedora_page(plan: PdfPlan) -> None:
    y = plan.new_page("The supported Fedora package contract", "Fedora-first release")
    y = plan.lead("The development machine and release workflow both target Fedora 44. This gives the project one exact environment to build, install, and physically validate first.", y)
    y = plan.table(
        ["Artifact", "Audience and channel", "Required proof"],
        [
            ["OpenClassCraft-Fedora-44-x86_64.rpm", "Everyone · public Community release", "SHA-256, RPM/detached signature, exact tag/source, licence notices"],
            ["OpenClassCraft-Fedora-44-x86_64.rpm.sha256", "Everyone · beside the RPM", "Checksum validates the exact released bytes"],
            ["Teacher-Console-0.1.0-linux-x86_64.AppImage", "Authorised school contact · controlled delivery", "Checksum, signature, version, approved licence and notices"],
            ["school.occlicense", "One named campus · private delivery", "Valid project signature and matching campus term"],
        ],
        [0.37, 0.29, 0.34], y, body_size=7.2,
    )
    y = plan.flow([
        ("1 · BUILD", "Fedora 44 container"),
        ("2 · TEST", "Unit + fresh world"),
        ("3 · PACKAGE", "CPack RPM"),
        ("4 · INSTALL", "Clean Fedora"),
        ("5 · SIGN", "RPM + proof"),
        ("6 · PILOT", "Two-device LAN"),
    ], y)
    y = plan.two_columns(
        "Already present",
        [
            "Fedora 44 CI container and RPM generation.",
            "RPM content checks and clean installation.",
            "Engine tests and fresh-world server smoke test.",
            "SHA-256 generation.",
            "Separate Community and Console artifacts.",
            "Allow-list that rejects Console files from public releases.",
        ],
        "Required before supported release",
        [
            "Make Fedora—not Windows—the first public alpha scope.",
            "Physically test install, launch, update, and uninstall.",
            "Test LAN discovery and manual fallback on two devices.",
            "Sign the RPM and publish verification instructions.",
            "Record known limitations and rollback procedure.",
            "Retain the previous known-good artifact.",
        ],
        y,
    )
    y = plan.callout("INSTALLATION CONTRACT", "A teacher installs with: sudo dnf install ./OpenClassCraft-Fedora-44-x86_64.rpm — then starts: openclasscraft. The public RPM must work without the Console or a licence file.", y, kind="good")
    y = plan.callout("SCOPE CONTROL", "Ubuntu and Windows remain later validation targets, but they must not delay Fedora proof. Do not promise support from untested CI artifacts alone.", y)
    plan.footer("Fedora-first release", y)


def fulfilment_page(plan: PdfPlan) -> None:
    y = plan.new_page("How a school receives the package", "Purchase and fulfilment")
    y = plan.lead("Start with an owner-controlled, manually renewed annual plan. A school gets a clear order, one verified package, and named onboarding—not an anonymous consumer checkout.", y)
    y = plan.flow([
        ("QUALIFY", "Campus + teacher"),
        ("AGREE", "Scope + term"),
        ("INVOICE", "Order + payment"),
        ("RECONCILE", "Cleared status"),
        ("DELIVER", "Files + licence"),
        ("ONBOARD", "Install + lesson"),
    ], y)
    y = plan.two_columns(
        "Recommended payment model",
        [
            "Use a written order or quotation, then a one-time payment link or bank transfer.",
            "No automatic debit during the founding stage.",
            "Link every payment reference to the campus register.",
            "Reconcile the actual cleared status—not a screenshot.",
            "Put taxes, refunds, cancellation, and support in the signed order.",
        ],
        "School delivery bundle",
        [
            "README-FIRST.pdf and teacher quick-start material.",
            "Signed Teacher Console AppImage.",
            "Unique school.occlicense campus entitlement.",
            "SHA256SUMS and detached signature.",
            "Approved licence and third-party notices.",
            "Link to the same public Community RPM.",
        ],
        y,
    )
    y = plan.callout("WHY MANUAL ANNUAL RENEWAL", "Razorpay documents Payment Links as one-time payments and currently documents a ₹15,000 domestic card/UPI recurring limit. The proposed ₹24,999 standard plan therefore fits a fresh annual school approval better than an automatic mandate.", y, kind="blue")
    y = plan.section("Private customer register — never commit it to the public repository", y)
    y = plan.table(
        ["Identity", "Commercial", "Delivery", "Lifecycle"],
        [["Campus ID, legal school name, approved contact", "Order/invoice reference, plan, amount, cleared status", "Version, hashes, licence ID, delivered date", "Start, expiry, grace end, renewal and support status"]],
        [0.25, 0.25, 0.25, 0.25], y, body_size=7.2,
    )
    y = plan.section("Internet requirements", y)
    y = plan.table(
        ["Activity", "Internet?", "Offline alternative"],
        [
            ["Pay and reconcile", "Normally yes", "Approved bank/procurement process"],
            ["Initial download", "Normally yes", "School-approved USB/removable media"],
            ["Licence check and lessons", "No", "Local signature/date check and trusted LAN"],
            ["Renew", "Communication normally yes", "Import the replacement licence by USB"],
        ],
        [0.34, 0.22, 0.44], y, body_size=7.2,
    )
    y = plan.callout("CURRENT-STATE WARNING", "Payment fulfilment and automatic expiry are not implemented in the current Console. Do not collect an annual payment assuming the present build will enforce the school term—it will not.", y, kind="warn")
    plan.footer("Purchase and fulfilment", y)


def licensing_page(plan: PdfPlan) -> None:
    y = plan.new_page("One binary, one campus licence file", "Offline licence architecture")
    y = plan.lead("Every school receives the same signed Console build. A small unique licence grants campus features for a defined term and is verified locally without contacting a server.", y)
    y = plan.flow([
        ("OWNER SIGNER", "Private Ed25519 key outside Git"),
        ("LICENCE FILE", "Campus + dates + features"),
        ("CONSOLE", "Embedded public verification key"),
        ("ENTITLEMENT", "Active · grace · expired · invalid"),
    ], y)
    left_x = MARGIN
    gap = 18
    column_w = (CONTENT_W - gap) / 2
    y_left = plan.section("Illustrative payload", y, left_x, column_w)
    code = """{
  \"schema\": 1,
  \"license_id\": \"OCC-SCH-2026-0001\",
  \"campus_id\": \"campus_7f31...\",
  \"school_name\": \"Example School\",
  \"plan\": \"founding-annual\",
  \"starts_on\": \"2026-10-01\",
  \"expires_on\": \"2027-09-30\",
  \"grace_days\": 30,
  \"features\": [\"console.edit\",
               \"lesson.bridge\",
               \"supported.updates\"],
  \"signature\": \"base64url...\"
}"""
    code_h = plan.measure(code, column_w - 18, 6.9, family="Noto Sans Mono", spacing=0.5)
    plan.fill_rect(left_x, y_left, column_w, code_h + 18, NAVY, 7)
    plan.text(code, left_x + 9, y_left + 9, column_w - 18, 6.9, "#eef7fb", family="Noto Sans Mono", spacing=0.5)
    left_end = y_left + code_h + 25
    left_end = plan.callout("FORMAT RULE", "The signature covers canonical bytes for every field except signature. Specify date inclusivity, encoding, algorithm, schema evolution, and maximum file size.", left_end, x=left_x, width=column_w, size=7.5)

    right_x = MARGIN + column_w + gap
    y_right = plan.section("Verification rules", y, right_x, column_w)
    right_end = plan.numbered([
        "Parse a bounded document with an exact supported schema.",
        "Reject missing, malformed, oversized, or unknown-critical values.",
        "Verify the Ed25519 signature with the embedded public key.",
        "Compare UTC date with start, expiry, and grace boundaries.",
        "Return ACTIVE, EXPIRING, GRACE, EXPIRED, or INVALID.",
        "Enforce capabilities in Electron's main process—not only the UI.",
        "Log status changes without student or payment data.",
    ], right_x, y_right, column_w, size=7.7)
    right_end = plan.callout("NO SECRET IN THE APP", "Only the public key belongs in the repository and Console. Encrypt, restrict, and securely back up the private signing key; never expose it to CI logs or artifacts.", right_end, kind="good", x=right_x, width=column_w, size=7.5)
    y = max(left_end, right_end) + 7
    y = plan.callout("OFFLINE LIMITATION", "An offline licence cannot be revoked immediately, and device-clock tampering cannot be prevented perfectly. Use written terms and soft clock-rollback detection; do not add always-online DRM to the founding product.", y, kind="warn")
    plan.footer("Offline licence architecture", y)


def expiry_page(plan: PdfPlan) -> None:
    y = plan.new_page("Stop paid entitlements, not learning", "Expiry and renewal")
    y = plan.lead("Expiry must be predictable, reversible through renewal, and safe for school-owned data. The Community game never checks the School licence.", y)
    y = plan.table(
        ["When", "State and behaviour"],
        [
            ["30 days before expiry", "EXPIRING · Show exact end/grace dates, renewal contact, and export reminder. All functions continue."],
            ["Expiry date", "GRACE · Start a 30-day grace period with a persistent renewal notice. Normal operation continues."],
            ["Grace end", "EXPIRED · Switch to read/export mode. Stop edits, bridge sessions, supported updates, and plan support."],
            ["Renewal", "ACTIVE · Import a newly signed .occlicense. Existing workspace remains; no reinstall is required."],
        ],
        [0.27, 0.73], y, body_size=7.6,
    )
    y = plan.section("Capability after grace", y)
    y = plan.table(
        ["Capability", "Result", "Reason"],
        [
            ["Community game, existing worlds, LAN", "CONTINUES", "The free game is not a subscription product."],
            ["View Console workspace", "CONTINUES", "Teachers retain access to local records."],
            ["Export CSV reports and JSON backups", "CONTINUES", "Expiry must never trap school-owned data."],
            ["Create/edit lessons, students, groups", "PAUSES", "Operational capability belongs to the school term."],
            ["Start or export lesson bridge sessions", "PAUSES", "Enforced in the Electron main process."],
            ["Receive Console/curriculum updates", "PAUSES", "Update entitlement ends with the term."],
            ["Receive plan support or training", "PAUSES", "Service scope ends unless separately agreed."],
        ],
        [0.42, 0.17, 0.41], y, body_size=7.2,
    )
    y = plan.two_columns(
        "Renewal procedure",
        [
            "Send reminders at 60 and 30 days.",
            "Confirm term, price, support, and authorised contact.",
            "Issue a fresh order and reconcile payment.",
            "Create a new licence with new ID and dates.",
            "Import and record activation; no reinstall required.",
        ],
        "Cancellation or non-renewal",
        [
            "Do not auto-charge without an approved mandate.",
            "Apply the written refund/cancellation terms.",
            "Keep export and backup available.",
            "Provide uninstall and retention instructions.",
            "Never remotely delete the workspace.",
        ],
        y,
    )
    y = plan.callout("ENFORCEMENT BOUNDARY", "Do not rely on disabled buttons. Every mutating IPC action and the loopback bridge must independently require ACTIVE, EXPIRING, or GRACE status in the Electron main process.", y, kind="danger")
    plan.footer("Expiry and renewal", y)


def roadmap_page(plan: PdfPlan) -> None:
    y = plan.new_page("Implementation sequence and acceptance", "Technical roadmap")
    y = plan.lead("Build licensing only after the Fedora package is dependable. Each phase must leave an independently testable result and a documented rollback.", y)
    y = plan.table(
        ["Phase", "Implementation", "Exit criteria"],
        [
            ["0 · Commercial gates", "Approve Console licence, campus agreement, privacy, support, cancellation/refund, invoice/tax process, and key custodian.", "Signed templates exist; owner authorises paid fulfilment."],
            ["1 · Fedora baseline", "Change public alpha scope to Fedora; physical RPM and two-device LAN tests; add signing and verification.", "Tagged candidate passes the release checklist on Fedora 44 hardware."],
            ["2 · Licence core", "Versioned schema/canonical bytes; Ed25519 issue/verify tools; status model; private key outside Git.", "Test vectors pass; tampering fails; no secret in source, logs, or artifacts."],
            ["3 · Console enforcement", "Import/status IPC; guard mutations; stop bridge after grace; preserve view/report/backup; add renewal UI.", "Expired/invalid licences cannot mutate or bridge; exports work."],
            ["4 · Fulfilment", "Private register, manifests, delivery guide, reminders, reissue, incident and recovery procedures.", "A test payment-to-clean-install dry run is auditable."],
            ["5 · Controlled beta", "Free pilots first; observe install, onboarding, bridge, warnings, exports, and support load.", "One authorised pilot completes with no unresolved critical defect."],
        ],
        [0.19, 0.45, 0.36], y, body_size=6.9,
    )
    y = plan.two_columns(
        "Required licence tests",
        [
            "Valid signature and supported schema.",
            "Invalid key, signature, payload, dates, and features.",
            "Before-start, exact boundaries, grace, and expired states.",
            "Leap day, month end, local timezone, and UTC conversion.",
            "Oversized/malformed file and path failures.",
        ],
        "Required Console/package tests",
        [
            "Every mutating IPC route rejects expired/invalid status.",
            "Active bridge stops when entitlement expires.",
            "View/report/backup exports work after expiry.",
            "Replacement licence activates without data loss.",
            "Build contains public key only—no signing secret or customer fixture.",
        ],
        y,
    )
    y = plan.callout("SUGGESTED DELIVERY RHYTHM", "Four focused engineering/operations weeks for the Fedora baseline and offline licence path, followed by the existing eight-week guided beta. This is a planning sequence—not a public date commitment.", y, kind="good")
    plan.footer("Technical roadmap", y)


def security_page(plan: PdfPlan) -> None:
    y = plan.new_page("Controls that keep the model trustworthy", "Security and operations")
    y = plan.lead("The goal is practical distribution control and reliable service—not hostile DRM. Protect package integrity, signing authority, classroom privacy, and recovery.", y)
    y = plan.two_columns(
        "Signing and package integrity",
        [
            "Generate signing keys outside the repository.",
            "Encrypt and back up private keys; assign an issuer.",
            "Sign Fedora RPMs and delivery-bundle checksums.",
            "Publish verification key/fingerprint through trusted channels.",
            "Record tag, package hash, Console version, and licence ID.",
            "Define key rotation and compromise response before issuance.",
        ],
        "Classroom privacy and recovery",
        [
            "Use classroom aliases; do not require student accounts.",
            "Keep workspace and bridge local to the teacher device.",
            "Never place student data in licences or payment records.",
            "Keep backup/export available before and after expiry.",
            "Document retention, uninstall, and incident procedures.",
            "Stop deployment on privacy, data-loss, tampering, or permission failures.",
        ],
        y,
    )
    y = plan.section("Known risks and treatment", y)
    y = plan.table(
        ["Risk", "Decision", "Residual limitation"],
        [
            ["Clock set backwards", "Record last-seen time; warn or enter safe/read-only mode on material rollback.", "A privileged local user can manipulate state."],
            ["Immediate cancellation", "Use written terms; stop service/download access; signed licence reaches expiry.", "No instant revocation without an online check."],
            ["Licence copied", "Bind commercial rights to one campus; avoid hard hardware locking initially.", "Offline copying cannot be prevented perfectly."],
            ["Signing key exposed", "Rotate key/version, notify schools, and reissue licences through a trusted update.", "Old offline binaries need an update to trust new policy."],
            ["Licence file lost", "Verify authorised contact and issue an auditable replacement.", "Requires an accurate private register."],
            ["Community game shared", "Expected under applicable open-source licences; monetise Console rights and services.", "Business cannot depend on blocking game sharing."],
        ],
        [0.22, 0.46, 0.32], y, body_size=6.9,
    )
    y = plan.callout("LEGAL AND LICENCE REALITY", "The repository contains mixed upstream and project licences. Preserve required notices. The Teacher Console is currently marked UNLICENSED; owner-approved redistribution and commercial-use terms are required before paid delivery.", y, kind="warn")
    y = plan.callout("DATA PRINCIPLE", "A licence proves campus entitlement; it is not a student identity system. Include campus/commercial identifiers only—never student names, progress, worlds, or bridge tokens.", y)
    plan.footer("Security and operations", y)


def readiness_page(plan: PdfPlan) -> None:
    y = plan.new_page("Definition of ready for the first paid school", "Approval checklist")
    y = plan.lead("A successful pilot is not automatically a production licence. Every item below needs evidence and owner approval before an annual payment is accepted.", y)
    y = plan.two_columns(
        "Product and Fedora",
        [
            "Fedora RPM installs, launches, updates, and uninstalls cleanly.",
            "Two physical devices pass discovery and manual LAN fallback.",
            "RPM and Console signatures verify using published steps.",
            "Known limitations and rollback artifact are available.",
            "Public release excludes every Console/customer file.",
        ],
        "Commercial and school operations",
        [
            "Console licence and third-party notices are approved.",
            "Agreement states campus, term, scope, privacy, and termination.",
            "Professional review covers entity, invoice, tax, refund, and cancellation.",
            "Private customer register and access controls are ready.",
            "Payment, delivery, renewal, reissue, and incident dry run passes.",
        ],
        y,
    )
    y = plan.two_columns(
        "Licence implementation",
        [
            "Schema, dates, canonicalisation, features, and rotation are documented.",
            "Private key has an owner and recovery procedure.",
            "Invalid/expired status cannot mutate state or run bridge.",
            "View, report export, and backup work after expiry.",
            "Renewal activates without reinstall or workspace loss.",
        ],
        "Pilot evidence",
        [
            "Teacher completes onboarding and three classroom sessions.",
            "Backup/restore and exports pass with disposable alias-only data.",
            "No unresolved critical privacy, package, security, or data-loss issue.",
            "Support effort and renewal value are reviewed against price.",
            "Owner records an explicit production go/no-go decision.",
        ],
        y,
    )
    y = plan.callout("LAUNCH RULE", "If any legal, payment, signing, expiry, export, privacy, or physical Fedora gate is incomplete, continue with an explicitly controlled free beta. Do not represent the School package as a finished paid subscription.", y, kind="navy", size=8.6)
    y = plan.section("Immediate next actions", y)
    y = plan.table(
        ["Priority", "Action", "Owner output"],
        [
            ["1", "Approve Fedora as the only initial public support target and change the release scope.", "Fedora candidate tag and physical test record"],
            ["2", "Complete owner/legal/accounting review of the School commercial package.", "Approved agreement, licence, invoice, privacy and support terms"],
            ["3", "Implement the offline licence core and export-safe Console enforcement.", "Test vectors, signed demo licence, expiry QA report"],
            ["4", "Rehearse test payment-to-delivery on a clean Fedora device.", "Auditable fulfilment record without customer/student data"],
            ["5", "Run free founding pilots before enabling paid annual fulfilment.", "Pilot evidence, defect log, go/no-go decision"],
        ],
        [0.12, 0.50, 0.38], y, body_size=6.9,
    )
    y = plan.section("Source notes", y)
    source_text = (
        "Project basis: README.md; .github/workflows/release-build.yml; teacher-console/README.md; "
        "docs/launch/SCHOOL_OFFER.md; RELEASE_CHECKLIST.md; PRIVACY_AND_SAFETY.md; and PILOT_PLAYBOOK.md. "
        "Payment references reviewed 27 August 2026: razorpay.com/docs/payments/payment-links/faqs/ and "
        "razorpay.com/docs/payments/subscriptions/settings/. This is a product and engineering plan—not legal, "
        "accounting, tax, security-certification, or procurement advice."
    )
    y += plan.text(source_text, MARGIN, y, CONTENT_W, 6.9, MUTED, spacing=0.7) + 4
    plan.footer("Definition of ready", y)


def generate(output: Path) -> None:
    if not ICON.is_file():
        raise FileNotFoundError(f"Missing cover artwork: {ICON}")
    plan = PdfPlan(output)
    cover(plan)
    product_page(plan)
    fedora_page(plan)
    fulfilment_page(plan)
    licensing_page(plan)
    expiry_page(plan)
    roadmap_page(plan)
    security_page(plan)
    readiness_page(plan)
    plan.finish()
    if plan.page_number != 9:
        raise RuntimeError(f"Expected 9 pages, generated {plan.page_number}")
    positions = ", ".join(f"p{page}={end:.0f}pt" for page, end in plan.page_end_positions)
    print(f"Generated {output} ({positions})")


if __name__ == "__main__":
    destination = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_OUTPUT
    generate(destination)
