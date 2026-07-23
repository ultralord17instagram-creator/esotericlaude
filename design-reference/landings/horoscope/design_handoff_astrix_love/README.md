# Handoff: Astrix — «Любовь» (love quiz → forecast flow)

## Overview
Astrix is an astrology app. This design covers a self-contained love flow: the user answers a
single question about their love situation, enters their birth date and name, watches an
astrological loading animation, and lands on a personalized "love forecast" result screen with
teaser rows that upsell deeper readings.

Two files are included:
- **Mobile** — `Astrix Love.dc.html` (390 px frame, single scrolling column).
- **Desktop** — `Astrix Love Desktop.dc.html` (full-bleed, centered content, two-column result).

Both share identical logic and copy — only layout differs.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing the
intended look and behavior, **not production code to copy directly**. They are authored in a
small in-house component format (a `<x-dc>` template + a `Component` logic class); ignore that
wrapper. The task is to **recreate these designs in the target codebase's existing environment**
(React, Vue, SwiftUI, native, etc.) using its established patterns, component library, and design
tokens. If no environment exists yet, pick the most appropriate framework and implement there.

The logic class is plain vanilla JS and maps cleanly to any component model: it's a single
state machine (`step`) plus a few pure helpers (`zodiac`, `score`, `reading`). See **State
Management** below.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are intended to be
reproduced faithfully. Exact values are in **Design Tokens**. The only intentionally rough parts
are the icon/glyphs (see **Assets**) — those are Unicode astrological glyphs used as placeholders
and may be swapped for the codebase's real icon set.

## Screens / Views
The flow is a 5-step state machine. A progress indicator is always visible at top: 5 pill
segments (mobile: 22×4 px; desktop: 30×4 px), filled `#a996ff` up to and including the current
step, otherwise `rgba(150,130,240,.2)`.

### 1. Intro (`step: 'intro'`)
- **Purpose:** user picks the statement closest to their current love situation.
- **Layout (mobile):** centered column. Glow orb (86 px circle) with `♡` glyph → kicker
  `ASTRIX · ЛЮБОВЬ` → H1 question → three stacked option rows.
- **Layout (desktop):** centered, max-width 1120 px. Same header, then a **3-column grid**
  (`repeat(3,1fr)`, gap 22 px) of option cards.
- **Copy:**
  - Kicker: `ASTRIX · ЛЮБОВЬ`
  - H1: **Что у тебя с любовью прямо сейчас?**
  - Sub (desktop only): `Выбери, что ближе всего — звёзды подберут расклад именно для тебя`
  - Options (value → title → subtitle):
    - `a` → **Жду своего человека** / `Верю, что встреча впереди`
    - `b` → **Не могу отпустить** / `Прошлое всё ещё держит`
    - `c` → **Всё время не складывается** / `Хочу понять причину`
  - Mobile options are radio-style rows (24 px circle + label). Desktop options are cards with
    title + subtitle (no icons — icons were intentionally removed).
- **Behavior:** clicking an option sets `loveAnswer` and advances to `dob`.

### 2. Date of birth (`step: 'dob'`)
- **Purpose:** capture birthday, derive zodiac sign live.
- **Layout:** centered card, max-width 560 px (desktop). Pulsing 74–84 px ring with `☾` glyph →
  H2 → sub → input row → live zodiac chip → primary button.
- **Copy:** H2 **Когда ты родилась?** · sub `Дата рождения раскроет твой знак` · button `Далее`.
- **Inputs (flex row, gap 10–12 px):** day `ДД` (fixed width), month `<select>` (flex:1, options
  Январь…Декабрь value 1–12), year `ГГГГ` (fixed width). Day/year strip non-digits; day max 2
  chars, year max 4.
- **Live chip:** once month+day are set, show pill: `{zodiacGlyph} Твой знак — {zodiacName}`.
- **Behavior:** `Далее` only advances (to `name`) when the date is valid
  (`1≤d≤31, 1≤m≤12, 1900≤y≤2025`). Button background is full `#8b7cf0` when valid, else
  `rgba(139,124,240,.3)` (disabled look).

