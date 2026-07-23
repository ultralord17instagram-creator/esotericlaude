# План реализации: Личный кабинет (персональный дашборд дня)

> **For Claude:** REQUIRED SUB-SKILL: используй superpowers:executing-plans для выполнения этого плана задача за задачей.

**Goal:** Превратить страницу `/lk` из «страницы аккаунта» в персональный дашборд дня: четыре бесплатных «знака дня» с прогрессом «открыто X из 4», единый профиль как источник правды по дате рождения, секция аккаунта с выходом. Нового бэкенда нет.

**Architecture:** Дашборд собирается на клиенте из уже существующих детерминированных генераторов контента (`content/tarot`, `content/numerology`, `content/horoscope`). Факт «открыто за сегодня» живёт в localStorage с авто-сбросом по суткам МСК (по образцу `content/tarot/guestLimits.js`). Профиль читается и пишется через существующий `GET/PATCH /api/v1/profile/me`; после сохранения даты в ЛК синхронизируются локальные кэши гороскопа и нумерологии, чтобы продукты сразу считали по новой дате. Выход использует существующие `/auth/logout` и `/auth/logout-all`.

**Tech Stack:** Next.js 14 (App Router, JSX, `'use client'`), React 18, CSS-модули, `node:test` для чистой логики (как `content/numerology/index.test.mjs`). Никаких новых зависимостей и таблиц БД.

**Дизайн-источник:** [docs/plans/2026-07-11-lk-design.md](docs/plans/2026-07-11-lk-design.md)

---

## Соглашения и подводные камни (прочитать до старта)

1. **Раннер тестов.** Чистая логика тестируется через `node:test`, тем же способом, что уже работает для [frontend/app/content/numerology/index.test.mjs](frontend/app/content/numerology/index.test.mjs). Команда из корня репозитория:
   `node --test frontend/app/lk/dayProgress.test.mjs`
   Тест-файлы `.mjs` импортируют модули `.js` напрямую. Node запускается там, где доступен (локально либо через node-образ проекта, как гоняются тесты «Нумерологии» и «Гороскопа»).
2. **localStorage в тестах не мокаем через DOM.** Модуль `dayProgress.js` принимает хранилище параметром (по умолчанию `localStorage`), поэтому его логика (отметка, авто-сброс суток, счётчик) тестируется чистым фейковым стором без браузера. Сетевые хелперы (`fetch` профиля) юнит-раннером не покрываются, как `loadProfile` в «Нумерологии»: их проверяет сборка и ручная приёмка.
3. **React-компоненты юнит-раннера не имеют** (в проекте нет jest/vitest, `package.json` содержит только `next`-скрипты). UI-задачи проверяются **одной** финальной сборкой `next build` (компиляция) и визуальной приёмкой владельцем. Не добавляй тест-фреймворк (YAGNI) и не вставляй `next build` после каждой задачи.
4. **Сборка только в Docker и один раз в конце.** `next build` на хосте с `NODE_ENV=development` ломается; скриншот-инструмента нет. Финальная проверка сборки, не по задаче.
5. **Никакого «—» (длинного тире) в русских текстах, видимых пользователю** (плейсхолдеры дразнилок, подписи, приветствие): пользователь читает его как AI-tell. Запятые, двоеточия, скобки, дефис, точка. Символ «·» допустим как разделитель.
6. **Идентификаторы блоков едины во всём коде:** `'card' | 'number' | 'mood' | 'lunar'`. Их используют и `dayProgress.js`, и `dayBlocks.js`, и вызовы `markOpened(...)` из продуктов. Латиницей, не кириллицей.
7. **Кросс-импорты клиент-модулей допустимы.** `dayProgress.js` импортирует `moscowDayKey` из `content/tarot`; продукты импортируют `markOpened` из `app/lk/dayProgress`. Это общие клиентские модули, а не связывание продуктов между собой.
8. **Блок «Подписка» не трогаем по сути** (дизайн §3, §10.4). При пересборке `LKClient` его разметку и логику (статус, оплатить, отменить) переносим как есть. Единственное изменение: отдельная кнопка «Выйти» уезжает из него в новую секцию «Аккаунт».
9. **Порядок работ:** сначала тестируемое клиентское ядро (`dayProgress`, `dayBlocks`), затем UI дашборда, затем правки нумерологии под профиль, затем пересборка `LKClient`, в конце интеграция `markOpened` в продукты и финальная сборка. Промежуточно `/lk` может выглядеть неполным, финальное состояние собирается.

---

## Фаза A. Клиентское ядро дашборда (чистые функции, TDD)

### Задача A1. Трекинг «открыто» `dayProgress.js`

**Files:**
- Create: `frontend/app/lk/dayProgress.js`
- Test: `frontend/app/lk/dayProgress.test.mjs`

**Step 1: Пишем падающий тест**

Создай `dayProgress.test.mjs` (хранилище инъектируется фейком, DOM не нужен):

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { markOpened, getOpened, openedCount, resolveOpened, BLOCK_IDS } from './dayProgress.js'

function fakeStore() {
  const m = {}
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v } }
}
const DAY1 = new Date('2026-07-11T12:00:00Z') // 15:00 МСК, день 20260711
const DAY2 = new Date('2026-07-12T12:00:00Z') // следующий день

