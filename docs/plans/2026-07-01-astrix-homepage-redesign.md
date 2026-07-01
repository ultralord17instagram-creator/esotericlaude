# Astrix Homepage Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current dark/cyan homepage with the warm "parchment + gold" Astrix design (reference variant **2a «Гибрид»**), applied globally — new design tokens, fonts, and Nav — while removing the WebGL animation layer.

**Architecture:** This is a **re-skin**, not a restructure. The current homepage (`app/page.jsx`) already has the exact sections the design needs (hero → products → how-it-works → reviews → footer). We rewrite the global design tokens in `styles/theme.css`, swap the two Google fonts in `layout.jsx`, re-skin the global `Nav`, rewrite `landing.module.css` + `page.jsx` to match variant 2a, and replace the WebGL-driven `AnimatedCards` with a static product-card component that uses per-service inline SVG icons. Inner pages (matrix/tarot/etc.) inherit the new tokens automatically; fully re-skinning them is explicitly out of scope (see Task 9 audit).

**Tech Stack:** Next.js 14 (App Router), React 18, CSS Modules, `next/font/google`. No new dependencies. The design reference lives in `design-reference/` (canvas doc `Astrix Home (bundle-src).html` — variant 2a is the `id='2a'` block, lines ~31–208; its data arrays are in the `renderVals()` script, lines ~593–609).

**Verification approach:** This is a visual change, so "tests" are: (1) `npm run build` compiles clean, (2) the dev server renders the page without console errors, (3) a screenshot compared against `design-reference/screenshots/`. There are no unit tests for CSS — do not fabricate them. Use the `verify` / `run` skill or `mcp__Claude_Preview__*` tools for the visual checks.

---

## Design Tokens (single source of truth — reuse these exact values throughout)

**Palette (from variant 2a):**
- Parchment page bg: `#EAE0CE` · canvas/outer bg: `#D8CEB9`
- Light tiles/cards: `#FBF7EF` · `#F3ECDB` · `#F3ECDD`
- Graphite (footer, hero medallion, dark icon chips): `#1B1A30` · deep night `#171630`
- Gold accents: `#B9954F` (primary) · `#C6A667` · `#D8B884` · `#E4CB98`
- Blush (Демо chip, avatars): bg `#E7CFC9` · text `#8A544C`
- Text: heading `#211F30` · alt `#26243A` · body `#6E6551` · muted-caps `#9A8D72`
- Borders: hairline `rgba(30,29,52,.08)` · gold `rgba(185,149,79,.3)`

**Fonts (Google Fonts, both support Cyrillic):**
- Serif (headings, logo, quotes): **Source Serif 4** — weights 400/500/600 + italic 400
- Sans (body, UI): **Golos Text** — weights 400/500/600/700

---

## Task 1: Preflight — branch + baseline

**Files:** none (git + dev server only)

**Step 1:** Create a working branch off `master`.
```bash
git checkout -b feat/astrix-homepage-redesign
```

**Step 2:** Start the dev server in the background and capture the CURRENT homepage as a before-shot (for comparison later).
```bash
cd frontend && npm run dev
```
Then screenshot `http://localhost:3000/` (via the `run`/`verify` skill or `mcp__Claude_Preview__preview_screenshot`). Save mentally as "before".
Expected: current dark/cyan page renders.

**Step 3:** Commit nothing yet — this task is setup only.

---

## Task 2: Global design tokens (`styles/theme.css`)

**Files:**
- Modify: `frontend/app/styles/theme.css` (full `:root` block + `body`/`a`, lines 1–85)

**Step 1: Rewrite the `:root` token block.** Replace the Backgrounds / Text / Accent / Borders / Fonts groups with the Astrix palette. Keep the type-scale, spacing, and **all legacy aliases** (lines 46–68) so other pages keep compiling — just repoint the alias *values*.

