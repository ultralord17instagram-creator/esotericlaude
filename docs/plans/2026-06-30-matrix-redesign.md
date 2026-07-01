# Matrix of Destiny — Full Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the placeholder Matrix of Destiny page with a fully functional product: SVG diagram, chakra map, purpose blocks, and interpretation sections (free/paid).

**Architecture:** The matrix page breaks out of the generic `ProductPage` wrapper into a fully custom layout. A `calculateMatrix(birthDate)` function computes all ~20 nodes from the birth date using the standard Natalia Ladini algorithm. The result flows into five independent display components. Content (interpretations) lives in a separate `matrix-content.js` file with placeholder strings — easy to swap in real text later without touching component code.

**Tech Stack:** Next.js 14 App Router, React, SVG (inline JSX), CSS Modules, existing `useAuth` + `Paywall` component.

---

## Important context before starting

- **Auth:** `useAuth()` from `../context/AuthContext` returns `{ user, loading }`. `user.subscribed` is the paid-access flag.
- **Paywall component:** `../components/ui/Paywall` — drop it in anywhere to gate content. No props needed.
- **CSS variables** already defined in the project: `--color-accent`, `--color-text-primary`, `--color-text-secondary`, `--font-size-xl`, `--font-size-lg`, `--font-size-sm`.
- **All new files** go inside `frontend/app/matrix/` unless noted otherwise.
- **Backend: do not touch.** No API changes needed — birth date comes from the input form.
- **The input form** (`ProductInputForm`) already works for `birth_date`. The new `MatrixClient` will keep using it.
- **Reduce function:** Numbers in the matrix are always in range 1–22. `reduce(n)` = if n ≤ 22 return n, else sum its digits and repeat.

---

## Algorithm reference (Natalia Ladini, standard)

Given birth date DD.MM.YYYY:

```
d      = reduce(day)                   // e.g. 18 → 18
m      = reduce(month)                 // e.g. 9 → 9
y      = reduce(digitSum(year))        // e.g. 2003 → 2+0+0+3=5 → 5
k      = reduce(d + m + y)            // "karmic tail" / bottom point
center = reduce(d + m + y + k)        // personal number / center

// Outer octagon (8 points, clockwise from top):
top         = m
top_right   = reduce(m + y)           // NE diagonal
right       = y
bot_right   = reduce(y + k)           // SE diagonal
bottom      = k
bot_left    = reduce(k + d)           // SW diagonal  ← verify vs screenshot
left        = d
top_left    = reduce(d + m)           // NW diagonal

// Inner nodes (male/female lines):
male1   = reduce(d + center)          // on male line, between left and center
male2   = reduce(m + center)          // on male line, between top and center
female1 = reduce(y + center)          // on female line
female2 = reduce(k + center)          // on female line

// Purpose points:
personal_spiritual  = reduce(d + m)   // = top_left (same value, different meaning context)
personal_material   = reduce(y + k)   // = bot_right
social_male         = reduce(m + y)   // = top_right
social_female       = reduce(m + y)   // same node, direction context
spiritual_purpose   = k               // bottom point

// Chakra values (Итог / Причина / Страх):
// Each chakra maps to specific node pairs — see Task 1 for full mapping.
```

> **Verification step (Task 1):** After implementing, test with 18.09.2003. Expected center = 10. Screenshot values: top=9, top_right=14, right=5, bot_right=10, bottom=5, left=18, top_left=9. SW diagonal and inner nodes — verify visually and adjust formulas if needed.

---

## Task 1: Calculation engine

**Files:**
- Rewrite: `frontend/app/content/matrix.js`

**Goal:** Export `calculateMatrix(birthDate)` → a structured object with all node values, chakra values, purpose values, and the user's age.

**Step 1: Replace the file contents**