test('BLOCK_IDS: четыре блока дашборда', () => {
  assert.deepEqual(BLOCK_IDS, ['card', 'number', 'mood', 'lunar'])
})

test('resolveOpened: другой день сбрасывает прогресс', () => {
  assert.deepEqual(resolveOpened({ day: '20260711', opened: { card: true } }, '20260712'), {})
  assert.deepEqual(resolveOpened({ day: '20260711', opened: { card: true } }, '20260711'), { card: true })
  assert.deepEqual(resolveOpened(null, '20260711'), {})
})

test('markOpened/getOpened: отмечает блоки за сегодня', () => {
  const s = fakeStore()
  markOpened('card', DAY1, s)
  markOpened('mood', DAY1, s)
  assert.deepEqual(getOpened(DAY1, s), { card: true, mood: true })
  assert.equal(openedCount(DAY1, s), 2)
})

test('markOpened: смена суток обнуляет счётчик', () => {
  const s = fakeStore()
  markOpened('card', DAY1, s)
  assert.equal(openedCount(DAY1, s), 1)
  assert.equal(openedCount(DAY2, s), 0) // новый день, авто-сброс
})

test('markOpened: игнорирует неизвестный id', () => {
  const s = fakeStore()
  markOpened('bogus', DAY1, s)
  assert.equal(openedCount(DAY1, s), 0)
})
```

**Step 2: Запуск, ожидаем FAIL**

Run: `node --test frontend/app/lk/dayProgress.test.mjs`
Expected: FAIL, `Cannot find module './dayProgress.js'`.

**Step 3: Реализация**

Создай `dayProgress.js` (по образцу `content/tarot/guestLimits.js`, но с инъекцией стора для тестируемости):

```js
// Факт «открыл блок дня» за сегодня. localStorage, сброс по суткам МСК.
// Осознанно на устройстве: контент дня детерминирован, теряется только галочка
// (дизайн §5.4). Кросс-девайс синхронизация вне скоупа.
import { moscowDayKey } from '../content/tarot'

export const BLOCK_IDS = ['card', 'number', 'mood', 'lunar']
const KEY = 'lk.day_opened'

// Реальное хранилище браузера или null (SSR / приватный режим).
function browserStore() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null } catch { return null }
}

function readRaw(store) {
  try { return JSON.parse(store.getItem(KEY) || 'null') } catch { return null }
}
function writeRaw(store, value) {
  try { store.setItem(KEY, JSON.stringify(value)) } catch {}
}

// Чистая: по сырому состоянию и ключу сегодняшнего дня вернуть карту открытых.
// Разошёлся день -> пустая карта (авто-сброс).
export function resolveOpened(raw, day) {
  if (!raw || raw.day !== day) return {}
  return raw.opened || {}
}

// Карта открытых блоков за сегодня. { card?: true, ... }.
export function getOpened(now = new Date(), store = browserStore()) {
  if (!store) return {}
  return resolveOpened(readRaw(store), String(moscowDayKey(now)))
}

// Отметить блок открытым за сегодня. Неизвестный id игнорируется.
export function markOpened(blockId, now = new Date(), store = browserStore()) {
  if (!store || !BLOCK_IDS.includes(blockId)) return
  const day = String(moscowDayKey(now))
  const opened = { ...resolveOpened(readRaw(store), day), [blockId]: true }
  writeRaw(store, { day, opened })
}

// Сколько из четырёх блоков открыто сегодня.
export function openedCount(now = new Date(), store = browserStore()) {
  const opened = getOpened(now, store)
  return BLOCK_IDS.filter(id => opened[id]).length
}
```

**Step 4: Запуск, ожидаем PASS**

Run: `node --test frontend/app/lk/dayProgress.test.mjs`
Expected: PASS (5 тестов).

**Step 5: Коммит**

```bash
git add frontend/app/lk/dayProgress.js frontend/app/lk/dayProgress.test.mjs
git commit -m "feat(lk): dayProgress — трекинг открытых блоков дня (localStorage, сброс по суткам)"
```

---

### Задача A2. Сборка блоков дашборда `dayBlocks.js`

**Files:**
- Create: `frontend/app/lk/dayBlocks.js`
- Test: `frontend/app/lk/dayBlocks.test.mjs`

> Собирает данные четырёх блоков из уже существующих генераторов (дизайн §5.1). Чистая функция от `{ birth, today }`, тестируется в node напрямую (все генераторы контента уже импортируются в node-тестах «Нумерологии» и «Гороскопа»).

**Step 1: Пишем падающий тест**

Создай `dayBlocks.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDayBlocks, DAY_BLOCKS } from './dayBlocks.js'

const TODAY = new Date('2026-07-11T12:00:00Z')

test('DAY_BLOCKS: четыре блока в фиксированном порядке', () => {
  assert.deepEqual(DAY_BLOCKS.map(b => b.id), ['card', 'number', 'mood', 'lunar'])
})

