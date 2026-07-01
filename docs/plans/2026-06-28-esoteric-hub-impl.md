# Esoteric Hub — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Esoteric Hub MVP — landing page, 4 esoteric products (Matrix, Numerology, Tarot, Horoscope) with free/paid results, user profile management, and the complete design system.

**Architecture:** Products are declared in `products.config.ts`; each has a `FreeResult` and `PaidResult` component. A `ContentProvider` layer returns static text now (AI-ready later). The paywall sits inline after the free result. Backend adds a `user_profiles` table (name, birth_date, gender) with a migration and DDD-style service/repo.

**Tech Stack:** Next.js 14 App Router (JSX), FastAPI + SQLAlchemy async + Alembic, PostgreSQL, CloudPayments (already wired).

**Do NOT touch:** `AuthContext.jsx`, `ProtectedRoute.jsx`, `RefTracker.jsx`, `usePayment.js`, `/api/tracking/*`, `/api/admin/*`, `s2s_auth.py`, `auth_clients.py`, `payment_clients.py`, `main.py`, `config.py`.

---

## Phase 1 — Design System

### Task 1: CSS Design Tokens

**Files:**
- Create: `frontend/app/styles/theme.css`
- Modify: `frontend/app/layout.jsx` (import theme.css)

**Step 1: Create theme.css**

```css
/* frontend/app/styles/theme.css */
:root {
  --color-bg: #ffffff;
  --color-surface: #f5f5f7;
  --color-surface-hover: #ebebed;
  --color-text-primary: #1d1d1f;
  --color-text-secondary: #6e6e73;
  --color-accent: #0071e3;
  --color-accent-hover: #0077ed;
  --color-border: #d2d2d7;
  --color-success: #34c759;
  --color-error: #ff3b30;

  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 17px;
  --font-size-lg: 21px;
  --font-size-xl: 28px;
  --font-size-2xl: 40px;
  --font-size-3xl: 56px;
  --line-height-base: 1.6;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --spacing-section: 80px;
  --max-width: 1100px;
  --max-width-narrow: 680px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
  color: var(--color-text-primary);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

a { color: var(--color-accent); text-decoration: none; }
a:hover { text-decoration: underline; }
```

**Step 2: Import in layout**

Find `frontend/app/layout.jsx` (or `layout.js`). Add import at the top:
```js
import './styles/theme.css'
```

**Step 3: Commit**
```bash
git add frontend/app/styles/theme.css frontend/app/layout.jsx
git commit -m "feat: add CSS design tokens (theme.css)"
```

---

### Task 2: Shared UI Components

**Files:**
- Create: `frontend/app/components/ui/Button.jsx`
- Create: `frontend/app/components/ui/Card.jsx`
- Create: `frontend/app/components/ui/Input.jsx`
- Create: `frontend/app/components/ui/Paywall.jsx`

**Step 1: Button**
```jsx
// frontend/app/components/ui/Button.jsx
'use client'
import styles from './Button.module.css'

export default function Button({ children, variant = 'primary', size = 'md', disabled, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

```css
/* frontend/app/components/ui/Button.module.css */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

.primary { background: var(--color-accent); color: #fff; }
.primary:hover:not(:disabled) { background: var(--color-accent-hover); }

.secondary { background: var(--color-surface); color: var(--color-text-primary); }
.secondary:hover:not(:disabled) { background: var(--color-surface-hover); }

.ghost { background: transparent; color: var(--color-accent); }
.ghost:hover:not(:disabled) { background: var(--color-surface); }

.sm { padding: 8px 16px; font-size: var(--font-size-sm); }
.md { padding: 12px 24px; font-size: var(--font-size-base); }
.lg { padding: 16px 32px; font-size: var(--font-size-lg); }
```

**Step 2: Card**
```jsx
// frontend/app/components/ui/Card.jsx
import styles from './Card.module.css'

export default function Card({ children, className = '' }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>
}
```

```css
/* frontend/app/components/ui/Card.module.css */
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  border: 1px solid var(--color-border);
}
```

**Step 3: Input**
```jsx
// frontend/app/components/ui/Input.jsx
import styles from './Input.module.css'

