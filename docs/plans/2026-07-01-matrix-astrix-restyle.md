# Matrix Page — Astrix Restyle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the established Astrix parchment/gold design language to the **Matrix of Destiny** page (`/matrix`), plus the shared product atoms it depends on — while leaving the drawn matrix diagram (`MatrixSVG.jsx`) untouched.

**Architecture:** This is a **re-skin using tokens that already exist** in `styles/theme.css` (no new mockup, no new tokens). The bulk of the work is rewriting `matrix/matrix.module.css` into Astrix tiles / medallions / gold dividers / serif typography. Matrix reuses four **shared atoms** — `Button`, `Input`, `ProductInputForm`, `Paywall` — which are currently plain; restyling them is required for Matrix to look Astrix, and as a bonus upgrades the other three products (tarot / horoscope / numerology) that share them. Component JSX is touched only minimally (a diagram tile wrapper + a header eyebrow/medallion). `MatrixSVG.jsx` is **not modified**.

**Tech Stack:** Next.js 14 (App Router), CSS Modules. All colors/fonts come from the existing global tokens in `frontend/app/styles/theme.css` — **always reference `var(--…)`, never hardcode hex** (exception: pre-existing content-driven inline chakra colors, which stay).

**Verification approach:** Visual change → "tests" are (1) `npm run build` clean, (2) dev server renders `/matrix` (both the input screen and a result screen) with no console errors, (3) screenshots compared against the Astrix homepage look (`design-reference/screenshots/turn2-cards.png`) for palette/typography consistency. No unit tests for CSS — do not fabricate them.

---

## Token cheat-sheet (already defined in `theme.css` — reuse verbatim)

- Parchment page `--bg-base` `#EAE0CE` · light tile `--bg-raised` `#FBF7EF` · deeper tile `--bg-tile` `#F3ECDB`
- Graphite `--bg-deep` `#1B1A30` · text-on-dark `--text-on-dark` `#F3ECDB`
- Text: `--text-primary` `#211F30` · `--text-secondary` `#6E6551` · `--text-muted` `#9A8D72`
- Gold: `--accent` `#B9954F` · `--accent-light` `#D8B884` · `--accent-hover` `#A08A5E` · `--accent-dim` `rgba(185,149,79,.10)`
- Blush: `--blush-bg` `#E7CFC9` · `--blush-text` `#8A544C`
- Borders: `--border` `rgba(30,29,52,.08)` · `--border-accent` `rgba(185,149,79,.30)`
- Fonts: `--font-heading` (Source Serif 4) · `--font-body` (Golos Text)

---

## Task 1: Preflight — isolate the homepage work, baseline Matrix

**Files:** none (git + dev server)

**Context:** The homepage redesign is currently **uncommitted** in the working tree on branch `feat/astrix-homepage-redesign`. Commit it first so the Matrix diff stays clean.

**Step 1: Commit the homepage work as its own commit.**
```bash
git add frontend/app docs/plans/2026-07-01-astrix-homepage-redesign.md
git status   # confirm design-reference/ and .next/ are NOT staged (they're untracked/ignored noise)
git commit -m "feat: Astrix parchment/gold redesign of homepage + global theme"
```
> If `design-reference/` should be versioned, that's a separate decision — do **not** bundle it into this commit. Leave it untracked for now.

**Step 2: Baseline screenshot.** With the dev server running (`cd frontend && npm run dev`), open `http://localhost:3000/matrix`, submit any birth date (e.g. `1990-05-15`) to reach the result screen, and screenshot both the **input** state and the **result** state. These are the "before" shots — Matrix currently renders on the parchment body but with flat, non-Astrix composition (utilitarian header, borderless tables, bright diagram).

**Step 3:** No commit for this task (setup only).

---

## Task 2: Shared atom — `Button` → Astrix pill

**Files:**
- Modify: `frontend/app/components/ui/Button.module.css` (full file)