test('buildDayBlocks: с датой рождения все четыре доступны и несут контент', () => {
  const blocks = buildDayBlocks({ birth: '1990-11-29', today: TODAY })
  assert.equal(blocks.length, 4)
  assert.ok(blocks.every(b => b.available))
  const byId = Object.fromEntries(blocks.map(b => [b.id, b]))
  assert.equal(typeof byId.card.content.name, 'string')
  assert.equal(typeof byId.card.content.message, 'string')
  assert.ok(Number.isInteger(byId.number.content.number))
  assert.equal(typeof byId.number.content.text, 'string')
  assert.equal(typeof byId.mood.content.sign, 'string')
  assert.equal(typeof byId.mood.content.text, 'string')
  assert.ok(byId.lunar.content.lunarDay >= 1 && byId.lunar.content.lunarDay <= 30)
})

test('buildDayBlocks: без даты карта и луна доступны, число и настрой нет', () => {
  const byId = Object.fromEntries(buildDayBlocks({ birth: null, today: TODAY }).map(b => [b.id, b]))
  assert.equal(byId.card.available, true)
  assert.equal(byId.lunar.available, true)
  assert.equal(byId.number.available, false)
  assert.equal(byId.number.content, null)
  assert.equal(byId.mood.available, false)
  assert.equal(byId.mood.content, null)
})

test('buildDayBlocks: детерминирован по дате', () => {
  const a = buildDayBlocks({ birth: '1990-11-29', today: TODAY })
  const b = buildDayBlocks({ birth: '1990-11-29', today: TODAY })
  assert.deepEqual(a.find(x => x.id === 'card').content, b.find(x => x.id === 'card').content)
})
```

**Step 2: Запуск, ожидаем FAIL**

Run: `node --test frontend/app/lk/dayBlocks.test.mjs`
Expected: FAIL, `Cannot find module './dayBlocks.js'`.

**Step 3: Реализация**

Создай `dayBlocks.js` (источники строго из дизайна §5.1):

```js
// Сборка данных дашборда дня из существующих генераторов контента (дизайн §5.1).
// Всё детерминировано по дате. Блоки, которым нужна дата рождения, без неё
// возвращают available:false и content:null (онбординг, дизайн §5.6).
import { getDayCard, getText } from '../content/tarot'
import { buildForecast } from '../content/numerology'
import { sign as getSign } from '../content/horoscope/astro'
import { getToday, getLunar } from '../content/horoscope'

// Метаданные блоков: порядок, требуется ли дата, продукт и куда ведёт «открыть полностью».
export const DAY_BLOCKS = [
  { id: 'card',   title: 'Карта дня',   needsBirth: false, product: 'Таро',        href: '/tarot/day' },
  { id: 'number', title: 'Число дня',   needsBirth: true,  product: 'Нумерология', href: '/numerology/forecast' },
  { id: 'mood',   title: 'Настрой дня', needsBirth: true,  product: 'Гороскоп',    href: '/horoscope' },
  { id: 'lunar',  title: 'Лунный день', needsBirth: false, product: 'Гороскоп',    href: '/horoscope' },
]

// Контент одного блока. birth: 'YYYY-MM-DD' (для number/mood), today: Date.
function blockContent(id, birth, today) {
  if (id === 'card') {
    const card = getDayCard(today)
    return {
      name: card.ru,
      message: getText({ scenario: 'day', number: card.number }),
      advice: getText({ scenario: 'advice', number: card.number }),
    }
  }
  if (id === 'lunar') {
    const l = getLunar(today)
    return { lunarDay: l.lunarDay, phase: l.phase, meaning: l.todayMeaning }
  }
  if (id === 'number') {
    const f = buildForecast({ date: birth, horizon: 'day', today })
    return { number: f.number, text: f.text }
  }
  if (id === 'mood') {
    const s = getSign(birth)
    const mood = getToday(s.id, today).blocks.find(b => b.id === 'mood')
    const text = typeof mood?.text === 'string' ? mood.text : mood?.text?.teaser
    return { sign: s.name, text }
  }
  return null
}

// Массив блоков с их доступностью и контентом.
export function buildDayBlocks({ birth, today = new Date() }) {
  return DAY_BLOCKS.map(b => {
    const available = !b.needsBirth || !!birth
    return { ...b, available, content: available ? blockContent(b.id, birth, today) : null }
  })
}
```

**Step 4: Запуск, ожидаем PASS**

Run: `node --test frontend/app/lk/dayBlocks.test.mjs`
Expected: PASS (4 теста).

**Step 5: Коммит**

```bash
git add frontend/app/lk/dayBlocks.js frontend/app/lk/dayBlocks.test.mjs
git commit -m "feat(lk): dayBlocks — сборка четырёх блоков дня из генераторов контента"
```

---

## Фаза B. UI дашборда (build-verified)

> Юнит-раннера для компонентов нет: каждая задача создаёт файл(ы) с полным кодом и коммитит. Ошибки компиляции ловит финальная сборка (Задача F2). Стили структурные, финальный визуал дорабатывает владелец. Правило «без —» действует и для видимого текста.

### Задача B1. Стили дашборда в `lk.module.css`

**Files:**
- Modify: `frontend/app/lk/lk.module.css` (дописать в конец файла)

**Step 1: Дописать в конец `lk.module.css`**

```css
/* ── Дашборд дня ─────────────────────────────────────────────────────────── */
.dashHeader { display: flex; flex-direction: column; gap: 2px; }
.dashGreeting { font-size: var(--font-size-lg); font-weight: 600; }
.dashDate { color: var(--color-text-secondary); font-size: var(--font-size-sm); text-transform: capitalize; }

