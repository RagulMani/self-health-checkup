---
version: alpha
name: Vital Compass
description: A mobile-first health monitoring webapp for individuals tracking daily wellness metrics, with a calm, clinical aesthetic that emphasizes clarity and trustworthiness over trend-driven design.
colors:
  page_bg: "#FFFFFF"
  text_primary: "#1A1A1A"
  text_secondary: "#666666"
  text_muted: "#999999"
  accent_primary: "#0D7377"
  accent_secondary: "#14AABF"
  surface_elevated: "#F8F9FA"
  surface_card: "#FFFFFF"
  border_light: "#E5E7EB"
  danger: "#DC2626"
typography:
  display:
    fontFamily: "Segoe UI, Roboto, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.2
  h1:
    fontFamily: "Segoe UI, Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  h2:
    fontFamily: "Segoe UI, Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  h3:
    fontFamily: "Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.4
  body_lg:
    fontFamily: "Segoe UI, Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body_md:
    fontFamily: "Segoe UI, Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  body_sm:
    fontFamily: "Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Segoe UI, Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.5px"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button:
    structure: "inline-flex, center-aligned, min 44px height, icon + text optional"
    states: "default, hover (+2% darker bg), active (shadow inset), disabled (opacity 0.5), focus (outline 2px offset 2px)"
    variants: "primary (bg: {colors.accent_primary}, text: white), secondary (bg: {colors.surface_elevated}, text: {colors.text_primary}, border: 1px {colors.border_light}), danger (bg: {colors.danger}, text: white)"
  input:
    structure: "block width, border 1px {colors.border_light}, padding md, radius md, font body_md"
    states: "default, focus (border {colors.accent_primary}, shadow 0 0 0 3px {colors.accent_primary}20), disabled (bg {colors.surface_elevated}, cursor not-allowed), error (border {colors.danger}, helper text red)"
  card:
    structure: "bg {colors.surface_card}, border 1px {colors.border_light}, radius lg, padding lg, shadow 0 1px 3px rgba(0,0,0,0.08)"
    states: "default, hover (shadow 0 4px 12px rgba(0,0,0,0.12), border {colors.accent_secondary})"
  metric_tile:
    structure: "card variant, grid 2 columns mobile, 4 columns tablet+, includes label (body_sm uppercase), value (h2), unit (body_sm {colors.text_secondary}), optional status badge"
    states: "default, alert (accent border left 4px {colors.danger}), good (accent border left 4px {colors.accent_primary})"
  reminder_badge:
    structure: "inline-block, bg {colors.accent_secondary}15, border-left 3px {colors.accent_secondary}, padding sm md, radius sm, font body_sm"
    states: "default, completed (opacity 0.6, strikethrough text)"
  modal:
    structure: "fixed overlay 0 0 100% 100% bg rgba(0,0,0,0.5), center-aligned card max-width 500px, header with close button top-right, body padding lg, footer with action buttons"
    states: "open (fade-in 200ms), closed (fade-out 200ms)"
---

## Overview

Vital Compass is a health monitoring webapp designed for individuals age 16+ who want accessible, non-clinical tracking of daily wellness metrics. The aesthetic is calm, trustworthy, and institutional—borrowing visual language from healthcare settings (muted teals, clean typography, clinical card layouts) while remaining approachable and non-alarming. The interface prioritizes clarity and safety: every measurement includes contextual ranges, disclaimers are always visible, and alerts use warm, non-accusatory language. The design serves daily check-ins and reflective health insight, not emergency diagnosis. Light mode is mandatory, as users perform health tracking in variable environments (home, clinic waiting room, workplace) and require high-contrast legibility under different lighting conditions.

## Colors

