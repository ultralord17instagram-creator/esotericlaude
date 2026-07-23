# План реализации продукта «Гороскоп»

> **For Claude:** REQUIRED SUB-SKILL: используй superpowers:executing-plans для выполнения этого плана задача за задачей.

**Goal:** Собрать клиентский продукт «Гороскоп» (три раздела: Сегодня + живое небо, Портрет знака, Лунный календарь) по образцу «Нумерологии»: детерминированные астро-расчёты и статичные тексты на клиенте, сквозной freemium через `user.subscribed`, память даты рождения через профиль/localStorage.

**Architecture:** Всё живёт на фронте в `frontend/app/content/horoscope/` (расчёты `astro.js`, конфиг `scenarios.js`, тексты `texts/`, байты `bait.js`, сборка `index.js`) и `frontend/app/horoscope/` (свой клиент с вкладками, вход сразу в «Сегодня», без `ProductPage`). Нового бэкенда нет: из бэкенда используется только существующий `/api/v1/profile/me`. Тексты выезжают плейсхолдерами (наполнение отдельным чатом по §16 дизайна).

**Tech Stack:** Next.js 14 (App Router, JSX, `'use client'`), React 18, CSS-модули, `node:test` для юнит-тестов чистой логики (как `content/numerology/index.test.mjs`). Иконки: инлайн-SVG/эмодзи (без новых зависимостей).

**Дизайн-источник:** [docs/plans/2026-07-09-horoscope-design.md](docs/plans/2026-07-09-horoscope-design.md)

---

## Соглашения и подводные камни (прочитать до старта)

1. **Раннер тестов.** Чистая логика (`astro.js`, `index.js`) тестируется через `node:test`, тем же способом, что уже работает для [frontend/app/content/numerology/index.test.mjs](frontend/app/content/numerology/index.test.mjs). Команда из корня репозитория:
   `node --test frontend/app/content/horoscope/astro.test.mjs`
   Node запускается там, где он доступен (локально, если установлен, иначе через node-образ проекта, как гоняются тесты «Нумерологии»). Тест-файлы `.mjs` импортируют модули `.js` напрямую, как в «Нумерологии».
2. **React-компоненты юнит-раннера не имеют** (в проекте нет jest/vitest, `package.json` содержит только `next` скрипты, у «Нумерологии» тоже нет тестов компонентов). Поэтому UI-задачи проверяются **одной** финальной сборкой `next build` (компиляция/типы) и визуальной приёмкой владельцем. Не добавляй тест-фреймворк (YAGNI) и не вставляй `next build` после каждой задачи.
3. **Сборка только в Docker и один раз в конце.** `next build` на хосте с `NODE_ENV=development` ломается; скриншот-инструмента нет. Финальная проверка сборки, не по задаче.
4. **Никакого «—» (длинного тире) в русских текстах и плейсхолдерах** для пользователя: пользователь читает его как AI-tell. Запятые, двоеточия, скобки, дефис. В числовых диапазонах дат допустим «–» (короткое тире), но не «—».
5. **Ключи знаков латиницей** (`aries`, `taurus`, ...), чтобы не тащить кириллицу в ключи текстов. `sign()` возвращает и латинский `id`, и русское `name`.
6. **Продукты не связываем импортами.** «Гороскоп» получает собственные копии компонентов (`SignHeader`, `BlockCard`), свой CSS-модуль и свои иконки. Хелпер «сегодня в Europe/Moscow» дублируется в `astro.js` (как в `numbers.js`). Из общего переиспользуем только `components/ui/Paywall.jsx`, `components/ui/Modal.jsx`, `context/AuthContext`.
7. **Платный текст структурно `{ teaser, body }`, бесплатный — строка.** Отсутствующий ключ даёт видимый плейсхолдер (`[текст: ...]`), продукт не падает. Это тот же контракт, что в `content/numerology/index.js`.
8. **Порядок работ:** сначала чистое тестируемое ядро (`astro.js`, `index.js`), затем UI, затем перезапись клиента и удаление старой заглушки последней. Промежуточно маршрут `/horoscope` может не собираться, финальное состояние собирается.

---

## Фаза A. Астро-ядро `astro.js` (источник правды, чистые функции)

Все функции детерминированы, «сегодня» передаётся аргументом. Тесты пишем и дописываем в один файл `frontend/app/content/horoscope/astro.test.mjs`.

### Задача A1. Знак зодиака `sign()`

**Files:**
- Create: `frontend/app/content/horoscope/astro.js`
- Test: `frontend/app/content/horoscope/astro.test.mjs`

**Step 1: Пишем падающий тест**

Создай `astro.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sign } from './astro.js'

test('sign: дата определяет знак и латинский id', () => {
  assert.equal(sign('1990-11-29').id, 'sagittarius') // Стрелец
  assert.equal(sign('1988-05-08').id, 'taurus')      // Телец
  assert.equal(sign('2000-01-10').id, 'capricorn')   // Козерог (начало года)
  assert.equal(sign('2000-12-25').id, 'capricorn')   // Козерог (конец года)
  assert.equal(sign('1995-03-21').name, 'Овен')      // граница
})
```

**Step 2: Запускаем тест, убеждаемся что падает**

Run: `node --test frontend/app/content/horoscope/astro.test.mjs`
Expected: FAIL, `Cannot find module './astro.js'` (файла ещё нет).

**Step 3: Пишем минимальную реализацию**

Создай `astro.js` (таблица переносится из текущей заглушки `content/horoscope.js`, добавлены латинские `id` и `range`; строка Козерога намеренно продублирована для переноса через конец года):

```js
// Источник правды по астро-расчётам продукта «Гороскоп» (дизайн §5, §12.1).
// Всё детерминировано и чисто: «сегодня» передаётся аргументом.

// ── Знаки: границы (месяц,день × 2), стихия, планета, диапазон ────────────────
export const SIGNS = [
  { id: 'capricorn',   name: 'Козерог',  dates: [1, 1, 1, 19],    element: 'Земля',  planet: 'Сатурн',   range: '22.12 – 19.01' },
  { id: 'aquarius',    name: 'Водолей',  dates: [1, 20, 2, 18],   element: 'Воздух', planet: 'Уран',     range: '20.01 – 18.02' },
  { id: 'pisces',      name: 'Рыбы',     dates: [2, 19, 3, 20],   element: 'Вода',   planet: 'Нептун',   range: '19.02 – 20.03' },
  { id: 'aries',       name: 'Овен',     dates: [3, 21, 4, 19],   element: 'Огонь',  planet: 'Марс',     range: '21.03 – 19.04' },
  { id: 'taurus',      name: 'Телец',    dates: [4, 20, 5, 20],   element: 'Земля',  planet: 'Венера',   range: '20.04 – 20.05' },
  { id: 'gemini',      name: 'Близнецы', dates: [5, 21, 6, 21],   element: 'Воздух', planet: 'Меркурий', range: '21.05 – 21.06' },
  { id: 'cancer',      name: 'Рак',      dates: [6, 22, 7, 22],   element: 'Вода',   planet: 'Луна',     range: '22.06 – 22.07' },
  { id: 'leo',         name: 'Лев',      dates: [7, 23, 8, 22],   element: 'Огонь',  planet: 'Солнце',   range: '23.07 – 22.08' },
  { id: 'virgo',       name: 'Дева',     dates: [8, 23, 9, 22],   element: 'Земля',  planet: 'Меркурий', range: '23.08 – 22.09' },
  { id: 'libra',       name: 'Весы',     dates: [9, 23, 10, 22],  element: 'Воздух', planet: 'Венера',   range: '23.09 – 22.10' },
  { id: 'scorpio',     name: 'Скорпион', dates: [10, 23, 11, 21], element: 'Вода',   planet: 'Плутон',   range: '23.10 – 21.11' },
  { id: 'sagittarius', name: 'Стрелец',  dates: [11, 22, 12, 21], element: 'Огонь',  planet: 'Юпитер',   range: '22.11 – 21.12' },
  { id: 'capricorn',   name: 'Козерог',  dates: [12, 22, 12, 31], element: 'Земля',  planet: 'Сатурн',   range: '22.12 – 19.01' },
]

export function sign(birthDate) {
  const [, m, d] = String(birthDate).split('-').map(Number)
  return SIGNS.find(s => (m === s.dates[0] && d >= s.dates[1]) || (m === s.dates[2] && d <= s.dates[3])) ?? SIGNS[0]
}
```