```js
// Matrix of Destiny calculation engine.
// Algorithm: Natalia Ladini standard method.
// All numbers reduced to range 1–22.

function digitSum(n) {
  return String(n).split('').reduce((a, c) => a + Number(c), 0)
}

function reduce(n) {
  if (n <= 0) return 1
  while (n > 22) n = digitSum(n)
  return n
}

function parseDate(birthDate) {
  // Accepts 'YYYY-MM-DD' (HTML date input) or 'DD.MM.YYYY'
  if (birthDate.includes('-')) {
    const [yyyy, mm, dd] = birthDate.split('-').map(Number)
    return { day: dd, month: mm, year: yyyy }
  }
  const [dd, mm, yyyy] = birthDate.split('.').map(Number)
  return { day: dd, month: mm, year: yyyy }
}

function getAge(year, month, day) {
  const today = new Date()
  let age = today.getFullYear() - year
  const m = today.getMonth() + 1 - month
  if (m < 0 || (m === 0 && today.getDate() < day)) age--
  return age
}

export function calculateMatrix(birthDate) {
  const { day, month, year } = parseDate(birthDate)

  const d = reduce(day)
  const m = reduce(month)
  const y = reduce(digitSum(year))
  const k = reduce(d + m + y)
  const center = reduce(d + m + y + k)

  const top_left  = reduce(d + m)
  const top_right = reduce(m + y)
  const bot_right = reduce(y + k)
  const bot_left  = reduce(k + d)

  const male1   = reduce(d + center)
  const male2   = reduce(m + center)
  const female1 = reduce(y + center)
  const female2 = reduce(k + center)

  // Chakra mapping: [итог, причина, страх]
  // Standard mapping (verify against known sources):
  const chakras = {
    sahasrara:    { total: d,       cause: m,       fear: top_left  },
    ajna:         { total: center,  cause: male2,   fear: reduce(center * 2) },
    vishuddha:    { total: m,       cause: top_right, fear: y       },
    anahata:      { total: center,  cause: male1,   fear: k        },
    manipura:     { total: d,       cause: m,       fear: reduce(d + m + center) },
    svadhishthana:{ total: female2, cause: female2, fear: k        },
    muladhara:    { total: d,       cause: d,       fear: y        },
    general:      { total: reduce(d+m+y+k+center), cause: reduce(d+m+y+k+center), fear: reduce(bot_left) },
  }

  // Purpose blocks
  const purposes = {
    personal: {
      spiritual: top_left,
      material:  bot_right,
      adult:     reduce(top_left + bot_right),
    },
    social: {
      withMen:   top_right,
      withWomen: top_right,
      withSociety: reduce(top_right + center),
    },
    spiritual: {
      number: k,
    },
  }

  const nodes = { d, m, y, k, center, top_left, top_right, bot_right, bot_left, male1, male2, female1, female2 }

  return {
    nodes,
    chakras,
    purposes,
    age: getAge(year, month, day),
    birthDate,
  }
}
```

**Step 2: Manual verification**

Open browser console or Node REPL and run:
```js
import { calculateMatrix } from './matrix.js'
console.log(calculateMatrix('2003-09-18'))
// Expected: center=10, nodes.m=9, nodes.y=5, nodes.d=18, nodes.k=5
// nodes.top_left=9, nodes.top_right=14, nodes.bot_right=10
```

Compare `nodes` output against the screenshot. Adjust chakra formulas if values don't match — chakra mapping is the most uncertain part.

**Step 3: Commit**
```
git add frontend/app/content/matrix.js
git commit -m "feat(matrix): implement calculateMatrix engine"
```

---

## Task 2: Content file with placeholders

**Files:**
- Create: `frontend/app/content/matrix-content.js`

**Goal:** Structured content file with placeholder text for all 22 arcana × all aspects + chakra interpretations. Real texts to be filled in a separate session later.

**Step 1: Create the file**

```js
// Matrix of Destiny interpretation texts.
// Keys: arcana number (1–22), then aspect name.
// Replace placeholder strings with real interpretation texts.
// FREE aspects: personality, lessons
// PAID aspects: all others

function placeholder(num, aspect) {
  return `[Число ${num} — ${aspect}: текст будет добавлен позже]`
}

const ASPECTS = [
  'personality', 'lessons', 'relationships', 'money',
  'socialRole', 'ancestral', 'talents', 'parentLimits',
  'personalPurpose', 'socialPurpose', 'spiritualPurpose',
  'yearForecast', 'sexuality',
]

const CHAKRA_KEYS = [
  'sahasrara', 'ajna', 'vishuddha', 'anahata',
  'manipura', 'svadhishthana', 'muladhara', 'general',
]

export const MATRIX_CONTENT = Object.fromEntries(
  Array.from({ length: 22 }, (_, i) => {
    const num = i + 1
    return [num, Object.fromEntries(ASPECTS.map(a => [a, placeholder(num, a)]))]
  })
)

export const CHAKRA_CONTENT = Object.fromEntries(
  CHAKRA_KEYS.map(chakra => [
    chakra,
    Object.fromEntries(
      Array.from({ length: 22 }, (_, i) => {
        const num = i + 1
        return [num, placeholder(num, chakra)]
      })
    ),
  ])
)

export const FREE_ASPECTS = ['personality', 'lessons']

export const PAID_ASPECTS = [
  'relationships', 'money', 'socialRole', 'ancestral',
  'talents', 'parentLimits', 'personalPurpose', 'socialPurpose',
  'spiritualPurpose', 'yearForecast', 'sexuality',
]

export const ASPECT_LABELS = {
  personality:      'Характеристика личности',
  lessons:          'Уроки прошлого',
  relationships:    'Отношения',
  money:            'Деньги',
  socialRole:       'Ваша социальная роль',
  ancestral:        'Родовые задачи',
  talents:          'Таланты',
  parentLimits:     'Ограничения, полученные от родителей',
  personalPurpose:  'Личное предназначение',
  socialPurpose:    'Социальное предназначение',
  spiritualPurpose: 'Духовное предназначение',
  yearForecast:     'Персональный прогноз по годам',
  sexuality:        'Сексуальность',
}

export const CHAKRA_LABELS = {
  sahasrara:     { ru: 'Сахасрара',    number: 7, color: '#9b59b6' },
  ajna:          { ru: 'Аджна',        number: 6, color: '#3498db' },
  vishuddha:     { ru: 'Вишудха',      number: 5, color: '#1abc9c' },
  anahata:       { ru: 'Анахата',      number: 4, color: '#2ecc71' },
  manipura:      { ru: 'Манипура',     number: 3, color: '#f1c40f' },
  svadhishthana: { ru: 'Свадхистана',  number: 2, color: '#e67e22' },
  muladhara:     { ru: 'Муладхара',    number: 1, color: '#e74c3c' },
}
```

