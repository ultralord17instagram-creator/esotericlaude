# Нумерология — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: используй superpowers:executing-plans, чтобы выполнять этот план задача за задачей.

**Goal:** Заменить клиентскую заглушку `/numerology` полноценным продуктом «Нумерология»: хаб на три сценария (Разбор, Совместимость, Прогноз) с детерминированным нумерологическим ядром, декларативным конфигом блоков, слоем плейсхолдер-текстов и freemium-гейтом по подписке.

**Architecture:** Чисто клиентский продукт по образцу «Матрицы» (свой толстый клиент, без бэкенда, без роутов и таблиц). Вся математика в одном источнике правды `content/numerology/numbers.js` (детерминированные функции), блоки описаны декларативно в `scenarios.js`, тексты лежат статикой в `texts/` и берутся через единую точку `index.js`. Гейт один: бесплатный блок открыт всегда, платные открывает `user.subscribed` из `AuthContext`. Память даты/имени в localStorage.

**Tech Stack:** Next.js 14 (App Router, JS/JSX), React 18, CSS Modules, lucide-react. Node 20 в контейнере `frontend` (Docker). Тесты чистых модулей через встроенный `node --test` (без новых зависимостей). Первоисточник дизайна: `docs/plans/2026-07-05-numerology-design.md`.

---

## Как это проверять (прочитать до старта)

Особенности проекта, которые определяют формат проверки:

1. **Node только в Docker.** На хосте node может отсутствовать. Все node-команды идут через сервис `frontend` из `docker-compose.dev.yml` (образ `node:20-alpine`, монтирует `./frontend` → `/app`).
2. **Тестового раннера в проекте нет** и мы его не добавляем. Для чистых детерминированных модулей (`numbers.js`, `index.js`) используем встроенный в Node 20 раннер `node --test` — ноль новых зависимостей.
3. **ESM-нюанс.** Контент-файлы написаны на `import/export`, но в корневом `frontend/package.json` нет `"type": "module"`, поэтому «сырой» node прочтёт `.js` в папке как CommonJS и упадёт. Решение (Задача 0): положить локальный `frontend/app/content/numerology/package.json` = `{"type":"module"}`. Он влияет только на то, как **node-раннер** резолвит модули в этой папке; сборщик Next компилирует эти файлы сам и этот флаг игнорирует, роутинг App Router его не трогает (папка `content/` не является роут-сегментом). Тест-файлы — с расширением `.mjs`.
4. **Никаких пофазных сборок.** `next build` НЕ запускаем после каждой задачи. Сборка один раз в финале (Задача 10). Важно: `NODE_ENV=development` ломает `next build`, поэтому финальную сборку запускать с `NODE_ENV=production`.
5. **React-UI не покрываем фейковыми тестами.** Для компонентов и клиентов — ручной чек-лист в браузере. Состояния подписки переключаются строкой `DEV_SESSION` в `frontend/app/devConfig.js` (`guest` / `free` / `subscriber`).
6. **Тексты не пишем.** Продукт выезжает с плейсхолдерами (см. §16 дизайна). Задача плана — структура ключей и рабочая механика, а не наполнение.
7. **Без длинного тире** в любых пользовательских строках (плейсхолдеры тоже): пользователь читает «—» как AI-tell. Запятые, двоеточия, скобки.

**Базовая команда тестов** (стек поднимать не нужно):

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps \
  -w /app/app/content/numerology frontend node --test
```

Если dev-стек уже поднят (`docker compose -f docker-compose.dev.yml up -d`), эквивалент:

```bash
docker compose -f docker-compose.dev.yml exec \
  -w /app/app/content/numerology frontend node --test
```

**Просмотр в браузере:** `docker compose -f docker-compose.dev.yml up -d`, открыть `http://localhost/numerology` (nginx на :80 проксирует фронт).

DRY, YAGNI, частые коммиты. Каждая задача заканчивается коммитом.

---

## Task 0: Каркас папки и тест-харнес

Готовим структуру и убеждаемся, что node-раннер видит папку как ESM.

**Files:**
- Create: `frontend/app/content/numerology/package.json`
- Create: `frontend/app/content/numerology/numbers.test.mjs` (временный smoke, заменится в Task 1)

**Step 1: Локальный package.json для ESM**

Создать `frontend/app/content/numerology/package.json`:

```json
{
  "type": "module"
}
```

**Step 2: Smoke-тест харнеса**

Создать `frontend/app/content/numerology/numbers.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'

test('харнес запускается', () => {
  assert.equal(1 + 1, 2)
})
```

**Step 3: Запустить и убедиться, что раннер работает**

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps \
  -w /app/app/content/numerology frontend node --test
```

Ожидаемо: `tests 1`, `pass 1`, `fail 0`. Это подтверждает, что связка «локальный `type:module` + `.mjs` + `node --test`» рабочая. Если раннер не находит файл или падает на ESM, чинить харнес здесь, до написания логики.

**Step 4: Commit**

```bash
git add frontend/app/content/numerology/package.json frontend/app/content/numerology/numbers.test.mjs
git commit -m "chore(numerology): scaffold content folder + node --test harness"
```

---

## Task 1: Числовое ядро `numbers.js` (TDD)

Единственный источник правды по формулам (дизайн §5, Приложения A и B). Всё детерминировано и чисто (никаких `new Date()` внутри расчётов — «сегодня» передаётся аргументом, чтобы тесты были воспроизводимы).

**Files:**
- Create: `frontend/app/content/numerology/numbers.js`
- Modify: `frontend/app/content/numerology/numbers.test.mjs` (заменить smoke на реальные тесты)

**Step 1: Написать падающие тесты**

Заменить содержимое `numbers.test.mjs`. Фикстуры взяты из Приложения B дизайна (дата `1990-11-29`, имя «Анна», «сегодня» `2026-07-05`) и проверены вручную:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  reduceKeepMaster, reduceToDigit,
  lifePath, expression, soul,
  personalYear, personalMonth, personalDay,
  pairNumber, pairKey, nameCompat,
  moscowDayKey, dayVariantIndex,
} from './numbers.js'

// Полдень UTC, чтобы TZ-сдвиг Москвы (+3) не перекинул дату на соседнюю.
const TODAY = new Date('2026-07-05T12:00:00Z')

test('reduceKeepMaster сохраняет 11 и 22', () => {
  assert.equal(reduceKeepMaster(29), 11)   // 2+9
  assert.equal(reduceKeepMaster(38), 11)   // 3+8
  assert.equal(reduceKeepMaster(2299), 22) // 2+2+9+9=22
  assert.equal(reduceKeepMaster(19), 1)    // 19->10->1
  assert.equal(reduceKeepMaster(11), 11)
  assert.equal(reduceKeepMaster(22), 22)
})

test('reduceToDigit сводит до 1..9 без мастер-чисел', () => {
  assert.equal(reduceToDigit(11), 2)
  assert.equal(reduceToDigit(29), 2)
  assert.equal(reduceToDigit(2026), 1)
})

test('lifePath из ISO-даты', () => {
  assert.equal(lifePath('1990-11-29'), 5)
})

test('expression и soul по имени (кириллица)', () => {
  assert.equal(expression('Анна'), 5) // а1+н6+н6+а1=14->5
  assert.equal(soul('Анна'), 2)       // гласные а,а: 1+1
})

test('expression по латинице', () => {
  assert.equal(expression('Anna'), 3) // a1+n5+n5+a1=12->3
})

test('персональные циклы день/месяц/год', () => {
  assert.equal(personalYear('1990-11-29', TODAY), 5)
  assert.equal(personalMonth('1990-11-29', TODAY), 3)
  assert.equal(personalDay('1990-11-29', TODAY), 8)
})

test('парные числа и ключ пары', () => {
  assert.equal(pairNumber(5, 8), 4)        // reduceKeepMaster(13)
  assert.equal(pairKey(5, 8), '5-8')
  assert.equal(pairKey(8, 5), '5-8')       // неупорядоченная
  assert.equal(pairKey(8, 11), '8-11')     // числовая сортировка, не строковая
  assert.equal(pairKey(11, 22), '11-22')
  assert.equal(nameCompat(5, 6), 11)       // reduceKeepMaster(11) сохраняет мастер
})

test('moscowDayKey и dayVariantIndex детерминированы', () => {
  assert.equal(moscowDayKey(TODAY), 20260705)
  assert.equal(dayVariantIndex(TODAY, 4), 1) // 20260705 % 4
})
```