**Step 4: Запускаем тест, убеждаемся что проходит**

Run: `node --test frontend/app/content/horoscope/astro.test.mjs`
Expected: PASS (1 тест, 5 ассертов).

**Step 5: Коммит**

```bash
git add frontend/app/content/horoscope/astro.js frontend/app/content/horoscope/astro.test.mjs
git commit -m "feat(horoscope): astro.sign — знак и латинский id по дате"
```

---

### Задача A2. Время и выбор варианта `moscowDayKey` / `dayVariantIndex`

**Files:**
- Modify: `frontend/app/content/horoscope/astro.js`
- Test: `frontend/app/content/horoscope/astro.test.mjs`

**Step 1: Дописываем падающий тест**

Добавь в `astro.test.mjs`:

```js
import { moscowDayKey, dayVariantIndex } from './astro.js'

test('moscowDayKey: целочисленный ключ дня в TZ Москвы', () => {
  const k = moscowDayKey(new Date('2026-07-09T00:00:00Z')) // 03:00 по Москве
  assert.equal(k, 20260709)
})

test('dayVariantIndex: детерминированный индекс по модулю count', () => {
  const today = new Date('2026-07-09T12:00:00Z')
  assert.equal(dayVariantIndex(today, 4), 20260709 % 4)
  assert.equal(dayVariantIndex(today, 0), 0) // защита от деления на ноль
})
```

**Step 2: Запуск, ожидаем FAIL**

Run: `node --test frontend/app/content/horoscope/astro.test.mjs`
Expected: FAIL, `moscowDayKey is not a function`.

**Step 3: Реализация**

Добавь в `astro.js` (дублируется из `numbers.js` намеренно, продукты не связываем импортами):

```js
// ── «Сегодня» в TZ проекта (Europe/Moscow). Дублируется намеренно. ───────────
export function moscowDayKey(date = new Date()) {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
  const [y, m, d] = s.split('-').map(Number)
  return y * 10000 + m * 100 + d
}

// Детерминированный выбор варианта дневного текста: стабилен в течение дня.
export function dayVariantIndex(today = new Date(), count = 1) {
  return count > 0 ? moscowDayKey(today) % count : 0
}
```

**Step 4: Запуск, ожидаем PASS**

Run: `node --test frontend/app/content/horoscope/astro.test.mjs`
Expected: PASS (3 теста).

**Step 5: Коммит**

```bash
git add frontend/app/content/horoscope/astro.js frontend/app/content/horoscope/astro.test.mjs
git commit -m "feat(horoscope): astro moscowDayKey/dayVariantIndex"
```

---

### Задача A3. Фаза Луны `moonPhase()` и лунный день `lunarDay()`

**Files:**
- Modify: `frontend/app/content/horoscope/astro.js`
- Test: `frontend/app/content/horoscope/astro.test.mjs`

**Step 1: Падающий тест**

Добавь в `astro.test.mjs` (проверяем опорную дату и пол-цикла, чтобы тест был устойчив к формуле):

```js
import { moonPhase, lunarDay, REF_NEW_MOON, SYNODIC } from './astro.js'

test('moonPhase: опорная дата это новолуние, лунный день 1', () => {
  const ref = new Date(REF_NEW_MOON)
  assert.equal(moonPhase(ref).name, 'Новолуние')
  assert.equal(lunarDay(ref), 1)
})

test('moonPhase: середина цикла это полнолуние', () => {
  const half = new Date(REF_NEW_MOON + (SYNODIC / 2) * 86400000)
  assert.equal(moonPhase(half).name, 'Полнолуние')
})

test('lunarDay всегда в диапазоне 1..30', () => {
  for (const iso of ['2026-01-01', '2026-06-15', '2027-03-30', '2026-11-07']) {
    const ld = lunarDay(new Date(iso + 'T12:00:00Z'))
    assert.ok(ld >= 1 && ld <= 30, `лунный день ${ld} вне диапазона для ${iso}`)
  }
})
```

**Step 2: Запуск, ожидаем FAIL**

Run: `node --test frontend/app/content/horoscope/astro.test.mjs`
Expected: FAIL, `moonPhase is not a function`.

**Step 3: Реализация**

Добавь в `astro.js`:

```js
// ── Луна: возраст, фаза (8), лунный день (1..30) ─────────────────────────────
// Опорное новолуние (UTC) и синодический месяц как константы (дизайн §5.2, §17.1).
export const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) // 2000-01-06 18:14 UTC
export const SYNODIC = 29.530588853                       // средний синодический месяц, дней

// Порядок фаз важен: индекс 0..7 соответствует долям возраста (дизайн, Прил. B).
export const PHASES = [
  { name: 'Новолуние',        emoji: '🌑' },
  { name: 'Растущий серп',    emoji: '🌒' },
  { name: 'Первая четверть',  emoji: '🌓' },
  { name: 'Растущая Луна',    emoji: '🌔' },
  { name: 'Полнолуние',       emoji: '🌕' },
  { name: 'Убывающая Луна',   emoji: '🌖' },
  { name: 'Последняя четверть', emoji: '🌗' },
  { name: 'Старая Луна',      emoji: '🌘' },
]

export function moonAge(date = new Date()) {
  const days = (date.getTime() - REF_NEW_MOON) / 86400000
  let age = days % SYNODIC
  if (age < 0) age += SYNODIC
  return age // [0, SYNODIC)
}

export function moonPhase(date = new Date()) {
  const idx = Math.floor((moonAge(date) / SYNODIC) * 8 + 0.5) % 8
  return PHASES[idx]
}

export function lunarDay(date = new Date()) {
  return Math.min(30, Math.floor(moonAge(date)) + 1) // 1..30
}
```

**Step 4: Запуск, ожидаем PASS**

Run: `node --test frontend/app/content/horoscope/astro.test.mjs`
Expected: PASS (6 тестов).

**Step 5: Коммит**

```bash
git add frontend/app/content/horoscope/astro.js frontend/app/content/horoscope/astro.test.mjs
git commit -m "feat(horoscope): astro moonPhase/lunarDay (опорное новолуние + синодический месяц)"
```

---

### Задача A4. Планетарный день недели `planetaryDay()`

**Files:**
- Modify: `frontend/app/content/horoscope/astro.js`
- Test: `frontend/app/content/horoscope/astro.test.mjs`

**Step 1: Падающий тест**

Добавь в `astro.test.mjs`:

```js
import { planetaryDay } from './astro.js'

test('planetaryDay: управитель по дню недели в TZ Москвы', () => {
  // 2026-01-05 понедельник, 2026-01-04 воскресенье
  assert.equal(planetaryDay(new Date('2026-01-05T12:00:00Z')).planet, 'Луна')
  assert.equal(planetaryDay(new Date('2026-01-04T12:00:00Z')).planet, 'Солнце')
  assert.equal(planetaryDay(new Date('2026-01-09T12:00:00Z')).planet, 'Венера') // пятница
})
```

**Step 2: Запуск, ожидаем FAIL**

Run: `node --test frontend/app/content/horoscope/astro.test.mjs`
Expected: FAIL, `planetaryDay is not a function`.

**Step 3: Реализация**

Добавь в `astro.js`:

```js
// ── Планетарный день недели (Europe/Moscow) ──────────────────────────────────
const WEEKDAY_PLANET = {
  Mon: 'Луна', Tue: 'Марс', Wed: 'Меркурий', Thu: 'Юпитер',
  Fri: 'Венера', Sat: 'Сатурн', Sun: 'Солнце',
}

export function planetaryDay(date = new Date()) {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Moscow', weekday: 'short' }).format(date)
  return { planet: WEEKDAY_PLANET[wd] ?? 'Солнце', weekday: wd }
}
```

**Step 4: Запуск, ожидаем PASS**