### 3. Name (`step: 'name'`)
- **Purpose:** capture first name.
- **Layout:** same centered card as DOB. Pulsing ring with `✧` glyph → H2 → sub → text input →
  primary button.
- **Copy:** H2 **Как тебя зовут?** · sub `Звёзды обращаются к тебе по имени` ·
  placeholder `Твоё имя` · button `Составить прогноз`.
- **Behavior:** button disabled-look until name is non-empty; on click starts loading.

### 4. Loading (`step: 'loading'`)
- **Purpose:** perceived-effort animation while "computing" the forecast.
- **Layout:** centered. Composite animated widget (mobile 260 px, desktop 320 px):
  - Radial aura, gentle pulse.
  - Outer ring with 8 zodiac glyphs (`♈♉♊♋♌♍♎♏`), spins 26 s.
  - Middle dashed ring, counter-spins 18 s.
  - Two orbiting planet dots (14 px light dot orbiting 7 s; 9 px violet dot orbiting 4.5 s reverse).
  - Glowing core (120–150 px) showing live `{progress}%`.
  - Status line (cycles by progress): `Звёзды выстраиваются…` (<25) →
    `Читаем твою натальную карту…` (<50) → `Венера открывает твой дом любви…` (<75) →
    `Составляем любовный прогноз…`. Below: `{name}, звёзды почти сошлись…`
- **Behavior:** `progress` increments +2 every 55 ms (0→100 ≈ 2.75 s). At 100% wait 400 ms then
  go to `result`.

### 5. Result (`step: 'result'`)
- **Purpose:** show the personalized forecast + teaser upsell rows.
- **Layout (mobile):** single scrolling column inside the frame. Header (kicker + name/sign chip)
  → score ring → four revealed reading sections → four teaser rows → "Пройти ещё раз".
- **Layout (desktop):** max-width 1080 px, **2-column grid** `360px 1fr`, gap 56 px.
  - **Left (sticky):** hero card — kicker `ТВОЙ ЛЮБОВНЫЙ ПРОГНОЗ`, chip `{name} · {zodiacName}`,
    score ring, outline `Пройти ещё раз` button.
  - **Right:** four reading sections stacked, then a 2-column grid of teaser rows.
- **Score ring:** 172 px (mobile) / 190 px (desktop). Track `rgba(255,255,255,.05)`, value arc via
  conic-gradient from −90° (`#c4b7ff`→`#8b7cf0` up to `score*3.6deg`, rest `rgba(255,255,255,.04)`),
  dark inner hole (126/138 px) containing `♥`, big `{loveScore}%`, caption `энергия любви`.
  `loveScore` = deterministic 70–97 hash of name+day+year.
- **Reading sections** (label in violet caps + body, content depends on `loveAnswer` — see
  `reading()`):
    - `ЕГО ЗНАК`, `ВОЗРАСТ`, `КАКОЙ ОН`, `КАК ПОЗНАКОМИТЕСЬ`.
- **Teaser rows** (label + a small pill button `Узнать`; these are the paywall hooks, no padlocks):
    - `ПЕРВАЯ БУКВА ЕГО ИМЕНИ`, `МЕСЯЦ, КОГДА ВЫ ВСТРЕТИТЕСЬ`,
      `КАК ТЫ УЗНАЕШЬ ЕГО СРЕДИ ДРУГИХ`, `ЧТО ЧУТЬ НЕ ПОМЕШАЕТ ВАМ`.
- **Behavior:** `Пройти ещё раз` resets all state to the intro. `Узнать` buttons are the intended
  paywall entry points (no handler wired in the prototype).

## Interactions & Behavior
- **Navigation:** linear `intro → dob → name → loading → result`, plus reset from result.
- **Validation:** DOB range check; name non-empty. Invalid → button shows disabled color and does
  nothing on click.
- **Animations (all CSS):**
  - `astrixSpin` 26 s linear infinite (outer zodiac ring).
  - `astrixSpinRev` 18 s linear infinite (dashed ring).
  - `astrixOrbit` 7 s / 4.5 s-reverse linear infinite (planet dots).
  - `astrixPulse` 4–5 s ease-in-out infinite (rings/aura scale+opacity).
  - `astrixGlow` 4 s ease-in-out infinite (core box-shadow breathe).
  - `astrixTwinkle` 3–5 s ease-in-out infinite (background stars opacity).