> Все ожидаемые значения выше сверены вручную с Приложениями A/B дизайна (кириллица `Анна`, латиница `Anna`, парные ключи, персональные циклы, `moscowDayKey`). Если какой-то ассерт не сойдётся — сначала перепроверить реализацию `numbers.js`, а не подгонять фикстуру.

**Step 2: Запустить, убедиться что падает**

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps \
  -w /app/app/content/numerology frontend node --test
```

Ожидаемо: FAIL, `Cannot find module './numbers.js'` (файла ещё нет).

**Step 3: Реализовать `numbers.js`**

```js
// Единственный источник правды по нумерологическим формулам (дизайн §5, Прил. A/B).
// Всё детерминировано и чисто: «сегодня» передаётся аргументом.

// ── Таблицы букв → числа (Приложение A) ──────────────────────────────────────
const CYRILLIC = {
  а:1, б:2, в:3, г:4, д:5, е:6, ё:7, ж:8, з:9,
  и:1, й:2, к:3, л:4, м:5, н:6, о:7, п:8, р:9,
  с:1, т:2, у:3, ф:4, х:5, ц:6, ч:7, ш:8, щ:9,
  ъ:1, ы:2, ь:3, э:4, ю:5, я:6,
}
const LATIN = {
  a:1, b:2, c:3, d:4, e:5, f:6, g:7, h:8, i:9,
  j:1, k:2, l:3, m:4, n:5, o:6, p:7, q:8, r:9,
  s:1, t:2, u:3, v:4, w:5, x:6, y:7, z:8,
}
const CYR_VOWELS = new Set(['а','е','ё','и','о','у','ы','э','ю','я'])
const LAT_VOWELS = new Set(['a','e','i','o','u']) // y — согласная

function letterValue(ch) {
  return CYRILLIC[ch] ?? LATIN[ch] ?? 0
}
function isVowel(ch) {
  return CYR_VOWELS.has(ch) || LAT_VOWELS.has(ch)
}
function letters(name) {
  return String(name).toLowerCase().split('').filter(ch => ch in CYRILLIC || ch in LATIN)
}

// ── Свёртки ─────────────────────────────────────────────────────────────────
export function reduceKeepMaster(n) {
  while (n > 9 && n !== 11 && n !== 22) {
    n = String(n).split('').reduce((a, d) => a + Number(d), 0)
  }
  return n
}
export function reduceToDigit(n) {
  while (n > 9) {
    n = String(n).split('').reduce((a, d) => a + Number(d), 0)
  }
  return n
}

// ── Разбор ISO-даты 'YYYY-MM-DD' ─────────────────────────────────────────────
function parseISO(date) {
  const [y, m, d] = String(date).split('-').map(Number)
  return { y, m, d }
}

// ── Идентификационные числа (11/22 сохраняются) ──────────────────────────────
export function lifePath(date) {
  const { y, m, d } = parseISO(date)
  const dd = reduceKeepMaster(d)
  const mm = reduceKeepMaster(m)
  const yy = reduceKeepMaster(y)
  return reduceKeepMaster(dd + mm + yy)
}
export function expression(name) {
  const sum = letters(name).reduce((a, ch) => a + letterValue(ch), 0)
  return reduceKeepMaster(sum)
}
export function soul(name) {
  const sum = letters(name).filter(isVowel).reduce((a, ch) => a + letterValue(ch), 0)
  return reduceKeepMaster(sum)
}

// ── «Сегодня» в TZ проекта (Europe/Moscow) ───────────────────────────────────
// Дублируется из Таро намеренно: продукты не связываем импортами между собой.
export function moscowDayKey(date = new Date()) {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
  const [y, m, d] = s.split('-').map(Number)
  return y * 10000 + m * 100 + d
}
function moscowParts(date = new Date()) {
  const key = moscowDayKey(date)
  return { y: Math.floor(key / 10000), m: Math.floor(key / 100) % 100, d: key % 100 }
}

// ── Персональные циклы (сводятся к 1..9, без мастер-чисел) ────────────────────
export function personalYear(birthDate, today = new Date()) {
  const b = parseISO(birthDate)
  const t = moscowParts(today)
  return reduceToDigit(reduceToDigit(b.d) + reduceToDigit(b.m) + reduceToDigit(t.y))
}
export function personalMonth(birthDate, today = new Date()) {
  return reduceToDigit(personalYear(birthDate, today) + moscowParts(today).m)
}
export function personalDay(birthDate, today = new Date()) {
  return reduceToDigit(personalMonth(birthDate, today) + moscowParts(today).d)
}

// ── Парные числа (Совместимость) ─────────────────────────────────────────────
export function pairNumber(lp1, lp2) {
  return reduceKeepMaster(lp1 + lp2)
}
export function pairKey(a, b) {
  return [a, b].sort((x, y) => x - y).join('-') // числовая сортировка
}
export function nameCompat(expr1, expr2) {
  return reduceKeepMaster(expr1 + expr2)
}