Run: `node --test frontend/app/content/horoscope/astro.test.mjs`
Expected: PASS (7 тестов).

**Step 5: Коммит**

```bash
git add frontend/app/content/horoscope/astro.js frontend/app/content/horoscope/astro.test.mjs
git commit -m "feat(horoscope): astro planetaryDay (управитель дня)"
```

---

### Задача A5. Ретрограды `retrogrades()` + таблица `RETROGRADES`

**Files:**
- Modify: `frontend/app/content/horoscope/astro.js`
- Test: `frontend/app/content/horoscope/astro.test.mjs`

> Реальные периоды из эфемерид наполняются при написании контента (дизайн §16). Здесь один seed-период, чтобы структура и функция работали и тестировались.

**Step 1: Падающий тест**

Добавь в `astro.test.mjs`:

```js
import { retrogrades } from './astro.js'

test('retrogrades: планеты, ретроградные на дату (по seed-таблице)', () => {
  const inside = retrogrades(new Date('2026-03-01T12:00:00Z'))
  assert.ok(inside.includes('Меркурий'))
  const outside = retrogrades(new Date('2026-07-01T12:00:00Z'))
  assert.deepEqual(outside, [])
})
```

**Step 2: Запуск, ожидаем FAIL**

Run: `node --test frontend/app/content/horoscope/astro.test.mjs`
Expected: FAIL, `retrogrades is not a function`.

**Step 3: Реализация**

Добавь в `astro.js`:

```js
// ── Ретрограды: статическая таблица периодов (дизайн §5.4, §16) ───────────────
// ПЛЕЙСХОЛДЕР: реальные периоды Меркурия/Венеры/Марса на 2026-2028+ берутся из
// открытых эфемерид при наполнении контента. Продлевается вручную раз в год.
export const RETROGRADES = [
  { planet: 'Меркурий', from: '2026-02-25', to: '2026-03-20' },
]

function isoKey(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return y * 10000 + m * 100 + d
}

export function retrogrades(date = new Date()) {
  const k = moscowDayKey(date)
  return RETROGRADES.filter(r => k >= isoKey(r.from) && k <= isoKey(r.to)).map(r => r.planet)
}
```

**Step 4: Запуск, ожидаем PASS**

Run: `node --test frontend/app/content/horoscope/astro.test.mjs`
Expected: PASS (8 тестов).

**Step 5: Коммит**

```bash
git add frontend/app/content/horoscope/astro.js frontend/app/content/horoscope/astro.test.mjs
git commit -m "feat(horoscope): astro retrogrades + таблица периодов (seed)"
```

---

## Фаза B. Конфиг, тексты-плейсхолдеры и сборка `index.js`

### Задача B1. Конфиг блоков `scenarios.js`

**Files:**
- Create: `frontend/app/content/horoscope/scenarios.js`

> Чистые данные, отдельного теста не требуют (проверятся косвенно через `index.test.mjs` в B6). Одна задача = один файл = один коммит.

**Step 1: Создать файл**

```js
// Декларативный конфиг блоков разделов (дизайн §12.2).
// basis — по чему считается блок; free — открыт без подписки;
// variants — есть варианты по дню (только раздел «Сегодня»).
export const SCENARIOS = {
  today: {
    sky: { free: true }, // живое небо: общие тексты, всегда бесплатно
    blocks: [
      { id: 'mood',   name: 'Гороскоп на сегодня', basis: 'sign', variants: true, free: true  },
      { id: 'love',   name: 'Любовь сегодня',      basis: 'sign', variants: true, free: false },
      { id: 'money',  name: 'Деньги и работа',     basis: 'sign', variants: true, free: false },
      { id: 'health', name: 'Здоровье и энергия',  basis: 'sign', variants: true, free: false },
      { id: 'luck',   name: 'Удача дня',           basis: 'sign', variants: true, free: false },
      { id: 'advice', name: 'Совет дня',           basis: 'sign', variants: true, free: true  },
    ],
  },
  portrait: {
    basis: 'sign',
    blocks: [
      { id: 'core',    name: 'Характер и суть',    free: true  },
      { id: 'power',   name: 'Суперсила знака',     free: false },
      { id: 'shadow',  name: 'Теневая сторона',     free: false },
      { id: 'love',    name: 'Любовь и отношения',  free: false },
      { id: 'money',   name: 'Деньги и карьера',    free: false },
      { id: 'purpose', name: 'Предназначение',      free: false },
    ],
  },
  lunar: {
    basis: 'lunarDay',
    todayFree: true,
    spheres: ['beauty', 'money', 'love', 'affairs', 'health'],
  },
}
```

**Step 2: Коммит**

```bash
git add frontend/app/content/horoscope/scenarios.js
git commit -m "feat(horoscope): scenarios.js — конфиг блоков трёх разделов"
```

---

### Задача B2. Тексты-плейсхолдеры `texts/`

**Files:**
- Create: `frontend/app/content/horoscope/texts/sky.js`
- Create: `frontend/app/content/horoscope/texts/today.js`
- Create: `frontend/app/content/horoscope/texts/portrait.js`
- Create: `frontend/app/content/horoscope/texts/lunar.js`
- Create: `frontend/app/content/horoscope/texts/lunar_ratings.js`

> Структура ключей из дизайна §12.3. Файлы почти пустые: реальные ~440 текстов пишет отдельный бриф (§16). Пустые ключи `index.js` закрывает видимыми плейсхолдерами. Латинские ключи знаков.

**Step 1: `texts/sky.js`** (живое небо, бесплатные строки по названию сущности из `astro.js`)

```js
// Живое небо (бесплатно). Ключи: русские названия из astro.js (PHASES, планеты).
// Значение лунного дня берётся из texts/lunar.js (days), здесь его нет.
export const SKY_TEXTS = {
  phases: {
    'Новолуние': '', 'Растущий серп': '', 'Первая четверть': '', 'Растущая Луна': '',
    'Полнолуние': '', 'Убывающая Луна': '', 'Последняя четверть': '', 'Старая Луна': '',
  },
  planetaryDays: {
    'Луна': '', 'Марс': '', 'Меркурий': '', 'Юпитер': '', 'Венера': '', 'Сатурн': '', 'Солнце': '',
  },
  retro: { 'Меркурий': '', 'Венера': '', 'Марс': '' },
}
```

**Step 2: `texts/today.js`** (бесплатные блоки — массивы строк; платные — массивы `{ teaser, body }`)

```js
// «Сегодня» по знаку × варианты дня (дизайн §6, §12.3).
// mood/advice — бесплатные: { <sign>: ['вариант1', ...] }.
// love/money/health/luck — платные: { <sign>: [{ teaser, body }, ...] }.
// Ключи знаков латиницей. Пустые массивы -> плейсхолдер из index.js.
const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']
const emptyFree = () => Object.fromEntries(SIGNS.map(s => [s, []]))
const emptyPaid = () => Object.fromEntries(SIGNS.map(s => [s, []]))

export const TODAY_TEXTS = {
  mood:   emptyFree(),
  advice: emptyFree(),
  love:   emptyPaid(),
  money:  emptyPaid(),
  health: emptyPaid(),
  luck:   emptyPaid(),
}
```

**Step 3: `texts/portrait.js`** (по знаку, без вариантов; core — строка, остальные — `{ teaser, body }`)

```js
// «Портрет знака»: { blockId: { <sign>: текст } } (дизайн §7, §12.3).
// core — бесплатный (строка). Остальные — платные ({ teaser, body }).
const SIGNS = ['aries','taurus','gemini','cancer','leo','virgo','libra','scorpio','sagittarius','capricorn','aquarius','pisces']
const bySign = () => Object.fromEntries(SIGNS.map(s => [s, '']))

export const PORTRAIT_TEXTS = {
  core:    bySign(),
  power:   bySign(),
  shadow:  bySign(),
  love:    bySign(),
  money:   bySign(),
  purpose: bySign(),
}
```

**Step 4: `texts/lunar.js`** (библиотека 30 лунных дней + обзоры сфер)