.progressWrap { display: flex; flex-direction: column; gap: 6px; }
.progressLabel { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
.progressBar { height: 8px; border-radius: 999px; background: var(--color-border); overflow: hidden; }
.progressFill { height: 100%; border-radius: 999px; background: var(--accent); transition: width 0.3s var(--ease-out); }
.progressDone { font-size: var(--font-size-sm); color: var(--accent); }

.dashGrid { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 500px) { .dashGrid { grid-template-columns: repeat(2, 1fr); } }

.dashCard {
  display: flex; flex-direction: column; gap: 10px;
  padding: 16px; border: 1px dashed var(--color-border);
  border-radius: var(--radius-md); background: var(--color-bg);
}
.dashCardOpen { border-style: solid; border-color: var(--border-accent); background: var(--bg-raised); }
.dashCardLocked { opacity: 0.85; }
.dashCardHead { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.dashCardTitle { font-weight: 600; }
.dashStatusOpen { font-size: var(--font-size-xs); color: var(--accent); white-space: nowrap; }
.dashStatusClosed { font-size: var(--font-size-xs); color: var(--color-text-muted); white-space: nowrap; }
.dashCardText { color: var(--color-text-secondary); font-size: var(--font-size-sm); line-height: 1.6; }
.dashCardBody { display: flex; flex-direction: column; gap: 8px; }
.dashCardValue { font-weight: 600; }
.dashProductLink { color: var(--accent); font-size: var(--font-size-sm); font-weight: 500; }
.dashProfileLink { color: var(--accent); font-size: var(--font-size-sm); font-weight: 500; align-self: flex-start; }
```

**Step 2: Коммит**

```bash
git add frontend/app/lk/lk.module.css
git commit -m "feat(lk): стили дашборда дня (карточки, прогресс, статусы)"
```

---

### Задача B2. Карточка блока `DayBlockCard.jsx`

**Files:**
- Create: `frontend/app/lk/components/DayBlockCard.jsx`

> Три состояния (дизайн §5.2, §5.6): недоступен без даты рождения (онбординг) / доступен но не открыт (дразнилка + кнопка) / открыт (инлайн-контент + ссылка в продукт). Тексты дразнилок это рабочие плейсхолдеры, тон дорабатывает владелец (дизайн §14).

**Step 1: Создать файл**

```jsx
'use client'
import Link from 'next/link'
import Button from '../../components/ui/Button'
import styles from '../lk.module.css'

// Рабочие плейсхолдеры дразнилок «ещё не открыто» (дизайн §14). Без «—».
const TEASERS = {
  card:   'Старший аркан дня уже выбран. Открой послание.',
  number: 'Твоё число дня рассчитано. Посмотри настрой на сегодня.',
  mood:   'Небо настроило твой день. Загляни, каким будет настрой.',
  lunar:  'Луна сегодня в своей фазе. Узнай, чем хорош лунный день.',
}

// Инлайн-контент открытого блока по его id.
function BlockContent({ block }) {
  const c = block.content
  if (block.id === 'card') {
    return (
      <>
        <p className={styles.dashCardValue}>{c.name}</p>
        <p className={styles.dashCardText}>{c.message}</p>
        <p className={styles.dashCardText}>{c.advice}</p>
      </>
    )
  }
  if (block.id === 'number') {
    return (
      <>
        <p className={styles.dashCardValue}>Число дня: {c.number}</p>
        <p className={styles.dashCardText}>{c.text}</p>
      </>
    )
  }
  if (block.id === 'mood') {
    return (
      <>
        <p className={styles.dashCardValue}>{c.sign}</p>
        <p className={styles.dashCardText}>{c.text}</p>
      </>
    )
  }
  if (block.id === 'lunar') {
    return (
      <>
        <p className={styles.dashCardValue}>{c.phase.emoji} Лунный день {c.lunarDay} · {c.phase.name}</p>
        <p className={styles.dashCardText}>{c.meaning}</p>
      </>
    )
  }
  return null
}

// block: { id, title, product, href, available, content }.
// opened: показан ли контент за сегодня. onOpen(id): раскрыть и отметить.
export default function DayBlockCard({ block, opened, onOpen }) {
  // Профиль без даты рождения: мягкий онбординг вместо контента (дизайн §5.6).
  if (!block.available) {
    return (
      <div className={`${styles.dashCard} ${styles.dashCardLocked}`}>
        <div className={styles.dashCardHead}>
          <span className={styles.dashCardTitle}>{block.title}</span>
        </div>
        <p className={styles.dashCardText}>Укажи дату рождения, чтобы открыть.</p>
        <a href="#profile" className={styles.dashProfileLink}>Заполнить профиль</a>
      </div>
    )
  }

  return (
    <div className={`${styles.dashCard} ${opened ? styles.dashCardOpen : ''}`}>
      <div className={styles.dashCardHead}>
        <span className={styles.dashCardTitle}>{block.title}</span>
        <span className={opened ? styles.dashStatusOpen : styles.dashStatusClosed}>
          {opened ? '✓ открыто' : 'ещё нет'}
        </span>
      </div>

      {opened ? (
        <>
          <div className={styles.dashCardBody}><BlockContent block={block} /></div>
          <Link href={block.href} className={styles.dashProductLink}>
            Открыть полностью в «{block.product}»
          </Link>
        </>
      ) : (
        <>
          <p className={styles.dashCardText}>{TEASERS[block.id]}</p>
          <Button variant="secondary" onClick={() => onOpen(block.id)}>Открыть</Button>
        </>
      )}
    </div>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/lk/components/DayBlockCard.jsx
git commit -m "feat(lk): DayBlockCard — карточка блока дня (онбординг / дразнилка / инлайн-контент)"
```

---

### Задача B3. Дашборд `DayDashboard.jsx`

**Files:**
- Create: `frontend/app/lk/components/DayDashboard.jsx`

> Шапка с приветствием и датой, прогресс «открыто X из 4», сетка из четырёх `DayBlockCard`. Отметка «открыто» читается из `dayProgress` на маунте и обновляется по клику «Открыть».

**Step 1: Создать файл**

```jsx
'use client'
import { useState, useEffect } from 'react'
import { buildDayBlocks } from '../dayBlocks'
import { getOpened, markOpened } from '../dayProgress'
import DayBlockCard from './DayBlockCard'
import styles from '../lk.module.css'

// birth: 'YYYY-MM-DD' | null (из профиля). name: имя для приветствия | ''.
export default function DayDashboard({ birth, name }) {
  const today = new Date()
  const blocks = buildDayBlocks({ birth, today })
  const [opened, setOpened] = useState({})

  // Читаем localStorage только на клиенте (после гидрации), чтобы SSR совпал.
  useEffect(() => { setOpened(getOpened()) }, [])

  const open = (id) => { markOpened(id); setOpened(getOpened()) }

  const total = blocks.length
  const count = blocks.filter(b => opened[b.id]).length
  const greeting = name ? `Твой день, ${name}` : 'Твой день'
  const dateLabel = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })

  return (
    <section className={styles.section}>
      <div className={styles.dashHeader}>
        <h2 className={styles.dashGreeting}>{greeting}</h2>
        <p className={styles.dashDate}>{dateLabel}</p>
      </div>

      <div className={styles.progressWrap}>
        <span className={styles.progressLabel}>Открыто {count} из {total}</span>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(count / total) * 100}%` }} />
        </div>
        {count === total && <p className={styles.progressDone}>Ты собрал весь свой день. До завтра.</p>}
      </div>

      <div className={styles.dashGrid}>
        {blocks.map(b => (
          <DayBlockCard key={b.id} block={b} opened={!!opened[b.id]} onOpen={open} />
        ))}
      </div>
    </section>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/lk/components/DayDashboard.jsx
git commit -m "feat(lk): DayDashboard — шапка, прогресс дня и сетка четырёх блоков"
```

---

## Фаза C. Единый профиль в нумерологии (источник правды)

> Гороскоп уже читает профиль для залогиненного (`HoroscopeClient` тянет `fetchBirthFromProfile()`, затем localStorage). Приводим нумерологию к той же логике (дизайн §6.2, §6.3): для залогиненного профиль главнее `loadProfile()`.

### Задача C1. Хелпер чтения профиля в `content/numerology/index.js`

**Files:**
- Modify: `frontend/app/content/numerology/index.js`
- Test: `frontend/app/content/numerology/index.test.mjs`

**Step 1: Дописать падающий тест**

Добавь в `index.test.mjs` (тестируем только чистую нормализацию; `fetch`-хелпер сборка/ручная проверка):

```js
import { normalizeBirth } from './index.js'

test('normalizeBirth: валидная ISO-дата или null', () => {
  assert.equal(normalizeBirth('1990-11-29'), '1990-11-29')
  assert.equal(normalizeBirth(''), null)
  assert.equal(normalizeBirth('не дата'), null)
  assert.equal(normalizeBirth(null), null)
})
```

> Файл теста уже импортирует `test` и `assert` в шапке; повторно их не добавляй, только новый `import { normalizeBirth }` и сам `test(...)`.

**Step 2: Запуск, ожидаем FAIL**

Run: `node --test frontend/app/content/numerology/index.test.mjs`
Expected: FAIL, `normalizeBirth is not a function`.

**Step 3: Реализация**

Добавь в конец `content/numerology/index.js` (рядом с `loadProfile/saveProfile`):

```js
// Валидная ISO-дата 'YYYY-MM-DD' или null (дизайн §6).
export function normalizeBirth(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : null
}

// Профиль залогиненного как источник правды. { date, name } или null.
// Тот же существующий эндпоинт, что у гороскопа и LKClient (дизайн §3, §6.2).
export async function fetchProfileNumerology() {
  try {
    const res = await fetch('/api/v1/profile/me')
    if (!res.ok) return null
    const data = await res.json()
    const date = normalizeBirth(data?.birth_date)
    const name = typeof data?.name === 'string' ? data.name : ''
    if (!date && !name) return null
    return { date, name }
  } catch { return null }
}
```

**Step 4: Запуск, ожидаем PASS**

Run: `node --test frontend/app/content/numerology/index.test.mjs`
Expected: PASS (существующие тесты + новый `normalizeBirth`).

**Step 5: Коммит**

```bash
git add frontend/app/content/numerology/index.js frontend/app/content/numerology/index.test.mjs
git commit -m "feat(numerology): fetchProfileNumerology + normalizeBirth (профиль как источник даты)"
```

---

### Задача C2. `ForecastClient` предпочитает профиль

**Files:**
- Modify: `frontend/app/numerology/forecast/ForecastClient.jsx`

**Step 1: Обновить импорт**

Замени строку импорта из контента:

```jsx
import { buildForecast, loadProfile, saveProfile } from '../../content/numerology'
```

на:

```jsx
import { buildForecast, loadProfile, saveProfile, fetchProfileNumerology } from '../../content/numerology'
```

**Step 2: Заменить эффект памяти профиля**

Замени текущий эффект:

```jsx
  // Память профиля: дата уже вводилась -> сразу к выбору горизонта.
  useEffect(() => {
    const d = loadProfile()?.date
    if (d) { setDate(d); setStep('select') }
  }, [])
```

на (для залогиненного профиль главнее localStorage, дизайн §6.2):

```jsx
  // Память даты: залогинен -> профиль, иначе localStorage (дизайн §6.2).
  useEffect(() => {
    let alive = true
    ;(async () => {
      const fromProfile = user ? await fetchProfileNumerology() : null
      const d = fromProfile?.date ?? loadProfile()?.date
      if (alive && d) { setDate(d); setStep('select') }
    })()
    return () => { alive = false }
  }, [user])
```

> `user` уже есть в компоненте (`const { user } = useAuth()`). Локальный кэш `saveProfile` при вводе даты не трогаем: он остаётся запасным для гостя и не мешает профилю.

**Step 3: Коммит**

```bash
git add frontend/app/numerology/forecast/ForecastClient.jsx
git commit -m "feat(numerology): прогноз берёт дату из профиля для залогиненного"
```

---

### Задача C3. `BreakdownClient` предпочитает профиль

**Files:**
- Modify: `frontend/app/numerology/breakdown/BreakdownClient.jsx`

**Step 1: Обновить импорт**

Замени:

```jsx
import { buildBreakdown, loadProfile, saveProfile } from '../../content/numerology'
```

на:

```jsx
import { buildBreakdown, loadProfile, saveProfile, fetchProfileNumerology } from '../../content/numerology'
```

**Step 2: Заменить эффект памяти профиля**

Замени текущий эффект:

```jsx
  // Память профиля: дата+имя уже вводились -> сразу к выбору направления.
  useEffect(() => {
    const p = loadProfile()
    if (p?.date && p?.name) {
      setForm({ date: p.date, name: p.name })
      setData(buildBreakdown({ date: p.date, name: p.name }))
      setStep('directions')
    }
  }, [])
```

на (профиль главнее для залогиненного; имя из профиля может быть пустым, тогда падаем на localStorage):

```jsx
  // Память данных: залогинен -> профиль (дата+имя), иначе localStorage (дизайн §6.2).
  useEffect(() => {
    let alive = true
    ;(async () => {
      const fromProfile = user ? await fetchProfileNumerology() : null
      const p = (fromProfile?.date && fromProfile?.name) ? fromProfile : loadProfile()
      if (alive && p?.date && p?.name) {
        setForm({ date: p.date, name: p.name })
        setData(buildBreakdown({ date: p.date, name: p.name }))
        setStep('directions')
      }
    })()
    return () => { alive = false }
  }, [user])
```

> `user` уже есть (`const { user } = useAuth()`). Разбор требует и дату, и имя; если в профиле есть только дата, остаёмся на шаге ввода (пользователь введёт имя один раз).

**Step 3: Коммит**

```bash
git add frontend/app/numerology/breakdown/BreakdownClient.jsx
git commit -m "feat(numerology): разбор берёт дату и имя из профиля для залогиненного"
```

---

## Фаза D. Пересборка `LKClient` и выход со всех устройств

### Задача D1. `logoutAll` в `AuthContext`

**Files:**
- Modify: `frontend/app/context/AuthContext.jsx`

> «Выйти со всех устройств» (дизайн §8): существующий эндпоинт `POST /api/v1/auth/logout-all`, затем та же локальная очистка, что в `logout()`.

**Step 1: Добавить обработчик рядом с `logout`**

После функции `logout` (перед `return (`) добавь:

```jsx
  const logoutAll = async () => {
    try {
      await fetch('/api/v1/auth/logout-all', { method: 'POST' })
    } catch {}
    _clearUserInfo()
    setUser(null)
  }
```

**Step 2: Прокинуть в value провайдера**

В объекте value добавь `logoutAll`:

```jsx
    <AuthContext.Provider value={{ user, loading, register, login, logout, logoutAll, refetchUser: fetchMe }}>
```

**Step 3: Коммит**

```bash
git add frontend/app/context/AuthContext.jsx
git commit -m "feat(auth): logoutAll — выход со всех устройств через /auth/logout-all"
```

---

### Задача D2. Новый макет `LKClient`

**Files:**
- Modify: `frontend/app/lk/LKClient.jsx`

> Новый порядок секций (дизайн §4): дашборд, продукты, профиль, подписка (как есть), аккаунт. Блок подписки переносим без изменений по сути; отдельную кнопку «Выйти» из него убираем в секцию «Аккаунт» (§8, §10.4). В сохранении профиля добавляем синхронизацию локальных кэшей продуктов (§6.3).

**Step 1: Заменить весь файл**

```jsx
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
import DayDashboard from './components/DayDashboard'
import { saveBirthLocal } from '../content/horoscope'
import { saveProfile } from '../content/numerology'
import styles from './lk.module.css'

function LKContent() {
  const { user, logout, logoutAll, refetchUser } = useAuth()
  const { startPayment } = usePayment()
  const [payLoading, setPayLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [logoutAllLoading, setLogoutAllLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleLogoutAll = async () => {
    if (!confirm('Выйти со всех устройств?')) return
    setLogoutAllLoading(true)
    try { await logoutAll() }
    finally { setLogoutAllLoading(false) }
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
      // Единый источник правды: синхронизируем кэши продуктов от профиля (дизайн §6.3),
      // чтобы гороскоп и нумерология сразу считали по новой дате.
      if (profile.birth_date) {
        saveBirthLocal(profile.birth_date)
        saveProfile({ date: profile.birth_date, name: profile.name })
      }
      setProfileSaved(true)
    } catch (err) { setError(err.message) }
    finally { setProfileLoading(false) }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Личный кабинет</h1>

        {/* Дашборд дня */}
        <DayDashboard birth={profile.birth_date || null} name={profile.name} />

        {/* Продукты */}
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

        {/* Профиль */}
        <Card className={styles.section}>
          <h2 id="profile" className={styles.sectionTitle}>Профиль</h2>
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

        {/* Подписка (существующий блок, по сути не меняем) */}
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Подписка</h2>
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
          </div>
        </Card>

        {/* Аккаунт */}
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Аккаунт</h2>
          <p className={styles.email}>{user?.email}</p>
          <div className={styles.actions}>
            <Button variant="ghost" onClick={logout}>Выйти</Button>
            <Button variant="ghost" onClick={handleLogoutAll} disabled={logoutAllLoading}>
              {logoutAllLoading ? 'Выходим...' : 'Выйти со всех устройств'}
            </Button>
          </div>
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

> Что изменилось относительно текущего файла: добавлен дашборд сверху; email и обе кнопки выхода переехали в новую секцию «Аккаунт»; из блока «Подписка» убрана кнопка «Выйти» (сама логика подписки не тронута); в `handleProfileSave` добавлена синхронизация кэшей; у заголовка профиля появился `id="profile"` для якоря онбординга из дашборда.

**Step 2: Коммит**

```bash
git add frontend/app/lk/LKClient.jsx
git commit -m "feat(lk): новый макет ЛК (дашборд, профиль с синхронизацией кэшей, секция аккаунта)"
```

---

## Фаза E. Отметка «открыто» из продуктов

> Чтобы «открыл блок в самом продукте» отражалось в дашборде (дизайн §5.5). Вызовы `markOpened(...)` в `useEffect` при фактическом показе free-контента дня, не при слепом заходе на страницу.

### Задача E1. Таро: карта дня

**Files:**
- Modify: `frontend/app/tarot/day/DayClient.jsx`

**Step 1: Добавить импорты**

К импортам добавь `useEffect` и `markOpened`:

```jsx
import { useState, useEffect } from 'react'
```

и после существующих импортов (например под строкой импорта `getDayCard, getText`):

```jsx
import { markOpened } from '../../lk/dayProgress'
```

**Step 2: Отметить при раскрытии карты**

Внутри компонента `DayClient`, сразу после `const reveal = () => setCard(getDayCard())`, добавь эффект:

```jsx
  // Раскрыл карту дня -> отметить блок «карта» открытым в дашборде (дизайн §5.5).
  useEffect(() => { if (card) markOpened('card') }, [card])
```

**Step 3: Коммит**

```bash
git add frontend/app/tarot/day/DayClient.jsx
git commit -m "feat(tarot): отметка markOpened('card') при раскрытии карты дня"
```

---

### Задача E2. Гороскоп: настрой дня и лунный день

**Files:**
- Modify: `frontend/app/horoscope/TodayView.jsx`
- Modify: `frontend/app/horoscope/LunarView.jsx`

**Step 1: `TodayView.jsx`**

Добавь `useEffect` к импорту React:

```jsx
import { useState, useEffect } from 'react'
```

и импорт трекера после локальных импортов (например под `import { Sparkle, Lock } from './components/icons'`):

```jsx
import { markOpened } from '../lk/dayProgress'
```

Внутри `TodayView`, после `const categories = data.blocks.filter(b => !b.free)`, добавь:

```jsx
  // Показан бесплатный блок «настрой дня» -> отметить в дашборде (дизайн §5.5).
  useEffect(() => { markOpened('mood') }, [])
```

**Step 2: `LunarView.jsx`**

Добавь импорты в шапку файла:

```jsx
import { useEffect } from 'react'
import { markOpened } from '../lk/dayProgress'
```

Внутри `LunarView`, после `const data = getLunar(today)`, добавь:

```jsx
  // Показан лунный день -> отметить в дашборде (дизайн §5.5).
  useEffect(() => { markOpened('lunar') }, [])
```

**Step 3: Коммит**

```bash
git add frontend/app/horoscope/TodayView.jsx frontend/app/horoscope/LunarView.jsx
git commit -m "feat(horoscope): отметка markOpened('mood'/'lunar') при показе free-контента дня"
```

---

### Задача E3. Нумерология: число дня

**Files:**
- Modify: `frontend/app/numerology/forecast/ForecastClient.jsx`

**Step 1: Добавить импорт трекера**

После импорта из контента добавь:

```jsx
import { markOpened } from '../../lk/dayProgress'
```

**Step 2: Отметить при показе прогноза на день**

Внутри `ForecastClient`, рядом с эффектом памяти профиля (Задача C2), добавь отдельный эффект. Дневной free-текст показывается, когда пройден шаг ввода и выбран горизонт «день»:

```jsx
  // Показан бесплатный прогноз на день -> отметить блок «число» (дизайн §5.5).
  useEffect(() => {
    if (step !== 'input' && horizon === 'day') markOpened('number')
  }, [step, horizon])
```

**Step 3: Коммит**

```bash
git add frontend/app/numerology/forecast/ForecastClient.jsx
git commit -m "feat(numerology): отметка markOpened('number') при показе прогноза на день"
```

---

## Фаза F. Финальная проверка

### Задача F1. Прогон всех юнит-тестов

**Step 1: Запуск наборов дашборда и затронутого контента**

Run:
```bash
node --test frontend/app/lk/dayProgress.test.mjs frontend/app/lk/dayBlocks.test.mjs frontend/app/content/numerology/index.test.mjs
```
Expected: PASS, все тесты зелёные (5 в dayProgress + 4 в dayBlocks + существующие «Нумерологии» с новым `normalizeBirth`).

**Step 2: Коммит не требуется** (если тесты падают, чинить перед сборкой).

---

### Задача F2. Финальная сборка (Docker, один раз)

**Step 1: Собрать фронтенд в проектном окружении**

Собери `next build` тем же способом, что принят в проекте (Docker-образ Node; сборка на хосте с `NODE_ENV=development` не показательна). Команду сборки бери из существующего процесса проекта (compose / Makefile / CI), новых способов не изобретай.

Expected: сборка проходит без ошибок компиляции; маршрут `/lk` и затронутые страницы продуктов (`/tarot/day`, `/horoscope`, `/numerology/forecast`, `/numerology/breakdown`) собираются.

**Step 2: Ручная приёмка владельцем (визуально, вне автоматизации)**

Сценарии приёмки:
1. Зайти в `/lk`: виден дашборд с четырьмя блоками и прогрессом «открыто 0 из 4».
2. Нажать «Открыть» на «Карте дня»: раскрывается контент, статус меняется на «открыто», прогресс растёт.
3. Пустой профиль: «Число дня» и «Настрой дня» показывают «Укажи дату рождения», ссылка ведёт к секции профиля.
4. Заполнить дату рождения в профиле, сохранить: зайти в гороскоп/нумерологию, они считают по новой дате без повторного ввода.
5. Открыть карту дня в самом Таро, вернуться в `/lk`: блок «Карта дня» отмечен открытым.
6. «Выйти со всех устройств» в секции «Аккаунт» разлогинивает и уводит на вход.

**Step 3: Финальный коммит (если правки по приёмке не потребовались, пропустить)**

```bash
git add -A
git commit -m "chore(lk): финальная сборка и приёмка дашборда дня"
```

---

## Приложение: карта файлов

**Создаём:**
- `frontend/app/lk/dayProgress.js` (+ `dayProgress.test.mjs`) — трекинг «открыто» (A1).
- `frontend/app/lk/dayBlocks.js` (+ `dayBlocks.test.mjs`) — сборка четырёх блоков (A2).
- `frontend/app/lk/components/DayBlockCard.jsx` — карточка блока (B2).
- `frontend/app/lk/components/DayDashboard.jsx` — дашборд (B3).

**Меняем:**
- `frontend/app/lk/lk.module.css` — стили дашборда (B1).
- `frontend/app/content/numerology/index.js` (+ тест) — `normalizeBirth`, `fetchProfileNumerology` (C1).
- `frontend/app/numerology/forecast/ForecastClient.jsx` — профиль как источник даты (C2) + `markOpened('number')` (E3).
- `frontend/app/numerology/breakdown/BreakdownClient.jsx` — профиль как источник даты+имени (C3).
- `frontend/app/context/AuthContext.jsx` — `logoutAll` (D1).
- `frontend/app/lk/LKClient.jsx` — новый макет, синхронизация кэшей, секция аккаунта (D2).
- `frontend/app/tarot/day/DayClient.jsx` — `markOpened('card')` (E1).
- `frontend/app/horoscope/TodayView.jsx`, `frontend/app/horoscope/LunarView.jsx` — `markOpened('mood'/'lunar')` (E2).

**Вне скоупа (дизайн §11):** управление подпиской, история раскладов, кросс-девайс синхронизация, уведомления, смена пароля/email, удаление аккаунта.
