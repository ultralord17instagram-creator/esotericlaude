# Родовой сценарий (/lp/rod) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: используй executing-plans, чтобы прогонять план задача-за-задачей.

**Goal:** собрать лендинг `/lp/rod` («Родовой сценарий») на движке Матрицы судьбы: воронка Hero → квиз (форк по шагу 1) → расчёт → reveal-результат (2 открытых блока + 3 залоченных с «Узнать» → `/register`), контент по 4 флейворам, число `female2` подтверждает флейвор через маппинг архетипов.

**Architecture:** копия механики `horo-love` (фазовый клиент + reveal-список), но с плоским квизом как у `love` и хедером из реальной `MatrixDiagram`. Вся чистая логика и тексты — в `rod-copy.js` (детерминированный `buildReveal(flavor, female2)`), конфиг воронки — в `rod.js`. Движок расчёта (`calculateMatrix`) и оплата НЕ трогаются. Новый клиент самодостаточен, компоненты `love`/`horo-love` не задеваются.

**Tech Stack:** Next.js 14 (App Router, client components), React 18, чистые ESM-модули, тесты `node:test` (запуск в одноразовом `node:20-alpine`, локального node нет — Docker-only).

**Источники (единственные авторитетные):**
- Дизайн/структура: [rod-landing-design](2026-07-20-rod-landing-design.md)
- Все пользовательские тексты: [rod-copy-brief](2026-07-20-rod-copy-brief.md) — **прозу переносим ОТТУДА дословно, ничего не сочиняем**.

---

## Как запускать тесты (проверенный паттерн из love-плана)

Одноразовый контейнер, зависимости не нужны. Из корня репо:

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/content/landings/rod-copy.test.mjs
```

Прогон всех тестов лендингов и lp-логики (регресс):

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/lp/logic/*.test.mjs app/content/landings/*.test.mjs
```

В PowerShell тот же вызов без префикса `MSYS_NO_PATHCONV=1`.