**Context:** Astrix primary CTA = solid **graphite pill** with cream text (matches the homepage `.heroCta`). Currently `.primary` is gold bg + white text. This atom is used by every product's form + the Paywall.

**Step 1: Rewrite `Button.module.css`.**
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  border-radius: 999px;               /* pill */
  font-family: var(--font-body);
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: opacity 0.2s, background 0.2s, border-color 0.2s;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* solid graphite — primary CTA */
.primary { background: var(--bg-deep); color: var(--text-on-dark); }
.primary:hover:not(:disabled) { opacity: 0.9; }

/* parchment tile — secondary */
.secondary { background: var(--bg-raised); color: var(--text-primary); border: 1px solid var(--border); }
.secondary:hover:not(:disabled) { background: var(--bg-tile); }

/* outlined gold — ghost */
.ghost { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-accent); }
.ghost:hover:not(:disabled) { background: var(--accent-dim); color: var(--text-primary); }

.sm { padding: 9px 18px;  font-size: var(--text-sm); }
.md { padding: 13px 24px; font-size: var(--text-base); }
.lg { padding: 16px 30px; font-size: var(--text-base); }
```
> Note: `.lg` font drops from `--text-lg` (20px) to `--text-base` (16px) to match Astrix CTA sizing (homepage CTA is 16px). Adjust if it reads too small next to the serif headings.

**Step 2: Verify.** `cd frontend && npm run build` — expected clean.

**Step 3: Commit.**
```bash
git add frontend/app/components/ui/Button.module.css
git commit -m "feat: restyle shared Button to Astrix graphite pill"
```

---

## Task 3: Shared atom — `Input` → Astrix field

**Files:**
- Modify: `frontend/app/components/ui/Input.module.css` (full file)

**Step 1: Rewrite.**
```css
.group { display: flex; flex-direction: column; gap: 7px; }
.label {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
}
.input {
  padding: 13px 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  font-family: var(--font-body);
  font-size: var(--text-base);
  background: var(--bg-raised);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input::placeholder { color: var(--text-muted); }
.input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-dim); }
.inputError { border-color: var(--color-error); }
.error { font-size: var(--text-xs); color: var(--color-error); }
```

**Step 2: Verify.** `npm run build` clean.

**Step 3: Commit.**
```bash
git add frontend/app/components/ui/Input.module.css
git commit -m "feat: restyle shared Input to Astrix parchment field"
```

---

## Task 4: Shared atom — `ProductInputForm` → Astrix toggle

**Files:**
- Modify: `frontend/app/components/ProductInputForm.module.css` (full file)

**Context:** The "Для себя / Для другого" toggle should read as a pill segmented control; the active tab is a graphite pill with cream text.

**Step 1: Rewrite.**
```css
.form { display: flex; flex-direction: column; gap: 16px; max-width: 400px; margin: 0 auto; }
.toggle { display: flex; gap: 4px; background: var(--bg-tile); border-radius: 999px; padding: 4px; }
.tab {
  flex: 1; padding: 9px; border: none; border-radius: 999px;
  background: transparent; cursor: pointer;
  font-family: var(--font-body); font-size: var(--text-sm); font-weight: 600;
  color: var(--text-secondary); transition: background 0.2s, color 0.2s;
}
.active { background: var(--bg-deep); color: var(--text-on-dark); }
```

**Step 2: Verify.** `npm run build` clean.

**Step 3: Commit.**
```bash
git add frontend/app/components/ProductInputForm.module.css
git commit -m "feat: restyle shared product form toggle to Astrix"
```

---

## Task 5: Shared atom — `Paywall` → Astrix tile

**Files:**
- Modify: `frontend/app/components/ui/Paywall.module.css` (full file)
- Modify: `frontend/app/components/ui/Paywall.jsx` (add accent bar + blush chip — lines 12–16)

**Context:** The paywall teases locked content: a preview fades under a blur into a card with the CTA. Restyle the card as a parchment tile with the gold accent bar + a blush "Подписка" chip (echoing the homepage product card), serif title, and the graphite pill CTA (now provided by Task 2). The blur must fade into the page bg (`--bg-base`).

**Step 1: Rewrite `Paywall.module.css`.**
```css
.paywall { position: relative; margin-top: -80px; padding-top: 80px; }
.blur {
  position: absolute; top: 0; left: 0; right: 0; height: 120px;
  background: linear-gradient(to bottom, transparent, var(--bg-base) 80%);
  pointer-events: none;
}
.box {
  position: relative;
  text-align: center;
  padding: 34px 24px 30px;
  border: 1px solid var(--border);
  border-radius: 24px;
  background: var(--bg-raised);
  box-shadow: 0 20px 44px -28px rgba(27,26,48,.55);
  max-width: 480px;
  margin: 0 auto;
  overflow: hidden;
}
.accentBar { position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, var(--blush-bg), var(--accent)); }
.chip {
  display: inline-block; margin-bottom: 14px;
  font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--blush-text); background: var(--blush-bg); border-radius: 999px; padding: 6px 12px;
}
.title { font-family: var(--font-heading); font-weight: 600; font-size: var(--text-xl); color: var(--text-primary); margin-bottom: 8px; }
.sub { color: var(--text-secondary); font-size: var(--text-sm); margin-bottom: 22px; }
.hint { margin-top: 16px; font-size: var(--text-sm); color: var(--text-secondary); }
.hint a { color: var(--accent); font-weight: 600; }
```

**Step 2: Update `Paywall.jsx`** — add the accent bar + chip inside `.box` (before the title):
```jsx
<div className={styles.box}>
  <span className={styles.accentBar} aria-hidden />
  <span className={styles.chip}>Подписка</span>
  <p className={styles.title}>Хочешь узнать полный расклад?</p>
  <p className={styles.sub}>Открой доступ ко всем продуктам за 9 ₽ на 3 дня</p>
  <Button size="lg" onClick={() => router.push(user ? '/lk' : '/register')}>
    {user ? 'Оформить подписку' : 'Попробовать за 9 ₽'}
  </Button>
  {!user && (
    <p className={styles.hint}>Уже есть аккаунт? <a href="/login">Войти</a></p>
  )}