```js
// Лунный календарь: значения 30 дней (общая библиотека с «живым небом») + обзоры сфер.
// days — бесплатные строки; spheres — короткие обзоры (показываются в платной секции).
const days = () => Object.fromEntries(Array.from({ length: 30 }, (_, i) => [i + 1, '']))

export const LUNAR_TEXTS = {
  days: days(),
  spheres: { beauty: '', money: '', love: '', affairs: '', health: '' },
}
```

**Step 5: `texts/lunar_ratings.js`** (данные-рейтинги, не проза)

```js
// Рейтинги благоприятности: { <сфера>: { <лунный день 1..30>: 'good'|'neutral'|'bad' } }.
// Данные, не проза (дизайн §8). Пустые объекты -> index.js подставит 'neutral'.
// Реальные значения из стандартного лунного календаря при наполнении (§17.5).
export const LUNAR_RATINGS = {
  beauty:  {},
  money:   {},
  love:    {},
  affairs: {},
  health:  {},
}
```

**Step 6: Коммит**

```bash
git add frontend/app/content/horoscope/texts/
git commit -m "feat(horoscope): каркас текстов (sky/today/portrait/lunar/ratings) с плейсхолдерами"
```

---

### Задача B3. Байты `bait.js`

**Files:**
- Create: `frontend/app/content/horoscope/bait.js`

**Step 1: Создать файл**

```js
// Байт-крючки платных блоков (дизайн §12.4, аналог content/numerology/bait.js).
// Структура: { <раздел>: { <blockId>: [вариант1, ...] } }. Выбор варианта
// детерминированный (getBait в index.js). Пустой массив -> видимый плейсхолдер.
// Реальные тексты и тон дорабатывает владелец отдельным брифом.
export const BAIT = {
  today: {
    love: [], money: [], health: [], luck: [],
  },
  portrait: {
    power: [], shadow: [], love: [], money: [], purpose: [],
  },
  lunar: {
    calendar: [], // байт для платной секции «благоприятные дни»
  },
}
```

**Step 2: Коммит**

```bash
git add frontend/app/content/horoscope/bait.js
git commit -m "feat(horoscope): bait.js — каркас байт-крючков"
```

---

### Задача B4. Сборка `index.js`: `getText`-хелперы и `getBait`

**Files:**
- Create: `frontend/app/content/horoscope/index.js`
- Create: `frontend/app/content/horoscope/index.test.mjs`

**Step 1: Падающий тест**

Создай `index.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getBait } from './index.js'

test('getBait: раздел без вариантов даёт видимый плейсхолдер', () => {
  // 'mood' — бесплатный блок, байта не имеет и в BAIT.today не входит,
  // поэтому остаётся стабильным примером плейсхолдера при любом наполнении.
  const b = getBait('today', 'mood', 'aries')
  assert.match(b, /^\[байт: today\.mood\]$/)
})

test('getBait: выбор варианта детерминирован по сиду', () => {
  const a = getBait('today', 'love', 'aries')
  const b = getBait('today', 'love', 'aries')
  assert.equal(a, b)
})
```

**Step 2: Запуск, ожидаем FAIL**

Run: `node --test frontend/app/content/horoscope/index.test.mjs`
Expected: FAIL, `Cannot find module './index.js'`.

**Step 3: Реализация (первая часть `index.js`)**

Создай `index.js`:

```js
import { SCENARIOS } from './scenarios.js'
import * as A from './astro.js'
import { SKY_TEXTS } from './texts/sky.js'
import { TODAY_TEXTS } from './texts/today.js'
import { PORTRAIT_TEXTS } from './texts/portrait.js'
import { LUNAR_TEXTS } from './texts/lunar.js'
import { LUNAR_RATINGS } from './texts/lunar_ratings.js'
import { BAIT } from './bait.js'

// ── Плейсхолдеры (структура важнее наполнения на этом этапе) ──────────────────
const phFree = (l) => `[текст: ${l}]`
const phPaid = (l) => ({ teaser: `[тизер: ${l}]`, body: `[текст: ${l}]` })
const phBait = (l) => `[байт: ${l}]`

function seedNum(seed) {
  return String(seed).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)
}

// Байт платного блока для гостя. Пустой раздел -> видимый плейсхолдер.
export function getBait(section, block, seed) {
  const variants = BAIT[section]?.[block]
  if (!Array.isArray(variants) || variants.length === 0) return phBait(`${section}.${block}`)
  return variants[seedNum(seed) % variants.length]
}
```

**Step 4: Запуск, ожидаем PASS**

Run: `node --test frontend/app/content/horoscope/index.test.mjs`
Expected: PASS (2 теста).

**Step 5: Коммит**

```bash
git add frontend/app/content/horoscope/index.js frontend/app/content/horoscope/index.test.mjs
git commit -m "feat(horoscope): index getBait + плейсхолдеры"
```

---

### Задача B5. `getToday(signId, today)`

**Files:**
- Modify: `frontend/app/content/horoscope/index.js`
- Test: `frontend/app/content/horoscope/index.test.mjs`

**Step 1: Падающий тест**

Добавь в `index.test.mjs`:

```js
import { getToday } from './index.js'

const TODAY = new Date('2026-07-09T12:00:00Z')

test('getToday: собирает живое небо и блоки, платные несут bait', () => {
  const r = getToday('aries', TODAY)
  // живое небо
  assert.equal(typeof r.sky.phase.name, 'string')
  assert.ok(r.sky.lunarDay >= 1 && r.sky.lunarDay <= 30)
  assert.equal(typeof r.sky.planetary.planet, 'string')
  assert.ok(Array.isArray(r.sky.retro))
  // блоки: 6 штук (mood/love/money/health/luck/advice)
  assert.equal(r.blocks.length, 6)
  const mood = r.blocks.find(b => b.id === 'mood')
  assert.equal(mood.free, true)
  assert.equal(typeof mood.text, 'string') // бесплатный -> строка (плейсхолдер)
  const love = r.blocks.find(b => b.id === 'love')
  assert.equal(love.free, false)
  assert.equal(typeof love.text.teaser, 'string') // платный -> { teaser, body }
  assert.equal(typeof love.text.body, 'string')
  assert.equal(typeof love.bait, 'string')        // платный несёт байт
  assert.equal(mood.bait, undefined)               // бесплатный без байта
})
```

**Step 2: Запуск, ожидаем FAIL**

Run: `node --test frontend/app/content/horoscope/index.test.mjs`
Expected: FAIL, `getToday is not a function`.

**Step 3: Реализация**

Добавь в `index.js`:

```js
// Выбор варианта дня: бесплатный -> строка, платный -> { teaser, body }.
function pickFree(arr, today, label) {
  if (!Array.isArray(arr) || arr.length === 0) return phFree(label)
  const v = arr[A.dayVariantIndex(today, arr.length)]
  return typeof v === 'string' && v ? v : phFree(label)
}
function pickPaid(arr, today, label) {
  if (!Array.isArray(arr) || arr.length === 0) return phPaid(label)
  const v = arr[A.dayVariantIndex(today, arr.length)]
  if (v && typeof v === 'object') {
    return { teaser: v.teaser || phPaid(label).teaser, body: v.body || phPaid(label).body }
  }
  return phPaid(label)
}

// ── Раздел «Сегодня» + живое небо ────────────────────────────────────────────
export function getToday(signId, today = new Date()) {
  const phase = A.moonPhase(today)
  const ld = A.lunarDay(today)
  const planetary = A.planetaryDay(today)
  const retro = A.retrogrades(today)

  const sky = {
    phase, lunarDay: ld, planetary, retro,
    texts: {
      phase: SKY_TEXTS.phases[phase.name] || phFree(`sky.phase.${phase.name}`),
      lunarDay: LUNAR_TEXTS.days[ld] || phFree(`lunar.days.${ld}`),
      planetary: SKY_TEXTS.planetaryDays[planetary.planet] || phFree(`sky.planet.${planetary.planet}`),
      retro: retro.map(p => ({ planet: p, text: SKY_TEXTS.retro[p] || phFree(`sky.retro.${p}`) })),
    },
  }

  const blocks = SCENARIOS.today.blocks.map(b => {
    const arr = TODAY_TEXTS[b.id]?.[signId]
    const label = `today.${b.id}.${signId}`
    if (b.free) {
      return { id: b.id, name: b.name, free: true, text: pickFree(arr, today, label) }
    }
    return {
      id: b.id, name: b.name, free: false,
      text: pickPaid(arr, today, label),
      bait: getBait('today', b.id, signId),
    }
  })

  return { sky, blocks }
}
```