- **Hover (desktop):** intro option cards → border `#a996ff`, background `rgba(139,124,240,.12)`.
- **Loading progress:** JS interval, +2 / 55 ms.
- **Responsive:** ship the two files as two breakpoints. Mobile is a 390 px column; desktop centers
  content and switches intro to a 3-col grid and result to a 2-col grid.

## State Management
Single component state:
```
step: 'intro' | 'dob' | 'name' | 'loading' | 'result'   // current screen
loveAnswer: '' | 'a' | 'b' | 'c'                          // intro choice
day, month, year: string                                  // birth date inputs
name: string                                              // first name
progress: number                                          // 0–100 loading counter
```
Derived (pure, recomputed on render):
- `zodiac(month, day)` → `{ name, glyph }` using standard tropical cutoffs.
- `dobOk()` → boolean range check.
- `score()` → deterministic 70–97 from `name+day+year` (stable per user).
- `reading()` → `{ aboutSign, age, character, meet }` keyed by `loveAnswer` (3 variants; see file).
Transitions: option click → `dob`; valid `Далее` → `name`; `Составить прогноз` → `loading`
(starts interval); progress 100% (+400 ms) → `result`; `Пройти ещё раз` → full reset.
No data fetching — all content is local. Wire `Узнать` / the real "full reading" to your backend.

## Design Tokens
**Colors**
- Page background: `#0a0714`; card/frame inner: `#08050f`; deep panel: `#120d26` / `#17102e`.
- Primary violet (buttons/accents): `#8b7cf0`; accent light: `#a996ff`; brighter: `#c4b7ff`.
- Star/among highlights: `#e6ddff`, `#b7a8ff`, `#cdbfff`, `#fff`.
- Text: primary `#F4F1FF` / `#F1EEFB`; body `#d6cfe8` / `#d8d0ef`; muted `#8b84a8` / `#8079a4`;
  faint label `#7b7498`.
- Translucent fills: cards `rgba(255,255,255,.03–.045)`; violet tint `rgba(139,124,240,.12–.18)`;
  borders `rgba(150,130,240,.16–.2)` and `rgba(160,140,255,.24–.4)`.
- Glow orbs: `radial-gradient(circle, rgba(139,124,240,.4–.55), transparent 66–70%)`.

**Typography**
- Display/headings/kickers/buttons: **Unbounded** (weights 400–700). Kickers use letter-spacing
  `.26–.44em`, uppercase.
- Body/UI/inputs: **Golos Text** (400–500).
- Optional serif accent: **PT Serif** (used earlier for an upsell heading; currently unused).
- Sizes (desktop): H1 46 px; step H2 32 px; body 17 px; option title 22 px; section label 13 px;
  score number 40 px. (Mobile: H1 27 px; H2 24 px; body 15.5 px; score 36 px.)

**Radius:** cards 26–28 px; frame 40 px; inputs/buttons 16 px; pills/chips 100 px; small icon
boxes 9–15 px.

**Spacing:** container paddings 30–56 px; section gaps 22–56 px; input gap 10–12 px.

**Shadows / glow:** orb `0 0 40–50px rgba(139,124,240,.4–.5)`; core inset
`inset 0 0 22–24px rgba(139,124,240,.35)`; twinkle stars `0 0 6px #b7a8ff`.

## Assets
- **Icons/glyphs are Unicode**, rendered as text with a `\uFE0E` (text-presentation) suffix to
  force monochrome (no emoji color): `♡ ☾ ✧ ✦ ♥` and zodiac `♈♉♊♋♌♍♎♏♐♑♒♓`. Replace with the
  codebase's real icon set if preferred; keep them monochrome violet.
- No raster images, no external media. Fonts load from Google Fonts (Unbounded, Golos Text,
  PT Serif) — swap for self-hosted/licensed equivalents as your project requires.
- All copy is in **Russian**; keep it verbatim unless localizing.

## Files
- `Astrix Love.dc.html` — mobile flow (reference).
- `Astrix Love Desktop.dc.html` — desktop flow (reference).
Both contain the full template + the `Component` logic class (vanilla JS state machine + helpers).
