# Matrix Content Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace all 462 placeholder strings in `frontend/app/content/matrix-content.js` with real Russian-language interpretation texts for the Matrix of Destiny.

**Architecture:** Each task writes one aspect (or one chakra) for all 22 arcana by editing the content file directly. Tasks are ordered: free aspects first (personality, lessons), then 11 paid aspects, then 8 chakra sections. No tests needed — this is pure content. Verify after each task that the file is valid JS (no syntax errors).

**Tech Stack:** Plain JavaScript static object, Russian text, no dependencies.

**Style rules (enforce in every task):**
- 1–2 paragraphs per text, ~120–200 words
- Mixed esoteric (tarot arcana imagery) + psychological (traits, patterns)
- No em dashes (—). Use commas, colons, periods, parentheses instead
- Address the reader as "вы" (formal you)
- Language: Russian

---

## Task 1: Restructure the file — replace placeholder generator with static skeleton

**Files:**
- Rewrite: `frontend/app/content/matrix-content.js`

**Step 1: Rewrite the file with a static skeleton**

Replace the entire dynamic section (lines 1–41) with a static object. Keep all exports from line 42 onward (`FREE_ASPECTS`, `PAID_ASPECTS`, `ASPECT_LABELS`, `CHAKRA_LABELS`) unchanged.

The new top of the file:

```js
// Matrix of Destiny interpretation texts.
// Keys: arcana number (1–22), then aspect name.
// FREE aspects: personality, lessons
// PAID aspects: all others

export const MATRIX_CONTENT = {
  1:  { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  2:  { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  3:  { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  4:  { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  5:  { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  6:  { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  7:  { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  8:  { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  9:  { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  10: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  11: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  12: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  13: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  14: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  15: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  16: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  17: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  18: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  19: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  20: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  21: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
  22: { personality: '', lessons: '', relationships: '', money: '', socialRole: '', ancestral: '', talents: '', parentLimits: '', personalPurpose: '', socialPurpose: '', spiritualPurpose: '', yearForecast: '', sexuality: '' },
}

export const CHAKRA_CONTENT = {
  sahasrara:     { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: '', 11: '', 12: '', 13: '', 14: '', 15: '', 16: '', 17: '', 18: '', 19: '', 20: '', 21: '', 22: '' },
  ajna:          { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: '', 11: '', 12: '', 13: '', 14: '', 15: '', 16: '', 17: '', 18: '', 19: '', 20: '', 21: '', 22: '' },
  vishuddha:     { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: '', 11: '', 12: '', 13: '', 14: '', 15: '', 16: '', 17: '', 18: '', 19: '', 20: '', 21: '', 22: '' },
  anahata:       { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: '', 11: '', 12: '', 13: '', 14: '', 15: '', 16: '', 17: '', 18: '', 19: '', 20: '', 21: '', 22: '' },
  manipura:      { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: '', 11: '', 12: '', 13: '', 14: '', 15: '', 16: '', 17: '', 18: '', 19: '', 20: '', 21: '', 22: '' },
  svadhishthana: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: '', 11: '', 12: '', 13: '', 14: '', 15: '', 16: '', 17: '', 18: '', 19: '', 20: '', 21: '', 22: '' },
  muladhara:     { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: '', 11: '', 12: '', 13: '', 14: '', 15: '', 16: '', 17: '', 18: '', 19: '', 20: '', 21: '', 22: '' },
  general:       { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: '', 9: '', 10: '', 11: '', 12: '', 13: '', 14: '', 15: '', 16: '', 17: '', 18: '', 19: '', 20: '', 21: '', 22: '' },
}
```

**Step 2: Verify the file is valid JS**

Open `frontend/app/content/matrix-content.js` and confirm no syntax errors (check that the dev server still starts: `cd frontend && npm run dev`).

**Step 3: Commit**
```
git add frontend/app/content/matrix-content.js
git commit -m "refactor(matrix-content): replace placeholder generator with static skeleton"
```

---

## Task 2: Write `personality` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in the `personality` field for all 22 arcana. Reference the arcana table below for each number's core energy. Style: who this person is, their dominant traits, how they show up in the world. No em dashes.

**Arcana reference:**
- 1 (Маг): воля, инициатива, магнетизм
- 2 (Жрица): интуиция, глубина, тайна
- 3 (Императрица): творчество, чувственность, изобилие
- 4 (Император): структура, власть, стабильность
- 5 (Иерофант): мудрость, традиции, наставничество
- 6 (Влюблённые): гармония, красота, выбор
- 7 (Колесница): сила воли, целеустремлённость, движение
- 8 (Сила): внутренняя мощь, терпение, самообладание
- 9 (Отшельник): мудрость, уединение, духовный поиск
- 10 (Колесо Фортуны): изменчивость, адаптивность, судьбоносность
- 11 (Справедливость): честность, баланс, аналитичность
- 12 (Повешенный): жертвенность, глубина, переосмысление
- 13 (Смерть): трансформация, бесстрашие, обновление
- 14 (Умеренность): гибкость, синтез, терпение
- 15 (Дьявол): страстность, харизма, теневая сторона
- 16 (Башня): революционность, разрушение стереотипов
- 17 (Звезда): вдохновение, надежда, путеводный свет
- 18 (Луна): чувствительность, интуиция, внутренние страхи
- 19 (Солнце): радость, уверенность, жизненная сила
- 20 (Суд): ответственность, пробуждение, переоценка ценностей
- 21 (Мир): целостность, мастерство, завершённость
- 22 (Шут): свобода, спонтанность, доверие жизни