```css
:root {
  /* Backgrounds */
  --bg-deep:    #1B1A30;   /* graphite — footer, hero medallion */
  --bg-night:   #171630;   /* deep night panel */
  --bg-base:    #EAE0CE;   /* parchment page */
  --bg-canvas:  #D8CEB9;   /* outer canvas */
  --bg-raised:  #FBF7EF;   /* light tiles / cards */
  --bg-tile:    #F3ECDB;
  --bg-card:    #FBF7EF;

  /* Text */
  --text-primary:   #211F30;
  --text-secondary: #6E6551;
  --text-muted:     #9A8D72;
  --text-on-dark:   #F3ECDB;

  /* Accent — gold */
  --accent:         #B9954F;
  --accent-soft:    #C6A667;
  --accent-light:   #D8B884;
  --accent-glow:    #E4CB98;
  --accent-dim:     rgba(185, 149, 79, 0.10);
  --accent-hover:   #A08A5E;

  /* Blush */
  --blush-bg:       #E7CFC9;
  --blush-text:     #8A544C;

  /* Borders */
  --border:         rgba(30, 29, 52, 0.08);
  --border-accent:  rgba(185, 149, 79, 0.30);

  /* Fonts */
  --font-heading: var(--font-serif), 'Source Serif 4', Georgia, serif;
  --font-body:    var(--font-sans),  'Golos Text', system-ui, sans-serif;

  /* Type scale — unchanged */
  --text-xs: 11px; --text-sm: 14px; --text-base: 16px; --text-lg: 20px;
  --text-xl: 28px; --text-2xl: 40px; --text-3xl: 56px; --text-4xl: 72px;

  /* Spacing — unchanged */
  --space-section: 100px; --max-width: 1100px;
  --radius-sm: 8px; --radius-md: 12px; --radius-lg: 20px;

  /* Animation — unchanged */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);

  /* Legacy aliases — repointed to new palette */
  --color-bg:             var(--bg-base);
  --color-surface:        var(--bg-raised);
  --color-surface-hover:  var(--bg-tile);
  --color-text-primary:   var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-accent:         var(--accent);
  --color-accent-hover:   var(--accent-hover);
  --color-border:         var(--border);
  --color-success:        #4E9A6B;
  --color-error:          #B4524A;
  --font-sans:            var(--font-body);
  --font-size-xs:  var(--text-xs);  --font-size-sm:  var(--text-sm);
  --font-size-base:var(--text-base);--font-size-lg:  var(--text-lg);
  --font-size-xl:  var(--text-xl);  --font-size-2xl: var(--text-2xl);
  --font-size-3xl: var(--text-3xl);
  --line-height-base: 1.6;
  --radius-xl: 28px;
  --spacing-section: var(--space-section);
  --max-width-narrow: 680px;
}
```

**Step 2: Update the `body` background** (line 78) from `var(--bg-deep)` to `var(--bg-base)`:
```css
body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-base);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```
Leave the `a { color: var(--accent); }` rules as-is (they now resolve to gold).

**Step 3: Verify build.**
Run: `cd frontend && npm run build`
Expected: compiles with no errors (the `--font-serif` / `--font-sans` vars are defined in Task 3; a build now still succeeds because they fall back to the literal font names).

**Step 4: Commit.**
```bash
git add frontend/app/styles/theme.css
git commit -m "feat: swap global design tokens to Astrix parchment/gold palette"
```

---

## Task 3: Swap global fonts (`layout.jsx`)

**Files:**
- Modify: `frontend/app/layout.jsx` (lines 4–7, 21)

**Step 1:** Replace the `Cinzel`/`Inter` imports and instances with `Source_Serif_4` and `Golos_Text`, exposing them as the `--font-serif` / `--font-sans` CSS variables that theme.css now references.

```jsx
import { Source_Serif_4, Golos_Text } from 'next/font/google'

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})
const sans = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})
```

**Step 2:** Update the `<html>` className (line 21):
```jsx
<html lang="ru" className={`${serif.variable} ${sans.variable}`}>
```

**Step 3: Verify.**
Run: `cd frontend && npm run build`
Expected: compiles clean; fonts resolve. If `next/font` errors on a weight, confirm the weight exists for that family (Source Serif 4 supports 400–600; Golos Text 400–700).

**Step 4: Commit.**
```bash
git add frontend/app/layout.jsx
git commit -m "feat: switch global fonts to Source Serif 4 + Golos Text"
```

---

## Task 4: Re-skin the global Nav

**Files:**
- Modify: `frontend/app/components/Nav.module.css` (full file)
- Modify: `frontend/app/components/Nav.jsx` (logo text/icon — lines 3, 13–15, 22)

**Step 1: Rewrite `Nav.module.css`** to a light parchment bar with a gold hairline and a filled graphite CTA (matches the reference header: transparent "Войти" + solid dark pill). Drop the cyan radial glows.

```css
.nav {
  background: rgba(234, 224, 206, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
}

.inner {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 0 24px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 9px;
}
.logo:hover { opacity: 0.75; }

.links { display: flex; align-items: center; gap: 20px; }

.link {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  transition: color 0.2s;
}
.link:hover { color: var(--text-primary); }

/* solid graphite pill CTA */
.cta {
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-on-dark);
  background: var(--bg-deep);
  border-radius: 999px;
  padding: 10px 18px;
  transition: opacity 0.2s;
}
.cta:hover { opacity: 0.9; text-decoration: none; }
.cta span { position: relative; }
```

**Step 2: Update `Nav.jsx`** — change the logo to "Astrix" with the crescent-star mark, and swap the lucide `Sparkles` import for the inline logo SVG. Replace the logo Link (lines 13–15):
```jsx
<Link href="/" className={styles.logo}>
  <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
    <circle cx="12" cy="13" r="8.5" fill="none" stroke="#B9954F" strokeWidth="1.3"/>
    <circle cx="15.5" cy="11" r="8.5" fill="#EAE0CE"/>
    <path d="M18.7 15 l.7 1.9 1.9 .7 -1.9 .7 -.7 1.9 -.7 -1.9 -1.9 -.7 1.9 -.7 z" fill="#B9954F"/>
  </svg>
  Astrix
</Link>
```
Remove the now-unused `import { Sparkles } from 'lucide-react'` (line 3).
> Note: keep the logo circle fill `#EAE0CE` matching the parchment bg (the crescent is a knockout). If the Nav bg differs, match it.