**Palette role:**
- **page_bg (#FFFFFF)**: Page background. All content sits on white; no tinted backgrounds.
- **text_primary (#1A1A1A)**: Body copy, labels, and headings. Strict WCAG AA contrast (17.5:1).
- **text_secondary (#666666)**: Subtext, timestamps, helper text, inactive states. Contrast 7.5:1 on white.
- **text_muted (#999999)**: Disabled labels, placeholders. Contrast 3.9:1 on white (acceptable for UI controls, not body copy).
- **accent_primary (#0D7377)**: Primary actions (buttons, navigation active states, metric focus). Clinical teal, evokes healthcare trust.
- **accent_secondary (#14AABF)**: Highlights, hover states, secondary accents, informational badges. Lighter teal, reduces cognitive load on repeated encounters.
- **surface_elevated (#F8F9FA)**: Subtle background for input containers, card backgrounds in stacked layouts, and disabled states. Almost-white, reducing glare.
- **surface_card (#FFFFFF)**: Card surfaces; same as page_bg to reduce visual hierarchy clutter.
- **border_light (#E5E7EB)**: All dividers, input borders, card outlines. Neutral gray, never accent color.
- **danger (#DC2626)**: Alerts, error states, and critical health flags (e.g., blood pressure > 180/120). Red, not orange; clinical clarity.

**Usage constraints:**
- Accent colors appear in ≤20% of UI (buttons, active tabs, metric alerts).
- Text colors may never be inverted (no white text on light bg).
- Danger color appears only in alerts and error fields; never as decoration.
- All text/background pairs must meet WCAG AA (4.5:1 for body, 3:1 for large text). Danger text on white: 5.2:1 ✓.

## Typography

**Font stack and roles:**
- **Segoe UI / Roboto (sans-serif, system stack)**: Single typeface family. No serifs (clinical clarity), no novelty fonts (accessibility). Robust across Android, iOS, Windows, macOS.
  - **Display (2rem, 600)**: Page title (e.g., "Dashboard"). Very rare; used once per screen.
  - **H1 (1.5rem, 600)**: Section headers (e.g., "Health Metrics", "Symptom Checker").
  - **H2 (1.25rem, 600)**: Subsection headers and card titles.
  - **H3 (1rem, 600)**: Metric labels, form section headers.
  - **Body_lg (1rem, 400)**: Primary body copy, modal text, form descriptions.
  - **Body_md (0.9375rem, 400)**: Default body copy, table cells.
  - **Body_sm (0.875rem, 400)**: Helper text, timestamps, secondary detail.
  - **Label (0.8125rem, 600, +0.5px letter-spacing)**: Form labels, badges, tab labels. Uppercase for form field names only.

**Casing rules:**
- Headings (H1–H3): Sentence case (capitalize first word and proper nouns only).
- Form labels: Sentence case, not all-caps.
- Button labels: Sentence case (e.g., "Download report", not "DOWNLOAD REPORT").
- Tab labels: Sentence case.
- Badges and small labels: Sentence case; use all-caps only if explicitly part of an acronym (e.g., "BMI", "HR").

**Pairing rationale:** Single sans-serif family ensures scanability and reduces cognitive load in a medical/clinical context. Weights differentiate hierarchy; no italics used. Line-height ≥1.4 aids readability for users checking health data multiple times daily.

## Layout

**Grid & density:**
- Desktop: 12-column grid, gutters 24px. Comfortable density (not compact, not spacious).
- Tablet (768px+): 8-column grid, gutters 16px.
- Mobile (<768px): Single column, gutters 16px.
- Max content width: 1200px (centered on desktop).

**Section rhythm:**
- Top nav/header: 64px height (logo + user menu).
- Page title section: 32px padding top/bottom (H1).
- Card spacing: 16px gap between cards in a grid.
- Vertical section padding: 32px between major sections (Dashboard → Symptom Checker).

**Signature layout moves:**
1. **Dashboard hero**: Large metric tiles (2 columns mobile, 4 columns desktop) displaying BMI, heart rate, blood pressure, temperature, blood sugar, sleep, water, activity. Each tile is a card with a visual status indicator (green bar, red border, or neutral).
2. **Sidebar + content panel (desktop)** / **Tab strip (mobile)**: Navigation (Dashboard, Health History, Symptom Checker, Reminders, Profile) lives in a left sidebar (desktop, 240px) or top tab strip (mobile). Content fills remaining space.
3. **Modal for input forms**: Adding a new health check-in, editing reminders, or downloading a report uses a centered modal (max-width 500px) over a semi-transparent overlay.

**Responsive behavior:**
- Mobile-first: single column, stacked cards, bottom sheet–style modals.
- Tablet: 2-column layout for metric tiles, sidebar collapses to icon-only tabs.
- Desktop: full sidebar, 4-column metric grid, side-by-side panels for comparison charts.

## Elevation & Depth

**Shadow system (CSS):**
- **Elevation 0** (default card): `0 1px 3px rgba(0, 0, 0, 0.08)`
- **Elevation 1** (card hover, input focus): `0 4px 12px rgba(0, 0, 0, 0.12)`
- **Elevation 2** (modals, dropdowns, sticky headers): `0 12px 24px rgba(0, 0, 0, 0.15)`
- **Inset shadow** (pressed button state): `inset 0 2px 4px rgba(0, 0, 0, 0.1)`

**Three elevation levels:** Ground (page bg), raised (cards, buttons), floated (modals, overlays).

**Interaction behavior:**
- **Hover**: Card shadow increases to Elevation 1; text/background lightens 2%.
- **Active/pressed**: Button shadow becomes inset; background darkens 5%.
- **Disabled**: Opacity 0.5, no hover effect, cursor not-allowed.
- **Focus**: 2px outline in accent_primary, 2px offset from element edge (keyboard navigation).

No animation/motion (medical app context; motion can distract from critical data).

## Shapes

**Radius philosophy:**
- **sm (4px)**: Form inputs, small badges, reminder pills.
- **md (8px)**: Buttons, standard inputs, disclosure triangles.
- **lg (12px)**: Cards, large modals, rounded corners for chart containers.
- **No full radius (50%)**: Clinical aesthetic avoids soft, rounded-pill shapes.

**Icon style:**
- **Stroke-based, 24px grid, 2px stroke weight**: Icons are outlined (not filled) for clarity. Consistent with iOS/Material system icons.
- Examples: heart outline (heart rate), droplet outline (water), moon outline (sleep), activity outline (exercise), alert triangle (warnings).

**Decorative language:**
- Minimal decoration (no gradients, patterns, or illustrations).
- Forbidden: rounded corners >12px, drop shadows on text, animated backgrounds, emoji.
- Permitted: simple color-coded left borders on metric cards (4px, accent_primary for good, danger for warning), light divider lines (border_light).

## Components

- **Button**: Inline-flex, center-aligned, minimum 44px height (touch target), 16px horizontal padding. Variants: primary (teal bg, white text), secondary (elevated bg, dark text, light border), danger (red bg, white text). States: default, hover (shadow increase, 2% darker), active (inset shadow), disabled (opacity 0.5), focus (2px outline). Copy: action verbs in sentence case (e.g., "Save health check", "Download report").

- **Input field**: Block width 100%, border 1px border_light, 12px horizontal padding, 8px vertical padding (44px total height), radius md, font body_md. Placeholder text in text_muted. States: default, focus (border accent_primary, shadow 0 0 0 3px accent_primary 20%), disabled (bg surface_elevated, text text_muted, cursor not-allowed), error (border danger, red helper text below). Labels always visible above input (not floating).

- **Card**: bg surface_card, border 1px border_light, radius lg, padding 16px (mobile) / 24px (desktop), shadow Elevation 0. States: default, hover (shadow Elevation 1, border accent_secondary), alert (left border 4px danger if critical metric), good (left border 4px accent_primary if healthy metric). No flip/3D transforms.

- **Metric tile**: Subtype of card. Two-column grid (mobile), four-column (desktop). Each tile shows: label (body_sm, uppercase metric name), value (h2, metric number), unit (body_sm, secondary text, e.g., "kg", "mmHg"), optional status badge (small pill: "Good", "Caution", "Alert"). Background stays white; color change comes via left border or badge color, never full tile tint.

- **Reminder badge**: Inline-block, bg accent_secondary 15% (pale teal), left border 3px accent_secondary, padding 8px 16px, radius sm, font body_sm. Displays reminder type (e.g., "Morning checkup", "Medication reminder"). States: default (text_primary), completed (opacity 0.6, strikethrough, text_secondary). No animation.

- **Modal**: Fixed overlay (0 0 100% 100%, bg rgba(0,0,0,0.5)). Center-aligned card (max-width 500px, mobile 100% - 32px). Header with H2 title and close button (top-right, × icon, 24px). Body with lg padding. Footer with two buttons (Cancel secondary, Action primary). No backdrop blur. Fade-in 200ms on open, fade-out 200ms on close.

## Do's and Don'ts

- **Do** use a light background (white page_bg) for all screens; do not apply tinted or dark modes. Medical data requires maximum contrast and legibility in varied lighting.
- **Do** include a disclaimer banner at the top of the app (height 48px, bg surface_elevated, border-top 2px accent_primary) stating: "This app is for informational purposes only and does not replace professional medical diagnosis or emergency care. Always consult a doctor for concerning symptoms." Keep it visible at all times on desktop.
- **Do** keep all text size ≥12px (body_sm); do not use fonts smaller than 0.875rem. Users may have vision impairment; clinical data must remain legible.
- **Don't** use more than two accent colors in a single screen; limit accent_primary to buttons and active tabs, accent_secondary to hover/info states only.
- **Don't** add animations, parallax scrolling, or micro-interactions. Medical apps prioritize data clarity over delight; motion may distract or confuse users interpreting health alerts.
- **Don't** apply border-radius >12px (lg). No pill-shaped buttons, no fully rounded corners; clinical aesthetic demands precision and clarity, not soft curves.
- **Don't** forget minimum 44px touch targets for all interactive elements (buttons, tabs, input fields) on mobile; ensure focus states are visible (2px outline) for keyboard navigation in compliance with WCAG 2.1 Level AA.