**Step 2: Commit**
```
git add frontend/app/content/matrix-content.js
git commit -m "feat(matrix): add content file with placeholders"
```

---

## Task 3: MatrixHeader component

**Files:**
- Create: `frontend/app/matrix/MatrixHeader.jsx`

**Goal:** Display user name, birth date, age. No PDF/share buttons.

**Step 1: Create the component**

```jsx
import styles from './matrix.module.css'

const ARCHETYPES = {
  1: 'Лидер', 2: 'Дипломат', 3: 'Творец', 4: 'Строитель',
  5: 'Авантюрист', 6: 'Воспитатель', 7: 'Мыслитель', 8: 'Организатор',
  9: 'Мудрец', 10: 'Исследователь', 11: 'Мечтатель', 12: 'Жертва',
  13: 'Трансформатор', 14: 'Алхимик', 15: 'Искуситель', 16: 'Бунтарь',
  17: 'Звезда', 18: 'Иллюзионист', 19: 'Победитель', 20: 'Судья',
  21: 'Маг', 22: 'Безумец',
}

export default function MatrixHeader({ name, birthDate, age, personalNumber }) {
  const displayDate = birthDate.includes('-')
    ? birthDate.split('-').reverse().join('.')
    : birthDate

  return (
    <div className={styles.header}>
      <h1 className={styles.headerTitle}>Матрица судьбы</h1>
      <div className={styles.headerMeta}>
        <span className={styles.headerName}>{name || 'Ваша матрица'}</span>
        <span className={styles.headerDate}>Дата рождения: {displayDate}</span>
        <span className={styles.headerAge}>
          Возраст: {age}{' '}
          <span className={styles.archetype}>({ARCHETYPES[personalNumber] || 'Исследователь'})</span>
        </span>
      </div>
    </div>
  )
}
```

**Step 2: Commit**
```
git add frontend/app/matrix/MatrixHeader.jsx
git commit -m "feat(matrix): add MatrixHeader component"
```

---

## Task 4: MatrixSVG component

**Files:**
- Create: `frontend/app/matrix/MatrixSVG.jsx`

**Goal:** SVG rendering of the full matrix diagram — octagon, colored node circles with numbers, male/female lines, age markers on the outer ring.

**Node colors** (match screenshot):
- `d` (left): purple `#9b59b6`
- `m` (top): purple `#9b59b6`
- `y` (right): red `#e74c3c`
- `k` (bottom): red `#e74c3c`
- `center`: yellow `#f1c40f`
- `male1`, `male2`: blue `#3498db`
- `female1`, `female2`: orange `#e67e22`
- `top_left`, `top_right`, `bot_right`, `bot_left`: white with dark border

**Step 1: Create the component**