export default function Input({ label, id, error, ...props }) {
  return (
    <div className={styles.group}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input id={id} className={`${styles.input} ${error ? styles.inputError : ''}`} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
```

```css
/* frontend/app/components/ui/Input.module.css */
.group { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-primary); }
.input {
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  background: var(--color-bg);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.15s;
}
.input:focus { border-color: var(--color-accent); }
.inputError { border-color: var(--color-error); }
.error { font-size: var(--font-size-xs); color: var(--color-error); }
```

**Step 4: Paywall**
```jsx
// frontend/app/components/ui/Paywall.jsx
'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import Button from './Button'
import styles from './Paywall.module.css'

export default function Paywall() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <div className={styles.paywall}>
      <div className={styles.blur} aria-hidden />
      <div className={styles.box}>
        <p className={styles.title}>Хочешь узнать полный расклад?</p>
        <p className={styles.sub}>Открой доступ ко всем продуктам за 9 ₽ на 3 дня</p>
        <Button size="lg" onClick={() => router.push(user ? '/lk' : '/register')}>
          {user ? 'Оформить подписку' : 'Попробовать за 9 ₽'}
        </Button>
        {!user && (
          <p className={styles.hint}>
            Уже есть аккаунт?{' '}
            <a href="/login">Войти</a>
          </p>
        )}
      </div>
    </div>
  )
}
```

```css
/* frontend/app/components/ui/Paywall.module.css */
.paywall { position: relative; margin-top: -80px; padding-top: 80px; }
.blur {
  position: absolute; top: 0; left: 0; right: 0; height: 120px;
  background: linear-gradient(to bottom, transparent, var(--color-bg) 80%);
  pointer-events: none;
}
.box {
  position: relative;
  text-align: center;
  padding: 40px 24px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg);
  max-width: 480px;
  margin: 0 auto;
}
.title { font-size: var(--font-size-xl); font-weight: 600; margin-bottom: 8px; }
.sub { color: var(--color-text-secondary); margin-bottom: 24px; }
.hint { margin-top: 16px; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
```

**Step 5: Commit**
```bash
git add frontend/app/components/ui/
git commit -m "feat: add shared UI components (Button, Card, Input, Paywall)"
```

---

## Phase 2 — Product Infrastructure

### Task 3: Products Config

**Files:**
- Create: `frontend/app/products.config.js`

**Step 1: Create config**
```js
// frontend/app/products.config.js
// Registry of all esoteric products. Add a new product = add one object here.
export const PRODUCTS = [
  {
    id: 'matrix',
    name: 'Матрица судьбы',
    slug: 'matrix',
    icon: '🔮',
    description: 'Раскрой программу своей судьбы через нумерологический квадрат',
    inputs: ['birth_date'],
    extraInputs: [],
  },
  {
    id: 'numerology',
    name: 'Нумерология',
    slug: 'numerology',
    icon: '🔢',
    description: 'Узнай значение чисел в твоей жизни',
    inputs: ['birth_date', 'name'],
    extraInputs: [],
  },
  {
    id: 'tarot',
    name: 'Расклад Таро',
    slug: 'tarot',
    icon: '🃏',
    description: 'Получи ответ на волнующий вопрос',
    inputs: [],
    extraInputs: ['intention'],
  },
  {
    id: 'horoscope',
    name: 'Гороскоп',
    slug: 'horoscope',
    icon: '⭐',
    description: 'Персональный гороскоп на основе даты рождения',
    inputs: ['birth_date'],
    extraInputs: [],
  },
]

export function getProduct(slug) {
  return PRODUCTS.find(p => p.slug === slug) ?? null
}
```

**Step 2: Commit**
```bash
git add frontend/app/products.config.js
git commit -m "feat: add products config"
```

---

### Task 4: Product Input Form Component

**Files:**
- Create: `frontend/app/components/ProductInputForm.jsx`
- Create: `frontend/app/components/ProductInputForm.module.css`

**Step 1: Create form**

This component handles "for self / for other" toggle and collects the required inputs.

```jsx
// frontend/app/components/ProductInputForm.jsx
'use client'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Input from './ui/Input'
import Button from './ui/Button'
import styles from './ProductInputForm.module.css'

export default function ProductInputForm({ product, onSubmit }) {
  const { user } = useAuth()
  const [forOther, setForOther] = useState(false)
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (key, val) => setValues(v => ({ ...v, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(values)
    setLoading(false)
  }

  const needsBirthDate = product.inputs.includes('birth_date')
  const needsName = product.inputs.includes('name')
  const needsIntention = product.extraInputs.includes('intention')

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {user && (
        <div className={styles.toggle}>
          <button
            type="button"
            className={`${styles.tab} ${!forOther ? styles.active : ''}`}
            onClick={() => setForOther(false)}
          >
            Для себя
          </button>
          <button
            type="button"
            className={`${styles.tab} ${forOther ? styles.active : ''}`}
            onClick={() => setForOther(true)}
          >
            Для другого
          </button>
        </div>
      )}

      {needsBirthDate && (!user || forOther) && (
        <Input
          label="Дата рождения"
          id="birth_date"
          type="date"
          required
          value={values.birth_date ?? ''}
          onChange={e => set('birth_date', e.target.value)}
        />
      )}

      {needsName && (!user || forOther) && (
        <Input
          label="Имя"
          id="name"
          type="text"
          required
          placeholder="Введи имя"
          value={values.name ?? ''}
          onChange={e => set('name', e.target.value)}
        />
      )}

      {needsIntention && (
        <Input
          label="Вопрос или намерение (необязательно)"
          id="intention"
          type="text"
          placeholder="Например: что меня ждёт в отношениях?"
          value={values.intention ?? ''}
          onChange={e => set('intention', e.target.value)}
        />
      )}

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Считаем...' : 'Получить результат'}
      </Button>
    </form>
  )
}
```

```css
/* frontend/app/components/ProductInputForm.module.css */
.form { display: flex; flex-direction: column; gap: 16px; max-width: 400px; margin: 0 auto; }
.toggle { display: flex; gap: 4px; background: var(--color-surface); border-radius: var(--radius-md); padding: 4px; }
.tab {
  flex: 1; padding: 8px; border: none; border-radius: var(--radius-sm);
  background: transparent; cursor: pointer;
  font-family: var(--font-sans); font-size: var(--font-size-sm);
  color: var(--color-text-secondary); transition: all 0.15s;
}
.active { background: var(--color-bg); color: var(--color-text-primary); font-weight: 500; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
```

**Step 2: Commit**
```bash
git add frontend/app/components/ProductInputForm.jsx frontend/app/components/ProductInputForm.module.css
git commit -m "feat: add ProductInputForm with for-self/for-other toggle"
```

---

## Phase 3 — Content Providers (Static Texts)

### Task 5: Matrix of Destiny Content

**Files:**
- Create: `frontend/app/content/matrix.js`

**Step 1: Create static content**
```js
// frontend/app/content/matrix.js
// ContentProvider for Matrix of Destiny.
// Returns { free, paid } text objects based on birth_date.
// Replace getResult() internals to switch to AI — UI doesn't change.

function getLifePath(birthDate) {
  const digits = birthDate.replace(/-/g, '').split('').map(Number)
  const sum = digits.reduce((a, b) => a + b, 0)
  return sum > 22 ? Math.floor(sum / 10) + (sum % 10) : sum
}

const FREE_TEXTS = {
  default: {
    title: 'Твоя матрица судьбы',
    preview: 'В центре твоей матрицы стоит число личности — ключ к твоей жизненной программе. Оно отражает твои врождённые таланты и то, для чего ты пришёл в этот мир.',
    teaser: 'Полный расчёт включает 12 секторов: личность, предназначение, кармические задачи, родовые программы и денежный канал...',
  },
}

const PAID_SECTIONS = [
  { title: 'Число личности', key: 'personality' },
  { title: 'Число предназначения', key: 'destiny' },
  { title: 'Кармические задачи', key: 'karma' },
  { title: 'Денежный канал', key: 'money' },
  { title: 'Родовые программы', key: 'family' },
]

const SECTION_TEXTS = {
  personality: 'Твоё число личности говорит о природных качествах, с которыми ты пришёл в мир. Это фундамент твоего характера и способ, которым ты воспринимаешь реальность.',
  destiny: 'Число предназначения указывает на главную задачу этой жизни. Именно здесь сосредоточены твои наибольшие возможности для роста и реализации.',
  karma: 'Кармические задачи — это уроки, которые твоя душа выбрала для проработки. Осознание их помогает избежать повторяющихся ситуаций.',
  money: 'Денежный канал показывает твой естественный путь к материальному изобилию и блокировки, которые мешают потоку.',
  family: 'Родовые программы — паттерны, унаследованные от рода. Часть из них ресурсная, часть требует осознания и трансформации.',
}

export function getMatrixResult(inputs) {
  const lifePathNum = inputs.birth_date ? getLifePath(inputs.birth_date) : 7
  const free = FREE_TEXTS.default
  const paid = PAID_SECTIONS.map(s => ({
    title: s.title,
    text: SECTION_TEXTS[s.key],
    number: lifePathNum,
  }))
  return { free, paid, lifePathNum }
}
```

**Step 2: Commit**
```bash
git add frontend/app/content/matrix.js
git commit -m "feat: add Matrix content provider (static)"
```

---

### Task 6: Numerology Content

**Files:**
- Create: `frontend/app/content/numerology.js`

**Step 1:**
```js
// frontend/app/content/numerology.js
function reduceToSingle(n) {
  while (n > 9 && n !== 11 && n !== 22) {
    n = String(n).split('').reduce((a, d) => a + Number(d), 0)
  }
  return n
}

function lifePathNumber(birthDate) {
  const [y, m, d] = birthDate.split('-').map(Number)
  const sum = String(y).split('').reduce((a, b) => a + Number(b), 0) + m + d
  return reduceToSingle(sum)
}

function nameNumber(name) {
  const RU_MAP = { а:1,б:2,в:3,г:4,д:5,е:6,ё:6,ж:7,з:8,и:9,й:1,к:2,л:3,м:4,н:5,о:7,п:8,р:9,с:1,т:2,у:3,ф:4,х:5,ц:6,ч:7,ш:8,щ:9,ъ:0,ы:1,ь:0,э:5,ю:6,я:7 }
  const sum = name.toLowerCase().split('').reduce((a, c) => a + (RU_MAP[c] ?? 0), 0)
  return reduceToSingle(sum)
}

const LP_MEANINGS = {
  1: 'Лидер и первооткрыватель. Твоя миссия — прокладывать новые пути.',
  2: 'Дипломат и миротворец. Сила в партнёрстве и гармонии.',
  3: 'Творец и коммуникатор. Самовыражение — твой главный ресурс.',
  4: 'Строитель и практик. Надёжность и системный подход — твои козыри.',
  5: 'Искатель свободы. Перемены и разнообразие — источник твоей энергии.',
  6: 'Хранитель и наставник. Любовь и ответственность — твоя суть.',
  7: 'Мыслитель и исследователь. Истина — твоя главная ценность.',
  8: 'Организатор и управленец. Материальный успех — твоя область.',
  9: 'Гуманист и мудрец. Служение человечеству — твоё призвание.',
  11: 'Мастер-интуит. Высшая чувствительность и духовная миссия.',
  22: 'Мастер-строитель. Способность воплощать великие идеи в реальность.',
}

export function getNumerologyResult(inputs) {
  const lp = inputs.birth_date ? lifePathNumber(inputs.birth_date) : 7
  const nn = inputs.name ? nameNumber(inputs.name) : 5
  return {
    free: {
      title: 'Твоё число жизненного пути',
      number: lp,
      preview: LP_MEANINGS[lp] ?? LP_MEANINGS[7],
      teaser: 'Полный анализ включает число судьбы, число души, число личности, ключевые годы и персональный прогноз...',
    },
    paid: {
      lifePath: { number: lp, meaning: LP_MEANINGS[lp] ?? '' },
      nameNumber: { number: nn, meaning: `Число имени ${nn} раскрывает твою социальную маску — то, как тебя воспринимают окружающие.` },
      compatibility: `Числа ${lp} и ${nn} в сочетании указывают на твою уникальную энергетическую подпись.`,
      forecast: 'Персональный год и ключевые месяцы рассчитаны на основе твоих данных.',
    },
  }
}
```

**Step 2: Commit**
```bash
git add frontend/app/content/numerology.js
git commit -m "feat: add Numerology content provider (static)"
```

---

### Task 7: Tarot Content

**Files:**
- Create: `frontend/app/content/tarot.js`

**Step 1:**
```js
// frontend/app/content/tarot.js
// Pseudo-random but deterministic: seed from current date so same day = same cards.
function dayHash() {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function pick(arr, seed) {
  return arr[(seed * 1103515245 + 12345) % arr.length]
}

const CARDS = [
  { name: 'Шут', meaning: 'Начало нового пути, свежий взгляд на мир, доверие процессу.' },
  { name: 'Маг', meaning: 'Воля и мастерство. У тебя есть все инструменты для действия.' },
  { name: 'Жрица', meaning: 'Прислушайся к интуиции. Ответ уже внутри тебя.' },
  { name: 'Императрица', meaning: 'Изобилие, творчество, забота. Время взращивать.' },
  { name: 'Император', meaning: 'Структура и порядок. Возьми ответственность.' },
  { name: 'Иерофант', meaning: 'Традиция и наставничество. Ищи мудрость у учителей.' },
  { name: 'Влюблённые', meaning: 'Выбор и ценности. Следуй сердцу.' },
  { name: 'Колесница', meaning: 'Воля и движение вперёд. Победа через дисциплину.' },
  { name: 'Сила', meaning: 'Мягкость сильнее напора. Укроти внутреннего зверя.' },
  { name: 'Отшельник', meaning: 'Уединение и поиск. Ответы найдутся в тишине.' },
  { name: 'Колесо Фортуны', meaning: 'Перемены на горизонте. Прими цикличность жизни.' },
  { name: 'Справедливость', meaning: 'Баланс и последствия. Всё возвращается.' },
  { name: 'Повешенный', meaning: 'Пауза и иная перспектива. Отпусти контроль.' },
  { name: 'Смерть', meaning: 'Трансформация. Что-то заканчивается, освобождая место новому.' },
  { name: 'Умеренность', meaning: 'Гармония и баланс. Смешивай противоположности мудро.' },
  { name: 'Дьявол', meaning: 'Освободись от иллюзий и ограничивающих паттернов.' },
  { name: 'Башня', meaning: 'Внезапное откровение разрушает старое.' },
  { name: 'Звезда', meaning: 'Надежда и вдохновение. Доверяй своему пути.' },
  { name: 'Луна', meaning: 'Страхи и иллюзии. Смотри глубже.' },
  { name: 'Солнце', meaning: 'Радость и ясность. Успех и vitality.' },
  { name: 'Суд', meaning: 'Пробуждение. Призыв к новой жизни.' },
  { name: 'Мир', meaning: 'Завершение и полнота. Цикл замкнулся.' },
]

export function getTarotResult(inputs) {
  const seed = dayHash() + (inputs.intention?.length ?? 0)
  const past = pick(CARDS, seed)
  const present = pick(CARDS, seed + 1)
  const future = pick(CARDS, seed + 2)

  return {
    free: {
      title: 'Карта настоящего момента',
      card: present,
      teaser: 'Полный расклад включает три карты: прошлое, настоящее и будущее с детальной интерпретацией...',
    },
    paid: {
      past,
      present,
      future,
      synthesis: `Расклад показывает движение от ${past.name} через ${present.name} к ${future.name}. Это путь трансформации.`,
    },
  }
}
```

**Step 2: Commit**
```bash
git add frontend/app/content/tarot.js
git commit -m "feat: add Tarot content provider (static)"
```

---

### Task 8: Horoscope Content

**Files:**
- Create: `frontend/app/content/horoscope.js`

**Step 1:**
```js
// frontend/app/content/horoscope.js
const SIGNS = [
  { name: 'Козерог', dates: [1,1,1,19], element: 'Земля', planet: 'Сатурн' },
  { name: 'Водолей', dates: [1,20,2,18], element: 'Воздух', planet: 'Уран' },
  { name: 'Рыбы', dates: [2,19,3,20], element: 'Вода', planet: 'Нептун' },
  { name: 'Овен', dates: [3,21,4,19], element: 'Огонь', planet: 'Марс' },
  { name: 'Телец', dates: [4,20,5,20], element: 'Земля', planet: 'Венера' },
  { name: 'Близнецы', dates: [5,21,6,21], element: 'Воздух', planet: 'Меркурий' },
  { name: 'Рак', dates: [6,22,7,22], element: 'Вода', planet: 'Луна' },
  { name: 'Лев', dates: [7,23,8,22], element: 'Огонь', planet: 'Солнце' },
  { name: 'Дева', dates: [8,23,9,22], element: 'Земля', planet: 'Меркурий' },
  { name: 'Весы', dates: [9,23,10,22], element: 'Воздух', planet: 'Венера' },
  { name: 'Скорпион', dates: [10,23,11,21], element: 'Вода', planet: 'Плутон' },
  { name: 'Стрелец', dates: [11,22,12,21], element: 'Огонь', planet: 'Юпитер' },
  { name: 'Козерог', dates: [12,22,12,31], element: 'Земля', planet: 'Сатурн' },
]

function getSign(birthDate) {
  const [, m, d] = birthDate.split('-').map(Number)
  return SIGNS.find(s => (m === s.dates[0] && d >= s.dates[1]) || (m === s.dates[2] && d <= s.dates[3]))
    ?? SIGNS[0]
}

const DESCRIPTIONS = {
  'Овен': 'Лидер и первопроходец. Твоя энергия зажигает других.',
  'Телец': 'Строитель и гурман. Устойчивость и красота — твоя стихия.',
  'Близнецы': 'Коммуникатор и исследователь. Тебя питает разнообразие.',
  'Рак': 'Хранитель и интуит. Эмоции — твой компас.',
  'Лев': 'Творец и вдохновитель. Твоё сердце — источник силы.',
  'Дева': 'Аналитик и целитель. Совершенство в деталях.',
  'Весы': 'Дипломат и эстет. Гармония — твоя цель.',
  'Скорпион': 'Трансформатор и исследователь глубин. Ты видишь суть.',
  'Стрелец': 'Философ и искатель. Тебя ведёт поиск смысла.',
  'Козерог': 'Архитектор и стратег. Достижение — твоя природа.',
  'Водолей': 'Визионер и реформатор. Ты живёшь будущим.',
  'Рыбы': 'Мистик и эмпат. Границы между мирами для тебя прозрачны.',
}

export function getHoroscopeResult(inputs) {
  const sign = inputs.birth_date ? getSign(inputs.birth_date) : SIGNS[3]
  const desc = DESCRIPTIONS[sign.name] ?? ''

  return {
    free: {
      title: `Твой знак — ${sign.name}`,
      sign: sign.name,
      element: sign.element,
      planet: sign.planet,
      preview: desc,
      teaser: 'Полный гороскоп включает натальную карту, прогноз на месяц, совместимость и сферы жизни...',
    },
    paid: {
      sign,
      description: desc,
      monthForecast: `В ближайший месяц ${sign.name} ощутит усиление энергии в сфере отношений и карьеры. Планета ${sign.planet} поддерживает начинания.`,
      compatibility: `Лучший партнёр для ${sign.name} — те, кто дополняет стихию ${sign.element}.`,
      advice: 'Сфокусируйся на внутреннем росте — внешние результаты последуют.',
    },
  }
}
```

**Step 2: Commit**
```bash
git add frontend/app/content/horoscope.js
git commit -m "feat: add Horoscope content provider (static)"
```

---

## Phase 4 — Product Pages

### Task 9: Generic Product Page Shell

**Files:**
- Create: `frontend/app/components/ProductPage.jsx`
- Create: `frontend/app/components/ProductPage.module.css`

**Step 1:**
```jsx
// frontend/app/components/ProductPage.jsx
'use client'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ProductInputForm from './ProductInputForm'
import Paywall from './ui/Paywall'
import styles from './ProductPage.module.css'

export default function ProductPage({ product, getResult, FreeResult, PaidResult }) {
  const { user } = useAuth()
  const [result, setResult] = useState(null)

  const handleSubmit = async (inputs) => {
    const data = getResult(inputs)
    setResult(data)
  }

  const isSubscribed = user?.subscribed

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.icon}>{product.icon}</span>
        <h1 className={styles.title}>{product.name}</h1>
        <p className={styles.desc}>{product.description}</p>
      </div>

      {!result && (
        <section className={styles.formSection}>
          <ProductInputForm product={product} onSubmit={handleSubmit} />
        </section>
      )}

      {result && (
        <section className={styles.resultSection}>
          <FreeResult result={result.free} />

          {isSubscribed ? (
            <PaidResult result={result.paid} />
          ) : (
            <Paywall />
          )}

          <button
            className={styles.reset}
            onClick={() => setResult(null)}
          >
            Попробовать ещё раз
          </button>
        </section>
      )}
    </div>
  )
}
```

```css
/* frontend/app/components/ProductPage.module.css */
.page { max-width: var(--max-width-narrow); margin: 0 auto; padding: 40px 24px; }
.hero { text-align: center; margin-bottom: 48px; }
.icon { font-size: 64px; display: block; margin-bottom: 16px; }
.title { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: 12px; }
.desc { color: var(--color-text-secondary); font-size: var(--font-size-lg); }
.formSection { padding: 40px 0; }
.resultSection { display: flex; flex-direction: column; gap: 32px; }
.reset {
  background: none; border: none; color: var(--color-text-secondary);
  font-size: var(--font-size-sm); cursor: pointer; text-decoration: underline;
  align-self: center; margin-top: 16px;
}
```

**Step 2: Commit**
```bash
git add frontend/app/components/ProductPage.jsx frontend/app/components/ProductPage.module.css
git commit -m "feat: add generic ProductPage shell"
```

---

### Task 10: Matrix Page

**Files:**
- Create: `frontend/app/matrix/page.jsx`
- Create: `frontend/app/matrix/MatrixFreeResult.jsx`
- Create: `frontend/app/matrix/MatrixPaidResult.jsx`
- Create: `frontend/app/matrix/results.module.css`

**Step 1: MatrixFreeResult**
```jsx
// frontend/app/matrix/MatrixFreeResult.jsx
import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function MatrixFreeResult({ result }) {
  return (
    <Card>
      <h2 className={styles.resultTitle}>{result.title}</h2>
      <p className={styles.preview}>{result.preview}</p>
      <p className={styles.teaser}>{result.teaser}</p>
    </Card>
  )
}
```

**Step 2: MatrixPaidResult**
```jsx
// frontend/app/matrix/MatrixPaidResult.jsx
import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function MatrixPaidResult({ result }) {
  return (
    <div className={styles.paidGrid}>
      {result.map((section, i) => (
        <Card key={i} className={styles.sectionCard}>
          <div className={styles.sectionNumber}>{section.number}</div>
          <h3 className={styles.sectionTitle}>{section.title}</h3>
          <p className={styles.sectionText}>{section.text}</p>
        </Card>
      ))}
    </div>
  )
}
```

```css
/* frontend/app/matrix/results.module.css */
.resultTitle { font-size: var(--font-size-xl); font-weight: 600; margin-bottom: 16px; }
.preview { color: var(--color-text-primary); margin-bottom: 12px; line-height: 1.7; }
.teaser { color: var(--color-text-secondary); font-size: var(--font-size-sm); font-style: italic; }
.paidGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .paidGrid { grid-template-columns: 1fr; } }
.sectionCard { display: flex; flex-direction: column; gap: 8px; }
.sectionNumber { font-size: 40px; font-weight: 700; color: var(--color-accent); }
.sectionTitle { font-size: var(--font-size-lg); font-weight: 600; }
.sectionText { color: var(--color-text-secondary); line-height: 1.7; }
```

**Step 3: Page**
```jsx
// frontend/app/matrix/page.jsx
import { getProduct } from '../products.config'
import { getMatrixResult } from '../content/matrix'
import ProductPage from '../components/ProductPage'
import MatrixFreeResult from './MatrixFreeResult'
import MatrixPaidResult from './MatrixPaidResult'

export const metadata = {
  title: 'Матрица судьбы — раскрой программу своей жизни',
  description: 'Персональный расчёт матрицы судьбы по дате рождения. Узнай своё предназначение, кармические задачи и денежный канал.',
}

export default function MatrixPage() {
  const product = getProduct('matrix')
  return (
    <ProductPage
      product={product}
      getResult={getMatrixResult}
      FreeResult={MatrixFreeResult}
      PaidResult={MatrixPaidResult}
    />
  )
}
```

**Step 4: Commit**
```bash
git add frontend/app/matrix/
git commit -m "feat: add Matrix of Destiny product page"
```

---

### Task 11: Numerology Page

**Files:**
- Create: `frontend/app/numerology/page.jsx`
- Create: `frontend/app/numerology/NumerologyFreeResult.jsx`
- Create: `frontend/app/numerology/NumerologyPaidResult.jsx`

**Step 1: FreeResult**
```jsx
// frontend/app/numerology/NumerologyFreeResult.jsx
import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function NumerologyFreeResult({ result }) {
  return (
    <Card>
      <h2 className={styles.title}>{result.title}</h2>
      <div className={styles.bigNumber}>{result.number}</div>
      <p className={styles.preview}>{result.preview}</p>
      <p className={styles.teaser}>{result.teaser}</p>
    </Card>
  )
}
```

**Step 2: PaidResult**
```jsx
// frontend/app/numerology/NumerologyPaidResult.jsx
import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function NumerologyPaidResult({ result }) {
  return (
    <div className={styles.grid}>
      <Card>
        <h3 className={styles.cardTitle}>Число жизненного пути: {result.lifePath.number}</h3>
        <p>{result.lifePath.meaning}</p>
      </Card>
      <Card>
        <h3 className={styles.cardTitle}>Число имени: {result.nameNumber.number}</h3>
        <p>{result.nameNumber.meaning}</p>
      </Card>
      <Card>
        <h3 className={styles.cardTitle}>Синтез</h3>
        <p>{result.compatibility}</p>
      </Card>
      <Card>
        <h3 className={styles.cardTitle}>Прогноз</h3>
        <p>{result.forecast}</p>
      </Card>
    </div>
  )
}
```

```css
/* frontend/app/numerology/results.module.css */
.title { font-size: var(--font-size-xl); font-weight: 600; margin-bottom: 12px; }
.bigNumber { font-size: 80px; font-weight: 800; color: var(--color-accent); line-height: 1; margin-bottom: 16px; }
.preview { margin-bottom: 12px; line-height: 1.7; }
.teaser { color: var(--color-text-secondary); font-size: var(--font-size-sm); font-style: italic; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .grid { grid-template-columns: 1fr; } }
.cardTitle { font-size: var(--font-size-base); font-weight: 600; margin-bottom: 8px; }
```

**Step 3: Page**
```jsx
// frontend/app/numerology/page.jsx
import { getProduct } from '../products.config'
import { getNumerologyResult } from '../content/numerology'
import ProductPage from '../components/ProductPage'
import NumerologyFreeResult from './NumerologyFreeResult'
import NumerologyPaidResult from './NumerologyPaidResult'

export const metadata = {
  title: 'Нумерология — числа твоей судьбы',
  description: 'Нумерологический расчёт по имени и дате рождения. Узнай своё число жизненного пути и скрытый потенциал.',
}

export default function NumerologyPage() {
  const product = getProduct('numerology')
  return (
    <ProductPage
      product={product}
      getResult={getNumerologyResult}
      FreeResult={NumerologyFreeResult}
      PaidResult={NumerologyPaidResult}
    />
  )
}
```

**Step 4: Commit**
```bash
git add frontend/app/numerology/
git commit -m "feat: add Numerology product page"
```

---

### Task 12: Tarot Page

**Files:**
- Create: `frontend/app/tarot/page.jsx`
- Create: `frontend/app/tarot/TarotFreeResult.jsx`
- Create: `frontend/app/tarot/TarotPaidResult.jsx`
- Create: `frontend/app/tarot/results.module.css`

**Step 1: FreeResult**
```jsx
// frontend/app/tarot/TarotFreeResult.jsx
import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function TarotFreeResult({ result }) {
  return (
    <Card>
      <h2 className={styles.title}>{result.title}</h2>
      <div className={styles.cardName}>{result.card.name}</div>
      <p className={styles.preview}>{result.card.meaning}</p>
      <p className={styles.teaser}>{result.teaser}</p>
    </Card>
  )
}
```

**Step 2: PaidResult**
```jsx
// frontend/app/tarot/TarotPaidResult.jsx
import Card from '../components/ui/Card'
import styles from './results.module.css'

const POSITIONS = [
  { key: 'past', label: 'Прошлое' },
  { key: 'present', label: 'Настоящее' },
  { key: 'future', label: 'Будущее' },
]

export default function TarotPaidResult({ result }) {
  return (
    <div className={styles.spread}>
      {POSITIONS.map(pos => (
        <Card key={pos.key} className={styles.posCard}>
          <p className={styles.position}>{pos.label}</p>
          <p className={styles.cardName}>{result[pos.key].name}</p>
          <p>{result[pos.key].meaning}</p>
        </Card>
      ))}
      <Card className={styles.synthesisCard}>
        <h3 className={styles.synthTitle}>Общий смысл расклада</h3>
        <p>{result.synthesis}</p>
      </Card>
    </div>
  )
}
```

```css
/* frontend/app/tarot/results.module.css */
.title { font-size: var(--font-size-xl); font-weight: 600; margin-bottom: 16px; }
.cardName { font-size: var(--font-size-2xl); font-weight: 700; color: var(--color-accent); margin-bottom: 12px; }
.preview { line-height: 1.7; margin-bottom: 12px; }
.teaser { color: var(--color-text-secondary); font-size: var(--font-size-sm); font-style: italic; }
.spread { display: flex; flex-direction: column; gap: 16px; }
.posCard { }
.position { font-size: var(--font-size-sm); font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.synthesisCard { background: var(--color-accent); color: #fff; border-color: transparent; }
.synthTitle { color: #fff; font-size: var(--font-size-lg); font-weight: 600; margin-bottom: 8px; }
.synthesisCard p { color: rgba(255,255,255,0.9); }
```

**Step 3: Page**
```jsx
// frontend/app/tarot/page.jsx
import { getProduct } from '../products.config'
import { getTarotResult } from '../content/tarot'
import ProductPage from '../components/ProductPage'
import TarotFreeResult from './TarotFreeResult'
import TarotPaidResult from './TarotPaidResult'

export const metadata = {
  title: 'Расклад Таро — послание карт для тебя',
  description: 'Персональный расклад Таро онлайн. Получи ответ на свой вопрос через символизм карт.',
}

export default function TarotPage() {
  const product = getProduct('tarot')
  return (
    <ProductPage
      product={product}
      getResult={getTarotResult}
      FreeResult={TarotFreeResult}
      PaidResult={TarotPaidResult}
    />
  )
}
```

**Step 4: Commit**
```bash
git add frontend/app/tarot/
git commit -m "feat: add Tarot product page"
```

---

### Task 13: Horoscope Page

**Files:**
- Create: `frontend/app/horoscope/page.jsx`
- Create: `frontend/app/horoscope/HoroscopeFreeResult.jsx`
- Create: `frontend/app/horoscope/HoroscopePaidResult.jsx`
- Create: `frontend/app/horoscope/results.module.css`

**Step 1: FreeResult**
```jsx
// frontend/app/horoscope/HoroscopeFreeResult.jsx
import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function HoroscopeFreeResult({ result }) {
  return (
    <Card>
      <h2 className={styles.title}>{result.title}</h2>
      <div className={styles.badges}>
        <span className={styles.badge}>{result.element}</span>
        <span className={styles.badge}>{result.planet}</span>
      </div>
      <p className={styles.preview}>{result.preview}</p>
      <p className={styles.teaser}>{result.teaser}</p>
    </Card>
  )
}
```

**Step 2: PaidResult**
```jsx
// frontend/app/horoscope/HoroscopePaidResult.jsx
import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function HoroscopePaidResult({ result }) {
  return (
    <div className={styles.grid}>
      <Card>
        <h3 className={styles.cardTitle}>Прогноз на месяц</h3>
        <p>{result.monthForecast}</p>
      </Card>
      <Card>
        <h3 className={styles.cardTitle}>Совместимость</h3>
        <p>{result.compatibility}</p>
      </Card>
      <Card>
        <h3 className={styles.cardTitle}>Совет звёзд</h3>
        <p>{result.advice}</p>
      </Card>
    </div>
  )
}
```

```css
/* frontend/app/horoscope/results.module.css */
.title { font-size: var(--font-size-xl); font-weight: 600; margin-bottom: 12px; }
.badges { display: flex; gap: 8px; margin-bottom: 16px; }
.badge { padding: 4px 12px; background: var(--color-surface); border-radius: 99px; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.preview { line-height: 1.7; margin-bottom: 12px; }
.teaser { color: var(--color-text-secondary); font-size: var(--font-size-sm); font-style: italic; }
.grid { display: flex; flex-direction: column; gap: 16px; }
.cardTitle { font-size: var(--font-size-base); font-weight: 600; margin-bottom: 8px; }
```

**Step 3: Page**
```jsx
// frontend/app/horoscope/page.jsx
import { getProduct } from '../products.config'
import { getHoroscopeResult } from '../content/horoscope'
import ProductPage from '../components/ProductPage'
import HoroscopeFreeResult from './HoroscopeFreeResult'
import HoroscopePaidResult from './HoroscopePaidResult'

export const metadata = {
  title: 'Гороскоп — персональный прогноз по знаку зодиака',
  description: 'Гороскоп по дате рождения с прогнозом на месяц, совместимостью и советами звёзд.',
}

export default function HoroscopePage() {
  const product = getProduct('horoscope')
  return (
    <ProductPage
      product={product}
      getResult={getHoroscopeResult}
      FreeResult={HoroscopeFreeResult}
      PaidResult={HoroscopePaidResult}
    />
  )
}
```

**Step 4: Commit**
```bash
git add frontend/app/horoscope/
git commit -m "feat: add Horoscope product page"
```

---

## Phase 5 — Landing Page

### Task 14: Landing Page

**Files:**
- Modify: `frontend/app/page.jsx`
- Create: `frontend/app/landing.module.css`

**Step 1: Landing page**
```jsx
// frontend/app/page.jsx
import Link from 'next/link'
import { PRODUCTS } from './products.config'
import styles from './landing.module.css'

export const metadata = {
  title: 'Эзотерический хаб — матрица судьбы, нумерология, таро и гороскоп',
  description: 'Попробуй каждый сервис бесплатно. Матрица судьбы, нумерология, расклад Таро и персональный гороскоп — всё в одном месте.',
}

const HOW_IT_WORKS = [
  { step: '1', title: 'Выбери продукт', desc: 'Нажми на любую карточку ниже — каждый сервис доступен бесплатно' },
  { step: '2', title: 'Введи данные', desc: 'Дата рождения или вопрос — ничего лишнего' },
  { step: '3', title: 'Открой полный доступ', desc: 'Демо-результат сразу. Полный анализ — по подписке за 9 ₽' },
]

const REVIEWS = [
  { name: 'Анна К.', text: 'Матрица судьбы просто перевернула моё понимание себя. Всё точь-в-точь!' },
  { name: 'Михаил Д.', text: 'Расклад Таро помог принять сложное решение. Теперь пользуюсь каждую неделю.' },
  { name: 'Елена В.', text: 'Нумерология объяснила паттерны, которые я замечала всю жизнь. Рекомендую.' },
]

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1 className={styles.heroTitle}>
            Познай себя через<br />
            <span className={styles.accent}>язык символов</span>
          </h1>
          <p className={styles.heroSub}>
            Матрица судьбы, нумерология, Таро и гороскоп — попробуй каждый сервис бесплатно
          </p>
          <Link href="#products" className={styles.heroCta}>
            Попробовать бесплатно
          </Link>
        </div>
      </section>

      {/* Products */}
      <section className={styles.section} id="products">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Выбери продукт</h2>
          <div className={styles.productsGrid}>
            {PRODUCTS.map(p => (
              <Link key={p.id} href={`/${p.slug}`} className={styles.productCard}>
                <span className={styles.productIcon}>{p.icon}</span>
                <h3 className={styles.productName}>{p.name}</h3>
                <p className={styles.productDesc}>{p.description}</p>
                <span className={styles.productCta}>Попробовать →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Как это работает</h2>
          <div className={styles.stepsGrid}>
            {HOW_IT_WORKS.map(s => (
              <div key={s.step} className={styles.step}>
                <div className={styles.stepNum}>{s.step}</div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Отзывы</h2>
          <div className={styles.reviewsGrid}>
            {REVIEWS.map((r, i) => (
              <div key={i} className={styles.review}>
                <p className={styles.reviewText}>«{r.text}»</p>
                <p className={styles.reviewName}>{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>© 2026 Эзотерический хаб · <Link href="/login">Войти</Link> · <Link href="/register">Регистрация</Link></p>
        </div>
      </footer>
    </main>
  )
}
```

**Step 2: Styles**
```css
/* frontend/app/landing.module.css */
.container { max-width: var(--max-width); margin: 0 auto; padding: 0 24px; }

.hero {
  padding: 100px 0 80px;
  text-align: center;
  background: linear-gradient(180deg, #f0f4ff 0%, var(--color-bg) 100%);
}
.heroTitle { font-size: var(--font-size-3xl); font-weight: 700; line-height: 1.15; margin-bottom: 20px; }
.accent { color: var(--color-accent); }
.heroSub { font-size: var(--font-size-lg); color: var(--color-text-secondary); max-width: 560px; margin: 0 auto 36px; }
.heroCta {
  display: inline-block;
  background: var(--color-accent); color: #fff;
  padding: 16px 40px; border-radius: var(--radius-md);
  font-size: var(--font-size-lg); font-weight: 500;
  transition: background 0.15s;
}
.heroCta:hover { background: var(--color-accent-hover); text-decoration: none; }

.section { padding: var(--spacing-section) 0; }
.sectionAlt { background: var(--color-surface); }
.sectionTitle { font-size: var(--font-size-2xl); font-weight: 700; text-align: center; margin-bottom: 48px; }

.productsGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
.productCard {
  display: flex; flex-direction: column; gap: 8px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 28px;
  transition: box-shadow 0.15s, transform 0.15s;
  color: var(--color-text-primary);
}
.productCard:hover { box-shadow: 0 8px 32px rgba(0,0,0,0.08); transform: translateY(-2px); text-decoration: none; }
.productIcon { font-size: 40px; }
.productName { font-size: var(--font-size-lg); font-weight: 600; }
.productDesc { color: var(--color-text-secondary); font-size: var(--font-size-sm); flex: 1; }
.productCta { color: var(--color-accent); font-size: var(--font-size-sm); font-weight: 500; margin-top: 8px; }

.stepsGrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
@media (max-width: 700px) { .stepsGrid { grid-template-columns: 1fr; } }
.step { text-align: center; }
.stepNum { width: 48px; height: 48px; border-radius: 50%; background: var(--color-accent); color: #fff; font-size: var(--font-size-lg); font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; }
.stepTitle { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: 8px; }
.stepDesc { color: var(--color-text-secondary); }

.reviewsGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; }
.review { background: var(--color-surface); border-radius: var(--radius-lg); padding: 24px; }
.reviewText { font-style: italic; line-height: 1.7; margin-bottom: 12px; }
.reviewName { font-weight: 600; color: var(--color-text-secondary); font-size: var(--font-size-sm); }

.footer { background: var(--color-surface); padding: 32px 0; text-align: center; color: var(--color-text-secondary); font-size: var(--font-size-sm); }
.footer a { color: var(--color-accent); }

@media (max-width: 600px) {
  .heroTitle { font-size: var(--font-size-2xl); }
}
```

**Step 3: Commit**
```bash
git add frontend/app/page.jsx frontend/app/landing.module.css
git commit -m "feat: build landing page with hero, products, how-it-works, reviews"
```

---

## Phase 6 — Personal Cabinet & Profile

### Task 15: Backend — user_profiles Migration

**Files:**
- Create: `backend/app/infrastructure/alembic/versions/002_add_user_profiles.py`

**Step 1: Create migration**
```python
# backend/app/infrastructure/alembic/versions/002_add_user_profiles.py
"""add user_profiles table

Revision ID: 002
Revises: 001
Create Date: 2026-06-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user_profiles',
        sa.Column('auth_user_id', UUID(as_uuid=True), sa.ForeignKey('users.auth_user_id', ondelete='CASCADE'), primary_key=True),
        sa.Column('name', sa.VARCHAR(128), nullable=True),
        sa.Column('birth_date', sa.DATE, nullable=True),
        sa.Column('gender', sa.Enum('male', 'female', name='gender_enum'), nullable=True),
        sa.Column('created_at', sa.TIMESTAMPTZ, server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMPTZ, server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('user_profiles')
    op.execute("DROP TYPE IF EXISTS gender_enum")
```

**Step 2: Run migration to verify**
```bash
cd backend
alembic upgrade head
```
Expected: migration runs without error, `user_profiles` table created.

**Step 3: Commit**
```bash
git add backend/app/infrastructure/alembic/versions/002_add_user_profiles.py
git commit -m "feat: add user_profiles migration"
```

---

### Task 16: Backend — UserProfile DDD Layer

**Files:**
- Create: `backend/app/domain/entities/user_profile.py`
- Create: `backend/app/infrastructure/sql/models/user_profile_model.py`
- Create: `backend/app/infrastructure/sql/mappers/user_profile_mapper.py`
- Create: `backend/app/repositories/user_profile_repo.py`
- Create: `backend/app/services/user_profile_service.py`

**Step 1: Entity**
```python
# backend/app/domain/entities/user_profile.py
from dataclasses import dataclass
from datetime import date
from uuid import UUID


@dataclass
class UserProfileEntity:
    auth_user_id: UUID
    name: str | None = None
    birth_date: date | None = None
    gender: str | None = None  # 'male' | 'female'
```

**Step 2: SQLAlchemy Model**
```python
# backend/app/infrastructure/sql/models/user_profile_model.py
import enum
from sqlalchemy import Column, Date, Enum, ForeignKey, VARCHAR, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import TIMESTAMP
from .base import Base


class GenderEnum(str, enum.Enum):
    male = 'male'
    female = 'female'


class UserProfileModel(Base):
    __tablename__ = 'user_profiles'

    auth_user_id = Column(UUID(as_uuid=True), ForeignKey('users.auth_user_id', ondelete='CASCADE'), primary_key=True)
    name = Column(VARCHAR(128), nullable=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(Enum(GenderEnum, name='gender_enum'), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('now()'), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text('now()'), onupdate=text('now()'), nullable=False)
```

**Step 3: Mapper**
```python
# backend/app/infrastructure/sql/mappers/user_profile_mapper.py
from ...domain.entities.user_profile import UserProfileEntity
from ..sql.models.user_profile_model import UserProfileModel


def to_entity(model: UserProfileModel) -> UserProfileEntity:
    return UserProfileEntity(
        auth_user_id=model.auth_user_id,
        name=model.name,
        birth_date=model.birth_date,
        gender=model.gender,
    )


def to_model(entity: UserProfileEntity) -> UserProfileModel:
    return UserProfileModel(
        auth_user_id=entity.auth_user_id,
        name=entity.name,
        birth_date=entity.birth_date,
        gender=entity.gender,
    )
```

**Step 4: Repository**
```python
# backend/app/repositories/user_profile_repo.py
from typing import Protocol
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from ..domain.entities.user_profile import UserProfileEntity
from ..infrastructure.sql.models.user_profile_model import UserProfileModel
from ..infrastructure.sql.mappers.user_profile_mapper import to_entity, to_model


class IUserProfileRepository(Protocol):
    async def get(self, auth_user_id: UUID) -> UserProfileEntity | None: ...
    async def upsert(self, entity: UserProfileEntity) -> UserProfileEntity: ...


class SqlUserProfileRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, auth_user_id: UUID) -> UserProfileEntity | None:
        result = await self._session.execute(
            select(UserProfileModel).where(UserProfileModel.auth_user_id == auth_user_id)
        )
        model = result.scalar_one_or_none()
        return to_entity(model) if model else None

    async def upsert(self, entity: UserProfileEntity) -> UserProfileEntity:
        existing = await self._session.execute(
            select(UserProfileModel).where(UserProfileModel.auth_user_id == entity.auth_user_id)
        )
        model = existing.scalar_one_or_none()
        if model:
            if entity.name is not None:
                model.name = entity.name
            if entity.birth_date is not None:
                model.birth_date = entity.birth_date
            if entity.gender is not None:
                model.gender = entity.gender
        else:
            model = to_model(entity)
            self._session.add(model)
        await self._session.flush()
        return to_entity(model)
```

**Step 5: Service**
```python
# backend/app/services/user_profile_service.py
from uuid import UUID
from datetime import date
from ..repositories.user_profile_repo import IUserProfileRepository
from ..domain.entities.user_profile import UserProfileEntity


class UserProfileService:
    def __init__(self, repo: IUserProfileRepository) -> None:
        self._repo = repo

    async def get_profile(self, auth_user_id: UUID) -> UserProfileEntity | None:
        return await self._repo.get(auth_user_id)

    async def update_profile(
        self,
        auth_user_id: UUID,
        name: str | None,
        birth_date: date | None,
        gender: str | None,
    ) -> UserProfileEntity:
        entity = UserProfileEntity(
            auth_user_id=auth_user_id,
            name=name,
            birth_date=birth_date,
            gender=gender,
        )
        return await self._repo.upsert(entity)
```

**Step 6: Commit**
```bash
git add backend/app/domain/entities/user_profile.py backend/app/infrastructure/sql/models/user_profile_model.py backend/app/infrastructure/sql/mappers/user_profile_mapper.py backend/app/repositories/user_profile_repo.py backend/app/services/user_profile_service.py
git commit -m "feat: add UserProfile DDD layer (entity, model, mapper, repo, service)"
```

---

### Task 17: Backend — Profile API Route

**Files:**
- Create: `backend/app/api/v1/routes/profile.py`
- Modify: `backend/app/api/v1/router.py` (include profile router)
- Modify: `backend/app/api/v1/dependencies.py` (add get_profile_service)

**Step 1: Schemas** — add to existing schemases or create inline in route:
```python
# backend/app/api/v1/routes/profile.py
from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from ..dependencies import get_current_user, get_db_session
from ....repositories.user_profile_repo import SqlUserProfileRepository
from ....services.user_profile_service import UserProfileService

router = APIRouter(prefix='/profile', tags=['profile'])


class ProfileResponse(BaseModel):
    auth_user_id: UUID
    name: str | None
    birth_date: date | None
    gender: str | None


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    birth_date: date | None = None
    gender: str | None = None


@router.get('/me', response_model=ProfileResponse)
async def get_my_profile(
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    svc = UserProfileService(SqlUserProfileRepository(session))
    profile = await svc.get_profile(current_user.auth_user_id)
    if profile is None:
        return ProfileResponse(auth_user_id=current_user.auth_user_id, name=None, birth_date=None, gender=None)
    return ProfileResponse(
        auth_user_id=profile.auth_user_id,
        name=profile.name,
        birth_date=profile.birth_date,
        gender=profile.gender,
    )


@router.patch('/me', response_model=ProfileResponse)
async def update_my_profile(
    body: ProfileUpdateRequest,
    current_user=Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    svc = UserProfileService(SqlUserProfileRepository(session))
    updated = await svc.update_profile(
        auth_user_id=current_user.auth_user_id,
        name=body.name,
        birth_date=body.birth_date,
        gender=body.gender,
    )
    return ProfileResponse(
        auth_user_id=updated.auth_user_id,
        name=updated.name,
        birth_date=updated.birth_date,
        gender=updated.gender,
    )
```

**Step 2: Register router** — open `backend/app/api/v1/router.py`, add:
```python
from .routes.profile import router as profile_router
# in the api_router includes section:
api_router.include_router(profile_router)
```

**Step 3: Commit**
```bash
git add backend/app/api/v1/routes/profile.py backend/app/api/v1/router.py
git commit -m "feat: add GET/PATCH /api/v1/profile/me endpoints"
```

---

### Task 18: Personal Cabinet — Full UI

**Files:**
- Modify: `frontend/app/lk/LKClient.jsx`
- Create: `frontend/app/lk/lk.module.css`

**Step 1: Replace LKClient.jsx**
```jsx
// frontend/app/lk/LKClient.jsx
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePayment } from '../hooks/usePayment'
import ProtectedRoute from '../components/ProtectedRoute'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Link from 'next/link'
import { PRODUCTS } from '../products.config'
import styles from './lk.module.css'

function LKContent() {
  const { user, logout, refetchUser } = useAuth()
  const { startPayment } = usePayment()
  const [payLoading, setPayLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState('')

  // Profile state
  const [profile, setProfile] = useState({ name: '', birth_date: '', gender: '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    fetch('/api/v1/profile/me')
      .then(r => r.json())
      .then(d => setProfile({ name: d.name ?? '', birth_date: d.birth_date ?? '', gender: d.gender ?? '' }))
      .catch(() => {})
  }, [])

  const handlePayment = async () => {
    setError('')
    setPayLoading(true)
    try { await startPayment() }
    catch (err) { setError(err.message); setPayLoading(false) }
  }

  const handleCancel = async () => {
    if (!confirm('Отменить подписку?')) return
    setError('')
    setCancelLoading(true)
    try {
      const res = await fetch('/api/v1/subscriptions/me/cancel', { method: 'POST' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Ошибка отмены') }
      await refetchUser()
    } catch (err) { setError(err.message) }
    finally { setCancelLoading(false) }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileSaved(false)
    try {
      const res = await fetch('/api/v1/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name || null,
          birth_date: profile.birth_date || null,
          gender: profile.gender || null,
        }),
      })
      if (!res.ok) throw new Error('Ошибка сохранения')
      setProfileSaved(true)
    } catch (err) { setError(err.message) }
    finally { setProfileLoading(false) }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Личный кабинет</h1>

        {/* Subscription */}
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Подписка</h2>
          <p className={styles.email}>{user?.email}</p>
          <p className={user?.subscribed ? styles.statusActive : styles.statusInactive}>
            {user?.subscribed
              ? `Активна до ${new Date(user.subscribed_until).toLocaleDateString('ru-RU')}`
              : 'Не активна'}
          </p>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            {!user?.subscribed && (
              <Button onClick={handlePayment} disabled={payLoading}>
                {payLoading ? 'Переходим...' : 'Оформить за 9 ₽'}
              </Button>
            )}
            {user?.subscribed && (
              <Button variant="ghost" onClick={handleCancel} disabled={cancelLoading}>
                {cancelLoading ? 'Отменяем...' : 'Отменить подписку'}
              </Button>
            )}
            <Button variant="ghost" onClick={logout}>Выйти</Button>
          </div>
        </Card>

        {/* Products */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Продукты</h2>
          <div className={styles.productsGrid}>
            {PRODUCTS.map(p => (
              <Link key={p.id} href={`/${p.slug}`} className={styles.productCard}>
                <span className={styles.productIcon}>{p.icon}</span>
                <span className={styles.productName}>{p.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Profile */}
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Профиль</h2>
          <form onSubmit={handleProfileSave} className={styles.profileForm}>
            <Input
              label="Имя"
              id="name"
              type="text"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            />
            <Input
              label="Дата рождения"
              id="birth_date"
              type="date"
              value={profile.birth_date}
              onChange={e => setProfile(p => ({ ...p, birth_date: e.target.value }))}
            />
            <div>
              <label className={styles.label}>Пол</label>
              <select
                value={profile.gender}
                onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                className={styles.select}
              >
                <option value="">Не указан</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>
            <Button type="submit" variant="secondary" disabled={profileLoading}>
              {profileLoading ? 'Сохраняем...' : profileSaved ? 'Сохранено ✓' : 'Сохранить'}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  )
}

export default function LKClient() {
  return (
    <ProtectedRoute>
      <LKContent />
    </ProtectedRoute>
  )
}
```

**Step 2: Create lk.module.css**
```css
/* frontend/app/lk/lk.module.css */
.page { padding: 48px 24px; min-height: 100vh; background: var(--color-surface); }
.container { max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
.title { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: 8px; }
.section { display: flex; flex-direction: column; gap: 12px; }
.sectionTitle { font-size: var(--font-size-lg); font-weight: 600; }
.email { color: var(--color-text-secondary); }
.statusActive { color: var(--color-success); font-weight: 500; }
.statusInactive { color: var(--color-text-secondary); }
.error { color: var(--color-error); font-size: var(--font-size-sm); }
.actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 8px; }

.productsGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
@media (min-width: 500px) { .productsGrid { grid-template-columns: repeat(4, 1fr); } }
.productCard {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px; border: 1px solid var(--color-border);
  border-radius: var(--radius-md); background: var(--color-bg);
  color: var(--color-text-primary); transition: box-shadow 0.15s;
}
.productCard:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); text-decoration: none; }
.productIcon { font-size: 32px; }
.productName { font-size: var(--font-size-xs); font-weight: 500; text-align: center; }

.profileForm { display: flex; flex-direction: column; gap: 16px; }
.label { font-size: var(--font-size-sm); font-weight: 500; display: block; margin-bottom: 6px; }
.select {
  width: 100%; padding: 12px 16px;
  border: 1px solid var(--color-border); border-radius: var(--radius-sm);
  font-family: var(--font-sans); font-size: var(--font-size-base);
  background: var(--color-bg); color: var(--color-text-primary);
}
```

**Step 3: Commit**
```bash
git add frontend/app/lk/LKClient.jsx frontend/app/lk/lk.module.css
git commit -m "feat: rebuild LK with products grid, subscription management and profile editor"
```

---

## Phase 7 — Auth Pages Styling

### Task 19: Style Login & Register Pages

**Files:**
- Modify: `frontend/app/login/page.jsx`
- Modify: `frontend/app/register/page.jsx`
- Create: `frontend/app/auth.module.css`

**Step 1: Auth styles**
```css
/* frontend/app/auth.module.css */
.page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--color-surface); padding: 24px; }
.card { background: var(--color-bg); border-radius: var(--radius-xl); padding: 48px 40px; width: 100%; max-width: 420px; border: 1px solid var(--color-border); }
.title { font-size: var(--font-size-2xl); font-weight: 700; margin-bottom: 8px; }
.sub { color: var(--color-text-secondary); margin-bottom: 32px; }
.form { display: flex; flex-direction: column; gap: 16px; }
.error { color: var(--color-error); font-size: var(--font-size-sm); }
.footer { margin-top: 24px; text-align: center; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
```

**Step 2: Read current login/register pages** to understand their current structure, then wrap them with the new styles. Check what's in `frontend/app/login/page.jsx` and `frontend/app/register/page.jsx` first.

For login (`frontend/app/login/page.jsx`) — wrap the content with:
```jsx
import styles from '../auth.module.css'
// wrap the outer element with:
<div className={styles.page}><div className={styles.card}>...</div></div>
```

For register — same pattern.

**Step 3: Commit**
```bash
git add frontend/app/auth.module.css frontend/app/login/page.jsx frontend/app/register/page.jsx
git commit -m "style: polish login and register pages"
```

---

## Phase 8 — SEO & robots

### Task 20: SEO Metadata for NoIndex Pages

**Files:**
- Modify: `frontend/app/lk/page.jsx`
- Modify: `frontend/app/checkout/page.jsx`

**Step 1: Add metadata to LK page**
```jsx
// In frontend/app/lk/page.jsx, add:
export const metadata = {
  title: 'Личный кабинет',
  robots: { index: false },
}
```

**Step 2: Add metadata to checkout**
```jsx
// In frontend/app/checkout/page.jsx, add:
export const metadata = {
  title: 'Оформление подписки',
  robots: { index: false },
}
```

**Step 3: Commit**
```bash
git add frontend/app/lk/page.jsx frontend/app/checkout/page.jsx
git commit -m "seo: noindex lk and checkout pages"
```

---

## Phase 9 — Navigation

### Task 21: Top Navigation Bar

**Files:**
- Create: `frontend/app/components/Nav.jsx`
- Create: `frontend/app/components/Nav.module.css`
- Modify: `frontend/app/layout.jsx` (add Nav)

**Step 1: Nav component**
```jsx
// frontend/app/components/Nav.jsx
'use client'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import styles from './Nav.module.css'

export default function Nav() {
  const { user, loading } = useAuth()

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>✨ Эзотерика</Link>
        <div className={styles.links}>
          {!loading && (
            user
              ? <Link href="/lk" className={styles.link}>Кабинет</Link>
              : <>
                  <Link href="/login" className={styles.link}>Войти</Link>
                  <Link href="/register" className={styles.cta}>Попробовать</Link>
                </>
          )}
        </div>
      </div>
    </nav>
  )
}
```

```css
/* frontend/app/components/Nav.module.css */
.nav { background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; z-index: 100; }
.inner { max-width: var(--max-width); margin: 0 auto; padding: 0 24px; height: 56px; display: flex; align-items: center; justify-content: space-between; }
.logo { font-size: var(--font-size-lg); font-weight: 700; color: var(--color-text-primary); }
.logo:hover { text-decoration: none; }
.links { display: flex; align-items: center; gap: 16px; }
.link { color: var(--color-text-secondary); font-size: var(--font-size-sm); }
.link:hover { color: var(--color-text-primary); text-decoration: none; }
.cta { background: var(--color-accent); color: #fff; padding: 8px 16px; border-radius: var(--radius-sm); font-size: var(--font-size-sm); font-weight: 500; }
.cta:hover { background: var(--color-accent-hover); text-decoration: none; }
```

**Step 2: Add to layout** — open `frontend/app/layout.jsx`, add inside `<body>`:
```jsx
import Nav from './components/Nav'
// Inside body, before {children}:
<Nav />
```

**Step 3: Commit**
```bash
git add frontend/app/components/Nav.jsx frontend/app/components/Nav.module.css frontend/app/layout.jsx
git commit -m "feat: add sticky navigation bar"
```

---

## Done ✅

At the end of all tasks, the site has:
- Design tokens in `theme.css`, reusable UI components
- 4 working product pages (matrix, numerology, tarot, horoscope) each with free demo + paywall
- Landing page with hero, product cards, how-it-works, reviews
- Personal cabinet with subscription management, product grid, profile editor
- Backend `user_profiles` table with GET/PATCH API
- Sticky nav, styled auth pages, SEO noindex on private pages

**Deployment checklist after implementation:**
1. Run `alembic upgrade head` in backend
2. `npm run build` in frontend — verify no type errors
3. Check all 4 product pages work without login (free result shows, paywall appears)
4. Check LK loads products and profile fields after login
5. Check subscription status display is correct