Прод-сборка (финальная проверка, Docker; `NODE_ENV=development` ломает `next build` — не задавать):

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine sh -c "npm ci && npm run build"
```

---

## Порядок и зависимости

1. **Task 1** — `rod-copy.js` (данные + `buildReveal`, TDD). Фундамент, всё остальное зависит.
2. **Task 2** — `rod.js` (конфиг воронки).
3. **Task 3** — регистрация в `index.js` + тест реестра.
4. **Task 4** — ветка движка в `page.jsx`.
5. **Task 5** — `RodClient.jsx` (клиент, ручная проверка).
6. **Task 6** — CSS-скин (за Кириллом, вне скоупа кода).

Реюз без изменений: `calculateMatrix` ([matrix.js](../../frontend/app/content/matrix.js)), `MatrixDiagram` ([MatrixDiagram.jsx](../../frontend/app/lp/components/MatrixDiagram.jsx)), стейт-машина квиза ([quizMachine.js](../../frontend/app/lp/logic/quizMachine.js)), хранилище ([quizStorage.js](../../frontend/app/lp/logic/quizStorage.js)).

---

## Ключевые факты кода (свериться перед началом)

- `calculateMatrix(birthDate)` возвращает `{ nodes, chakras, purposes, age, birthDate }`. Нужное число: **`calculateMatrix(iso).nodes.female2`** (`reduce(k + center)`, диапазон 1..22). `birthDate` принимает `'YYYY-MM-DD'` — экран даты в клиенте отдаёт именно `iso()`.
- `MatrixDiagram({ nodes, highlight })` рисует всю матрицу; `highlight` подсвечивает только ключи из внутреннего `POS` (`center`, `female1`). Для подсветки женской линии передаём `highlight={['female1']}`.
- Квиз-машина: шаги вида `{ id, type, question, options?, required }`; типы `'choice' | 'date' | 'text'`. `advance/isComplete/setAnswer` — как в `HoroLoveClient`.
- Флейвор = ответ на шаг 1 (`answers.mirror`), одно из `alone | endure | unhappy | nomen`.
- `buildReveal` — чистая функция, детерминированная, БЕЗ `Date`/`Math.random` (иначе тесты плавают и SSR≠клиент).

---

## Task 1: `rod-copy.js` — данные и резолвер `buildReveal` (TDD)

**Files:**
- Create: `frontend/app/content/landings/rod-copy.js`
- Test: `frontend/app/content/landings/rod-copy.test.mjs`

> Отклонение от дизайн-дока §8.6 (который называл `index.test.mjs`): выносим юниты `buildReveal` в отдельный когезивный `rod-copy.test.mjs` — раннер и так globает `app/content/landings/*.test.mjs`. В `index.test.mjs` (Task 3) остаётся только тест регистрации, по образцу остальных лендингов.

**Экспорты модуля:** `ARCHETYPE_BY_NUMBER`, `ARCH_LABELS`, `FLAVOR_ECHO`, `revealFields`, `ROD_DOSSIER`, `OPENERS`, `windowYear`, `buildReveal`.

### Step 1: Написать падающий тест

Создай `frontend/app/content/landings/rod-copy.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildReveal, ARCHETYPE_BY_NUMBER, revealFields, ROD_DOSSIER, windowYear,
} from './rod-copy.js'

const FLAVORS = ['alone', 'endure', 'unhappy', 'nomen']

test('ARCHETYPE_BY_NUMBER покрывает 1..22, каждое ровно раз, значения — валидные флейворы', () => {
  const keys = Object.keys(ARCHETYPE_BY_NUMBER).map(Number).sort((a, b) => a - b)
  assert.deepEqual(keys, Array.from({ length: 22 }, (_, i) => i + 1))
  for (const n of keys) assert.ok(FLAVORS.includes(ARCHETYPE_BY_NUMBER[n]), `число ${n} -> невалидный архетип`)
})

test('revealFields: 5 блоков, 2 открытых, 3 залоченных, правильные id/порядок', () => {
  assert.deepEqual(revealFields.map(f => f.id),
    ['scenario', 'howItShows', 'maleLine', 'whereBreaks', 'howToBreak'])
  assert.deepEqual(revealFields.filter(f => !f.locked).map(f => f.id), ['scenario', 'howItShows'])
  assert.deepEqual(revealFields.filter(f => f.locked).map(f => f.id), ['maleLine', 'whereBreaks', 'howToBreak'])
})

test('ROD_DOSSIER: все 4 флейвора заполнены всеми полями', () => {
  for (const fl of FLAVORS) {
    const d = ROD_DOSSIER[fl]
    assert.ok(d, `нет флейвора ${fl}`)
    for (const key of ['scenarioBody', 'howItShows', 'maleLine', 'whereBreaks', 'howToBreak']) {
      assert.equal(typeof d[key], 'string')
      assert.ok(d[key].length > 0, `${fl}.${key} пустой`)
      assert.ok(!d[key].includes('—'), `${fl}.${key} содержит длинное тире`)
    }
  }
})

test('buildReveal отдаёт 5 полей с label/locked/value для каждого флейвора', () => {
  for (const fl of FLAVORS) {
    const fields = buildReveal(fl, 8)
    assert.equal(fields.length, 5)
    assert.deepEqual(fields.map(f => f.id), revealFields.map(f => f.id))
    for (const f of fields) {
      assert.equal(typeof f.label, 'string')
      assert.equal(typeof f.locked, 'boolean')
      assert.equal(typeof f.value, 'string')
    }
  }
})

test('matched: архетип числа совпал с флейвором -> прямое подтверждение', () => {
  // 12 -> endure (см. ARCHETYPE_BY_NUMBER)
  assert.equal(ARCHETYPE_BY_NUMBER[12], 'endure')
  const scenario = buildReveal('endure', 12).find(f => f.id === 'scenario').value
  assert.ok(scenario.includes('12'), 'нет числа 12')
  assert.ok(scenario.includes('подтверждает это напрямую'), 'нет опенера matched')
  assert.ok(scenario.includes('терпения'), 'нет ярлыка архетипа флейвора')
  assert.ok(scenario.includes(ROD_DOSSIER.endure.scenarioBody), 'тело сценария не приклеено')
})

test('secondLayer: архетип числа разошёлся с флейвором -> второй слой', () => {
  // 8 -> alone, флейвор endure
  assert.equal(ARCHETYPE_BY_NUMBER[8], 'alone')
  const scenario = buildReveal('endure', 8).find(f => f.id === 'scenario').value
  assert.ok(scenario.includes('8'), 'нет числа 8')
  assert.ok(scenario.includes('это не всё'), 'нет опенера secondLayer')
  assert.ok(scenario.includes('силы и одиночества'), 'нет ярлыка архетипа ЧИСЛА')
  assert.ok(scenario.includes(ROD_DOSSIER.endure.scenarioBody), 'тело всё равно от флейвора')
})

test('токены подставлены: {N} и {year} не остаются литералами', () => {
  const fields = buildReveal('endure', 12)
  for (const f of fields) {
    assert.ok(!f.value.includes('{N}'), `${f.id}: остался {N}`)
    assert.ok(!f.value.includes('{year}'), `${f.id}: остался {year}`)
  }
  const howToBreak = fields.find(f => f.id === 'howToBreak').value
  assert.ok(new RegExp(`\\b${windowYear(12)}\\b`).test(howToBreak), 'год окна не подставлен')
})

test('детерминизм: одинаковый вход -> одинаковый выход', () => {
  assert.deepEqual(buildReveal('unhappy', 15), buildReveal('unhappy', 15))
})
```

### Step 2: Запустить тест — убедиться, что падает

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/content/landings/rod-copy.test.mjs
```
Ожидание: FAIL, `Cannot find module './rod-copy.js'`.

### Step 3: Реализовать `rod-copy.js`

Создай `frontend/app/content/landings/rod-copy.js`. Прозу (`ROD_DOSSIER`, ярлыки, эхо) переноси **дословно из копи-брифа** (секции «Маппинг», «Ярлыки архетипов», «Тела сценариев»). Структура:

```js
// Тексты и детерминированная логика лендинга rod. Без React и сети.
// ЕДИНСТВЕННЫЙ источник прозы — копи-бриф 2026-07-20-rod-copy-brief.md.
// Правила голоса: на «ты», женский голос, снятие вины прямым утверждением,
// без «не X, а Y», без длинного тире. Токены {N}=female2, {year}=окно.

// Число female2 (1..22) -> один из 4 архетипов. Черновой маппинг (§бриф), сверяет Кирилл.
export const ARCHETYPE_BY_NUMBER = {
  1: 'alone', 4: 'alone', 8: 'alone', 9: 'alone', 21: 'alone',
  2: 'endure', 5: 'endure', 11: 'endure', 12: 'endure', 14: 'endure',
  3: 'unhappy', 6: 'unhappy', 15: 'unhappy', 17: 'unhappy', 18: 'unhappy',
  7: 'nomen', 10: 'nomen', 13: 'nomen', 16: 'nomen', 19: 'nomen', 20: 'nomen', 22: 'nomen',
}

// Ярлыки архетипов. gen — родительный для опенера, short — короткий для «второго слоя».
export const ARCH_LABELS = {
  alone:   { gen: 'линии силы и одиночества',       short: 'сила и одиночество' },
  endure:  { gen: 'линии терпения',                 short: 'терпение' },
  unhappy: { gen: 'линии несчастливой любви',       short: 'несчастливая любовь' },
  nomen:   { gen: 'линии, где мужчины не остаются',  short: 'ранние потери' },
}

// Что она ответила на шаг 1 (для опенера «ты ответила, что...»).
export const FLAVOR_ECHO = {
  alone:   'были сильными и одинокими, всё тянули на себе',
  endure:  'терпели ради семьи и гасили себя',
  unhappy: 'жили в браке без счастья или не сложили его вовсе',
  nomen:   'рано оставались без мужчин',
}

// Порядок и замки блоков результата.
export const revealFields = [
  { id: 'scenario',   label: 'Какую судьбу тебе передали мать и бабка',        locked: false },
  { id: 'howItShows', label: 'Где ты уже повторяешь их слово в слово',         locked: false },
  { id: 'maleLine',   label: 'Почему в вашем роду мужчины не остаются',        locked: true },
  { id: 'whereBreaks',label: 'На ком круг замкнётся: на тебе или на дочери',   locked: true },
  { id: 'howToBreak', label: 'Что сделать, чтобы не отдать это дочери',        locked: true },
]

// Шаблоны опенеров. Токены: {echo} {N} {archGen} {flavorShort} {numArchGen} {numArchShort}
export const OPENERS = {
  matched: 'Ты ответила, что женщины твоего рода {echo}. Матрица подтверждает это напрямую: по женской линии у тебя число {N}, а оно как раз из {archGen}. Сходится один в один.',
  secondLayer: 'Ты ответила, что женщины твоего рода {echo}. Так и есть, но это не всё. По женской линии у тебя число {N}, а оно из {numArchGen}. Снаружи у тебя {flavorShort}, а глубже лежит второй слой, {numArchShort}, и его ты в себе не замечаешь.',
}

// Тела сценариев по флейвору. ПЕРЕНЕСТИ ДОСЛОВНО из копи-брифа §«Тела сценариев».
export const ROD_DOSSIER = {
  endure: {
    scenarioBody: '<из брифа: endure.scenarioBody>',
    howItShows:   '<из брифа: endure.howItShows>',
    maleLine:     '<из брифа: endure.maleLine>',
    whereBreaks:  '<из брифа: endure.whereBreaks>',
    howToBreak:   '<из брифа: endure.howToBreak, включает {year}>',
  },
  alone:   { /* аналогично, из брифа §alone */ },
  unhappy: { /* аналогично, из брифа §unhappy */ },
  nomen:   { /* аналогично, из брифа §nomen */ },
}