**Step 4: Запуск, ожидаем PASS**

Run: `node --test frontend/app/content/horoscope/index.test.mjs`
Expected: PASS (3 теста).

**Step 5: Коммит**

```bash
git add frontend/app/content/horoscope/index.js frontend/app/content/horoscope/index.test.mjs
git commit -m "feat(horoscope): getToday — живое небо + блоки дня"
```

---

### Задача B6. `getPortrait(signId)` и `getLunar(today)`

**Files:**
- Modify: `frontend/app/content/horoscope/index.js`
- Test: `frontend/app/content/horoscope/index.test.mjs`

**Step 1: Падающий тест**

Добавь в `index.test.mjs`:

```js
import { getPortrait, getLunar } from './index.js'

test('getPortrait: 6 блоков, core бесплатный (строка), остальные платные', () => {
  const r = getPortrait('leo')
  assert.equal(r.blocks.length, 6)
  const core = r.blocks.find(b => b.id === 'core')
  assert.equal(core.free, true)
  assert.equal(typeof core.text, 'string')
  const power = r.blocks.find(b => b.id === 'power')
  assert.equal(power.free, false)
  assert.equal(typeof power.text.teaser, 'string')
  assert.equal(typeof power.bait, 'string')
})

test('getLunar: сегодняшний день, сферы с рейтингами по 30 дней', () => {
  const r = getLunar(new Date('2026-07-09T12:00:00Z'))
  assert.ok(r.lunarDay >= 1 && r.lunarDay <= 30)
  assert.equal(typeof r.todayMeaning, 'string')
  assert.equal(r.spheres.length, 5)
  const beauty = r.spheres.find(s => s.id === 'beauty')
  assert.equal(beauty.ratings.length, 30)
  assert.equal(beauty.ratings[0], 'neutral') // пустая таблица -> дефолт
})
```

**Step 2: Запуск, ожидаем FAIL**

Run: `node --test frontend/app/content/horoscope/index.test.mjs`
Expected: FAIL, `getPortrait is not a function`.

**Step 3: Реализация**

Добавь в `index.js`:

```js
// ── Раздел «Портрет знака» ───────────────────────────────────────────────────
export function getPortrait(signId) {
  const blocks = SCENARIOS.portrait.blocks.map(b => {
    const raw = PORTRAIT_TEXTS[b.id]?.[signId]
    const label = `portrait.${b.id}.${signId}`
    if (b.free) {
      return { id: b.id, name: b.name, free: true, text: (typeof raw === 'string' && raw) ? raw : phFree(label) }
    }
    const text = (raw && typeof raw === 'object')
      ? { teaser: raw.teaser || phPaid(label).teaser, body: raw.body || phPaid(label).body }
      : phPaid(label)
    return { id: b.id, name: b.name, free: false, text, bait: getBait('portrait', b.id, signId) }
  })
  return { blocks }
}

// ── Раздел «Лунный календарь» ────────────────────────────────────────────────
export function getLunar(today = new Date()) {
  const ld = A.lunarDay(today)
  const phase = A.moonPhase(today)
  const spheres = SCENARIOS.lunar.spheres.map(id => ({
    id,
    overview: LUNAR_TEXTS.spheres[id] || phFree(`lunar.spheres.${id}`),
    ratings: Array.from({ length: 30 }, (_, i) => LUNAR_RATINGS[id]?.[i + 1] || 'neutral'),
  }))
  return {
    lunarDay: ld,
    phase,
    todayMeaning: LUNAR_TEXTS.days[ld] || phFree(`lunar.days.${ld}`),
    spheres,
    bait: getBait('lunar', 'calendar', ld),
  }
}
```

**Step 4: Запуск, ожидаем PASS**

Run: `node --test frontend/app/content/horoscope/index.test.mjs`
Expected: PASS (5 тестов).

**Step 5: Коммит**

```bash
git add frontend/app/content/horoscope/index.js frontend/app/content/horoscope/index.test.mjs
git commit -m "feat(horoscope): getPortrait + getLunar"
```

---

### Задача B7. Память даты рождения (localStorage + профиль)

**Files:**
- Modify: `frontend/app/content/horoscope/index.js`
- Test: `frontend/app/content/horoscope/index.test.mjs`

> localStorage/`fetch`-хелперы юнит-раннером не покрываются (нет DOM/fetch в `node:test`, как и у `loadProfile` в «Нумерологии»). Тестируем только чистую нормализацию входной даты; сетевые хелперы проверятся сборкой и вручную.

**Step 1: Падающий тест**

Добавь в `index.test.mjs`:

```js
import { normalizeBirth } from './index.js'

test('normalizeBirth: принимает валидную ISO-дату, отбрасывает мусор', () => {
  assert.equal(normalizeBirth('1990-11-29'), '1990-11-29')
  assert.equal(normalizeBirth(''), null)
  assert.equal(normalizeBirth('не дата'), null)
  assert.equal(normalizeBirth(null), null)
})
```

**Step 2: Запуск, ожидаем FAIL**

Run: `node --test frontend/app/content/horoscope/index.test.mjs`
Expected: FAIL, `normalizeBirth is not a function`.

**Step 3: Реализация**

Добавь в `index.js` (сетевые хелперы мержат профиль перед PATCH, чтобы не затереть name/gender, повторяя форму тела из [LKClient.jsx](frontend/app/lk/LKClient.jsx)):

```js
// ── Память даты рождения (дизайн §14) ────────────────────────────────────────
// Валидная ISO-дата 'YYYY-MM-DD' или null.
export function normalizeBirth(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? String(value) : null
}

const LS_KEY = 'horoscope.birth'
export function loadBirthLocal() {
  try { return normalizeBirth(localStorage.getItem(LS_KEY)) } catch { return null }
}
export function saveBirthLocal(date) {
  try { const d = normalizeBirth(date); if (d) localStorage.setItem(LS_KEY, d) } catch {}
}

// Профиль залогиненного (существующий эндпоинт, дизайн §3). null если не залогинен/нет даты.
export async function fetchBirthFromProfile() {
  try {
    const res = await fetch('/api/v1/profile/me')
    if (!res.ok) return null
    const data = await res.json()
    return normalizeBirth(data?.birth_date)
  } catch { return null }
}

// Сохранение в профиль: читаем текущий, мержим только birth_date (форма тела как в LKClient).
export async function saveBirthToProfile(date) {
  const d = normalizeBirth(date)
  if (!d) return
  try {
    const cur = await fetch('/api/v1/profile/me').then(r => r.ok ? r.json() : {}).catch(() => ({}))
    await fetch('/api/v1/profile/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cur?.name ?? null, birth_date: d, gender: cur?.gender ?? null }),
    })
  } catch {}
}
```

> **Проверить при интеграции:** принимает ли `PATCH /api/v1/profile/me` частичное тело. Хелпер сознательно шлёт все три поля (name/birth_date/gender), чтобы не занулить остальные, если бэкенд делает полную замену. Если PATCH частичный, лишний GET можно убрать.

**Step 4: Запуск, ожидаем PASS**

Run: `node --test frontend/app/content/horoscope/index.test.mjs`
Expected: PASS (6 тестов).

**Step 5: Коммит**

```bash
git add frontend/app/content/horoscope/index.js frontend/app/content/horoscope/index.test.mjs
git commit -m "feat(horoscope): память даты рождения (localStorage + профиль)"
```

---

### Задача B8. Прогон всех тестов контента

**Step 1: Запуск обоих наборов**

Run:
```bash
node --test frontend/app/content/horoscope/astro.test.mjs frontend/app/content/horoscope/index.test.mjs
```
Expected: PASS, все тесты зелёные (8 в astro + 6 в index = 14).