```jsx
'use client'

const SIZE = 500
const CX = SIZE / 2
const CY = SIZE / 2
const OUTER_R = 200   // outer octagon radius
const INNER_R = 110   // inner square radius
const NODE_R = 22     // circle radius for main nodes
const SMALL_R = 16    // circle radius for diagonal nodes
const INNER_NODE_R = 18 // for inner line nodes

// Octagon positions (clockwise from top = 12 o'clock)
function octPoint(index, r) {
  const angle = (index * 45 - 90) * (Math.PI / 180)
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) }
}

// index 0=top, 1=NE, 2=right, 3=SE, 4=bottom, 5=SW, 6=left, 7=NW
const POS = {
  top:       octPoint(0, OUTER_R),
  top_right: octPoint(1, OUTER_R),
  right:     octPoint(2, OUTER_R),
  bot_right: octPoint(3, OUTER_R),
  bottom:    octPoint(4, OUTER_R),
  bot_left:  octPoint(5, OUTER_R),
  left:      octPoint(6, OUTER_R),
  top_left:  octPoint(7, OUTER_R),
  center:    { x: CX, y: CY },
  male1:     { x: CX + (octPoint(6, OUTER_R).x - CX) * 0.5, y: CY + (octPoint(6, OUTER_R).y - CY) * 0.5 },
  male2:     { x: CX + (octPoint(0, OUTER_R).x - CX) * 0.5, y: CY + (octPoint(0, OUTER_R).y - CY) * 0.5 },
  female1:   { x: CX + (octPoint(2, OUTER_R).x - CX) * 0.5, y: CY + (octPoint(2, OUTER_R).y - CY) * 0.5 },
  female2:   { x: CX + (octPoint(4, OUTER_R).x - CX) * 0.5, y: CY + (octPoint(4, OUTER_R).y - CY) * 0.5 },
}

function Node({ pos, value, fill = '#fff', textFill = '#333', r = NODE_R, stroke = '#333' }) {
  return (
    <g>
      <circle cx={pos.x} cy={pos.y} r={r} fill={fill} stroke={stroke} strokeWidth="2" />
      <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
        fontSize={r > 20 ? 14 : 12} fontWeight="700" fill={textFill}>
        {value}
      </text>
    </g>
  )
}

function AgeLabel({ pos, age, offset }) {
  return (
    <text x={pos.x + offset.x} y={pos.y + offset.y}
      textAnchor="middle" fontSize="10" fill="#999">
      {age} лет
    </text>
  )
}

export default function MatrixSVG({ nodes }) {
  const { d, m, y, k, center, top_left, top_right, bot_right, bot_left, male1, male2, female1, female2 } = nodes

  const outerPoints = [
    POS.top, POS.top_right, POS.right, POS.bot_right,
    POS.bottom, POS.bot_left, POS.left, POS.top_left,
  ].map(p => `${p.x},${p.y}`).join(' ')

  const innerSquarePoints = [
    POS.top_left, POS.top_right, POS.bot_right, POS.bot_left,
  ].map(p => `${p.x},${p.y}`).join(' ')

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{ maxWidth: 500 }}>
      {/* Outer octagon */}
      <polygon points={outerPoints} fill="none" stroke="#333" strokeWidth="1.5" />

      {/* Inner diamond (connecting diagonals) */}
      <polygon points={innerSquarePoints} fill="none" stroke="#333" strokeWidth="1" strokeDasharray="4 2" />

      {/* Cross lines: top-bottom, left-right */}
      <line x1={POS.top.x} y1={POS.top.y} x2={POS.bottom.x} y2={POS.bottom.y} stroke="#333" strokeWidth="1.5" />
      <line x1={POS.left.x} y1={POS.left.y} x2={POS.right.x} y2={POS.right.y} stroke="#333" strokeWidth="1.5" />

      {/* Male line (blue): left → male1 → center → male2 → top */}
      <polyline
        points={`${POS.left.x},${POS.left.y} ${POS.male1.x},${POS.male1.y} ${POS.center.x},${POS.center.y} ${POS.male2.x},${POS.male2.y} ${POS.top.x},${POS.top.y}`}
        fill="none" stroke="#3498db" strokeWidth="2"
      />

      {/* Female line (red): bottom → female2 → center → female1 → right */}
      <polyline
        points={`${POS.bottom.x},${POS.bottom.y} ${POS.female2.x},${POS.female2.y} ${POS.center.x},${POS.center.y} ${POS.female1.x},${POS.female1.y} ${POS.right.x},${POS.right.y}`}
        fill="none" stroke="#e74c3c" strokeWidth="2"
      />

      {/* Male/Female line labels */}
      <text x={CX - 30} y={CY - 20} fontSize="10" fill="#3498db" transform={`rotate(-45 ${CX - 30} ${CY - 20})`}>
        Мужская линия
      </text>
      <text x={CX + 10} y={CY - 20} fontSize="10" fill="#e74c3c" transform={`rotate(45 ${CX + 10} ${CY - 20})`}>
        Женская линия
      </text>

      {/* Age markers on outer ring (approximate positions) */}
      <AgeLabel pos={POS.left}    age={0}  offset={{ x: -30, y: 0 }} />
      <AgeLabel pos={POS.top}     age={20} offset={{ x: 0, y: -30 }} />
      <AgeLabel pos={POS.right}   age={40} offset={{ x: 30, y: 0 }} />
      <AgeLabel pos={POS.bottom}  age={60} offset={{ x: 0, y: 30 }} />

      {/* Symbols */}
      <text x={CX - 15} y={CY - 10} fontSize="18" textAnchor="middle">★</text>
      <text x={CX + 15} y={CY + 15} fontSize="16" textAnchor="middle">♥</text>
      <text x={CX + 40} y={CY + 5}  fontSize="16" textAnchor="middle">$</text>

      {/* Main 4 corner nodes */}
      <Node pos={POS.left}    value={d} fill="#9b59b6" textFill="#fff" />
      <Node pos={POS.top}     value={m} fill="#9b59b6" textFill="#fff" />
      <Node pos={POS.right}   value={y} fill="#e74c3c" textFill="#fff" />
      <Node pos={POS.bottom}  value={k} fill="#e74c3c" textFill="#fff" />

      {/* Diagonal outer nodes */}
      <Node pos={POS.top_left}  value={top_left}  fill="#fff" r={SMALL_R} />
      <Node pos={POS.top_right} value={top_right} fill="#fff" r={SMALL_R} />
      <Node pos={POS.bot_right} value={bot_right} fill="#fff" r={SMALL_R} />
      <Node pos={POS.bot_left}  value={bot_left}  fill="#fff" r={SMALL_R} />

      {/* Center node */}
      <Node pos={POS.center} value={center} fill="#f1c40f" textFill="#333" r={26} />

      {/* Inner line nodes */}
      <Node pos={POS.male1}   value={male1}   fill="#3498db" textFill="#fff" r={INNER_NODE_R} />
      <Node pos={POS.male2}   value={male2}   fill="#3498db" textFill="#fff" r={INNER_NODE_R} />
      <Node pos={POS.female1} value={female1} fill="#e67e22" textFill="#fff" r={INNER_NODE_R} />
      <Node pos={POS.female2} value={female2} fill="#e67e22" textFill="#fff" r={INNER_NODE_R} />
    </svg>
  )
}
```