// Год окна разрыва. Деривация «открыта» (§бриф) — черновой детерминированный плейсхолдер
// БЕЗ Date (иначе SSR≠клиент и тесты плавают). Кирилл уточнит формулу из yearForecast.
const WINDOW_BASE = 2026
export function windowYear(female2) {
  return WINDOW_BASE + (female2 % 4)
}

function fill(tpl, map) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (k in map ? String(map[k]) : `{${k}}`))
}

// Резолвер: флейвор задаёт тело, female2 задаёт опенер (matched/secondLayer) и подстановки.
export function buildReveal(flavor, female2) {
  const numArch = ARCHETYPE_BY_NUMBER[female2]
  const matched = numArch === flavor
  const d = ROD_DOSSIER[flavor]
  const tokens = {
    N: female2,
    year: windowYear(female2),
    echo: FLAVOR_ECHO[flavor],
    archGen: ARCH_LABELS[flavor].gen,
    flavorShort: ARCH_LABELS[flavor].short,
    numArchGen: ARCH_LABELS[numArch].gen,
    numArchShort: ARCH_LABELS[numArch].short,
  }
  const opener = fill(matched ? OPENERS.matched : OPENERS.secondLayer, tokens)
  const value = {
    scenario:   `${opener} ${d.scenarioBody}`,
    howItShows: d.howItShows,
    maleLine:   d.maleLine,
    whereBreaks:d.whereBreaks,
    howToBreak: d.howToBreak,
  }
  return revealFields.map((f) => ({ ...f, value: fill(value[f.id], tokens) }))
}
```

### Step 4: Запустить тест — убедиться, что проходит

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/content/landings/rod-copy.test.mjs
```
Ожидание: PASS (все тесты). Если падает `содержит длинное тире` — заменить `—` в перенесённой прозе на запятые/точки/двоеточия.