**Step 3: Verify.**
Run: `cd frontend && npm run build` — expected clean.
Visual: reload `/`, Nav is a light bar with "Astrix" mark, gold hairline, dark "Попробовать" pill.

**Step 4: Commit.**
```bash
git add frontend/app/components/Nav.jsx frontend/app/components/Nav.module.css
git commit -m "feat: re-skin global Nav to Astrix light/parchment style"
```

---

## Task 5: Per-service SVG icons + data

**Files:**
- Create: `frontend/app/components/ui/ServiceIcon.jsx`

**Context:** The reference draws a bespoke inline SVG per service (matrix/taro/horoscope/numerology) in a `#D8B884` gold stroke — see bundle-src lines 111–114. We map by the existing `PRODUCTS[].id` (`matrix`, `tarot`, `horoscope`, `numerology`) so no data migration is needed.

**Step 1: Create `ServiceIcon.jsx`** — a pure presentational component (no `'use client'` needed; it's static SVG).
```jsx
// Bespoke esoteric glyph per service, gold stroke on a dark medallion.
export default function ServiceIcon({ id, size = 28, color = '#D8B884' }) {
  const common = { width: size, height: size, viewBox: '0 0 28 28', 'aria-hidden': true }
  switch (id) {
    case 'matrix':
      return (
        <svg {...common}>
          <rect x="6" y="6" width="16" height="16" fill="none" stroke={color} strokeWidth="1.3"/>
          <rect x="6" y="6" width="16" height="16" transform="rotate(45 14 14)" fill="none" stroke={color} strokeWidth="1.3"/>
          <circle cx="14" cy="14" r="1.5" fill={color}/>
        </svg>
      )
    case 'tarot':
      return (
        <svg {...common}>
          <rect x="9" y="4" width="10" height="20" rx="2.5" fill="none" stroke={color} strokeWidth="1.3"/>
          <path d="M14 8.5 l1.1 2.9 2.9 1.1 -2.9 1.1 -1.1 2.9 -1.1 -2.9 -2.9 -1.1 2.9 -1.1 z" fill="none" stroke={color} strokeWidth="1.2"/>
        </svg>
      )
    case 'horoscope':
      return (
        <svg {...common}>
          <circle cx="14" cy="14" r="4" fill="none" stroke={color} strokeWidth="1.3"/>
          <ellipse cx="14" cy="14" rx="10.5" ry="5.5" transform="rotate(-22 14 14)" fill="none" stroke={color} strokeWidth="1.2"/>
          <circle cx="22.5" cy="10.5" r="1.4" fill={color}/>
        </svg>
      )
    case 'numerology':
      return (
        <svg {...common}>
          <circle cx="14" cy="14.5" r="8.5" fill="none" stroke={color} strokeWidth="1.3"/>
          <path d="M14 6.5 L21 20 L7 20 Z" fill="none" stroke={color} strokeWidth="1.2"/>
          <circle cx="14" cy="15.5" r="1.3" fill={color}/>
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M14 4 l2.2 7.2 7.2 2.2 -7.2 2.2 -2.2 7.2 -2.2 -7.2 -7.2 -2.2 7.2 -2.2 z" fill="none" stroke={color} strokeWidth="1.2"/>
        </svg>
      )
  }
}
```

**Step 2: Verify import path resolves** (no runtime test yet — it's consumed in Task 6).
Run: `cd frontend && npm run build` — expected clean (unused component is tree-shaken; build still passes).

**Step 3: Commit.**
```bash
git add frontend/app/components/ui/ServiceIcon.jsx
git commit -m "feat: add per-service Astrix SVG glyphs"
```

---

## Task 6: New static ProductCards component (replaces AnimatedCards)

**Files:**
- Create: `frontend/app/components/ui/ProductCards.jsx`
- (AnimatedCards.jsx stays on disk until Task 10 cleanup — do not delete yet)

**Context:** Reference product card = variant 2a card (bundle-src lines 107–127): white tile `#FBF7EF`, gold-to-blush accent bar on top, 60px graphite medallion holding the gold `ServiceIcon`, blush "Демо" chip, tag caps + serif name, description, and a footer row ("Открыть демо →" + a lock "Подписка"). No motion library — cards are static with CSS hover only.

**Step 1: Create `ProductCards.jsx`.** No `'use client'` — it's a plain server component (static markup, `Link` works in RSC).
```jsx
import Link from 'next/link'
import ServiceIcon from './ServiceIcon'
import styles from '../../landing.module.css'

export default function ProductCards({ products }) {
  return (
    <div className={styles.productsGrid}>
      {products.map((p) => (
        <Link key={p.id} href={`/${p.slug}`} className={styles.productCard}>
          <span className={styles.productAccentBar} aria-hidden="true" />
          <div className={styles.productTop}>
            <span className={styles.productMedallion}>
              <ServiceIcon id={p.id} />
            </span>
            <span className={styles.productDemo}>Демо</span>
          </div>
          <div>
            <div className={styles.productTag}>{p.name}</div>
            <h3 className={styles.productName}>{p.name}</h3>
          </div>
          <p className={styles.productDesc}>{p.description}</p>
          <div className={styles.productFoot}>
            <span className={styles.productCta}>Открыть демо →</span>
            <span className={styles.productSub}>
              <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true">
                <rect x="1.5" y="5" width="8" height="6" rx="1.4" fill="none" stroke="#9A8D72" strokeWidth="1.1"/>
                <path d="M3.2 5 V3.4 a2.3 2.3 0 0 1 4.6 0 V5" fill="none" stroke="#9A8D72" strokeWidth="1.1"/>
              </svg>
              Подписка
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
```
> Note: the reference has a separate `p.tag` ("Психокарта личности") distinct from `p.name`. Our `products.config.js` has no `tag` field. Either (a) reuse `p.name` for the eyebrow as above (simplest, YAGNI), or (b) add a `tag` field to each product in `products.config.js` using the reference copy: Матрица→"Психокарта личности", Таро→"Расклад на вопрос", Гороскоп→"Ежедневный прогноз", Нумерология→"Число судьбы". **Recommended: (b)** — it's four one-line edits and looks intentional. If you do (b), render `{p.tag}` in the tag span.

**Step 2:** If choosing option (b), edit `frontend/app/products.config.js` to add `tag: '...'` to each of the 4 products.

**Step 3: Verify** after Task 7 wires it in (this component is not yet rendered). For now: `npm run build` clean.

**Step 4: Commit.**
```bash
git add frontend/app/components/ui/ProductCards.jsx frontend/app/products.config.js
git commit -m "feat: add static Astrix product cards component"
```

---

## Task 7: Rewrite `landing.module.css` to variant 2a

**Files:**
- Modify: `frontend/app/landing.module.css` (full rewrite, 429 lines → new)

**Context:** Rewrite every rule to the parchment/gold system. Mobile-first (matches 2a at ≤480px), widening at `min-width: 768px`. Key new pieces vs. the old file: `.divider` (gold hairline + star), the dark hero medallion, product-card sub-classes from Task 6, steps timeline in gold, reviews as a horizontal snap-scroller with `.dots`, and a dark graphite footer.

**Step 1: Replace the entire file** with the following (grouped by section; keep the `/* ── */` comment style already used in the repo):

```css
/* ── Shared ─────────────────────────────────────────────── */
.container { max-width: var(--max-width); margin: 0 auto; padding: 0 24px; }

.eyebrow {
  font-size: 11px; font-weight: 600; letter-spacing: 0.24em;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px;
}
.divider {
  display: flex; align-items: center; gap: 12px; margin: 8px 0 20px;
}
.divider::before, .divider::after {
  content: ''; flex: 1; height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-accent));
}
.divider::after { background: linear-gradient(90deg, var(--border-accent), transparent); }

/* ── Hero ───────────────────────────────────────────────── */
.hero { background: var(--bg-base); padding: 56px 0 32px; }
.heroInner { max-width: var(--max-width); margin: 0 auto; padding: 0 24px; }
.heroEyebrow { /* same as .eyebrow */
  font-size: 11px; font-weight: 600; letter-spacing: 0.24em;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 16px;
}
.heroTitle {
  font-family: var(--font-heading); font-weight: 500;
  font-size: clamp(2.2rem, 6vw, 3.4rem); line-height: 1.06;
  letter-spacing: -0.015em; color: var(--text-primary); margin: 0 0 16px;
  max-width: 16ch;
}
.heroSub {
  font-size: 16px; line-height: 1.55; color: var(--text-secondary);
  max-width: 42ch; margin: 0 0 26px;
}
.heroActions { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.heroCta {
  display: inline-flex; align-items: center; gap: 10px;
  height: 56px; padding: 0 28px; border-radius: 999px;
  background: var(--bg-deep); color: var(--text-on-dark);
  font-weight: 600; font-size: 16px; transition: opacity 0.2s;
}
.heroCta:hover { opacity: 0.9; text-decoration: none; }
.heroLink { color: var(--text-secondary); font-size: 14px; font-weight: 600; }

/* dark hero medallion (sacred geometry) */
.heroMedallion {
  position: relative; margin-top: 26px; height: 230px;
  border-radius: 24px; overflow: hidden; background: var(--bg-deep);
  border: 1px solid rgba(198,166,103,.2);
}
.heroMedallion svg.bg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.heroMedallionInner { position: relative; height: 100%; padding: 18px; display: flex; flex-direction: column; }
.heroBadge {
  align-self: flex-start; font-size: 10px; font-weight: 600; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--accent-light);
  border: 1px solid rgba(216,184,132,.4); border-radius: 999px; padding: 6px 12px;
}
.heroMedallionFoot { margin-top: auto; display: flex; align-items: flex-end; justify-content: space-between; }
.heroMedallionKicker { font-size: 10.5px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #B99B62; margin-bottom: 4px; }
.heroMedallionValue { font-family: var(--font-heading); font-size: 24px; font-weight: 500; color: var(--text-on-dark); }
.heroMedallionArrow { width: 42px; height: 42px; border-radius: 50%; border: 1px solid rgba(216,184,132,.5); display: flex; align-items: center; justify-content: center; color: var(--accent-glow); font-size: 17px; }

/* ── Sections ───────────────────────────────────────────── */
.section { background: var(--bg-base); padding: 40px 0; }
.sectionTitle {
  font-family: var(--font-heading); font-weight: 500;
  font-size: clamp(1.75rem, 4vw, var(--text-2xl)); line-height: 1.1;
  letter-spacing: -0.01em; color: var(--text-primary); margin: 0 0 6px;
}
.sectionLead { font-size: 14px; line-height: 1.55; color: var(--text-secondary); margin: 0 0 22px; }

/* ── Product cards (variant 2a) ─────────────────────────── */
.productsGrid { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 640px) { .productsGrid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 980px) { .productsGrid { grid-template-columns: repeat(4, 1fr); } }

.productCard {
  position: relative; display: flex; flex-direction: column; gap: 15px;
  background: var(--bg-raised); border: 1px solid var(--border);
  border-radius: 22px; padding: 20px; overflow: hidden; color: var(--text-primary);
  box-shadow: 0 16px 34px -24px rgba(27,26,48,.55);
  transition: transform 0.25s var(--ease-out), box-shadow 0.25s;
}
.productCard:hover { transform: translateY(-3px); box-shadow: 0 22px 40px -22px rgba(27,26,48,.6); text-decoration: none; }
.productAccentBar { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--blush-bg), var(--accent)); }
.productTop { display: flex; align-items: flex-start; justify-content: space-between; }
.productMedallion { width: 60px; height: 60px; border-radius: 17px; background: var(--bg-deep); display: flex; align-items: center; justify-content: center; }
.productDemo { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--blush-text); background: var(--blush-bg); border-radius: 999px; padding: 6px 12px; }
.productTag { font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #A08A5E; margin-bottom: 5px; }
.productName { font-family: var(--font-heading); font-weight: 600; font-size: 22px; margin: 0; color: var(--text-primary); }
.productDesc { margin: 0; font-size: 14px; line-height: 1.55; color: var(--text-secondary); flex: 1; }
.productFoot { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid rgba(30,29,52,.09); }
.productCta { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.productSub { display: flex; align-items: center; gap: 5px; font-size: 11.5px; color: var(--text-muted); }

/* ── Steps timeline ─────────────────────────────────────── */
.stepsGrid { display: flex; flex-direction: column; max-width: 640px; }
.step { display: flex; gap: 16px; padding-bottom: 20px; }
.stepNumCol { display: flex; flex-direction: column; align-items: center; }
.stepNum { width: 44px; height: 44px; flex: none; border-radius: 50%; border: 1px solid var(--border-accent); display: flex; align-items: center; justify-content: center; font-family: var(--font-heading); font-size: 16px; color: var(--accent); background: var(--bg-tile); }
.stepConnector { flex: 1; width: 1px; margin-top: 4px; background: linear-gradient(rgba(185,149,79,.4), rgba(185,149,79,0)); }
.stepBody { padding-top: 8px; }
.stepTitle { font-family: var(--font-heading); font-weight: 500; font-size: 19px; margin: 0 0 5px; color: var(--text-primary); }
.stepDesc { margin: 0; font-size: 13.5px; line-height: 1.55; color: var(--text-secondary); }

/* ── Reviews slider ─────────────────────────────────────── */
.reviewsScroller { display: flex; gap: 14px; overflow-x: auto; scroll-snap-type: x mandatory; padding: 4px 24px 6px; scroll-padding-left: 24px; scrollbar-width: none; margin: 18px -24px 0; }
.reviewsScroller::-webkit-scrollbar { display: none; }
.review { scroll-snap-align: start; flex: 0 0 300px; background: var(--bg-raised); border: 1px solid var(--border-accent); border-radius: 20px; padding: 22px; display: flex; flex-direction: column; gap: 14px; }
.reviewQuote { font-family: var(--font-heading); font-size: 44px; line-height: 0.5; color: var(--accent); height: 22px; }
.reviewText { margin: 0; font-family: var(--font-heading); font-size: 16.5px; line-height: 1.5; color: #3A3550; }
.reviewFoot { margin-top: auto; display: flex; align-items: center; gap: 12px; }
.reviewAvatar { width: 40px; height: 40px; flex: none; border-radius: 50%; background: var(--blush-bg); display: flex; align-items: center; justify-content: center; }
.reviewName { font-family: var(--font-heading); font-size: 15px; font-weight: 600; color: var(--text-primary); }
.reviewMeta { font-size: 11.5px; color: var(--text-muted); }
.dots { display: flex; gap: 6px; justify-content: center; margin-top: 16px; }
.dot { width: 6px; height: 6px; border-radius: 999px; background: rgba(30,29,52,.22); transition: width 0.25s, background 0.25s; }
.dotActive { width: 20px; background: var(--accent); }

/* ── Footer (dark graphite) ─────────────────────────────── */
.footer { background: var(--bg-deep); color: #D9CFB9; padding: 40px 0 30px; position: relative; overflow: hidden; }
.footerInner { max-width: var(--max-width); margin: 0 auto; padding: 0 24px; position: relative; }
.footerBrand { display: flex; align-items: center; gap: 9px; margin-bottom: 12px; }
.footerBrandName { font-family: var(--font-heading); font-size: 22px; font-weight: 600; color: var(--text-on-dark); }
.footerText { font-size: 13.5px; line-height: 1.6; color: #948A73; max-width: 42ch; margin: 0 0 24px; }
.footerCols { display: grid; grid-template-columns: 1fr 1fr; gap: 22px 16px; margin-bottom: 24px; max-width: 420px; }
.footerColTitle { font-size: 10.5px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
.footerLinks { display: flex; flex-direction: column; gap: 10px; font-size: 13.5px; color: #C6BCA6; }
.footerLinks a { color: #C6BCA6; }
.footerRule { height: 1px; background: rgba(198,166,103,.2); margin-bottom: 16px; }
.footerBottom { display: flex; align-items: center; justify-content: space-between; }
.footerCopy { font-size: 11.5px; color: #7C725D; }
.footerSocials { display: flex; gap: 8px; }
.footerSocial { width: 30px; height: 30px; border-radius: 50%; border: 1px solid rgba(198,166,103,.35); display: flex; align-items: center; justify-content: center; font-size: 11px; color: #C6BCA6; }

/* ── Desktop refinements ────────────────────────────────── */
@media (min-width: 768px) {
  .hero { padding: 72px 0 48px; }
  .heroTitle { font-size: clamp(3rem, 5vw, var(--text-3xl)); }
  .section { padding: 64px 0; }
  .stepsGrid { max-width: 720px; }
}
```
> Note on desktop hero: variant 2a is mobile-first; on desktop the hero stacks (title/sub/CTA then medallion below) which reads fine at `max-width:1100px`. A two-column desktop hero (text left, medallion right) is a nice-to-have — leave it single-column for this pass to stay faithful to 2a. Flag as follow-up if the user wants the 1440 desktop layout later.

**Step 2: Verify.**
Run: `cd frontend && npm run build` — expected clean (page.jsx still references old class names until Task 8, so **build the CSS but do not visually check until Task 8**).

**Step 3: Commit.**
```bash
git add frontend/app/landing.module.css
git commit -m "feat: rewrite landing styles to Astrix parchment/gold (variant 2a)"
```

---

## Task 8: Rewrite `page.jsx` — remove WebGL, wire 2a markup

**Files:**
- Modify: `frontend/app/page.jsx` (full rewrite)

**Context:** Remove the 5 dynamic WebGL/animation imports (`Aurora`, `Particles`, `BlurText`, `ScrollReveal`, `AnimatedCards`). Render the 2a structure using `ProductCards` (Task 6) and inline the hero medallion + reviews + footer markup. Reuse the reference data arrays (`renderVals()`, bundle-src lines 599–607) for steps and reviews.

**Step 1: Replace the whole file.**
```jsx
import Link from 'next/link'
import { PRODUCTS } from './products.config'
import ProductCards from './components/ui/ProductCards'
import Reviews from './components/ui/Reviews'
import styles from './landing.module.css'

export const metadata = {
  title: 'Astrix — матрица судьбы, нумерология, таро и гороскоп',
  description: 'Древняя мудрость для современных вопросов. Попробуй каждый сервис бесплатно, прежде чем открыть полный разбор.',
}

const STEPS = [
  { no: '01', title: 'Попробуй',            desc: 'Открой демо любого сервиса бесплатно — без регистрации и обязательств.' },
  { no: '02', title: 'Убедись',             desc: 'Получи живой фрагмент разбора под свой личный запрос.' },
  { no: '03', title: 'Открой полный доступ', desc: 'Подписка раскрывает полные расклады сразу во всех сервисах.' },
]

const REVIEWS = [
  { text: 'Демо Матрицы попало прямо в точку. Оформила подписку в тот же вечер и не жалею.', name: 'Алина',  meta: '29 лет · Матрица судьбы' },
  { text: 'Утренний гороскоп стал ритуалом. Коротко, тепло и по делу — без пугающих прогнозов.', name: 'Марина', meta: '34 года · Гороскоп' },
  { text: 'Расклад Таро помог решиться на переезд. Формулировки бережные, без давления.',      name: 'Ксения', meta: '41 год · Таро' },
]

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.heroEyebrow}>Эзотерический хаб</p>
          <h1 className={styles.heroTitle}>Древняя мудрость для современных вопросов</h1>
          <p className={styles.heroSub}>
            Матрица судьбы, Таро, гороскоп и нумерология — попробуй бесплатно, прежде чем открыть полный разбор.
          </p>
          <div className={styles.heroActions}>
            <Link href="#products" className={styles.heroCta}>Попробовать бесплатно <span>→</span></Link>
            <Link href="#how" className={styles.heroLink}>Как это работает ↓</Link>
          </div>

          <div className={styles.heroMedallion}>
            <svg className="bg" viewBox="0 0 342 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <circle cx="194" cy="96" r="78" fill="none" stroke="#C6A667" strokeWidth="1" opacity=".2"/>
              <circle cx="194" cy="96" r="56" fill="none" stroke="#C6A667" strokeWidth="1" opacity=".32"/>
              <ellipse cx="194" cy="96" rx="118" ry="46" transform="rotate(-18 194 96)" fill="none" stroke="#C6A667" strokeWidth="1" opacity=".18"/>
              <rect x="170" y="72" width="48" height="48" fill="none" stroke="#C6A667" strokeWidth="1.1" opacity=".62"/>
              <rect x="170" y="72" width="48" height="48" transform="rotate(45 194 96)" fill="none" stroke="#C6A667" strokeWidth="1.1" opacity=".62"/>
              <circle cx="194" cy="96" r="2.3" fill="#E4CB98"/>
              <circle cx="306" cy="58" r="2" fill="#E4CB98"/>
            </svg>
            <div className={styles.heroMedallionInner}>
              <span className={styles.heroBadge}>Матрица дня</span>
              <div className={styles.heroMedallionFoot}>
                <div>
                  <div className={styles.heroMedallionKicker}>Аркан дня</div>
                  <div className={styles.heroMedallionValue}>Луна · XVIII</div>
                </div>
                <div className={styles.heroMedallionArrow}>→</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className={styles.section} id="products">
        <div className={styles.container}>
          <div className={styles.divider} />
          <p className={styles.eyebrow}>Сервисы</p>
          <h2 className={styles.sectionTitle}>Четыре пути к себе</h2>
          <p className={styles.sectionLead}>Начни с бесплатного демо — подписка открывает полный разбор.</p>
          <ProductCards products={PRODUCTS} />
        </div>
      </section>

      {/* How it works */}
      <section className={styles.section} id="how">
        <div className={styles.container}>
          <div className={styles.divider} />
          <p className={styles.eyebrow}>Как это работает</p>
          <h2 className={styles.sectionTitle}>Три шага до полного разбора</h2>
          <div className={styles.stepsGrid}>
            {STEPS.map((s, i) => (
              <div key={s.no} className={styles.step}>
                <div className={styles.stepNumCol}>
                  <span className={styles.stepNum}>{s.no}</span>
                  {i < STEPS.length - 1 && <span className={styles.stepConnector} />}
                </div>
                <div className={styles.stepBody}>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.divider} />
          <p className={styles.eyebrow}>Отзывы</p>
          <h2 className={styles.sectionTitle}>Им откликнулось</h2>
        </div>
        <Reviews items={REVIEWS} />
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
              <circle cx="12" cy="13" r="8.5" fill="none" stroke="#D8B884" strokeWidth="1.3"/>
              <circle cx="15.5" cy="11" r="8.5" fill="#1B1A30"/>
              <path d="M18.7 15 l.7 1.9 1.9 .7 -1.9 .7 -.7 1.9 -.7 -1.9 -1.9 -.7 1.9 -.7 z" fill="#D8B884"/>
            </svg>
            <span className={styles.footerBrandName}>Astrix</span>
          </div>
          <p className={styles.footerText}>Древние практики простым языком. Пробуй бесплатно — открывай полный разбор по подписке.</p>
          <div className={styles.footerCols}>
            <div>
              <div className={styles.footerColTitle}>Сервисы</div>
              <div className={styles.footerLinks}>
                {PRODUCTS.map((p) => <Link key={p.id} href={`/${p.slug}`}>{p.name}</Link>)}
              </div>
            </div>
            <div>
              <div className={styles.footerColTitle}>Компания</div>
              <div className={styles.footerLinks}>
                <Link href="#how">Как это работает</Link>
                <Link href="/login">Войти</Link>
                <Link href="/register">Регистрация</Link>
              </div>
            </div>
          </div>
          <div className={styles.footerRule} />
          <div className={styles.footerBottom}>
            <span className={styles.footerCopy}>© 2026 Astrix</span>
            <div className={styles.footerSocials}>
              <span className={styles.footerSocial}>TG</span>
              <span className={styles.footerSocial}>VK</span>
              <span className={styles.footerSocial}>YT</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
```

**Step 2: Create the Reviews slider** at `frontend/app/components/ui/Reviews.jsx` (client component — it needs scroll-position → active dot, mirroring the reference `_setup()` at bundle-src lines 618–635).
```jsx
'use client'
import { useRef, useState, useCallback } from 'react'
import styles from '../../landing.module.css'

export default function Reviews({ items }) {
  const scrollerRef = useRef(null)
  const [active, setActive] = useState(0)

  const onScroll = useCallback(() => {
    const sc = scrollerRef.current
    if (!sc) return
    const card = sc.querySelector('[data-card]')
    const cw = card ? card.offsetWidth : 1
    setActive(Math.round(sc.scrollLeft / (cw + 14)))
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.reviewsScroller} ref={scrollerRef} onScroll={onScroll}>
        {items.map((r, i) => (
          <div key={i} data-card className={styles.review}>
            <div className={styles.reviewQuote}>“</div>
            <p className={styles.reviewText}>{r.text}</p>
            <div className={styles.reviewFoot}>
              <div className={styles.reviewAvatar}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M8 1 l1.4 4.6 4.6 1.4 -4.6 1.4 -1.4 4.6 -1.4 -4.6 -4.6 -1.4 4.6 -1.4 z" fill="#B9954F"/>
                </svg>
              </div>
              <div>
                <div className={styles.reviewName}>{r.name}</div>
                <div className={styles.reviewMeta}>{r.meta}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.dots}>
        {items.map((_, i) => (
          <span key={i} className={`${styles.dot} ${i === active ? styles.dotActive : ''}`} />
        ))}
      </div>
    </div>
  )
}
```

**Step 3: Verify — the real visual check.**
- Run: `cd frontend && npm run build` — expected: clean compile.
- Reload `http://localhost:3000/` and screenshot. Compare against `design-reference/screenshots/turn2-cards.png` and `pp-top.png` / `pp-bottom.png`.
- Expected: parchment hero with dark medallion, 4 product cards (dark medallion icon + blush "Демо" chip + gold accent bar), gold steps timeline, reviews slider with animated dots, dark graphite footer. No cyan anywhere. No console errors.

**Step 4: Commit.**
```bash
git add frontend/app/page.jsx frontend/app/components/ui/Reviews.jsx
git commit -m "feat: rebuild homepage with Astrix 2a layout, drop WebGL animation layer"
```

---

## Task 9: Cross-page sanity audit (global-token fallout)

**Files:** read-only audit; fixes are follow-up, not this plan

**Context:** Because Task 2 flipped the global palette from dark→parchment, any inner page that *uses tokens* (`var(--bg-*)`, `var(--accent)`, legacy `--color-*`) now renders parchment/gold — usually fine. But pages that **hardcode** dark hex values in their own `.module.css` will now clash (dark panels on a cream body). The user accepted that inner pages "inherit" the new theme; the goal here is to *know* what breaks, not fix it all now.

**Step 1: Grep for hardcoded colors in inner-page styles.**
Run (Grep tool, not bash): pattern `#0[0-9a-fA-F]{5}|#050|#030|rgba\(56, ?189, ?248` across `frontend/app/**/*.module.css` excluding `landing.module.css` and `Nav.module.css`.
Expected: a list of files (matrix/results.module.css, tarot/results.module.css, lk, checkout, auth, etc.) that pin dark backgrounds or cyan.

**Step 2:** Load `http://localhost:3000/matrix`, `/tarot`, `/login`, `/lk` and screenshot each.
Expected: identify which read acceptably vs. which look broken (e.g., cyan buttons, dark-on-cream contrast fails).

**Step 3:** Write findings into this plan file under a new "## Follow-up: inner page re-skin" heading — list each file + one-line issue. Do **not** fix them here (out of scope: user chose homepage + global theme + Nav).

**Step 4: Commit** the audit notes.
```bash
git add docs/plans/2026-07-01-astrix-homepage-redesign.md
git commit -m "docs: audit inner-page fallout from global theme swap"
```

---

## Task 10: Cleanup + dependency check

**Files:**
- Delete: `frontend/app/components/ui/AnimatedCards.jsx` (replaced by ProductCards)
- Audit: `frontend/package.json` — `gsap`, `ogl`, `motion` may now be unused on the homepage

**Step 1: Confirm the old animation components are unreferenced** before deleting.
Run (Grep): search `AnimatedCards|Aurora|Particles|BlurText|ScrollReveal` across `frontend/app/**`.
Expected: only the component files themselves match (no importers). If the homepage was their only consumer, they are dead.
> Keep `Aurora.jsx`, `Particles.jsx`, `BlurText.jsx`, `ScrollReveal.jsx` on disk **only if** another page imports them; otherwise flag for deletion. Do not delete blindly — verify each with the grep first.

**Step 2: Delete `AnimatedCards.jsx`** (its only importer was the old page.jsx).
```bash
git rm frontend/app/components/ui/AnimatedCards.jsx
```

**Step 3: Check for now-unused deps.** If grep shows `motion`, `ogl`, `gsap` have zero importers left, note them in the plan's follow-up section (don't necessarily uninstall — inner pages may still use them; verify with grep across all of `frontend/app`).
Run (Grep): `from 'motion|from 'ogl|from 'gsap|gsap` across `frontend/app/**`.
Expected: a definitive yes/no on each dependency.

**Step 4: Final full build + smoke.**
```bash
cd frontend && npm run build && npm run start
```
Screenshot `/` one more time; confirm parity with `design-reference/screenshots/turn2-cards.png`.
Expected: clean build, homepage matches variant 2a.

**Step 5: Commit.**
```bash
git add -A
git commit -m "chore: remove dead animation card component after Astrix redesign"
```

---

## Done criteria
- [ ] Homepage renders variant 2a: parchment hero + dark medallion, 4 product cards (dark icon medallion, blush "Демо" chip, gold accent bar), gold steps timeline, reviews slider w/ dots, dark footer.
- [ ] Global tokens + fonts + Nav are Astrix parchment/gold; no cyan on the homepage.
- [ ] No WebGL/motion imports remain on the homepage; `npm run build` is clean; no console errors.
- [ ] Inner-page fallout is documented (Task 9) as follow-up.

## Out of scope (explicit)
- Full re-skin of inner pages (matrix/tarot/horoscope/numerology/lk/checkout/auth) — documented as follow-up in Task 9.
- The reference's dedicated 1440px two-column desktop hero — this pass ships the faithful 2a single-column layout, responsive up to 1100px. Flag if the user later wants the wide desktop composition.
- Uninstalling `gsap`/`ogl`/`motion` from package.json (only flagged, pending Task 10 grep proof they're unused project-wide).