**Step 2: Коммит не требуется** (изменений нет; если тесты падают, чинить перед Фазой C).

---

## Фаза C. UI (свой клиент, вход в «Сегодня»)

> Юнит-раннера для компонентов нет: каждая задача создаёт файл(ы) с полным кодом и коммитит. Ошибки компиляции ловит финальная сборка (Задача D1). Стили в `horoscope.module.css` структурные и минимальные, финальный визуал дорабатывает владелец (дизайн §16). Правило «без —» действует и для видимого текста в компонентах.

### Задача C1. Иконки и CSS-модуль

**Files:**
- Create: `frontend/app/horoscope/components/icons.jsx`
- Create: `frontend/app/horoscope/horoscope.module.css`

**Step 1: `icons.jsx`** (эмодзи фаз/планет + пара служебных SVG; без новых зависимостей)

```jsx
// Иконки продукта «Гороскоп». Эмодзи фаз берутся из astro.PHASES.
// Служебные SVG — инлайн, наследуют currentColor. Финальный визуал за владельцем.
export function Lock({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function Sparkle({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" />
    </svg>
  )
}

// Значок рейтинга благоприятности лунного дня.
export const RATING_GLYPH = { good: '●', neutral: '○', bad: '×' }
export const RATING_LABEL = { good: 'хорошо', neutral: 'нейтрально', bad: 'плохо' }
```

**Step 2: `horoscope.module.css`** (структурный каркас: страница, шапка, вкладки, карточки, живое небо, замок, сетка лунного календаря)

```css
/* Структурный каркас продукта «Гороскоп». Визуальную полировку делает владелец. */
.page { max-width: 720px; margin: 0 auto; padding: 24px 16px 64px; }

/* Шапка знака + вкладки */
.header { margin-bottom: 20px; }
.signRow { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.signName { font-size: 22px; font-weight: 600; }
.signRange { opacity: 0.7; font-size: 14px; }
.changeBtn { background: none; border: 1px solid currentColor; border-radius: 999px; padding: 6px 12px; cursor: pointer; font-size: 13px; opacity: 0.8; }
.tabs { display: flex; gap: 6px; margin-top: 16px; }
.tab { flex: 1; padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: transparent; cursor: pointer; font-size: 14px; }
.tabOn { background: rgba(255,255,255,0.1); font-weight: 600; }

/* Форма ввода даты */
.form { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 13px; opacity: 0.75; }
.input { padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: inherit; }
.btnPrimary { padding: 12px 18px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; }
.btnPrimary:disabled { opacity: 0.5; cursor: default; }

/* Живое небо */
.sky { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
.skyFact { padding: 14px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
.skyIcon { font-size: 22px; }
.skyLabel { font-size: 12px; opacity: 0.7; margin-top: 6px; }
.skyValue { font-weight: 600; }
.skyText { font-size: 13px; opacity: 0.85; margin-top: 4px; }
.retroBadges { display: flex; gap: 6px; flex-wrap: wrap; }
.retroBadge { font-size: 12px; padding: 3px 8px; border-radius: 999px; border: 1px solid rgba(255,180,0,0.5); }

/* Карточка блока */
.block { padding: 16px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 12px; }
.blockName { font-weight: 600; margin-bottom: 8px; }
.blockText { line-height: 1.6; }
.locked { display: flex; flex-direction: column; gap: 10px; }
.lockedTeaser { line-height: 1.6; }
.bait { opacity: 0.9; }
.lockCta { display: inline-flex; align-items: center; gap: 6px; padding: 10px 14px; border-radius: 10px; border: none; cursor: pointer; font-weight: 600; align-self: flex-start; }
.lockNote { font-size: 12px; opacity: 0.6; }

/* Совет дня */
.advice { margin-top: 8px; padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,0.06); font-style: italic; }

/* Лунная сетка */
.lunarGrid { overflow-x: auto; }
.lunarTable { border-collapse: collapse; width: 100%; font-size: 12px; }
.lunarTable th, .lunarTable td { padding: 4px 6px; text-align: center; border: 1px solid rgba(255,255,255,0.08); }
.lunarSphere { text-align: left; white-space: nowrap; }
.rGood { color: #6ee787; }
.rNeutral { opacity: 0.5; }
.rBad { color: #ff7b72; }
```

**Step 3: Коммит**

```bash
git add frontend/app/horoscope/components/icons.jsx frontend/app/horoscope/horoscope.module.css
git commit -m "feat(horoscope): иконки и структурный CSS-модуль"
```

---

### Задача C2. `BlockCard.jsx` (блок с пейволом)

**Files:**
- Create: `frontend/app/horoscope/components/BlockCard.jsx`

> Аналог `numerology/components/ResultReading.jsx`, упрощённый до карточки блока. free||subscribed -> тело; иначе тизер + байт + кнопка -> `Modal` с `Paywall`.

**Step 1: Создать файл**

```jsx
'use client'
import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Paywall from '../../components/ui/Paywall'
import { Lock } from './icons'
import styles from '../horoscope.module.css'

// block: { id, name, free, text, bait? }. text: строка (free) или { teaser, body } (платный).
export default function BlockCard({ block, isSubscribed }) {
  const [payOpen, setPayOpen] = useState(false)
  const unlocked = block.free || isSubscribed
  const isPaid = typeof block.text === 'object'
  const full = isPaid ? `${block.text.teaser} ${block.text.body}` : block.text
  const teaser = isPaid ? block.text.teaser : block.text
  const bait = block.bait || teaser

  return (
    <div className={styles.block}>
      <div className={styles.blockName}>{block.name}</div>
      {unlocked ? (
        <p className={styles.blockText}>{full}</p>
      ) : (
        <div className={styles.locked}>
          <p className={styles.lockedTeaser}>{teaser}</p>
          <p className={styles.bait}>{bait}</p>
          <button type="button" className={styles.lockCta} onClick={() => setPayOpen(true)}>
            <Lock size={14} /> Открыть по подписке
          </button>
          <span className={styles.lockNote}>Отмена в любой момент</span>
          <Modal open={payOpen} onClose={() => setPayOpen(false)}>
            <Paywall />
          </Modal>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/horoscope/components/BlockCard.jsx
git commit -m "feat(horoscope): BlockCard — блок с тизером и пейволом"
```

---

### Задача C3. `SkyWidget.jsx` (живое небо, 4 факта)

**Files:**
- Create: `frontend/app/horoscope/components/SkyWidget.jsx`

**Step 1: Создать файл**

```jsx
'use client'
import styles from '../horoscope.module.css'

// sky: результат getToday(...).sky { phase, lunarDay, planetary, retro, texts }.
export default function SkyWidget({ sky }) {
  return (
    <section className={styles.sky}>
      <div className={styles.skyFact}>
        <div className={styles.skyIcon}>{sky.phase.emoji}</div>
        <div className={styles.skyLabel}>Фаза Луны</div>
        <div className={styles.skyValue}>{sky.phase.name}</div>
        <div className={styles.skyText}>{sky.texts.phase}</div>
      </div>

      <div className={styles.skyFact}>
        <div className={styles.skyIcon}>🌙</div>
        <div className={styles.skyLabel}>Лунный день</div>
        <div className={styles.skyValue}>{sky.lunarDay}</div>
        <div className={styles.skyText}>{sky.texts.lunarDay}</div>
      </div>

      <div className={styles.skyFact}>
        <div className={styles.skyIcon}>✦</div>
        <div className={styles.skyLabel}>День недели</div>
        <div className={styles.skyValue}>{sky.planetary.planet}</div>
        <div className={styles.skyText}>{sky.texts.planetary}</div>
      </div>

      <div className={styles.skyFact}>
        <div className={styles.skyLabel}>Ретрограды</div>
        {sky.retro.length === 0 ? (
          <div className={styles.skyText}>Сегодня ретроградов нет, планеты идут прямо.</div>
        ) : (
          <>
            <div className={styles.retroBadges}>
              {sky.texts.retro.map(r => (
                <span key={r.planet} className={styles.retroBadge}>{r.planet}</span>
              ))}
            </div>
            {sky.texts.retro.map(r => (
              <div key={r.planet} className={styles.skyText}>{r.text}</div>
            ))}
          </>
        )}
      </div>
    </section>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/horoscope/components/SkyWidget.jsx
git commit -m "feat(horoscope): SkyWidget — живое небо из четырёх фактов"
```