**Step 1: Write texts for arcana 1–11 in MATRIX_CONTENT**

**Step 2: Write texts for arcana 12–22 in MATRIX_CONTENT**

**Step 3: Commit**
```
git add frontend/app/content/matrix-content.js
git commit -m "content(matrix): add personality interpretations for arcana 1–22"
```

---

## Task 3: Write `lessons` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in the `lessons` field. Focus: what karmic patterns does the person need to work through, what mistakes get repeated, what the soul came to learn. More introspective tone than `personality`.

**Step 1: Write texts for arcana 1–11**

**Step 2: Write texts for arcana 12–22**

**Step 3: Commit**
```
git add frontend/app/content/matrix-content.js
git commit -m "content(matrix): add lessons interpretations for arcana 1–22"
```

---

## Task 4: Write `relationships` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `relationships`. Focus: how the person builds partnerships, recurring patterns in love and friendship, what they seek and what they avoid.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add relationships interpretations"`

---

## Task 5: Write `money` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `money`. Focus: the person's relationship with money, earning patterns, financial blocks, natural money-making style.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add money interpretations"`

---

## Task 6: Write `socialRole` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `socialRole`. Focus: the role the person naturally plays in groups and society, how others perceive them, their social archetype.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add socialRole interpretations"`

---

## Task 7: Write `ancestral` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `ancestral`. Focus: inherited family programs and patterns, ancestral tasks carried into this lifetime, what the family line needs to heal through this person.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add ancestral interpretations"`

---

## Task 8: Write `talents` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `talents`. Focus: natural gifts, what comes easily, professional strengths aligned with the arcana energy.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add talents interpretations"`

---

## Task 9: Write `parentLimits` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `parentLimits`. Focus: limiting beliefs received from parents or guardians, how these shape the person's self-image and blocks.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add parentLimits interpretations"`

---

## Task 10: Write `personalPurpose` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `personalPurpose`. Focus: what this person is here to achieve on a personal level (ages 20–40), self-actualization theme.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add personalPurpose interpretations"`

---

## Task 11: Write `socialPurpose` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `socialPurpose`. Focus: contribution to society (ages 40–60), how the person's energy serves the collective.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add socialPurpose interpretations"`

---

## Task 12: Write `spiritualPurpose` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `spiritualPurpose`. Focus: the highest expression of the soul (after 60), the spiritual mission of this arcana.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add spiritualPurpose interpretations"`

---

## Task 13: Write `yearForecast` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `yearForecast`. Focus: how this arcana number manifests when it appears as a personal year number. What themes, opportunities and challenges arise in such a year.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add yearForecast interpretations"`

---

## Task 14: Write `sexuality` for arcana 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `sexuality`. Focus: sexual energy, intimacy patterns, how the person expresses and receives physical love. Tasteful but honest tone.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add sexuality interpretations"`

---

## Task 15: Write `sahasrara` chakra for numbers 1–22

**Files:**
- Edit: `frontend/app/content/matrix-content.js`

Fill in `CHAKRA_CONTENT.sahasrara[1..22]`. Sahasrara = crown chakra: connection to higher self, spirituality, meaning, cosmic awareness. Each text: how this arcana energy affects the crown center. ~80–120 words.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add sahasrara chakra interpretations"`

---

## Task 16: Write `ajna` chakra for numbers 1–22

Ajna = third eye: intuition, clarity, inner vision, discernment.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add ajna chakra interpretations"`

---

## Task 17: Write `vishuddha` chakra for numbers 1–22

Vishuddha = throat: self-expression, communication, authentic voice.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add vishuddha chakra interpretations"`

---

## Task 18: Write `anahata` chakra for numbers 1–22

Anahata = heart: love, compassion, openness, emotional healing.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add anahata chakra interpretations"`

---

## Task 19: Write `manipura` chakra for numbers 1–22

Manipura = solar plexus: will, personal power, self-esteem, boundaries.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add manipura chakra interpretations"`

---

## Task 20: Write `svadhishthana` chakra for numbers 1–22

Svadhishthana = sacral: creativity, sexuality, emotions, pleasure.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add svadhishthana chakra interpretations"`

---

## Task 21: Write `muladhara` chakra for numbers 1–22

Muladhara = root: safety, body, groundedness, material foundation.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add muladhara chakra interpretations"`

---

## Task 22: Write `general` chakra for numbers 1–22

General = overall energetic summary for this arcana across the chakra system.

**Step 1:** Write texts 1–11
**Step 2:** Write texts 12–22
**Step 3:** Commit — `"content(matrix): add general chakra interpretations"`

---

## Final verification

After all tasks complete:
1. Start dev server: `cd frontend && npm run dev`
2. Open `/matrix`, enter any birth date
3. Confirm free sections (`personality`, `lessons`) show real text
4. Log in as subscribed user, confirm paid sections show real text
5. Confirm chakra interpretation section shows real text
6. Check that no string is empty (search for `''` in the file)