</div>
```

**Step 3: Verify.** `npm run build` clean.

**Step 4: Commit.**
```bash
git add frontend/app/components/ui/Paywall.jsx frontend/app/components/ui/Paywall.module.css
git commit -m "feat: restyle shared Paywall to Astrix tile"
```

---

## Task 6: Rewrite `matrix.module.css` (core of the redesign)

**Files:**
- Modify: `frontend/app/matrix/matrix.module.css` (full rewrite, 105 lines → new)

**Context:** Every Matrix component pulls its classes from this one file, so a full rewrite re-skins the whole page at once. New pieces vs. the old flat version: parchment **tiles** around the diagram / chakra table / purpose blocks, gold **circular medallions** for numbers, a gold **star** before every section title, serif headings, and the Astrix table treatment. The two new classes `.eyebrow` and `.numberMedallion` and `.diagramTile` are consumed by the small JSX edits in Task 7.

**Step 1: Replace the entire file.**
```css
/* ── Layout ─────────────────────────────────────────────── */
.page { max-width: var(--max-width); margin: 0 auto; padding: 32px 20px 80px; }

.eyebrow {
  font-size: 11px; font-weight: 600; letter-spacing: 0.24em;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px;
}

/* ── Header ─────────────────────────────────────────────── */
.header { display: flex; align-items: center; gap: 18px; margin-bottom: 36px; }
.numberMedallion {
  width: 60px; height: 60px; flex: none; border-radius: 17px;
  background: var(--bg-deep); color: var(--accent-light);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-heading); font-size: 24px; font-weight: 500;
}
.headerTitle {
  font-family: var(--font-heading); font-weight: 500;
  font-size: clamp(1.9rem, 4vw, var(--text-2xl)); line-height: 1.1;
  letter-spacing: -0.01em; color: var(--text-primary); margin-bottom: 6px;
}
.headerMeta { display: flex; flex-direction: column; gap: 4px; }
.headerName { font-family: var(--font-body); font-weight: 600; color: var(--text-primary); }
.headerDate, .headerAge { color: var(--text-secondary); font-size: var(--text-sm); }
.archetype {
  display: inline-block; margin-left: 4px; padding: 2px 10px;
  background: var(--accent-dim); border: 1px solid var(--border-accent); border-radius: 999px;
  color: var(--accent-hover); font-weight: 600; font-size: 12px;
  text-decoration: none; cursor: default;
}