// ── Выбор варианта «Дня» ─────────────────────────────────────────────────────
export function dayVariantIndex(today = new Date(), count = 1) {
  return count > 0 ? moscowDayKey(today) % count : 0
}
```

**Step 4: Запустить тесты, убедиться что проходят**

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps \
  -w /app/app/content/numerology frontend node --test
```

Ожидаемо: все тесты PASS. Если `expression('Anna')` или `nameCompat` не сошлись — исправить ОЖИДАЕМОЕ значение в тесте по факту таблицы (это фикстуры, не логика), кириллические кейсы должны совпасть без правок.

**Step 5: Commit**

```bash
git add frontend/app/content/numerology/numbers.js frontend/app/content/numerology/numbers.test.mjs
git commit -m "feat(numerology): deterministic number core (life path, expression, soul, cycles, pairs)"
```

---

## Task 2: Конфиг сценариев `scenarios.js`

Декларативное описание блоков (дизайн §12.2). Код читает конфиг, а не хардкодит блоки.

**Files:**
- Create: `frontend/app/content/numerology/scenarios.js`
- Create: `frontend/app/content/numerology/scenarios.test.mjs`

**Step 1: Написать тест-проверку целостности конфига**

Создать `scenarios.test.mjs` (лёгкая структурная проверка, не бизнес-логика):

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SCENARIOS } from './scenarios.js'

test('в каждом наборе блоков ровно один бесплатный', () => {
  assert.equal(SCENARIOS.breakdown.blocks.filter(b => b.free).length, 1)
  assert.equal(SCENARIOS.compatibility.blocks.filter(b => b.free).length, 1)
  assert.equal(SCENARIOS.forecast.horizons.month.blocks.filter(b => b.free).length, 1)
  assert.equal(SCENARIOS.forecast.horizons.year.blocks.filter(b => b.free).length, 1)
})

test('id блоков уникальны внутри сценария', () => {
  for (const key of ['breakdown', 'compatibility']) {
    const ids = SCENARIOS[key].blocks.map(b => b.id)
    assert.equal(new Set(ids).size, ids.length, `дубль id в ${key}`)
  }
})
```

**Step 2: Запустить, убедиться что падает** (нет файла).

**Step 3: Реализовать `scenarios.js`** — перенести конфиг из §12.2 дизайна дословно:

```js
// Конфиг блоков сценариев (дизайн §12.2). basis — какое число из numbers.js
// считается для блока; free — открыт без подписки; hot — считается по ключу пары;
// nameTouch — вплетается именной штрих; showcase — витринный продающий блок.
export const SCENARIOS = {
  breakdown: {
    inputs: ['date', 'name'],
    blocks: [
      { id: 'destiny',  name: 'Судьба и предназначение', basis: 'lifePath',   free: true  },
      { id: 'karma',    name: 'Кармический урок',        basis: 'lifePath',   free: false },
      { id: 'ancestry', name: 'Ресурс рода',             basis: 'lifePath',   free: false },
      { id: 'talents',  name: 'Таланты и самовыражение', basis: 'expression', free: false },
      { id: 'love',     name: 'Любовь и отношения',      basis: 'soul',       free: false },
      { id: 'money',    name: 'Деньги и достаток',       basis: 'lifePath',   free: false },
    ],
  },
  compatibility: {
    inputs: ['date', 'name', 'date2', 'name2'],
    blocks: [
      { id: 'general',  name: 'Общее',                basis: 'pairNumber', hot: false, free: true,  nameTouch: true  },
      { id: 'passion',  name: 'Страсть и близость',   basis: 'pairKey',    hot: true,  free: false, nameTouch: true  },
      { id: 'daily',    name: 'Быт и повседневность', basis: 'pairNumber', hot: false, free: false },
      { id: 'money',    name: 'Деньги вместе',        basis: 'pairNumber', hot: false, free: false },
      { id: 'fidelity', name: 'Шанс измены',          basis: 'pairKey',    hot: true,  free: false, showcase: true },
      { id: 'conflict', name: 'Конфликты и трения',   basis: 'pairNumber', hot: false, free: false },
      { id: 'future',   name: 'Перспектива союза',    basis: 'pairKey',    hot: true,  free: false, showcase: true },
    ],
  },
  forecast: {
    inputs: ['date'],
    horizons: {
      day:   { free: true, variants: true },
      month: { basis: 'personalMonth', blocks: [
        { id: 'mood',    name: 'Настроение месяца',       free: true  },
        { id: 'love',    name: 'Отношения в этом месяце', free: false },
        { id: 'money',   name: 'Дела и деньги',           free: false },
        { id: 'focus',   name: 'Фокус месяца',            free: false },
        { id: 'warning', name: 'Предостережение',         free: false },
      ] },
      year:  { basis: 'personalYear', blocks: [
        { id: 'theme',     name: 'Тема года',          free: true  },
        { id: 'love',      name: 'Любовь в этом году', free: false },
        { id: 'money',     name: 'Деньги и работа',    free: false },
        { id: 'challenge', name: 'Вызов года',         free: false },
        { id: 'advice',    name: 'Совет',              free: false },
      ] },
    },
  },
}
```

**Step 4: Запустить тесты, PASS.**

**Step 5: Commit**

```bash
git add frontend/app/content/numerology/scenarios.js frontend/app/content/numerology/scenarios.test.mjs
git commit -m "feat(numerology): declarative scenario/block config"
```

---

## Task 3: Плейсхолдер-тексты + резолвер `getText`

Тексты (~450 штук) пишутся отдельным чатом (дизайн §16). Здесь закладываем ТОЛЬКО структуру ключей и рабочий фолбэк, чтобы UI рендерился без падений. Файлы стартуют почти пустыми; `getText` возвращает видимый плейсхолдер для отсутствующего ключа.

**Files:**
- Create: `frontend/app/content/numerology/texts/breakdown.js`
- Create: `frontend/app/content/numerology/texts/compatibility.js`
- Create: `frontend/app/content/numerology/texts/forecast_day.js`
- Create: `frontend/app/content/numerology/texts/forecast_month.js`
- Create: `frontend/app/content/numerology/texts/forecast_year.js`

**Step 1: Наборы ключей.** Значения чисел (дизайн §5): идентификационные `KEYS_11 = [1..9, 11, 22]`; циклы `KEYS_9 = [1..9]`; ключи пар — 66 сочетаний из `KEYS_11`.

Создать `texts/breakdown.js` (плейсхолдеры для платных блоков — объекты `{teaser, body}`, для бесплатного `destiny` — строки):

```js
// Разбор: { blockId: { <число>: текст } }. Платные тексты — { teaser, body }.
// Бесплатный destiny — цельная строка. Реальные тексты пишутся отдельным чатом.
// Пустой объект = все ключи резолвятся в плейсхолдер (см. index.js getText).
export const BREAKDOWN_TEXTS = {
  destiny:  {}, // free, строки по числу 1..9,11,22
  karma:    {}, // { teaser, body } по числу
  ancestry: {},
  talents:  {},
  love:     {},
  money:    {},
}
```

Создать `texts/compatibility.js`:

```js
// Совместимость. hot — по ключу пары ('5-8'); background — по числу пары; nameTouch — по числу.
export const COMPATIBILITY_TEXTS = {
  hot: {
    passion:  {}, // { '1-1': {teaser,body}, ... } — но passion free? нет, платный
    fidelity: {},
    future:   {},
  },
  background: {
    general:  {}, // free, строки по числу пары
    daily:    {},
    money:    {},
    conflict: {},
  },
  nameTouch: {
    general: {}, // штрих к бесплатному Общему: строки по числу
    passion: {}, // штрих к платной Страсти
  },
}
```

Создать `texts/forecast_day.js`:

```js
// День: { <число 1..9>: ['вариант1', 'вариант2', 'вариант3', 'вариант4'] }. Всё бесплатно.
export const FORECAST_DAY_TEXTS = {
  // 1: ['...', '...', '...', '...'],
}
```

Создать `texts/forecast_month.js` и `texts/forecast_year.js`:

```js
// Месяц: { blockId: { <число 1..9>: текст } }. mood — free (строки), остальные { teaser, body }.
export const FORECAST_MONTH_TEXTS = {
  mood: {}, love: {}, money: {}, focus: {}, warning: {},
}
```

```js
// Год: { blockId: { <число 1..9>: текст } }. theme — free (строки), остальные { teaser, body }.
export const FORECAST_YEAR_TEXTS = {
  theme: {}, love: {}, money: {}, challenge: {}, advice: {},
}
```

**Step 2: Commit** (резолвер getText будет в Task 4 вместе с тестами)

```bash
git add frontend/app/content/numerology/texts/
git commit -m "feat(numerology): text placeholders with final key shape"
```

---

## Task 4: Точка доступа `index.js` (TDD)

Единая сборка результата сценария + резолвер текста с плейсхолдер-фолбэком + помощники localStorage-профиля (дизайн §12.4, §14).

**Files:**
- Create: `frontend/app/content/numerology/index.js`
- Create: `frontend/app/content/numerology/index.test.mjs`

**Step 1: Написать падающие тесты** (`index.test.mjs`). localStorage-помощники не тестируем в node (нет DOM) — только чистые: `getText`-фолбэк и сборку блоков.

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getText, buildBreakdown, buildForecast } from './index.js'

const TODAY = new Date('2026-07-05T12:00:00Z')

test('getText: отсутствующий ключ даёт видимый плейсхолдер, не падает', () => {
  const t = getText({ scenario: 'breakdown', block: 'karma', key: 5 })
  // платный блок -> { teaser, body }, оба строки-плейсхолдеры
  assert.equal(typeof t.teaser, 'string')
  assert.equal(typeof t.body, 'string')
  assert.match(t.body, /karma/)
})

test('getText: бесплатный блок возвращает строку', () => {
  const t = getText({ scenario: 'breakdown', block: 'destiny', key: 5 })
  assert.equal(typeof t, 'string')
})

test('buildBreakdown собирает 6 блоков с числами и флагом free', () => {
  const r = buildBreakdown({ date: '1990-11-29', name: 'Анна' })
  assert.equal(r.blocks.length, 6)
  const destiny = r.blocks.find(b => b.id === 'destiny')
  assert.equal(destiny.number, 5)
  assert.equal(destiny.free, true)
  const talents = r.blocks.find(b => b.id === 'talents')
  assert.equal(talents.number, 5) // expression('Анна')
})

test('buildForecast(day) выбирает вариант детерминированно и он бесплатный', () => {
  const r = buildForecast({ date: '1990-11-29', horizon: 'day', today: TODAY })
  assert.equal(r.number, 8) // personalDay
  assert.equal(r.free, true)
})
```