### Step 5: Commit

```bash
git add frontend/app/content/landings/rod-copy.js frontend/app/content/landings/rod-copy.test.mjs
git commit -m "feat(rod): копи-модуль rod-copy + резолвер buildReveal (v2)"
```

---

## Task 2: `rod.js` — конфиг воронки

**Files:**
- Create: `frontend/app/content/landings/rod.js`

Плоский квиз как у `love` (не ветки). Шаг 1 `id: 'mirror'`, его `value` = флейвор. Тексты — дословно из копи-брифа §«Экран hero», §«Экран quiz», §«Экран calculating», §«result».

### Step 1: Реализовать конфиг

Создай `frontend/app/content/landings/rod.js`:

```js
// Конфиг лендинга «Родовой сценарий». engine=rod переключает RodClient в page.jsx.
// Продукт — Матрица судьбы (calculateMatrix). Тексты: без длинного тире, женский голос.
import { revealFields } from './rod-copy.js'

export const rodLanding = {
  slug: 'rod',
  product: 'matrix',
  engine: 'rod',
  theme: 'ancestry',
  meta: {
    title: 'Родовой сценарий по дате рождения: что ты несёшь по женской линии',
    description: 'Пройди короткий тест и узнай по матрице, какой сценарий женщины твоего рода передают по наследству и на ком он обрывается.',
  },
  hero: {
    eyebrow: 'Родовой сценарий',
    title: 'В твоём роду это повторяется. И круг идёт к тебе.',
    titleAccent: 'круг идёт к тебе',
    subtitle: '2 минуты и только дата рождения. Матрица покажет, что ты несёшь по женской линии.',
    cta: 'Узнать свой родовой сценарий',
    note: 'Честно, даже если будет тяжело.',
  },
  quiz: {
    steps: [
      { id: 'mirror', type: 'choice', required: true,
        question: 'Что из этого больше всего похоже на женщин твоего рода?',
        options: [
          { value: 'alone',   label: 'Сильные и одинокие, всё тянули на себе' },
          { value: 'endure',  label: 'Терпели ради семьи и гасили себя' },
          { value: 'unhappy', label: 'Замужем, но несчастливы, или не сложилось' },
          { value: 'nomen',   label: 'Рано остались без мужчин: развод, вдовство, ушли' },
        ] },
      { id: 'circle', type: 'choice', required: true,
        question: 'Замечала, что твоя жизнь идёт по тому же кругу, что у мамы?',
        options: [
          { value: 'exact',    label: 'Да, почти точь-в-точь' },
          { value: 'why',      label: 'Да, но не понимаю почему' },
          { value: 'catch',    label: 'Иногда ловлю себя на этом' },
          { value: 'no',       label: 'Нет, у меня иначе' },
        ] },
      { id: 'mother_love', type: 'choice', required: true,
        question: 'Твоя мама была счастлива в любви?',
        options: [
          { value: 'yes',    label: 'Да, у неё сложилось' },
          { value: 'no',     label: 'Скорее нет' },
          { value: 'alone',  label: 'Она была одна' },
          { value: 'silent', label: 'Не знаю, у нас про это не говорили' },
        ] },
      { id: 'family_feel', type: 'choice', required: true,
        question: 'Что ты чаще всего чувствуешь, когда думаешь о своей семье?',
        options: [
          { value: 'guilt',   label: 'Вину' },
          { value: 'duty',    label: 'Долг, будто я всем должна' },
          { value: 'grudge',  label: 'Обиду' },
          { value: 'heavy',   label: 'Тяжесть, хочется отдалиться' },
        ] },
      { id: 'fear_pass', type: 'choice', required: true,
        question: 'Боишься, что передашь это дальше, дочери или детям?',
        options: [
          { value: 'much',    label: 'Да, очень' },
          { value: 'some',    label: 'Иногда думаю об этом' },
          { value: 'nokids',  label: 'Детей пока нет, но боюсь' },
          { value: 'no',      label: 'Нет' },
        ] },
      { id: 'yes_ladder', type: 'choice', required: true,
        question: 'Если в твоей матрице записано, на ком этот круг рвётся, хочешь узнать?',
        options: [
          { value: 'yes',   label: 'Да, конечно' },
          { value: 'badly', label: 'Очень хочу' },
          { value: 'doubt', label: 'Да, но не верю, что это реально' },
        ] },
      { id: 'birth_date', type: 'date', required: true,
        question: 'Теперь дата рождения, чтобы построить твою матрицу рода' },
      { id: 'name', type: 'text', required: true, placeholder: 'Имя',
        question: 'Как тебя зовут?' },
    ],
  },
  calculating: {
    title: 'Читаю твою женскую линию…',
    lines: [
      'Свожу твою дату с линией матери и бабки…',
      'Смотрю, что повторяется из поколения в поколение…',
      'Ищу точку, где круг рвётся…',
    ],
  },
  result: {
    kicker: 'ТВОЙ РОДОВОЙ СЦЕНАРИЙ',
    captionWithName: '{name}, твоя матрица рода',
    caption: 'Твоя матрица рода',
    chipLabel: 'точка рода',
    unlockCta: 'Узнать',
  },
  revealFields,
}
```