**Step 2: Verify visually**

After wiring into the page (Task 9), open `/matrix`, enter birth date `18.09.2003`, and compare the SVG output to the screenshot. Adjust node positions and colors as needed.

**Step 3: Commit**
```
git add frontend/app/matrix/MatrixSVG.jsx
git commit -m "feat(matrix): add SVG matrix diagram component"
```

---

## Task 5: ChakraMap component

**Files:**
- Create: `frontend/app/matrix/ChakraMap.jsx`

**Goal:** Table with 7 chakras + General row. Columns: Name (colored) | Итог | Причина | Страх. Free for all users.

**Step 1: Create the component**

```jsx
import { CHAKRA_LABELS } from '../content/matrix-content'
import styles from './matrix.module.css'

const CHAKRA_ORDER = ['sahasrara', 'ajna', 'vishuddha', 'anahata', 'manipura', 'svadhishthana', 'muladhara']

export default function ChakraMap({ chakras }) {
  return (
    <div className={styles.chakraSection}>
      <h2 className={styles.sectionTitle}>Карта чакр</h2>
      <table className={styles.chakraTable}>
        <thead>
          <tr>
            <th colSpan={2}>Название чакры</th>
            <th>Итог</th>
            <th>Причина</th>
            <th>Страх</th>
          </tr>
        </thead>
        <tbody>
          {CHAKRA_ORDER.map(key => {
            const label = CHAKRA_LABELS[key]
            const data = chakras[key]
            return (
              <tr key={key}>
                <td className={styles.chakraNum}>{label.number}</td>
                <td className={styles.chakraName} style={{ color: label.color }}>
                  {label.ru}
                </td>
                <td>{data.total}</td>
                <td>{data.cause}</td>
                <td>{data.fear}</td>
              </tr>
            )
          })}
          <tr className={styles.chakraGeneral}>
            <td colSpan={2}><strong>Общее</strong></td>
            <td>{chakras.general.total}</td>
            <td>{chakras.general.cause}</td>
            <td>{chakras.general.fear}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
```

**Step 2: Commit**
```
git add frontend/app/matrix/ChakraMap.jsx
git commit -m "feat(matrix): add ChakraMap component"
```

---

## Task 6: PurposeSection component

**Files:**
- Create: `frontend/app/matrix/PurposeSection.jsx`

**Goal:** Three columns — Personal / Social / Spiritual purpose, with numbers and period descriptions. Free for all users.

**Step 1: Create the component**