**Step 2: Запустить, убедиться что падает** (нет файла).

**Step 3: Реализовать `index.js`**

```js
import { SCENARIOS } from './scenarios.js'
import * as N from './numbers.js'
import { BREAKDOWN_TEXTS } from './texts/breakdown.js'
import { COMPATIBILITY_TEXTS } from './texts/compatibility.js'
import { FORECAST_DAY_TEXTS } from './texts/forecast_day.js'
import { FORECAST_MONTH_TEXTS } from './texts/forecast_month.js'
import { FORECAST_YEAR_TEXTS } from './texts/forecast_year.js'

const PLACEHOLDER_TEASER = (label) => `[тизер: ${label}]`
const PLACEHOLDER_BODY = (label) => `[текст: ${label}]`
const PLACEHOLDER_FREE = (label) => `[текст: ${label}]`

// Считает число блока по его basis из конфига.
function blockNumber(basis, ctx) {
  switch (basis) {
    case 'lifePath':   return N.lifePath(ctx.date)
    case 'expression': return N.expression(ctx.name)
    case 'soul':       return N.soul(ctx.name)
    case 'pairNumber': return N.pairNumber(ctx.lp1, ctx.lp2)
    case 'pairKey':    return N.pairKey(ctx.lp1, ctx.lp2)
    case 'personalMonth': return N.personalMonth(ctx.date, ctx.today)
    case 'personalYear':  return N.personalYear(ctx.date, ctx.today)
    default: return null
  }
}

// Достаёт сырой текст из нужного набора по (scenario, block, key). undefined если нет.
function rawText({ scenario, block, key, group }) {
  if (scenario === 'breakdown') return BREAKDOWN_TEXTS[block]?.[key]
  if (scenario === 'compatibility') {
    if (group === 'nameTouch') return COMPATIBILITY_TEXTS.nameTouch[block]?.[key]
    return (COMPATIBILITY_TEXTS.hot[block] ?? COMPATIBILITY_TEXTS.background[block])?.[key]
  }
  if (scenario === 'month') return FORECAST_MONTH_TEXTS[block]?.[key]
  if (scenario === 'year')  return FORECAST_YEAR_TEXTS[block]?.[key]
  if (scenario === 'day')   return FORECAST_DAY_TEXTS[key]
  return undefined
}

// Единая точка доступа. free блок -> строка; платный -> { teaser, body }.
// Отсутствующий ключ -> видимый плейсхолдер (структура важнее наполнения на этом этапе).
export function getText({ scenario, block, key, free = false, group }) {
  const label = `${scenario}.${block ?? ''}.${key}`
  const raw = rawText({ scenario, block, key, group })
  if (free) return typeof raw === 'string' ? raw : PLACEHOLDER_FREE(label)
  // платный: ожидаем { teaser, body }
  if (raw && typeof raw === 'object') {
    return { teaser: raw.teaser ?? PLACEHOLDER_TEASER(label), body: raw.body ?? PLACEHOLDER_BODY(label) }
  }
  return { teaser: PLACEHOLDER_TEASER(label), body: PLACEHOLDER_BODY(label) }
}

// ── Сборка результатов сценариев ─────────────────────────────────────────────
export function buildBreakdown({ date, name }) {
  const ctx = { date, name }
  const blocks = SCENARIOS.breakdown.blocks.map(b => {
    const number = blockNumber(b.basis, ctx)
    return {
      id: b.id, name: b.name, number, free: !!b.free,
      text: getText({ scenario: 'breakdown', block: b.id, key: number, free: b.free }),
    }
  })
  return { blocks }
}

export function buildCompatibility({ date, name, date2, name2 }) {
  const lp1 = N.lifePath(date), lp2 = N.lifePath(date2)
  const nameKey = N.nameCompat(N.expression(name), N.expression(name2))
  const ctx = { lp1, lp2 }
  const blocks = SCENARIOS.compatibility.blocks.map(b => {
    const number = blockNumber(b.basis, ctx) // число пары или ключ пары
    const block = {
      id: b.id, name: b.name, number, free: !!b.free, hot: !!b.hot, showcase: !!b.showcase,
      text: getText({ scenario: 'compatibility', block: b.id, key: number, free: b.free }),
    }
    if (b.nameTouch) {
      block.nameTouch = getText({
        scenario: 'compatibility', block: b.id, key: nameKey, group: 'nameTouch', free: b.free,
      })
    }
    return block
  })
  return { blocks, lp1, lp2, nameKey }
}

export function buildForecast({ date, horizon, today = new Date() }) {
  if (horizon === 'day') {
    const number = N.personalDay(date, today)
    const variants = FORECAST_DAY_TEXTS[number]
    const count = Array.isArray(variants) ? variants.length : 0
    const idx = N.dayVariantIndex(today, count || 1)
    const text = count > 0 ? variants[idx] : `[текст: day.${number} (вариант ${idx})]`
    return { horizon: 'day', number, free: true, text }
  }
  const conf = SCENARIOS.forecast.horizons[horizon] // month | year
  const number = blockNumber(conf.basis, { date, today })
  const blocks = conf.blocks.map(b => ({
    id: b.id, name: b.name, number, free: !!b.free,
    text: getText({ scenario: horizon, block: b.id, key: number, free: b.free }),
  }))
  return { horizon, number, blocks }
}

// ── localStorage-профиль (дизайн §14). Только браузер. ────────────────────────
const PROFILE_KEY = 'numerology.profile'
export function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { return null }
}
export function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)) } catch {}
}
export function clearProfile() {
  try { localStorage.removeItem(PROFILE_KEY) } catch {}
}
```