> Опциональный повтор-CTA внизу (бриф §«Опциональный повтор-CTA») — вне скоупа образца, можно добавить позже. Не блокирует DoD.

### Step 2: Commit

```bash
git add frontend/app/content/landings/rod.js
git commit -m "feat(rod): конфиг лендинга (hero, квиз, calculating, result)"
```

---

## Task 3: Регистрация в реестре + тест

**Files:**
- Modify: `frontend/app/content/landings/index.js`
- Test: `frontend/app/content/landings/index.test.mjs`

### Step 1: Написать падающий тест

Добавь в конец `frontend/app/content/landings/index.test.mjs`:

```js
test('getLanding отдаёт конфиг rod на движке rod', () => {
  const l = getLanding('rod')
  assert.equal(l.slug, 'rod')
  assert.equal(l.engine, 'rod')
  assert.equal(l.product, 'matrix')
  assert.equal(l.theme, 'ancestry')
  assert.equal(l.quiz.steps.length, 8)
  const ids = l.quiz.steps.map(s => s.id)
  assert.equal(ids[0], 'mirror')
  assert.ok(ids.includes('birth_date'))
  assert.ok(ids.includes('name'))
  assert.equal(l.revealFields.length, 5)
})
```

### Step 2: Запустить тест — убедиться, что падает

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/content/landings/index.test.mjs
```
Ожидание: FAIL (`getLanding('rod')` вернул `null`).

### Step 3: Зарегистрировать конфиг

В `frontend/app/content/landings/index.js`:
- добавь импорт `import { rodLanding } from './rod.js'` (после `taroPorchaLanding`);
- добавь `rod: rodLanding` в объект `LANDINGS`.

### Step 4: Запустить тест — убедиться, что проходит

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/content/landings/index.test.mjs
```
Ожидание: PASS.

### Step 5: Commit

```bash
git add frontend/app/content/landings/index.js frontend/app/content/landings/index.test.mjs
git commit -m "feat(rod): регистрация лендинга rod в реестре"
```

---

## Task 4: Ветка движка в `page.jsx`

**Files:**
- Modify: `frontend/app/lp/[slug]/page.jsx`

### Step 1: Подключить клиент

- добавь `import RodClient from './RodClient'` (после `DiagnosticClient`);
- в цепочку выбора `Client` добавь ветку **перед** финальным `LandingClient`:

```jsx
    landing.engine === 'rod' ? RodClient :
```

### Step 2: Проверка типов сборкой — отложена

`RodClient` ещё не создан; сборку/визуальную проверку делаем в Task 5. Здесь только правка роутинга.

### Step 3: Commit

```bash
git add frontend/app/lp/[slug]/page.jsx
git commit -m "feat(rod): ветка движка rod в роуте /lp/[slug]"
```

---

## Task 5: `RodClient.jsx` — фазовый клиент с reveal-механикой

**Files:**
- Create: `frontend/app/lp/[slug]/RodClient.jsx`

Образец — `HoroLoveClient` (фазы + reveal-список + возврат после оплаты), но:
- **плоский квиз** `landing.quiz.steps` (без веток/fork-интро);
- фаза стартует с `hero` (одна кнопка из `landing.hero`);
- флейвор = `answers.mirror`; число = `calculateMatrix(answers.birth_date).nodes.female2`;
- поля через `buildReveal(flavor, female2)` из `rod-copy.js`;
- хедер результата = `MatrixDiagram` + чип «точка рода {female2}», без зодиак-кольца и фейковых процентов.

### Step 1: Реализовать клиент

Создай `frontend/app/lp/[slug]/RodClient.jsx`:

```jsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { loadQuiz, saveQuiz } from '../logic/quizStorage.js'
import { initQuiz, currentStep, setAnswer, advance, isComplete } from '../logic/quizMachine.js'
import { calculateMatrix } from '../../content/matrix.js'
import { buildReveal } from '../../content/landings/rod-copy.js'
import MatrixDiagram from '../components/MatrixDiagram.jsx'
import styles from '../astrixLove.module.css' // старт: реюз классов Astrix Love; Кирилл переоденет (Task 6)

const MONTHS_SELECT = [
  [1, 'Январь'], [2, 'Февраль'], [3, 'Март'], [4, 'Апрель'], [5, 'Май'], [6, 'Июнь'],
  [7, 'Июль'], [8, 'Август'], [9, 'Сентябрь'], [10, 'Октябрь'], [11, 'Ноябрь'], [12, 'Декабрь'],
]

function iso(day, month, year) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function RodClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const router = useRouter()
  const isSubscribed = user?.subscribed ?? false
  const slug = landing.slug
  const steps = landing.quiz.steps

  const [phase, setPhase] = useState('hero') // hero | quiz | loading | result
  const [quiz, setQuiz] = useState(initQuiz)
  const [answers, setAnswers] = useState(null)
  const [progress, setProgress] = useState(0)
  const [unlocked, setUnlocked] = useState(false)

  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [name, setName] = useState('')

  const step = phase === 'quiz' ? currentStep(steps, quiz) : null

  useEffect(() => { track('lp_view', { slug }) /* eslint-disable-next-line */ }, [])

  // Возврат после оплаты: подписана + сохранённый квиз -> открываем залоченные блоки без ввода.
  useEffect(() => {
    if (!isSubscribed) return
    const s = loadQuiz(slug)
    if (s?.mirror && s.birth_date) {
      setAnswers(s)
      setUnlocked(true)
      setPhase('result')
    }
  }, [isSubscribed, slug])

  // Театр загрузки: 2.5с -> результат.
  useEffect(() => {
    if (phase !== 'loading' || !answers) return
    let p = 0, to
    const id = setInterval(() => {
      p = Math.min(100, p + 2)
      setProgress(p)
      if (p >= 100) {
        clearInterval(id)
        to = setTimeout(() => {
          track('reveal_view', { slug })
          if (!isSubscribed) track('paywall_view', { slug })
          setPhase('result')
        }, 400)
      }
    }, 50)
    return () => { clearInterval(id); if (to) clearTimeout(to) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, answers])

  const startQuiz = () => {
    setQuiz(initQuiz())
    setDay(''); setMonth(''); setYear(''); setName('')
    setPhase('quiz')
    track('quiz_start', { slug })
  }

  const finishQuiz = (a) => {
    track('quiz_complete', { slug, flavor: a.mirror })
    saveQuiz(slug, a)
    setAnswers(a)
    setProgress(0)
    setPhase('loading')
  }

  const commit = (id, value) => {
    const next = advance(steps, setAnswer(quiz, id, value))
    if (isComplete(steps, next)) finishQuiz(next.answers)
    else setQuiz(next)
  }

  const dobValid = () => {
    const d = +day, m = +month, y = +year
    return d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2025
  }
  const nameValid = name.trim().length > 0

  const onUnlock = () => {
    track('cta_click', { slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${slug}`) } catch {}
    router.push(user ? '/lk' : '/register')
  }

  // Прогресс-пилюли: hero + шаги + loading + result.
  const total = steps.length + 3
  let idx = 0
  if (phase === 'quiz') idx = 1 + quiz.index
  else if (phase === 'loading') idx = 1 + steps.length
  else if (phase === 'result') idx = 2 + steps.length
  const pills = Array.from({ length: total }, (_, i) => i <= idx)

  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}><span className={styles.brandName}>ASTRIX</span></div>
          <div className={styles.pills}>
            {pills.map((on, i) => <span key={i} className={on ? styles.pillOn : styles.pill} />)}
          </div>
        </header>

        <main className={styles.stage}>
          {phase === 'hero' && (
            <section className={styles.screenIntro}>
              <div className={styles.kicker}>{landing.hero.eyebrow}</div>
              <h1 className={styles.h1}>{landing.hero.title}</h1>
              <p className={styles.sub}>{landing.hero.subtitle}</p>
              <button className={styles.btn} onClick={startQuiz}>{landing.hero.cta}</button>
              <p className={styles.sub}>{landing.hero.note}</p>
            </section>
          )}

          {phase === 'quiz' && step && step.type === 'choice' && (
            <section className={styles.screen} key={`q${quiz.index}`}>
              <div className={styles.kicker}>{`Шаг ${quiz.index + 1} / ${steps.length}`}</div>
              <h2 className={styles.h2}>{step.question}</h2>
              <div className={styles.options}>
                {step.options.map((o) => (
                  <button key={o.value} className={styles.optionCard} onClick={() => commit(step.id, o.value)}>
                    <span className={styles.radio} />
                    <span className={styles.optText}><span className={styles.optTitle}>{o.label}</span></span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {phase === 'quiz' && step && step.type === 'date' && (
            <section className={styles.screen} key="dob">
              <h2 className={styles.h2}>{step.question}</h2>
              <div className={styles.dobRow}>
                <input className={`${styles.inp} ${styles.inpDay}`} value={day} inputMode="numeric" placeholder="ДД"
                  aria-label="День" onChange={(e) => setDay(e.target.value.replace(/\D/g, '').slice(0, 2))} />
                <select className={`${styles.inp} ${styles.inpMonth}`} value={month}
                  aria-label="Месяц" onChange={(e) => setMonth(e.target.value)}>
                  <option value="">Месяц</option>
                  {MONTHS_SELECT.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
                <input className={`${styles.inp} ${styles.inpYear}`} value={year} inputMode="numeric" placeholder="ГГГГ"
                  aria-label="Год" onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              </div>
              <button className={dobValid() ? styles.btn : styles.btnOff}
                onClick={() => { if (dobValid()) commit(step.id, iso(day, month, year)) }}>Далее</button>
            </section>
          )}

          {phase === 'quiz' && step && step.type === 'text' && (
            <section className={styles.screen} key="name">
              <h2 className={styles.h2}>{step.question}</h2>
              <input className={`${styles.inp} ${styles.textInput}`} value={name} placeholder={step.placeholder || 'Имя'}
                aria-label="Имя" onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && nameValid) commit(step.id, name.trim()) }} />
              <button className={`${nameValid ? styles.btn : styles.btnOff} ${styles.btnName}`}
                onClick={() => { if (nameValid) commit(step.id, name.trim()) }}>Построить матрицу рода</button>
            </section>
          )}

          {phase === 'loading' && (
            <section className={styles.loadingScreen}>
              <div className={styles.loadingMsg}>
                {landing.calculating.lines[progress < 34 ? 0 : progress < 67 ? 1 : 2] || landing.calculating.title}
              </div>
              <div className={styles.loadingSub}>{(answers?.name || '').trim() || 'Ты'}, круг почти виден…</div>
            </section>
          )}

          {phase === 'result' && answers && (() => {
            const matrix = calculateMatrix(answers.birth_date)
            const female2 = matrix.nodes.female2
            const flavor = answers.mirror
            const realName = (answers.name || '').trim()
            const fields = buildReveal(flavor, female2)
            const openFields = fields.filter((f) => !f.locked)
            const lockedFields = fields.filter((f) => f.locked)
            const caption = realName
              ? landing.result.captionWithName.replace('{name}', realName)
              : landing.result.caption
            return (
              <section className={styles.result}>
                <aside className={styles.resultHero}>
                  <div className={styles.heroKicker}>{landing.result.kicker}</div>
                  <div className={styles.heroChip}>
                    <span className={styles.zodText}>{caption} · {landing.result.chipLabel} {female2}</span>
                  </div>
                  <MatrixDiagram nodes={matrix.nodes} highlight={['female1']} />
                </aside>

                <div className={styles.resultBody}>
                  {openFields.map((f) => (
                    <div key={f.id} className={styles.readingBlock}>
                      <div className={styles.sectionLabel}>{f.label}</div>
                      <p className={styles.readingText}>{f.value}</p>
                    </div>
                  ))}

                  {unlocked ? (
                    lockedFields.map((f) => (
                      <div key={f.id} className={styles.readingBlock}>
                        <div className={styles.sectionLabel}>{f.label}</div>
                        <p className={styles.readingText}>{f.value}</p>
                      </div>
                    ))
                  ) : (
                    <div className={styles.teasers}>
                      {lockedFields.map((f) => (
                        <div key={f.id}>
                          <div className={styles.teaserLabel}>{f.label}</div>
                          <button className={styles.teaserBtn} onClick={onUnlock}>{landing.result.unlockCta}</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )
          })()}
        </main>
      </div>
    </div>
  )
}
```

### Step 2: Прод-сборка — убедиться, что чисто

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine sh -c "npm ci && npm run build"
```
Ожидание: сборка без ошибок; в списке роутов есть `/lp/[slug]`.

### Step 3: Ручная проверка воронки (dev-стек, nginx :80)

Подними dev-стек (как в love-плане) и пройди `/lp/rod`:
- Hero → одна кнопка → квиз (8 шагов, дата/имя) → расчёт → результат.
- Результат: хедер (диаграмма + «точка рода N») + 2 открытых блока с полным текстом + 3 залоченных (заголовок + «Узнать»).
- Кнопка «Узнать» ведёт на `/register` (аноним) или `/lk` (вошедший).
- Смена ответа на шаге 1 меняет сценарий; одна и та же дата+ответ дают тот же экран.

### Step 4: Commit

```bash
git add frontend/app/lp/[slug]/RodClient.jsx
git commit -m "feat(rod): клиент RodClient (hero -> квиз -> расчёт -> reveal)"
```

---

## Task 6: CSS-скин (за Кириллом, вне скоупа кода)

Клиент стартует на классах `astrixLove.module.css` (реюз, `/lp/love` и `/lp/horo-love` не задеты — импорт только читает файл). Визуальную тему «ancestry» Кирилл делает отдельно в Claude Design: либо форкает `astrixLove.module.css` в `rodAncestry.module.css` и меняет импорт в `RodClient`, либо переопределяет палитру. Reveal-блоки, `teaserBtn`, `heroChip` уже стилизованы — есть от чего оттолкнуться.

Никаких правок логики/разметки для этого не требуется.

---

## Definition of Done (сверка с дизайн-доком §10)

- [ ] `/lp/rod` открывается; воронка Hero → квиз → расчёт → результат проходится целиком.
- [ ] Результат: хедер (`MatrixDiagram` + чип «точка рода N») + 2 открытых блока (полный текст) + 3 залоченных (заголовок + «Узнать»).
- [ ] Открытые блоки показывают реальный сценарий по женской линии бесплатно и целиком.
- [ ] Каждая «Узнать» ведёт на `/register`; на лендинге НЕТ цены/подписки/слова «оплата».
- [ ] 4 флейвора дают свой сценарий; `buildReveal` выбирает `matched`/`secondLayer` по `ARCHETYPE_BY_NUMBER` и подставляет `{N}`.
- [ ] `ARCHETYPE_BY_NUMBER` покрывает все 22 числа; совпадение → `matched`, иначе `secondLayer`.
- [ ] Значения детерминированы (ответ + дата = один и тот же экран); `windowYear` без `Date`.
- [ ] После оплаты возврат на `/lp/rod`: тот же экран открывает 3 залоченных блока без повторного ввода.
- [ ] `/lp/love` и `/lp/horo-love` не задеты (свой клиент, свой копи-модуль).
- [ ] `rod-copy.test.mjs` и `index.test.mjs` зелёные; прод-сборка чистая.
- [ ] В прозе нет длинного тире и конструкций «не X, а Y» как украшения (проверка ревьюером на вычитке).

## Вне скоупа (YAGNI сейчас)

Форк по шагам 2-6 (форкает только шаг 1), лендинги «предназначение»/«деньги», A/B заголовков, повтор-CTA внизу, точная деривация года окна из `yearForecast` (сейчас плейсхолдер `windowYear`), мужской вариант лендинга.

## Открытые вопросы (решает Кирилл на вычитке)

- Тюнинг `ARCHETYPE_BY_NUMBER` (черновой; особо спорные 19/Солнце, 21/Мир).
- Финальные заголовки залоченных байтов (есть альтернативы в брифе).
- Формула `windowYear` из `yearForecast`.
- Слаг (`rod` vs `rodovoy`/`matrix-rod`).