```jsx
import styles from './matrix.module.css'

export default function PurposeSection({ purposes }) {
  const { personal, social, spiritual } = purposes

  return (
    <div className={styles.purposeGrid}>
      <div className={styles.purposeBlock}>
        <h3 className={styles.purposeTitle}>Личное предназначение</h3>
        <p className={styles.purposeDesc}>Проявляется в возрасте от 20 до 40 лет в результате объединения физических и духовных аспектов личности.</p>
        <div className={styles.purposeNumbers}>
          <span>Духовное <span className={styles.purposeNum}>{personal.spiritual}</span></span>
          <span className={styles.purposeArrow}>→</span>
          <span className={styles.purposeAdult}>{personal.adult}</span>
          <span>Взрослая личность</span>
        </div>
        <div className={styles.purposeNumbers}>
          <span>Материальное <span className={styles.purposeNum}>{personal.material}</span></span>
        </div>
      </div>

      <div className={styles.purposeBlock}>
        <h3 className={styles.purposeTitle}>Социальное предназначение</h3>
        <p className={styles.purposeDesc}>То хорошее и полезное, чем вы будете делиться с окружающими в возрасте от 40 до 60 лет.</p>
        <div className={styles.purposeNumbers}>
          <span>Взаимодействие с мужчинами <span className={styles.purposeNum}>{social.withMen}</span></span>
        </div>
        <div className={styles.purposeNumbers}>
          <span>с женщинами <span className={styles.purposeNum}>{social.withWomen}</span></span>
          <span className={styles.purposeArrow}>→</span>
          <span className={styles.purposeNum}>{social.withSociety}</span>
          <span>с социумом</span>
        </div>
      </div>

      <div className={styles.purposeBlock}>
        <h3 className={styles.purposeTitle}>Духовное предназначение</h3>
        <p className={styles.purposeDesc}>В этом суть вашего воплощения после 60 лет. Даётся бонусом в плюсе, если проработаны социальные и личные задачи.</p>
        <div className={styles.purposeNumbers}>
          <span className={styles.purposeNum}>{spiritual.number}</span>
          <span>Делать руками</span>
        </div>
      </div>
    </div>
  )
}
```

**Step 2: Commit**
```
git add frontend/app/matrix/PurposeSection.jsx
git commit -m "feat(matrix): add PurposeSection component"
```

---

## Task 7: MatrixInterpretations component

**Files:**
- Create: `frontend/app/matrix/MatrixInterpretations.jsx`

**Goal:** 13 interpretation sections. Free ones (personality, lessons) show text. Paid ones show title + Paywall.

**Step 1: Create the component**

```jsx
import { MATRIX_CONTENT, FREE_ASPECTS, PAID_ASPECTS, ASPECT_LABELS } from '../content/matrix-content'
import Paywall from '../components/ui/Paywall'
import styles from './matrix.module.css'

export default function MatrixInterpretations({ centerNumber, isSubscribed }) {
  const content = MATRIX_CONTENT[centerNumber] || MATRIX_CONTENT[1]

  return (
    <div className={styles.interpretations}>
      <h2 className={styles.sectionTitle}>Расшифровка значений</h2>

      {FREE_ASPECTS.map(aspect => (
        <div key={aspect} className={styles.interpretBlock}>
          <h3 className={styles.interpretTitle}>{ASPECT_LABELS[aspect]}</h3>
          <p className={styles.interpretText}>{content[aspect]}</p>
        </div>
      ))}

      <div className={styles.paidInterpretations}>
        {PAID_ASPECTS.map(aspect => (
          <div key={aspect} className={styles.interpretBlock}>
            <h3 className={styles.interpretTitle}>{ASPECT_LABELS[aspect]}</h3>
            {isSubscribed ? (
              <p className={styles.interpretText}>{content[aspect]}</p>
            ) : (
              <div className={styles.paywallWrap}>
                <p className={styles.interpretPreview}>{content[aspect].slice(0, 60)}…</p>
              </div>
            )}
          </div>
        ))}

        {!isSubscribed && (
          <div className={styles.interpretPaywall}>
            <Paywall />
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 2: Commit**
```
git add frontend/app/matrix/MatrixInterpretations.jsx
git commit -m "feat(matrix): add MatrixInterpretations component"
```

---

## Task 8: ChakraInterpretations component

**Files:**
- Create: `frontend/app/matrix/ChakraInterpretations.jsx`

**Goal:** 8 chakra interpretation sections, all paid. Same Paywall mechanic.

**Step 1: Create the component**

```jsx
import { CHAKRA_CONTENT, CHAKRA_LABELS } from '../content/matrix-content'
import Paywall from '../components/ui/Paywall'
import styles from './matrix.module.css'