**Step 4: Запустить тесты, PASS.**

**Step 5: Commit**

```bash
git add frontend/app/content/numerology/index.js frontend/app/content/numerology/index.test.mjs
git commit -m "feat(numerology): result assembly, getText resolver, localStorage profile"
```

---

## Task 5: Общие UI-компоненты

Функциональная структура (финальный визуал за Claude Design, дизайн §16). Паттерн пейвола повторяет `MatrixInterpretations` (тизер + `<Paywall/>` в `Modal`).

**Files:**
- Create: `frontend/app/numerology/components/BlockCard.jsx`
- Create: `frontend/app/numerology/components/NumberBadge.jsx`
- Create: `frontend/app/numerology/components/ScenarioCard.jsx`
- Create: `frontend/app/numerology/components/CompatibilityForm.jsx`
- Create: `frontend/app/numerology/numerology.module.css`

**Step 1: `NumberBadge.jsx`** — крупное число с пометкой мастер-числа:

```jsx
import styles from '../numerology.module.css'

export default function NumberBadge({ number, label }) {
  const isMaster = number === 11 || number === 22
  return (
    <div className={styles.badge}>
      <span className={styles.badgeNum}>{number}</span>
      {isMaster && <span className={styles.badgeMaster}>мастер-число</span>}
      {label && <span className={styles.badgeLabel}>{label}</span>}
    </div>
  )
}
```

**Step 2: `BlockCard.jsx`** — рендер блока с гейтом. `text` — строка (free) или `{teaser, body}` (платный):

```jsx
'use client'
import { useState } from 'react'
import Paywall from '../../components/ui/Paywall'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import styles from '../numerology.module.css'

// free блок или подписчик -> полный текст. Платный без подписки -> тизер + замок.
export default function BlockCard({ title, number, text, free, isSubscribed, nameTouch }) {
  const [payOpen, setPayOpen] = useState(false)
  const unlocked = free || isSubscribed

  const full = typeof text === 'string' ? text : `${text.teaser} ${text.body}`
  const teaser = typeof text === 'string' ? text : text.teaser

  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <h3 className={styles.blockTitle}>{title}</h3>
        {number != null && <span className={styles.blockNum}>{number}</span>}
      </div>

      {unlocked ? (
        <p className={styles.blockText}>{full}</p>
      ) : (
        <div className={styles.blockLocked}>
          <p className={styles.blockTeaser}>{teaser}</p>
          <Button variant="unlock" size="sm" onClick={() => setPayOpen(true)}>
            Открыть полный разбор
          </Button>
        </div>
      )}

      {nameTouch && unlocked && <p className={styles.blockNameTouch}>{nameTouch}</p>}

      {!isSubscribed && (
        <Modal open={payOpen} onClose={() => setPayOpen(false)}>
          <Paywall />
        </Modal>
      )}
    </div>
  )
}
```

> Примечание: для платного блока `nameTouch` тоже приходит как `{teaser, body}`. Показываем только когда `unlocked`; для бесплатного `general` штрих виден всегда (это часть free-крючка). Если нужно показывать тизер штриха и под замком — доработать при разметке контента, сейчас держим просто.

**Step 3: `ScenarioCard.jsx`** — карточка сценария на хабе (по образцу `spreadCard` в Таро):

```jsx
import Link from 'next/link'
import styles from '../numerology.module.css'

export default function ScenarioCard({ href, name, desc, meta }) {
  return (
    <Link href={href} className={styles.scenarioCard}>
      <div className={styles.scenarioName}>{name}</div>
      <div className={styles.scenarioDesc}>{desc}</div>
      <div className={styles.scenarioMeta}>{meta}</div>
    </Link>
  )
}
```

**Step 4: `CompatibilityForm.jsx`** — форма на двоих (2 даты + 2 имени; общий `ProductInputForm` не подходит):