---

### Задача C4. `SignHeader.jsx` (знак + вкладки + «Ввести другую»)

**Files:**
- Create: `frontend/app/horoscope/components/SignHeader.jsx`

**Step 1: Создать файл**

```jsx
'use client'
import styles from '../horoscope.module.css'

const TABS = [
  { id: 'today',    name: 'Сегодня' },
  { id: 'portrait', name: 'Портрет знака' },
  { id: 'lunar',    name: 'Лунный календарь' },
]

// sign: результат astro.sign(...). tab/onTab — активная вкладка. onChange — «Ввести другую».
export default function SignHeader({ sign, tab, onTab, onChange }) {
  return (
    <header className={styles.header}>
      <div className={styles.signRow}>
        <div>
          <div className={styles.signName}>{sign.name}</div>
          <div className={styles.signRange}>{sign.range} · {sign.element} · {sign.planet}</div>
        </div>
        <button type="button" className={styles.changeBtn} onClick={onChange}>Ввести другую</button>
      </div>
      <nav className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id} type="button"
            className={`${styles.tab} ${tab === t.id ? styles.tabOn : ''}`}
            onClick={() => onTab(t.id)}
          >
            {t.name}
          </button>
        ))}
      </nav>
    </header>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/horoscope/components/SignHeader.jsx
git commit -m "feat(horoscope): SignHeader — знак и вкладки разделов"
```

---

### Задача C5. `LunarGrid.jsx` (таблица благоприятности)

**Files:**
- Create: `frontend/app/horoscope/components/LunarGrid.jsx`

**Step 1: Создать файл**

```jsx
'use client'
import { RATING_GLYPH, RATING_LABEL } from './icons'
import styles from '../horoscope.module.css'

const SPHERE_LABEL = {
  beauty: 'Красота и стрижка', money: 'Деньги и покупки', love: 'Любовь',
  affairs: 'Дела и начинания', health: 'Здоровье',
}
const RATING_CLASS = { good: 'rGood', neutral: 'rNeutral', bad: 'rBad' }

// spheres: getLunar(...).spheres [{ id, overview, ratings[30] }].
export default function LunarGrid({ spheres }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  return (
    <div className={styles.lunarGrid}>
      <table className={styles.lunarTable}>
        <thead>
          <tr>
            <th className={styles.lunarSphere}>Сфера</th>
            {days.map(d => <th key={d}>{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {spheres.map(s => (
            <tr key={s.id}>
              <td className={styles.lunarSphere}>{SPHERE_LABEL[s.id] ?? s.id}</td>
              {s.ratings.map((r, i) => (
                <td key={i} className={styles[RATING_CLASS[r]]} title={RATING_LABEL[r]}>
                  {RATING_GLYPH[r]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/horoscope/components/LunarGrid.jsx
git commit -m "feat(horoscope): LunarGrid — сетка благоприятности по сферам"
```

---

### Задача C6. `TodayView.jsx`

**Files:**
- Create: `frontend/app/horoscope/TodayView.jsx`

**Step 1: Создать файл**

```jsx
'use client'
import { getToday } from '../content/horoscope'
import SkyWidget from './components/SkyWidget'
import BlockCard from './components/BlockCard'
import styles from './horoscope.module.css'

// Порядок экрана (дизайн §6): небо -> настрой -> 4 платные сферы -> совет.
export default function TodayView({ sign, today, isSubscribed }) {
  const data = getToday(sign.id, today)
  const advice = data.blocks.find(b => b.id === 'advice')
  const body = data.blocks.filter(b => b.id !== 'advice')

  return (
    <div>
      <SkyWidget sky={data.sky} />
      {body.map(b => <BlockCard key={b.id} block={b} isSubscribed={isSubscribed} />)}
      {advice && <div className={styles.advice}>{typeof advice.text === 'string' ? advice.text : advice.text.teaser}</div>}
    </div>
  )
}
```

> `mood` (бесплатный настрой) и 4 платные сферы рендерятся через `BlockCard`; `advice` показывается отдельной строкой-послевкусием (бесплатный, закрывает экран).

**Step 2: Коммит**

```bash
git add frontend/app/horoscope/TodayView.jsx
git commit -m "feat(horoscope): TodayView — небо, настрой, сферы, совет"
```

---

### Задача C7. `PortraitView.jsx`

**Files:**
- Create: `frontend/app/horoscope/PortraitView.jsx`

**Step 1: Создать файл**

```jsx
'use client'
import { getPortrait } from '../content/horoscope'
import BlockCard from './components/BlockCard'

// 6 блоков по знаку (дизайн §7). core бесплатный, остальные платные.
export default function PortraitView({ sign, isSubscribed }) {
  const data = getPortrait(sign.id)
  return (
    <div>
      {data.blocks.map(b => <BlockCard key={b.id} block={b} isSubscribed={isSubscribed} />)}
    </div>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/horoscope/PortraitView.jsx
git commit -m "feat(horoscope): PortraitView — 6 блоков портрета знака"
```

---

### Задача C8. `LunarView.jsx`

**Files:**
- Create: `frontend/app/horoscope/LunarView.jsx`

**Step 1: Создать файл**

```jsx
'use client'
import { getLunar } from '../content/horoscope'
import BlockCard from './components/BlockCard'
import LunarGrid from './components/LunarGrid'
import styles from './horoscope.module.css'

// Сегодняшний лунный день (бесплатно) + платная секция «благоприятные дни» (дизайн §8).
export default function LunarView({ today, isSubscribed }) {
  const data = getLunar(today)
  const unlocked = isSubscribed

  return (
    <div>
      <div className={styles.block}>
        <div className={styles.blockName}>
          {data.phase.emoji} Лунный день {data.lunarDay}, {data.phase.name}
        </div>
        <p className={styles.blockText}>{data.todayMeaning}</p>
      </div>

      {unlocked ? (
        <div className={styles.block}>
          <div className={styles.blockName}>Благоприятные дни месяца</div>
          <LunarGrid spheres={data.spheres} />
          {data.spheres.map(s => (
            <p key={s.id} className={styles.skyText}>{s.overview}</p>
          ))}
        </div>
      ) : (
        <BlockCard
          block={{ id: 'calendar', name: 'Благоприятные дни месяца', free: false,
            text: { teaser: 'Календарь показывает, какие дни месяца хороши для красоты, денег, любви, дел и здоровья.', body: '' },
            bait: data.bait }}
          isSubscribed={isSubscribed}
        />
      )}
    </div>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/horoscope/LunarView.jsx
git commit -m "feat(horoscope): LunarView — лунный день + платная сетка"
```

---

### Задача C9. `HoroscopeClient.jsx` (оркестрация, память даты, вкладки)

**Files:**
- Create: `frontend/app/horoscope/HoroscopeClient.jsx` (перезаписывает старый; см. Задачу D2 по удалению остального стаба)

**Step 1: Создать/перезаписать файл**