const CHAKRA_ORDER = ['sahasrara', 'ajna', 'vishuddha', 'anahata', 'manipura', 'svadhishthana', 'muladhara', 'general']

export default function ChakraInterpretations({ chakras, isSubscribed }) {
  return (
    <div className={styles.interpretations}>
      <h2 className={styles.sectionTitle}>Расшифровка карты чакр</h2>

      {CHAKRA_ORDER.map(key => {
        const label = key === 'general' ? { ru: 'Общее', color: '#333' } : CHAKRA_LABELS[key]
        const number = chakras[key]?.total || 1
        const text = CHAKRA_CONTENT[key]?.[number] || ''

        return (
          <div key={key} className={styles.interpretBlock}>
            <h3 className={styles.interpretTitle} style={{ color: label.color }}>
              {label.ru}
            </h3>
            {isSubscribed ? (
              <p className={styles.interpretText}>{text}</p>
            ) : (
              <p className={styles.interpretPreview}>{text.slice(0, 60)}…</p>
            )}
          </div>
        )
      })}

      {!isSubscribed && (
        <div className={styles.interpretPaywall}>
          <Paywall />
        </div>
      )}
    </div>
  )
}
```

**Step 2: Commit**
```
git add frontend/app/matrix/ChakraInterpretations.jsx
git commit -m "feat(matrix): add ChakraInterpretations component"
```

---

## Task 9: CSS module

**Files:**
- Create: `frontend/app/matrix/matrix.module.css`

**Goal:** All styles for the new matrix page. The old `results.module.css` is no longer needed for these components (keep the file, it may still be imported by old components temporarily).

**Step 1: Create the stylesheet**

```css
/* Layout */
.page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px 64px;
}

/* Header */
.header { margin-bottom: 32px; }
.headerTitle { font-size: var(--font-size-xl); font-weight: 700; margin-bottom: 8px; }
.headerMeta { display: flex; flex-direction: column; gap: 4px; }
.headerName { font-weight: 600; }
.headerDate, .headerAge { color: var(--color-text-secondary); font-size: var(--font-size-sm); }
.archetype { color: var(--color-accent); text-decoration: underline; cursor: default; }

/* Matrix + chakra row */
.matrixRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
  margin-bottom: 40px;
}
@media (max-width: 700px) {
  .matrixRow { grid-template-columns: 1fr; }
}

/* Section titles */
.sectionTitle { font-size: var(--font-size-lg); font-weight: 700; margin-bottom: 16px; }