/* ── Section titles (gold star lead-in) ─────────────────── */
.sectionTitle {
  font-family: var(--font-heading); font-weight: 500;
  font-size: clamp(1.4rem, 3vw, var(--text-xl)); letter-spacing: -0.005em;
  color: var(--text-primary); margin-bottom: 16px;
  display: flex; align-items: baseline; gap: 10px;
}
.sectionTitle::before { content: '✦'; color: var(--accent); font-size: 0.7em; }

/* ── Matrix + chakra row ────────────────────────────────── */
.matrixRow {
  display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
  align-items: start; margin-bottom: 40px;
}
@media (max-width: 760px) { .matrixRow { grid-template-columns: 1fr; } }

/* tile wrapper for the (unchanged) MatrixSVG diagram */
.diagramTile {
  background: var(--bg-raised); border: 1px solid var(--border); border-radius: 22px;
  padding: 20px; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 16px 34px -26px rgba(27,26,48,.5);
}

/* ── Chakra table ───────────────────────────────────────── */
.chakraSection {
  background: var(--bg-raised); border: 1px solid var(--border); border-radius: 22px;
  padding: 20px 20px 8px; box-shadow: 0 16px 34px -26px rgba(27,26,48,.5);
}
.chakraTable { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
.chakraTable th {
  text-align: left; padding: 9px 10px; border-bottom: 2px solid var(--border-accent);
  color: var(--text-muted); font-weight: 600; font-size: 11px;
  letter-spacing: 0.06em; text-transform: uppercase;
}
.chakraTable td { padding: 10px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
.chakraNum { color: var(--text-muted); font-weight: 600; width: 24px; }
.chakraName { font-weight: 600; }                 /* color comes from inline chakra color */
.chakraGeneral td { font-weight: 600; background: var(--bg-tile); color: var(--text-primary); }

/* ── Purpose grid ───────────────────────────────────────── */
.purposeGrid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px;
}
@media (max-width: 760px) { .purposeGrid { grid-template-columns: 1fr; } }
.purposeBlock {
  background: var(--bg-raised); border: 1px solid var(--border); border-radius: 20px; padding: 22px;
}
.purposeTitle { font-family: var(--font-heading); font-weight: 500; font-size: 18px; color: var(--text-primary); margin-bottom: 8px; }
.purposeDesc { color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.6; margin-bottom: 14px; }
.purposeNumbers { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: 6px; }
.purposeNum {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  border: 1px solid var(--border-accent); background: var(--bg-tile);
  color: var(--accent-hover); font-weight: 600; font-size: 13px;
}
.purposeAdult {
  display: inline-flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 50%;
  border: 2px solid var(--accent); background: var(--accent-dim);
  color: var(--accent-hover); font-weight: 700;
}
.purposeArrow { color: var(--text-muted); }

/* ── Interpretations ────────────────────────────────────── */
.interpretations { margin-bottom: 40px; }
.interpretBlock { padding: 16px 0; border-bottom: 1px solid var(--border); }
.interpretTitle { font-family: var(--font-heading); font-weight: 500; font-size: 18px; color: var(--text-primary); margin-bottom: 6px; }
.interpretText { color: var(--text-secondary); line-height: 1.7; }
.interpretPreview { color: var(--text-secondary); line-height: 1.7; opacity: 0.5; }
.paidInterpretations { position: relative; }
.interpretPaywall { margin-top: 24px; }
.paywallWrap { }

/* ── Reset button (Astrix ghost pill) ───────────────────── */
.formSection {
  max-width: 440px; margin: 0 auto 40px;
  background: var(--bg-raised); border: 1px solid var(--border-accent);
  border-radius: 24px; padding: 32px 24px;
  box-shadow: 0 20px 44px -28px rgba(27,26,48,.55);
}
.formSection .headerTitle { text-align: center; justify-content: center; margin-bottom: 20px; }
.resetBtn {
  display: block; margin: 32px auto 0;
  background: transparent; border: 1px solid var(--border-accent);
  padding: 13px 28px; border-radius: 999px; cursor: pointer;
  font-family: var(--font-body); font-weight: 600; color: var(--text-secondary);
  transition: background 0.2s, color 0.2s;
}
.resetBtn:hover { background: var(--accent-dim); color: var(--text-primary); }
```
> Note on chakra colors: `ChakraMap` / `ChakraInterpretations` set `style={{ color: label.color }}` from content data (e.g. `#333` for "Общее"). These are intentional per-chakra colors — **leave them**. They read acceptably on the parchment tile. If "Общее" `#333` looks too flat, that's a content-file tweak, out of scope here.

**Step 2: Verify.** `npm run build` clean. (Visual check happens in Task 7 once JSX is wired.)

**Step 3: Commit.**
```bash
git add frontend/app/matrix/matrix.module.css
git commit -m "feat: rewrite Matrix page styles to Astrix tiles/medallions/serif"
```

---

## Task 7: Minimal JSX wiring (diagram tile + header medallion)

**Files:**
- Modify: `frontend/app/matrix/MatrixClient.jsx` (wrap diagram — line 52; eyebrow on form screen — lines 33–37)
- Modify: `frontend/app/matrix/MatrixHeader.jsx` (eyebrow + number medallion + de-underlined archetype)

**Step 1: Wrap `MatrixSVG` in a tile** (`MatrixClient.jsx`, the result `.matrixRow`):
```jsx
<div className={styles.matrixRow}>
  <div className={styles.diagramTile}>
    <MatrixSVG nodes={matrixData.nodes} />
  </div>
  <ChakraMap chakras={matrixData.chakras} />
</div>
```

**Step 2: Add an eyebrow to the input screen** (`MatrixClient.jsx`, the `!matrixData` branch):
```jsx
<div className={styles.formSection}>
  <p className={styles.eyebrow}>Эзотерический хаб</p>
  <h1 className={styles.headerTitle}>Матрица судьбы</h1>
  <ProductInputForm product={product} onSubmit={handleSubmit} />
</div>
```

**Step 3: Restyle `MatrixHeader.jsx`** — add eyebrow + a graphite number medallion; the `.archetype` class is now a chip (CSS from Task 6), so no markup change needed there beyond keeping the class. New structure:
```jsx
return (
  <div className={styles.header}>
    <div className={styles.numberMedallion}>{personalNumber}</div>
    <div>
      <p className={styles.eyebrow}>Твоя матрица</p>
      <h1 className={styles.headerTitle}>Матрица судьбы</h1>
      <div className={styles.headerMeta}>
        <span className={styles.headerName}>{name || 'Ваша матрица'}</span>
        <span className={styles.headerDate}>Дата рождения: {displayDate}</span>
        <span className={styles.headerAge}>
          Возраст: {age}
          <span className={styles.archetype}>{ARCHETYPES[personalNumber] || 'Исследователь'}</span>
        </span>
      </div>
    </div>
  </div>
)
```
> The `.header` flex + `.numberMedallion` come from Task 6. Keep the `ARCHETYPES` map and `displayDate` logic exactly as-is.

**Step 4: Verify — the real visual check.**
- `cd frontend && npm run build` — expected clean compile.
- Reload `http://localhost:3000/matrix`. Check the **input screen**: centered parchment card, serif "Матрица судьбы", pill CTA. Submit `1990-05-15`. Check the **result screen**: graphite number medallion in the header, gold-star section titles, diagram sitting in a parchment tile, chakra table with gold header rule, purpose tiles with gold number medallions, interpretations with serif titles, Astrix paywall tile for the locked aspects, ghost-pill reset button.
- Confirm: no cyan, no console errors, and the **diagram graphic itself is unchanged** (same octagon/colors as the baseline shot).

**Step 5: Commit.**
```bash
git add frontend/app/matrix/MatrixClient.jsx frontend/app/matrix/MatrixHeader.jsx
git commit -m "feat: wire Astrix header medallion + diagram tile into Matrix page"
```

---

## Task 8: Regression check on the other 3 products

**Files:** read-only visual audit

**Context:** Tasks 2–5 changed **shared** atoms (Button, Input, form toggle, Paywall) used by tarot / horoscope / numerology. Confirm they still look coherent (they should look *better* — same Astrix atoms), not broken.

**Step 1:** With the dev server running, open and screenshot:
- `http://localhost:3000/tarot`
- `http://localhost:3000/horoscope`
- `http://localhost:3000/numerology`
Submit inputs to reach each result + paywall.

**Step 2:** Verify the Astrix pill buttons / parchment inputs / paywall tile render correctly on each. Note (do not fix here) any product-specific `results.module.css` rule that now clashes — e.g. `tarot/results.module.css` has `.synthesisCard { background: var(--color-accent); color:#fff }` (a gold card with white text — check contrast) and `.cardName { color: var(--color-accent) }`. If something reads poorly, add a one-line note under a "## Follow-up" heading in this file; a full re-skin of the three result bodies is a **separate** effort.

**Step 3: Commit** any audit notes.
```bash
git add docs/plans/2026-07-01-matrix-astrix-restyle.md
git commit -m "docs: audit shared-atom fallout on tarot/horoscope/numerology"
```

---

## Task 9 (OPTIONAL — only if requested): recolor the MatrixSVG diagram

**Files:**
- Modify: `frontend/app/matrix/MatrixSVG.jsx`

**Context:** `MatrixSVG` currently uses a bright, non-Astrix palette (`#333` lines, nodes `#9b59b6`/`#e74c3c`/`#3498db`/`#f1c40f`/`#e67e22`). It renders fine but **stylistically contrasts** with the parchment/gold page. The user explicitly asked to preserve the diagram, so this task is **out of scope by default** — implement only on explicit request.

Suggested Astrix mapping (if pursued): lines/octagon `#333`→`#26243A`; male line `#3498db`→`#6E6551` or keep a muted blue; female line `#e74c3c`→`--accent`; corner nodes → `--bg-deep` fill with `--accent-light` text; center node `#f1c40f`→`--accent` with graphite text; node text `#fff`→`--text-on-dark`. Keep the male/female **semantic** distinction (don't collapse both to gold). Screenshot-compare against the baseline to confirm the geometry is untouched.

Do **not** do this without a green light.

---

## Done criteria
- [ ] `/matrix` input + result screens render in Astrix parchment/gold: graphite header medallion, gold-star section titles, diagram in a parchment tile, Astrix table/purpose medallions, Astrix paywall + pill reset.
- [ ] Shared atoms (Button/Input/form/Paywall) are Astrix; tarot/horoscope/numerology verified still coherent (Task 8).
- [ ] `MatrixSVG` diagram graphic is byte-for-byte unchanged (Task 9 not run unless requested).
- [ ] `npm run build` clean; no console errors; no cyan remnants on `/matrix`.

## Out of scope (explicit)
- Recoloring the MatrixSVG diagram (Task 9 — opt-in only).
- Full re-skin of tarot/horoscope/numerology **result bodies** (their `results.module.css`) — only the shared atoms are touched; product-specific fallout is documented, not fixed, in Task 8.
- Any content/logic changes (archetypes, calculations, chakra data).