```jsx
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  sign as getSign,
} from '../content/horoscope/astro'
import {
  loadBirthLocal, saveBirthLocal, fetchBirthFromProfile, saveBirthToProfile, normalizeBirth,
} from '../content/horoscope'
import SignHeader from './components/SignHeader'
import TodayView from './TodayView'
import PortraitView from './PortraitView'
import LunarView from './LunarView'
import { Sparkle } from './components/icons'
import styles from './horoscope.module.css'

export default function HoroscopeClient() {
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false

  const [birth, setBirth] = useState(null)   // 'YYYY-MM-DD' | null
  const [tab, setTab] = useState('today')
  const [ready, setReady] = useState(false)  // прочитали ли память
  const [draft, setDraft] = useState('')     // значение поля ввода

  // При входе тянем дату: сперва профиль (если залогинен), затем localStorage.
  useEffect(() => {
    let alive = true
    ;(async () => {
      let d = user ? await fetchBirthFromProfile() : null
      if (!d) d = loadBirthLocal()
      if (alive) { setBirth(d); setReady(true) }
    })()
    return () => { alive = false }
  }, [user])

  const submit = (e) => {
    e.preventDefault()
    const d = normalizeBirth(draft)
    if (!d) return
    if (user) saveBirthToProfile(d); else saveBirthLocal(d)
    setBirth(d)
  }

  const changeDate = () => { setDraft(birth ?? ''); setBirth(null) }

  // Экран ввода (память пуста или нажали «Ввести другую»).
  if (!ready) return <div className={styles.page} />
  if (!birth) {
    return (
      <div className={styles.page}>
        <form className={styles.form} onSubmit={submit}>
          <h1 className={styles.signName}>Гороскоп на сегодня</h1>
          <div className={styles.field}>
            <label className={styles.label}>Дата рождения</label>
            <input className={styles.input} type="date" value={draft} onChange={e => setDraft(e.target.value)} />
          </div>
          <span className={styles.lockNote}><Sparkle size={12} /> Нужна только дата рождения, знак определим сами</span>
          <button className={styles.btnPrimary} type="submit" disabled={!normalizeBirth(draft)}>Смотреть небо</button>
          {!user && <span className={styles.lockNote}>Войди, чтобы дата сохранилась на всех устройствах</span>}
        </form>
      </div>
    )
  }

  const sign = getSign(birth)
  const today = new Date()

  return (
    <div className={styles.page}>
      <SignHeader sign={sign} tab={tab} onTab={setTab} onChange={changeDate} />
      {tab === 'today'    && <TodayView sign={sign} today={today} isSubscribed={isSubscribed} />}
      {tab === 'portrait' && <PortraitView sign={sign} isSubscribed={isSubscribed} />}
      {tab === 'lunar'    && <LunarView today={today} isSubscribed={isSubscribed} />}
    </div>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/horoscope/HoroscopeClient.jsx
git commit -m "feat(horoscope): HoroscopeClient — вход в «Сегодня», память даты, вкладки"
```

---

### Задача C10. `page.jsx` и удаление старого стаба

**Files:**
- Modify: `frontend/app/horoscope/page.jsx`
- Delete: `frontend/app/horoscope/HoroscopeFreeResult.jsx`
- Delete: `frontend/app/horoscope/HoroscopePaidResult.jsx`
- Delete: `frontend/app/horoscope/results.module.css`
- Delete: `frontend/app/content/horoscope.js`

> `HoroscopeClient.jsx` уже перезаписан в C9. Здесь чистим маршрут и старую заглушку контента. Таблица знаков из `content/horoscope.js` уже перенесена в `astro.js` (Задача A1), поэтому файл можно удалять.

**Step 1: Перезаписать `page.jsx`** (клиент больше не принимает `product`)

```jsx
import HoroscopeClient from './HoroscopeClient'

export const metadata = {
  title: 'Гороскоп — знак, живое небо и лунный календарь',
  description: 'Гороскоп на сегодня по знаку зодиака, реальное состояние неба и лунный календарь.',
}

export default function HoroscopePage() {
  return <HoroscopeClient />
}
```

**Step 2: Удалить старые файлы стаба**

```bash
git rm frontend/app/horoscope/HoroscopeFreeResult.jsx \
       frontend/app/horoscope/HoroscopePaidResult.jsx \
       frontend/app/horoscope/results.module.css \
       frontend/app/content/horoscope.js
```

**Step 3: Проверить, что на старый стаб больше нет ссылок**

Run (Grep-ом или rg): поиск импортов старого контента и результатов.
```bash
grep -rn "content/horoscope'" frontend/app || echo "нет ссылок на старый content/horoscope.js"
grep -rn "getHoroscopeResult\|HoroscopeFreeResult\|HoroscopePaidResult" frontend/app || echo "нет ссылок на старые компоненты"
```
Expected: обе команды печатают строку «нет ссылок ...». Импорты `from '../content/horoscope'` в новых View указывают на папку `content/horoscope/` (её `index.js`), это корректно и в вывод первой команды попадать не должно, так как паттерн включает закрывающую кавычку `content/horoscope'` без слэша (папка резолвится как `content/horoscope`). Если grep всё же показывает новые импорты, сверить вручную, что они ведут на `content/horoscope/index.js`.

**Step 4: Коммит**

```bash
git add frontend/app/horoscope/page.jsx
git commit -m "feat(horoscope): маршрут на новый клиент, удаление старого стаба"
```

---

## Фаза D. Верификация

### Задача D1. Полный прогон тестов контента

**Step 1:**

Run:
```bash
node --test frontend/app/content/horoscope/astro.test.mjs frontend/app/content/horoscope/index.test.mjs
```
Expected: PASS, 14 тестов зелёные.

---

### Задача D2. Сборка проекта (Docker, один раз)

> `next build` только в Docker; `NODE_ENV=development` ломает сборку; скриншот-инструмента нет. Это финальная проверка компиляции всего продукта.

**Step 1:** Собрать фронтенд тем же способом, что принят в проекте (Docker-сборка фронта, `NODE_ENV=production`).

Expected: сборка проходит без ошибок; маршрут `/horoscope` компилируется. Ошибки импортов/JSX, если появятся, чинить точечно и пересобрать.

**Step 2 (ручная приёмка владельцем):** открыть `/horoscope`, проверить:
- вход сразу в «Сегодня» (после ввода даты), знак определён верно;
- живое небо показывает фазу, лунный день, планетарный день, ретрограды;
- переключение вкладок Сегодня / Портрет / Лунный календарь;
- бесплатные блоки открыты, платные показывают тизер + байт + кнопку -> `Paywall`;
- «Ввести другую» возвращает к форме, новая дата запоминается;
- тексты выводятся как плейсхолдеры `[текст: ...]` (наполнение будет отдельным брифом).

---

## Что дальше (вне этого плана)

- **Наполнение ~440 текстов** и реальная таблица ретроградов: отдельный бриф по образцу [docs/plans/2026-07-05-numerology-content-brief.md](docs/plans/2026-07-05-numerology-content-brief.md) и [docs/plans/2026-07-09-numerology-bait-brief.md](docs/plans/2026-07-09-numerology-bait-brief.md). Структура ключей (§12 дизайна) собрана под этот бриф.
- **Финальный визуал** (стили, иконки фаз/планет, анимации): дорабатывает владелец.
- **Задел на будущее** (совместимость знаков, натальная карта, серверная отдача платных тел, тизер на главной): структура готова, реализация не входит (дизайн §15).

---

## Сводка задач

| # | Задача | Тип | Тест |
|---|---|---|---|
| A1 | astro.sign | логика | node:test |
| A2 | moscowDayKey / dayVariantIndex | логика | node:test |
| A3 | moonPhase / lunarDay | логика | node:test |
| A4 | planetaryDay | логика | node:test |
| A5 | retrogrades + таблица | логика | node:test |
| B1 | scenarios.js | конфиг | косвенно |
| B2 | тексты-плейсхолдеры | данные | косвенно |
| B3 | bait.js | данные | косвенно |
| B4 | index.getBait | логика | node:test |
| B5 | index.getToday | логика | node:test |
| B6 | index.getPortrait / getLunar | логика | node:test |
| B7 | память даты (localStorage + профиль) | логика | node:test (normalizeBirth) |
| B8 | прогон тестов контента | верификация | node:test |
| C1 | иконки + CSS-модуль | UI | сборка |
| C2 | BlockCard | UI | сборка |
| C3 | SkyWidget | UI | сборка |
| C4 | SignHeader | UI | сборка |
| C5 | LunarGrid | UI | сборка |
| C6 | TodayView | UI | сборка |
| C7 | PortraitView | UI | сборка |
| C8 | LunarView | UI | сборка |
| C9 | HoroscopeClient | UI | сборка |
| C10 | page.jsx + удаление стаба | UI | сборка |
| D1 | прогон тестов | верификация | node:test |
| D2 | сборка + приёмка | верификация | Docker build |