/* Chakra table */
.chakraSection { }
.chakraTable { width: 100%; border-collapse: collapse; font-size: var(--font-size-sm); }
.chakraTable th {
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid var(--color-border, #eee);
  color: var(--color-text-secondary);
  font-weight: 600;
}
.chakraTable td { padding: 10px 12px; border-bottom: 1px solid var(--color-border, #eee); }
.chakraNum { color: var(--color-text-secondary); font-weight: 600; width: 24px; }
.chakraName { font-weight: 600; }
.chakraGeneral td { font-weight: 600; background: var(--color-bg-subtle, #f9f9f9); }

/* Purpose grid */
.purposeGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}
@media (max-width: 700px) {
  .purposeGrid { grid-template-columns: 1fr; }
}
.purposeBlock { }
.purposeTitle { font-size: var(--font-size-base, 16px); font-weight: 700; margin-bottom: 8px; }
.purposeDesc { color: var(--color-text-secondary); font-size: var(--font-size-sm); line-height: 1.6; margin-bottom: 12px; }
.purposeNumbers { display: flex; align-items: center; gap: 8px; font-size: var(--font-size-sm); margin-bottom: 4px; }
.purposeNum {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid #ccc;
  font-weight: 600;
  font-size: 13px;
}
.purposeAdult {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-accent);
  font-weight: 700;
}
.purposeArrow { color: var(--color-text-secondary); }

/* Interpretations */
.interpretations { margin-bottom: 40px; }
.interpretBlock { margin-bottom: 24px; }
.interpretTitle { font-size: var(--font-size-base, 16px); font-weight: 700; margin-bottom: 8px; }
.interpretText { color: var(--color-text-secondary); line-height: 1.7; }
.interpretPreview { color: var(--color-text-secondary); line-height: 1.7; opacity: 0.5; }
.paidInterpretations { position: relative; }
.interpretPaywall { margin-top: 24px; }
.paywallWrap { }

/* Input form section */
.formSection { max-width: 400px; margin: 0 auto 40px; }
.resetBtn {
  display: block;
  margin: 32px auto 0;
  background: none;
  border: 1px solid var(--color-border, #ccc);
  padding: 8px 24px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-secondary);
}
```

**Step 2: Commit**
```
git add frontend/app/matrix/matrix.module.css
git commit -m "feat(matrix): add matrix page CSS module"
```

---

## Task 10: MatrixClient — wire everything together

**Files:**
- Rewrite: `frontend/app/matrix/MatrixClient.jsx`

**Goal:** Orchestrate all components. Show input form first, then full matrix result after submission.

**Step 1: Rewrite the file**

```jsx
'use client'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { calculateMatrix } from '../content/matrix'
import ProductInputForm from '../components/ProductInputForm'
import MatrixHeader from './MatrixHeader'
import MatrixSVG from './MatrixSVG'
import ChakraMap from './ChakraMap'
import PurposeSection from './PurposeSection'
import MatrixInterpretations from './MatrixInterpretations'
import ChakraInterpretations from './ChakraInterpretations'
import styles from './matrix.module.css'

// products.config.js entry for matrix — passed as prop from page.jsx
export default function MatrixClient({ product }) {
  const { user } = useAuth()
  const [matrixData, setMatrixData] = useState(null)
  const [inputName, setInputName] = useState('')

  const isSubscribed = user?.subscribed ?? false

  const handleSubmit = (inputs) => {
    const birthDate = user && !inputs.birth_date
      ? user.birth_date  // future: may come from profile
      : inputs.birth_date
    if (!birthDate) return
    setInputName(inputs.name || user?.email?.split('@')[0] || '')
    setMatrixData(calculateMatrix(birthDate))
  }

  if (!matrixData) {
    return (
      <div className={styles.page}>
        <div className={styles.formSection}>
          <h1 className={styles.headerTitle}>Матрица судьбы</h1>
          <ProductInputForm product={product} onSubmit={handleSubmit} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <MatrixHeader
        name={inputName}
        birthDate={matrixData.birthDate}
        age={matrixData.age}
        personalNumber={matrixData.nodes.center}
      />

      <div className={styles.matrixRow}>
        <MatrixSVG nodes={matrixData.nodes} />
        <ChakraMap chakras={matrixData.chakras} />
      </div>

      <PurposeSection purposes={matrixData.purposes} />

      <MatrixInterpretations
        centerNumber={matrixData.nodes.center}
        isSubscribed={isSubscribed}
      />

      <ChakraInterpretations
        chakras={matrixData.chakras}
        isSubscribed={isSubscribed}
      />

      <button className={styles.resetBtn} onClick={() => setMatrixData(null)}>
        Рассчитать другую дату
      </button>
    </div>
  )
}
```

**Step 2: Verify existing page.jsx still imports MatrixClient correctly**

Open `frontend/app/matrix/page.jsx`. It should already import and render `<MatrixClient product={product} />`. If it uses `getProduct('matrix')` from products.config, that's fine — no changes needed to page.jsx.

**Step 3: Start dev server and test end-to-end**

```
cd frontend && npm run dev
```

1. Open `http://localhost:3000/matrix`
2. Enter birth date `18.09.2003` (or `2003-09-18`)
3. Verify: center = 10, top = 9, right = 5, left = 18, bottom = 5
4. Verify chakra table renders with colored names
5. Verify free sections show text, paid sections show Paywall for unsubscribed user
6. Log in as subscribed user → verify paid sections show placeholder text

**Step 4: Final commit**
```
git add frontend/app/matrix/MatrixClient.jsx
git commit -m "feat(matrix): wire all components in MatrixClient, complete redesign"
```

---

## Cleanup (after verification)

Once everything works, the following old files are no longer used by the matrix page. Delete them if they're not imported anywhere else:

- `frontend/app/matrix/MatrixFreeResult.jsx`
- `frontend/app/matrix/MatrixPaidResult.jsx`

Check with:
```
grep -r "MatrixFreeResult\|MatrixPaidResult" frontend/app/
```

If no imports found → delete both files and commit.

```
git add -A
git commit -m "chore(matrix): remove unused FreeResult/PaidResult components"
```

---

## Verification checklist

- [ ] `calculateMatrix('2003-09-18')` returns `center=10, nodes.m=9, nodes.y=5, nodes.d=18, nodes.k=5`
- [ ] SVG renders without errors, all 13 nodes have values
- [ ] Chakra table shows 7 rows + General with numbers
- [ ] Three purpose columns visible on desktop
- [ ] `personality` and `lessons` sections show placeholder text for all users
- [ ] Remaining 11 aspects show Paywall for unsubscribed users
- [ ] Chakra interpretations section shows Paywall for unsubscribed users
- [ ] Subscribed user sees placeholder text in all sections
- [ ] "Рассчитать другую дату" button resets to input form
- [ ] Mobile layout: SVG and chakra table stack vertically