```jsx
'use client'
import { useState } from 'react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import styles from '../numerology.module.css'

export default function CompatibilityForm({ initial, onSubmit }) {
  const [v, setV] = useState(initial ?? { date: '', name: '', date2: '', name2: '' })
  const set = (k, val) => setV(s => ({ ...s, [k]: val }))
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(v)
    setLoading(false)
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.pairCol}>
        <p className={styles.pairLabel}>Первый человек</p>
        <Input label="Дата рождения" id="date" type="date" required value={v.date} onChange={e => set('date', e.target.value)} />
        <Input label="Имя" id="name" type="text" required placeholder="Имя" value={v.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className={styles.pairCol}>
        <p className={styles.pairLabel}>Второй человек</p>
        <Input label="Дата рождения" id="date2" type="date" required value={v.date2} onChange={e => set('date2', e.target.value)} />
        <Input label="Имя" id="name2" type="text" required placeholder="Имя" value={v.name2} onChange={e => set('name2', e.target.value)} />
      </div>
      <Button type="submit" size="lg" disabled={loading}>{loading ? 'Считаем...' : 'Проверить пару'}</Button>
    </form>
  )
}
```

**Step 5: `numerology.module.css`** — стартовые классы (плейсхолдер-стиль, доводится в Claude Design). Собрать классы, использованные выше: `.page .head .eyebrow .title .subtitle .scenarioGrid .scenarioCard .scenarioName .scenarioDesc .scenarioMeta .form .pairCol .pairLabel .block .blockHead .blockTitle .blockNum .blockText .blockLocked .blockTeaser .blockNameTouch .badge .badgeNum .badgeMaster .badgeLabel .tabs .tab .resetBtn .backLink`. Минимальный, читаемый CSS (можно опереться на `matrix.module.css` и `tarot.module.css` как референс переменных темы).

**Step 6: Проверка** — компоненты изолированно не запускаем; их проверим в браузере в задачах 6-9. Здесь только убедиться, что импорты путей корректны (`../../components/ui/...`).

**Step 7: Commit**

```bash
git add frontend/app/numerology/components/ frontend/app/numerology/numerology.module.css
git commit -m "feat(numerology): shared UI components (BlockCard, NumberBadge, ScenarioCard, CompatibilityForm)"
```

---

## Task 6: Хаб `/numerology` (заменяет заглушку)

Заменяем `page.jsx`, удаляем клиент/результаты заглушки. Хаб — три карточки сценариев.

**Files:**
- Create: `frontend/app/numerology/HubClient.jsx`
- Modify: `frontend/app/numerology/page.jsx`
- Delete: `frontend/app/numerology/NumerologyClient.jsx`
- Delete: `frontend/app/numerology/NumerologyFreeResult.jsx`
- Delete: `frontend/app/numerology/NumerologyPaidResult.jsx`
- Delete: `frontend/app/numerology/results.module.css`

**Step 1: `HubClient.jsx`**

```jsx
'use client'
import ScenarioCard from './components/ScenarioCard'
import styles from './numerology.module.css'

const SCENARIOS = [
  { id: 'breakdown',     name: 'Разбор',        desc: 'Портрет по дате и имени, 6 сфер',      meta: 'дата + имя' },
  { id: 'compatibility', name: 'Совместимость', desc: 'Анализ пары, 7 граней связи',          meta: '2 даты + 2 имени' },
  { id: 'forecast',      name: 'Прогноз',       desc: 'День, месяц и год по твоим числам',    meta: 'по дате рождения' },
]

export default function HubClient() {
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>Эзотерический хаб</p>
        <h1 className={styles.title}>Нумерология</h1>
        <p className={styles.subtitle}>Выбери, что посчитать: себя, пару или ближайшее время.</p>
      </div>
      <div className={styles.scenarioGrid}>
        {SCENARIOS.map(s => (
          <ScenarioCard key={s.id} href={`/numerology/${s.id}`} {...s} />
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Заменить `page.jsx`**

```jsx
import HubClient from './HubClient'

export const metadata = {
  title: 'Нумерология — числа твоей судьбы',
  description: 'Разбор личности, совместимость пары и персональный прогноз по дате рождения и имени.',
}

export default function NumerologyPage() {
  return <HubClient />
}
```

**Step 3: Удалить файлы заглушки**

```bash
git rm frontend/app/numerology/NumerologyClient.jsx \
       frontend/app/numerology/NumerologyFreeResult.jsx \
       frontend/app/numerology/NumerologyPaidResult.jsx \
       frontend/app/numerology/results.module.css
```

**Step 4: Проверка в браузере**

Поднять стек (если не поднят): `docker compose -f docker-compose.dev.yml up -d`. Открыть `http://localhost/numerology`. Ожидаемо: три карточки сценариев, клики ведут на `/numerology/breakdown|compatibility|forecast` (пока 404 у под-роутов, это норм до задач 7-9). Заглушка (форма «дата + имя») больше не показывается.

**Step 5: Commit**

```bash
git add frontend/app/numerology/HubClient.jsx frontend/app/numerology/page.jsx
git commit -m "feat(numerology): replace stub with scenario hub"
```

---

## Task 7: Сценарий «Разбор»

Форма (дата + имя) → 6 блоков. Память профиля + «Ввести другую».

**Files:**
- Create: `frontend/app/numerology/breakdown/page.jsx`
- Create: `frontend/app/numerology/breakdown/BreakdownClient.jsx`

**Step 1: `page.jsx`**

```jsx
import { getProduct } from '../../products.config'
import BreakdownClient from './BreakdownClient'

export const metadata = { title: 'Нумерология — Разбор личности' }

export default function BreakdownPage() {
  return <BreakdownClient product={getProduct('numerology')} />
}
```

**Step 2: `BreakdownClient.jsx`** — форма/результат по образцу `MatrixClient`, но с localStorage-памятью и общей формой `ProductInputForm`:

```jsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import ProductInputForm from '../../components/ProductInputForm'
import { buildBreakdown, loadProfile, saveProfile } from '../../content/numerology'
import BlockCard from '../components/BlockCard'
import NumberBadge from '../components/NumberBadge'
import styles from '../numerology.module.css'

export default function BreakdownClient({ product }) {
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false
  const [result, setResult] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => { setProfile(loadProfile()) }, [])

  const run = (date, name) => {
    saveProfile({ date, name })
    setProfile({ date, name })
    setResult(buildBreakdown({ date, name }))
  }

  const handleSubmit = (inputs) => {
    const date = inputs.birth_date
    const name = inputs.name
    if (!date || !name) return
    run(date, name)
  }

  // Форма ввода (общая ProductInputForm требует birth_date + name — уже настроено в реестре).
  if (!result) {
    return (
      <div className={styles.page}>
        <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
        <div className={styles.head}>
          <h1 className={styles.title}>Разбор личности</h1>
          <p className={styles.subtitle}>Дата рождения и имя раскроют шесть сфер твоей натуры.</p>
        </div>
        <ProductInputForm product={product} onSubmit={handleSubmit} />
        {profile && (
          <button className={styles.resetBtn} onClick={() => run(profile.date, profile.name)}>
            Повторить последний разбор ({profile.name})
          </button>
        )}
      </div>
    )
  }

  const destiny = result.blocks.find(b => b.free)
  return (
    <div className={styles.page}>
      <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
      <NumberBadge number={destiny.number} label="Число жизненного пути" />
      {result.blocks.map(b => (
        <BlockCard key={b.id} title={b.name} number={b.number} text={b.text} free={b.free} isSubscribed={isSubscribed} />
      ))}
      <button className={styles.resetBtn} onClick={() => setResult(null)}>Ввести другую</button>
    </div>
  )
}
```

**Step 3: Проверка в браузере** (`http://localhost/numerology/breakdown`):
- Ввести дату `1990-11-29` и имя «Анна» → 6 блоков, у «Судьба» число `5`, бейдж «Число жизненного пути 5».
- Блок «Судьба» показан целиком (free); остальные — тизер + кнопка «Открыть полный разбор» → модалка `Paywall` (при `DEV_SESSION='guest'` или `'free'`).
- Переключить `frontend/app/devConfig.js` → `DEV_SESSION = 'subscriber'`, обновить: все 6 блоков раскрыты, замка нет. Вернуть `'guest'` после проверки.
- «Ввести другую» → форма, есть кнопка «Повторить последний разбор (Анна)» (память профиля).

**Step 4: Commit**

```bash
git add frontend/app/numerology/breakdown/
git commit -m "feat(numerology): breakdown scenario (6 blocks, profile memory)"
```

---

## Task 8: Сценарий «Совместимость»

Форма на двоих → 7 блоков (горячие/фоновые + именной штрих). Разовый ввод, в общий профиль не пишем (дизайн §14).

**Files:**
- Create: `frontend/app/numerology/compatibility/page.jsx`
- Create: `frontend/app/numerology/compatibility/CompatibilityClient.jsx`

**Step 1: `page.jsx`**

```jsx
import CompatibilityClient from './CompatibilityClient'
export const metadata = { title: 'Нумерология — Совместимость пары' }
export default function CompatibilityPage() { return <CompatibilityClient /> }
```

**Step 2: `CompatibilityClient.jsx`**

```jsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import { buildCompatibility } from '../../content/numerology'
import CompatibilityForm from '../components/CompatibilityForm'
import BlockCard from '../components/BlockCard'
import styles from '../numerology.module.css'

export default function CompatibilityClient() {
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false
  const [result, setResult] = useState(null)

  const handleSubmit = (v) => {
    if (!v.date || !v.name || !v.date2 || !v.name2) return
    setResult(buildCompatibility(v))
  }

  if (!result) {
    return (
      <div className={styles.page}>
        <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
        <div className={styles.head}>
          <h1 className={styles.title}>Совместимость</h1>
          <p className={styles.subtitle}>Даты и имена двоих покажут, как складывается ваша связь.</p>
        </div>
        <CompatibilityForm onSubmit={handleSubmit} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
      <div className={styles.head}>
        <h1 className={styles.title}>Ваша пара: {result.lp1} и {result.lp2}</h1>
      </div>
      {result.blocks.map(b => (
        <BlockCard key={b.id} title={b.name} number={b.number} text={b.text}
          free={b.free} isSubscribed={isSubscribed} nameTouch={b.nameTouch?.body ?? b.nameTouch} />
      ))}
      <button className={styles.resetBtn} onClick={() => setResult(null)}>Другая пара</button>
    </div>
  )
}
```

> Примечание: `nameTouch` для free-блока `general` приходит строкой, для платной `passion` — `{teaser, body}`. Здесь для простоты передаём `b.nameTouch?.body ?? b.nameTouch` (штрих под подписку показывается телом). Уточнить подачу штриха при разметке контента.

**Step 3: Проверка в браузере** (`/numerology/compatibility`):
- Ввести две пары дат/имён → 7 блоков. Заголовок показывает два числа жизненного пути.
- «Общее» (free) раскрыто, «Страсть»/«Шанс измены»/«Перспектива» и прочие платные — тизер + замок при госте.
- В блоках, где `basis: pairKey`, число показывается как ключ пары (например `5-8`); где `pairNumber` — одно число. Это ожидаемо (сверить с конфигом).
- `DEV_SESSION='subscriber'` → всё раскрыто. Вернуть `'guest'`.

**Step 4: Commit**

```bash
git add frontend/app/numerology/compatibility/
git commit -m "feat(numerology): compatibility scenario (7 blocks, hot/background + name touch)"
```

---

## Task 9: Сценарий «Прогноз» (День / Месяц / Год)

Вкладки внутри одного роута `/numerology/forecast` (рекомендация дизайна §17.3). День бесплатен целиком и открывается сразу из памяти профиля (ежедневный якорь, §8.1).

**Files:**
- Create: `frontend/app/numerology/forecast/page.jsx`
- Create: `frontend/app/numerology/forecast/ForecastClient.jsx`

**Step 1: `page.jsx`**

```jsx
import { getProduct } from '../../products.config'
import ForecastClient from './ForecastClient'
export const metadata = { title: 'Нумерология — Прогноз' }
export default function ForecastPage() { return <ForecastClient product={getProduct('numerology')} /> }
```

**Step 2: `ForecastClient.jsx`** — дата из памяти → форма только при отсутствии; вкладки День/Месяц/Год:

```jsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import ProductInputForm from '../../components/ProductInputForm'
import { buildForecast, loadProfile, saveProfile } from '../../content/numerology'
import BlockCard from '../components/BlockCard'
import NumberBadge from '../components/NumberBadge'
import styles from '../numerology.module.css'

const HORIZONS = [
  { id: 'day', label: 'День' },
  { id: 'month', label: 'Месяц' },
  { id: 'year', label: 'Год' },
]

// Прогноз считается только от даты рождения (имя не участвует, дизайн §3).
export default function ForecastClient({ product }) {
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false
  const [date, setDate] = useState(null)
  const [tab, setTab] = useState('day')

  useEffect(() => { setDate(loadProfile()?.date ?? null) }, [])

  const handleSubmit = (inputs) => {
    if (!inputs.birth_date) return
    const prev = loadProfile() ?? {}
    saveProfile({ ...prev, date: inputs.birth_date })
    setDate(inputs.birth_date)
  }

  if (!date) {
    const dateOnly = { ...product, inputs: ['birth_date'] } // прогнозу имя не нужно
    return (
      <div className={styles.page}>
        <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
        <div className={styles.head}>
          <h1 className={styles.title}>Прогноз</h1>
          <p className={styles.subtitle}>Введи дату рождения — покажу настрой на день, месяц и год.</p>
        </div>
        <ProductInputForm product={dateOnly} onSubmit={handleSubmit} />
      </div>
    )
  }

  const forecast = buildForecast({ date, horizon: tab })

  return (
    <div className={styles.page}>
      <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
      <div className={styles.tabs}>
        {HORIZONS.map(h => (
          <button key={h.id} className={`${styles.tab} ${tab === h.id ? styles.active : ''}`} onClick={() => setTab(h.id)}>
            {h.label}
          </button>
        ))}
      </div>

      <NumberBadge number={forecast.number} label={tab === 'day' ? 'Персональный день' : tab === 'month' ? 'Персональный месяц' : 'Персональный год'} />

      {tab === 'day' ? (
        <BlockCard title="Твой день" number={forecast.number} text={forecast.text} free isSubscribed={isSubscribed} />
      ) : (
        forecast.blocks.map(b => (
          <BlockCard key={b.id} title={b.name} number={b.number} text={b.text} free={b.free} isSubscribed={isSubscribed} />
        ))
      )}

      <button className={styles.resetBtn} onClick={() => setDate(null)}>Ввести другую дату</button>
    </div>
  )
}
```

**Step 3: Проверка в браузере** (`/numerology/forecast`):
- Если профиль уже сохранён (после Задачи 7) — форма не показывается, сразу вкладки. Иначе ввести дату `1990-11-29`.
- Вкладка «День»: одно число (`personalDay`, для фикстуры `8` на «сегодня» 05.07), текст бесплатный, без замка даже у гостя.
- «Месяц»: 5 блоков, «Настроение месяца» free, остальные под замком у гостя. «Год»: 5 блоков, «Тема года» free.
- Число дня меняется день ото дня (детерминированно от даты, вариант выбирается `dayVariantIndex`).
- `DEV_SESSION='subscriber'` → платные блоки Месяца/Года раскрыты. Вернуть `'guest'`.

**Step 4: Commit**

```bash
git add frontend/app/numerology/forecast/
git commit -m "feat(numerology): forecast scenario (day/month/year tabs, date memory)"
```

---

## Task 10: Финальная зачистка, сборка, smoke-матрица

**Files:**
- Delete: `frontend/app/content/numerology.js` (старая заглушка-генератор)

**Step 1: Убедиться, что старая заглушка нигде не импортируется**

```bash
grep -rn "content/numerology'" frontend/app --include=*.jsx --include=*.js | grep -v "content/numerology/"
```

Ожидаемо: пусто (все импорты ведут в папку `content/numerology/`, а не в файл `content/numerology.js`). Если что-то осталось — поправить импорт на новый модуль.

**Step 2: Удалить файл-заглушку**

```bash
git rm frontend/app/content/numerology.js
```

**Step 3: Прогнать все тесты ядра**

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps \
  -w /app/app/content/numerology frontend node --test
```

Ожидаемо: все тесты (numbers, scenarios, index) PASS.

**Step 4: Продакшн-сборка (единственная за план)**

`NODE_ENV=development` ломает `next build`, поэтому сборку гоняем с `NODE_ENV=production`:

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps \
  -e NODE_ENV=production frontend sh -c "npm run build"
```

Ожидаемо: сборка проходит, роуты `/numerology`, `/numerology/breakdown`, `/numerology/compatibility`, `/numerology/forecast` присутствуют в выводе, ошибок нет. Тест-файлы `*.test.mjs` в `content/numerology/` сборку не ломают (Next не тянет их в бандл, они не импортируются из app-кода).

> Если Next ругается на `*.test.mjs` или локальный `package.json` в `app/`, вынести тесты и харнес в `frontend/tests/numerology/` и импортировать модули оттуда относительным путём. Это запасной вариант; сначала проверить, что дефолтная раскладка собирается.

**Step 5: Ручная smoke-матрица** (стек поднят, `http://localhost/numerology`)

Пройти по трём состояниям `DEV_SESSION` (`frontend/app/devConfig.js`), каждый раз обновляя страницу:

| Состояние | Ожидание |
|---|---|
| `guest` | Хаб открыт. В каждом сценарии free-блок виден целиком, платные — тизер + замок → модалка Paywall с кнопкой «Войти/Оформить». День бесплатен целиком. |
| `free` | Как гость (гейт тот же — только подписка), Paywall ведёт на `/lk`. |
| `subscriber` | Все блоки раскрыты во всех сценариях, замков нет. |

После проверки вернуть `DEV_SESSION = 'guest'` (или `'real'` для боевого режима — уточнить у владельца перед мержем).

**Step 6: Commit**

```bash
git add -A
git commit -m "chore(numerology): remove legacy stub content; final wiring"
```

---

## Follow-up (вне скоупа этой реализации)

- **~450 текстов-заготовок** пишутся отдельным чатом по брифу на наполнение (дизайн §16), собирается по образцу `docs/plans/2026-07-03-tarot-content-brief.md`. Структура ключей (§12 дизайна, Задача 3 плана) сделана так, чтобы бриф собрался без боли: `breakdown` 6×11, `compatibility` hot 3×66 + background 4×11 + nameTouch 2×11, `forecast_day` 9×4, `forecast_month`/`forecast_year` 5×9.
- **Финальный визуальный дизайн** (`numerology.module.css`, анимации, вёрстка) дорабатывается владельцем в Claude Design. Текущий CSS — рабочий плейсхолдер.
- **Задел на будущее** (дизайн §15): мастер-число 33, число личности (согласные), серверная отдача платных тел, дата из профиля для залогиненных. Структура наборов и `basis` расширяются без ломки.

---

## Открытые вопросы, зафиксированные в плане

Из §17 дизайна, решено для реализации (при желании владельца меняется точечно):

1. Метод расчёта — по §5 (свёртка с сохранением 11/22, стандартные таблицы), весь в `numbers.js`.
2. Анонимный доступ — гость видит free-блоки + пейвол на платных, без входа. Реализовано (гейт только `user.subscribed`).
3. Горизонты «Прогноза» — **вкладки** внутри `/numerology/forecast` (один роут, состояние). Реализовано так.
4. «Кармический урок» и «Ресурс рода» — `basis: 'lifePath'` (грани одного числа), меняется в `scenarios.js`.
5. Число вариантов «Дня» — **4** (наборы `forecast_day` рассчитаны на 4).
6. Именной штрих в «Совместимости» — 2 набора по 11 (под «Общее» и «Страсть»).
