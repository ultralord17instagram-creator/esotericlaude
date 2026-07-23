# Таро «Проверка на порчу»: план реализации

> **For Claude:** REQUIRED SUB-SKILL: используй superpowers:executing-plans, чтобы реализовать этот план задача-за-задачей.

**Goal:** Собрать прелендинг-воронку `/lp/taro-porcha` на новом движке `diagnostic`: шкала симптомов (мультивыбор, наливающийся индикатор) → имя → театр «тасую колоду» → расклад из 3 карт (что на тебе / откуда / что дальше) → кастомный финал-вердикт «На тебя ...» с кнопкой «Узнать» → регистрация. Карты подбираются детерминированно и смещены по ролям (теневые арканы на проблему, выходные на выход), не привязаны к результату шкалы (принцип «нет тупика»).

**Architecture:** Новый движок `diagnostic` подключается одной веткой в `frontend/app/lp/[slug]/page.jsx` (как `terminal`/`live-reveal`). Чистая логика (скоринг, бакет, детерминированный подбор карт по ролям, сборка расклада и финала) вынесена в `diagnosticMachine.js` и покрыта `node:test`; она переиспользует `normalizeName/interpolate/seedFromName/pickCards` из `revealMachine.js` и колоду `DECK`. Контент в `taro-porcha-copy.js`, конфиг в `taro-porcha.js`, тема-каркас в `diagnostic.module.css`. Клиент `DiagnosticClient.jsx` держит линейную фазовую машину + локальный компонент `SymptomMeter`. Бэкенд не трогаем.

**Tech Stack:** Next.js 14 (App Router), React 18, CSS Modules, `node --test` для юнит-тестов чистой логики и контента. Верификация только в Docker (на хосте нет Node).

---

## Исходные документы (источник истины)

- Дизайн: [2026-07-19-taro-porcha-landing-design.md](2026-07-19-taro-porcha-landing-design.md)
- Копи-бриф (симптомы+веса, пулы толкований A/B/C, финалы, копия экранов, анти-слоп): [2026-07-19-taro-porcha-copy-brief.md](2026-07-19-taro-porcha-copy-brief.md)

Тексты в `taro-porcha-copy.js` это транскрипция из копи-брифа. **При любом расхождении копи-бриф главнее** (его правит заказчик).

## Зафиксированные решения (развилки закрыты)

- **Возврат подписчика: редирект в `/lk`** (как в `RevealClient`/`TerminalClient`), фазы `full` на лендинге НЕТ. Полный разбор доставляет продукт в личном кабинете; сверх расклада отдельного контента в брифе нет, поэтому не дублируем его на прелендинге. Это осознанное отклонение от дизайн-дока §4/§5 (там предлагалась фаза `full`).
- **Light-финалы (5 из 6 карт) драфчу по правилу брифа.** В брифе прописаны все heavy-финалы и только правило + пример (Луна) для light. Остальные 5 light-финалов написаны по формуле брифа (лид + смягчённый вердикт + мягкая концовка) и помечены как **черновик Claude, к вычитке Кириллом**. Тесты проверяют их наличие и непустоту, а не формулировку.
- **CSS: минимальный рабочий каркас** `diagnostic.module.css` (структурные стили, чтобы фазы и шкала читались). Финальный вид заказчик доводит в Claude Design (как horo-love/taro-terminal).
- **Дефолты из брифа:** слаг `taro-porcha`; спрашиваем только имя (без даты рождения); порог `T = 4`; веса симптомов из таблицы брифа; кнопка «Узнать».

## Правила проекта (обязательно соблюдать)

- **Без длинного тире «—»** в отгружаемом тексте (пользовательское правило). Тест копи-файла это проверяет.
- **Никаких обещаний результата, гарантий снятия, медицины/диагнозов.** Симптомы бытовые (сила, деньги, отношения, сон, удача). Тон жёсткий, Барнум.
- **Анти-слоп (см. бриф §«Анти-слоп»):** без антитезы «не X, а Y», без мистики-филлера, без поэтических украшений. Транскрибируй бриф дословно, не «улучшай».
- Токен `{name}` подставляется только как подлежащее в именительном падеже. По умолчанию весь копирайт на «ты», `{name}` в v1 фактически не используется, но `interpolate()` в машине его поддерживает.
- Подбор карт **смещён по ролям**: теневые арканы (Луна 18, Дьявол 15, Башня 16, Смерть 13, Повешенный 12, Жрица 2) в слотах A и B; выходные (Звезда 17, Солнце 19, Суд 20, Мир 21, Умеренность 14, Сила 8) в слоте C. Финал берётся по **карте источника (слот B)** и бакету.
- Правки в существующих файлах минимальные: 1 строка ветки роутера + 2 строки реестра. Другие лендинги не трогаем.

## Верификация в этом проекте (среда нестандартная, важно)

- **Node только в Docker** (нет host node/npm). Чистую логику и контент гоняем эфемерным контейнером:
  ```
  docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test <путь к .test.mjs>
  ```
  Запускать **через PowerShell-инструмент** (Git Bash на Windows ломает пути `-v`/`-w`). Предупреждение `MODULE_TYPELESS_PACKAGE_JSON` безвредно.
- **Импорты в тест-файлах и подтягиваемых модулях только явные `./x.js`** (raw `node --test` не резолвит расширения/директории). `diagnosticMachine.js` импортирует `./revealMachine.js` и `../../content/tarot/deck.js` (оба уже с `.js`).
- **Никаких `npm run build` после каждой задачи** и **никаких скриншотов** (браузерный инструмент до докер-сервера не достаёт). Для CSS/JSX гейт это «компилируется + один прод-билд в конце».
- Финальный прод-билд с `-e NODE_ENV=production` (иначе спурьёзные ошибки `<Html>`/`useContext`, это не реальные баги), затем рестарт dev-контейнера. Детали в задаче 7.
- Коммиты **локальные** на текущей ветке `feat/astrix-homepage-redesign`. Пуш только по явной просьбе пользователя.

---

## Task 1: Чистая логика движка (`diagnosticMachine.js`)

**Files:**
- Create: `frontend/app/lp/logic/diagnosticMachine.js`
- Test: `frontend/app/lp/logic/diagnosticMachine.test.mjs`

**Step 1: Написать падающий тест**

Создать `frontend/app/lp/logic/diagnosticMachine.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SHADOW_NUMBERS, EXIT_NUMBERS, SHADOW_DECK, EXIT_DECK,
  scoreTicks, bucketFor, ticksSignature, buildSeed, pickVariant, pickReadingCards, buildReading,
} from './diagnosticMachine.js'

// Мини-фикстура копирайта: покрывает все теневые/выходные арканы и оба бакета.
const SHADOW = [18, 15, 16, 13, 12, 2]
const EXIT = [17, 19, 20, 21, 14, 8]
const mapNums = (nums, tag) => Object.fromEntries(nums.map((n) => [n, `${tag}${n}`]))
const COPY = {
  scan: {
    threshold: 4,
    symptoms: [
      { key: 'a', label: 'A', weight: 1 },
      { key: 'b', label: 'B', weight: 2 },
      { key: 'c', label: 'C', weight: 1 },
    ],
  },
  slots: {
    A: { openers: { heavy: ['H-open'], light: ['L-open'] }, intros: mapNums(SHADOW, 'A') },
    B: { intros: mapNums(SHADOW, 'B') },
    C: { intros: mapNums(EXIT, 'C'), tails: { heavy: ['H-tail'], light: ['L-tail'] } },
  },
  final: {
    headings: { heavy: mapNums(SHADOW, 'FH'), light: mapNums(SHADOW, 'FL') },
    listIntro: 'LI', promises: ['p1', 'p2', 'p3'], cta: 'Узнать',
  },
}

test('теневой и выходной наборы: по 6 арканов, не пересекаются', () => {
  assert.deepEqual(SHADOW_NUMBERS, [18, 15, 16, 13, 12, 2])
  assert.deepEqual(EXIT_NUMBERS, [17, 19, 20, 21, 14, 8])
  assert.equal(SHADOW_DECK.length, 6)
  assert.equal(EXIT_DECK.length, 6)
  assert.ok(SHADOW_DECK.every((c) => c && c.ru))          // валидные карты из колоды
  const overlap = SHADOW_NUMBERS.filter((n) => EXIT_NUMBERS.includes(n))
  assert.equal(overlap.length, 0)
})

test('scoreTicks: сумма весов, пустой и неизвестный ключ дают 0', () => {
  assert.equal(scoreTicks([], COPY.scan.symptoms), 0)
  assert.equal(scoreTicks(['b'], COPY.scan.symptoms), 2)
  assert.equal(scoreTicks(['a', 'b', 'c'], COPY.scan.symptoms), 4)
  assert.equal(scoreTicks(['zzz'], COPY.scan.symptoms), 0)
})

test('bucketFor: порог включительно даёт heavy', () => {
  assert.equal(bucketFor(4, 4), 'heavy')
  assert.equal(bucketFor(5, 4), 'heavy')
  assert.equal(bucketFor(3, 4), 'light')
  assert.equal(bucketFor(0, 4), 'light')
})

test('ticksSignature стабильна к порядку, buildSeed склеивает', () => {
  assert.equal(ticksSignature(['b', 'a']), ticksSignature(['a', 'b']))
  assert.equal(buildSeed('Аня', 'heavy', ['b', 'a']), 'Аня|heavy|a,b')
})

test('pickVariant детерминирован и в границах массива', () => {
  const arr = ['x', 'y']
  assert.equal(pickVariant('seed', arr), pickVariant('seed', arr))
  assert.ok(arr.includes(pickVariant('seed', arr)))
  assert.equal(pickVariant('seed', []), '')
})

test('pickReadingCards: A,B из теневого набора и различны, C из выходного', () => {
  const [a, b, c] = pickReadingCards('Аня|heavy|a,b')
  assert.ok(SHADOW_NUMBERS.includes(a.number))
  assert.ok(SHADOW_NUMBERS.includes(b.number))
  assert.notEqual(a.number, b.number)
  assert.ok(EXIT_NUMBERS.includes(c.number))
  // детерминизм
  const again = pickReadingCards('Аня|heavy|a,b')
  assert.deepEqual(again.map((x) => x.number), [a, b, c].map((x) => x.number))
})

test('buildReading: детерминизм и сборка heavy', () => {
  const r1 = buildReading(COPY, { name: 'Аня', ticks: ['a', 'b', 'c'] })
  const r2 = buildReading(COPY, { name: 'Аня', ticks: ['c', 'a', 'b'] }) // порядок не важен
  assert.deepEqual(r1, r2)
  assert.equal(r1.bucket, 'heavy')
  assert.equal(r1.cards.length, 3)
  assert.equal(r1.slots.length, 3)
  const src = r1.cards[1].number
  // финал берётся по карте источника (слот B) и бакету
  assert.equal(r1.final.heading, `FH${src}`)
  // слот A = опенер бакета + вступление карты A; слот C = вступление карты C + хвост бакета
  assert.ok(r1.slots[0].startsWith('H-open'))
  assert.ok(r1.slots[0].includes(`A${r1.cards[0].number}`))
  assert.ok(r1.slots[2].includes('H-tail'))
})

test('buildReading: пустая шкала -> light, но расклад полный (нет тупика)', () => {
  const r = buildReading(COPY, { name: '', ticks: [] })
  assert.equal(r.bucket, 'light')
  assert.equal(r.cards.length, 3)
  assert.ok(r.slots.every((s) => s && s.length > 0))     // 3 непустых толкования
  assert.ok(r.final.heading && r.final.heading.length > 0) // финал есть
  assert.ok(r.slots[0].startsWith('L-open'))
  assert.ok(r.slots[2].includes('L-tail'))
})
```

**Step 2: Запустить тест — убедиться, что падает**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/lp/logic/diagnosticMachine.test.mjs
```
Expected: FAIL (модуль `./diagnosticMachine.js` не найден / экспорты не определены).

**Step 3: Написать минимальную реализацию**

Создать `frontend/app/lp/logic/diagnosticMachine.js`:

```js
// Чистая логика движка diagnostic: скоринг симптомов, бакет heavy/light,
// детерминированный подбор карт со смещением по ролям (теневые на A/B, выходные на C),
// сборка расклада и финала. Без React и без сети, тестируется node:test.
// Переиспользует хелперы revealMachine (нормализация имени, хеш-сид, подбор карт).
import { DECK } from '../../content/tarot/deck.js'
import { normalizeName, interpolate, seedFromName, pickCards } from './revealMachine.js'

// Теневые арканы (проблема): Луна, Дьявол, Башня, Смерть, Повешенный, Жрица -> слоты A и B.
export const SHADOW_NUMBERS = [18, 15, 16, 13, 12, 2]
// Выходные арканы (что дальше): Звезда, Солнце, Суд, Мир, Умеренность, Сила -> слот C.
export const EXIT_NUMBERS = [17, 19, 20, 21, 14, 8]

const cardsByNumbers = (nums) => nums.map((n) => DECK.find((c) => c.number === n))
export const SHADOW_DECK = cardsByNumbers(SHADOW_NUMBERS)
export const EXIT_DECK = cardsByNumbers(EXIT_NUMBERS)

// Сумма весов отмеченных симптомов. Неизвестные ключи игнорируются.
export function scoreTicks(ticks, symptoms) {
  const weight = new Map(symptoms.map((s) => [s.key, s.weight]))
  return (ticks || []).reduce((sum, k) => sum + (weight.get(k) || 0), 0)
}

// Порог включительно: score >= T это heavy, иначе light.
export function bucketFor(score, threshold) {
  return score >= threshold ? 'heavy' : 'light'
}

// Стабильная к порядку подпись набора симптомов (для сида).
export function ticksSignature(ticks) {
  return [...(ticks || [])].sort().join(',')
}

// Строка-сид: имя|бакет|подпись симптомов. Один ввод -> один расклад.
export function buildSeed(name, bucket, ticks) {
  return `${name}|${bucket}|${ticksSignature(ticks)}`
}

// Детерминированный выбор варианта строки из пула (опенер/хвост) по сиду.
export function pickVariant(seedStr, arr) {
  if (!arr || arr.length === 0) return ''
  return arr[seedFromName(seedStr) % arr.length]
}

// Три карты со смещением по ролям: [A, B] различны из теневого набора, C из выходного.
export function pickReadingCards(seedStr) {
  const [a, b] = pickCards(seedStr, 2, SHADOW_DECK)
  const [c] = pickCards(`${seedStr}|c`, 1, EXIT_DECK)
  return [a, b, c]
}

// Собрать расклад: 3 карты, 3 текста слотов, финал по карте источника (слот B) и бакету.
// slotA = опенер[бакет] + вступление карты A; slotB = вступление карты B (источник);
// slotC = вступление карты C + хвост[бакет]. Все токены {name} подставляются.
export function buildReading(copy, { name = '', ticks = [] } = {}) {
  const cleanName = normalizeName(name)
  const score = scoreTicks(ticks, copy.scan.symptoms)
  const bucket = bucketFor(score, copy.scan.threshold)
  const seedStr = buildSeed(cleanName, bucket, ticks)
  const [cardA, cardB, cardC] = pickReadingCards(seedStr)
  const fill = (t) => interpolate(t, cleanName)

  const openerA = pickVariant(`${seedStr}|opA`, copy.slots.A.openers[bucket])
  const tailC = pickVariant(`${seedStr}|tailC`, copy.slots.C.tails[bucket])

  const slots = [
    fill(`${openerA} ${copy.slots.A.intros[cardA.number]}`),
    fill(copy.slots.B.intros[cardB.number]),
    fill(`${copy.slots.C.intros[cardC.number]} ${tailC}`),
  ]

  return {
    score,
    bucket,
    cards: [cardA, cardB, cardC],
    sourceCard: cardB,
    slots,
    final: {
      heading: fill(copy.final.headings[bucket][cardB.number]),
      listIntro: copy.final.listIntro,
      promises: copy.final.promises,
      cta: copy.final.cta,
    },
  }
}
```

**Step 4: Запустить тест — убедиться, что проходит**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/lp/logic/diagnosticMachine.test.mjs
```
Expected: PASS (все тесты зелёные).

**Step 5: Коммит (локальный)**

```
git add frontend/app/lp/logic/diagnosticMachine.js frontend/app/lp/logic/diagnosticMachine.test.mjs
git commit -m "feat(lp): чистая логика движка diagnostic (скоринг, бакет, подбор карт по ролям, сборка расклада)"
```

---

## Task 2: Контент лендинга (`taro-porcha-copy.js`)

**Files:**
- Create: `frontend/app/content/landings/taro-porcha-copy.js`
- Test: `frontend/app/content/landings/taro-porcha-copy.test.mjs`

**Step 1: Написать падающий тест**

Создать `frontend/app/content/landings/taro-porcha-copy.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TARO_PORCHA_COPY } from './taro-porcha-copy.js'
import { SHADOW_NUMBERS, EXIT_NUMBERS } from '../../lp/logic/diagnosticMachine.js'

const C = TARO_PORCHA_COPY

test('экраны intro/scan/name/calculating/reveal на месте', () => {
  assert.ok(C.meta.title && C.meta.description)
  assert.ok(C.intro.eyebrow && C.intro.title && C.intro.subtitle && C.intro.cta && C.intro.note)
  assert.ok(C.scan.title && C.scan.subtitle && C.scan.meterLabel && C.scan.cta)
  assert.ok(C.name.title && C.name.placeholder && C.name.cta)
  assert.ok(C.calculating.title && C.calculating.lines.length === 3)
  assert.ok(C.reveal.eyebrow && C.reveal.title && C.reveal.positions.length === 3)
  assert.ok(C.reveal.cta && C.reveal.loading && C.reveal.restart)
})

test('9 симптомов: уникальные ключи, числовой вес, порог число', () => {
  assert.equal(C.scan.symptoms.length, 9)
  const keys = C.scan.symptoms.map((s) => s.key)
  assert.equal(new Set(keys).size, 9)
  for (const s of C.scan.symptoms) {
    assert.ok(s.key && s.label, `симптом ${s.key}`)
    assert.equal(typeof s.weight, 'number')
  }
  assert.equal(typeof C.scan.threshold, 'number')
})

test('пулы слота A: опенеры обоих бакетов + вступления на все теневые арканы', () => {
  assert.ok(C.slots.A.openers.heavy.length > 0 && C.slots.A.openers.light.length > 0)
  for (const n of SHADOW_NUMBERS) {
    assert.ok(C.slots.A.intros[n] && C.slots.A.intros[n].length > 0, `A.intros[${n}]`)
  }
})

test('пулы слота B: вступления-источники на все теневые арканы', () => {
  for (const n of SHADOW_NUMBERS) {
    assert.ok(C.slots.B.intros[n] && C.slots.B.intros[n].length > 0, `B.intros[${n}]`)
  }
})

test('пулы слота C: вступления на все выходные арканы + хвосты обоих бакетов', () => {
  for (const n of EXIT_NUMBERS) {
    assert.ok(C.slots.C.intros[n] && C.slots.C.intros[n].length > 0, `C.intros[${n}]`)
  }
  assert.ok(C.slots.C.tails.heavy.length > 0 && C.slots.C.tails.light.length > 0)
})

test('финалы: heavy и light на все теневые (источник) арканы, 3 обещания, кнопка', () => {
  assert.ok(C.final.eyebrow && C.final.listIntro && C.final.cta && C.final.restart)
  assert.equal(C.final.promises.length, 3)
  for (const n of SHADOW_NUMBERS) {
    assert.ok(C.final.headings.heavy[n] && C.final.headings.heavy[n].length > 0, `heavy[${n}]`)
    assert.ok(C.final.headings.light[n] && C.final.headings.light[n].length > 0, `light[${n}]`)
  }
})

test('нигде нет длинного тире', () => {
  assert.ok(!JSON.stringify(C).includes('—'))
})
```

**Step 2: Запустить тест — убедиться, что падает**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/content/landings/taro-porcha-copy.test.mjs
```
Expected: FAIL (`./taro-porcha-copy.js` не найден).

**Step 3: Написать контент**

Создать `frontend/app/content/landings/taro-porcha-copy.js`. Тексты транскрибированы из копи-брифа. **Проверь на «—» перед сохранением** (только запятые/двоеточия/скобки). Light-финалы для Дьявола/Башни/Смерти/Повешенного/Жрицы это черновик по правилу брифа (лид + смягчённый вердикт + мягкая концовка), помечен комментарием к вычитке.

```js
// Тексты лендинга «Проверка на порчу» (движок diagnostic, копи-бриф 2026-07-19).
// Тон жёсткий, Барнум. Правила: обращение на «ты», без длинного тире,
// без гарантий/медицины, анти-слоп (без «не X, а Y»). Ключи intros это номера
// арканов (deck.js): теневые 18/15/16/13/12/2 (A,B), выходные 17/19/20/21/14/8 (C).
export const TARO_PORCHA_COPY = {
  meta: {
    title: 'Проверка на порчу: есть ли на тебе сглаз или родовой блок',
    description: 'Отметь свои признаки и вытяни карты. Расклад покажет, есть ли на тебе чужой негатив, откуда он взялся и снимается ли.',
  },
  // Экран intro (hero).
  intro: {
    eyebrow: 'Диагностика по картам Таро',
    title: 'Проверь, есть ли на тебе негатив, порча или чужая зависть',
    subtitle: 'Отметь, что узнаёшь в себе, и карты скажут, что тебя держит. Честно, даже если будет неприятно.',
    cta: 'Пройти проверку',
    note: '2 минуты. Только твои ответы и карты.',
  },
  // Экран scan (шкала симптомов). Веса и порог из брифа (калибруются на копирайте).
  scan: {
    title: 'Отметь всё, что узнаёшь в себе',
    subtitle: 'Чем больше совпадений, тем плотнее то, что на тебе висит.',
    meterLabel: 'Уровень негатива',
    cta: 'Проверить картами',
    threshold: 4,
    symptoms: [
      { key: 'sila', label: 'Силы уходят в никуда, просыпаешься уже уставшей', weight: 1 },
      { key: 'dengi', label: 'Деньги утекают сквозь пальцы, сколько бы ни было', weight: 1 },
      { key: 'lubov', label: 'Отношения рушатся на ровном месте', weight: 1 },
      { key: 'stena', label: 'Любое дело упирается в стену перед самым концом', weight: 1 },
      { key: 'son', label: 'Тяжёлые сны и тревога без причины', weight: 1 },
      { key: 'zavist', label: 'Чувство, что кто-то желает тебе зла', weight: 2 },
      { key: 'polosa', label: 'Пошла чёрная полоса, всё валится из рук', weight: 1 },
      { key: 'sled', label: 'Всё сломалось после одного человека или события', weight: 2 },
      { key: 'zerkalo', label: 'Смотришь в зеркало и себя не узнаёшь', weight: 1 },
    ],
  },
  // Экран name.
  name: {
    title: 'Как тебя зовут?',
    subtitle: 'Колода ляжет на твоё имя.',
    placeholder: 'Имя',
    hint: 'Достаточно имени, карты найдут твою энергию.',
    cta: 'Разложить карты',
  },
  // Экран calculating (театр).
  calculating: {
    title: 'Тасую колоду на тебя…',
    lines: [
      'Свожу твои ответы с картами…',
      'Смотрю, что тянется за тобой следом…',
      'Проверяю, чужое это или своё…',
    ],
  },
  // Экран reveal (рамка расклада). positions по слотам A/B/C.
  reveal: {
    eyebrow: 'Твой расклад',
    title: 'Три карты. Что на тебе, откуда и снимается ли.',
    positions: ['Что на тебе', 'Откуда это', 'Что дальше'],
    cta: 'Что с этим делать →',
    loading: 'Открываю карты…',
    restart: 'Начать заново',
  },
  // Пулы толкований. Ключи intros это номера арканов из deck.js.
  slots: {
    // Слот A «Что на тебе»: опенер по бакету + вступление по выпавшей карте (теневой набор).
    A: {
      openers: {
        heavy: ['Скажу сразу, тянуть не буду.', 'Расклад лёг тяжело.'],
        light: [
          'Открытой метки карты не дали, но и чистым расклад не назвали.',
          'Сильного на тебе не вижу, а вот помельче кое-что уже цепляется.',
        ],
      },
      intros: {
        18: 'Первой легла Луна. Её тянут, когда человека обманывают и решают за его спиной. По тебе это уже проступает: делаешь всё правильно, а сил нет и ничего не радует, будто кто-то отматывает их себе. И это не про обычную усталость, ты сама давно чувствуешь.',
        15: 'Первым лёг Дьявол. Он выпадает, когда человека что-то держит и не пускает, а вырваться хочется давно. У тебя это про одну и ту же колею: решаешь начать заново, а через месяц всё скатывается обратно. Злишься на себя, а выйти из круга не получается.',
        16: 'Первой встала Башня. Её тянут, когда в жизни ломается резко и не по твоей вине. У тебя был момент, после которого всё пошло под откос: работа, деньги, отношения посыпались один за другим. С тех пор живёшь с ощущением, что удача отвернулась.',
        13: 'Первой легла Смерть, и пугаться имени не надо. Тут она про то, что внутри тебя что-то заглохло и обратно не заводится. Раньше горела, тянулась к людям и планам, а теперь живёшь на автомате. Возраст и характер ни при чём, тебя придавили.',
        12: 'Первым лёг Повешенный. Его тянут, когда человек застрял и месяцами топчется на месте. Ты будто в подвешенном состоянии: и не плохо, и не хорошо, а сдвинуться не выходит. Любое дело буксует у самого финиша, словно кто-то держит за руку.',
        2: 'Первой легла Жрица. Она про то, что от тебя скрыто и о чём ты пока не догадываешься. На тебя влияют со стороны, а ты списываешь на совпадения и невезение. Внутри давно свербит, что не всё чисто, но ты привыкла заглушать.',
      },
    },
    // Слот B «Откуда это» (источник): вступление по карте, общее для обоих бакетов.
    B: {
      intros: {
        18: 'В источнике встала Луна. Это живой человек рядом, который в лицо улыбается, а за спиной желает тебе плохого. Скорее всего женщина из близкого круга, которая тебе завидует. Ты пару раз ловила это чувство, но убеждала себя, что накручиваешь.',
        15: 'Источник это Дьявол. Тянется к мужчине из прошлого, с которым ты так и не закрыла тему. Вы давно не вместе, а легче не стало, и каждого нового ты невольно с ним сравниваешь. Пока эта сцепка держится, новые отношения будут разваливаться на старте.',
        16: 'Источником легла Башня. Всё началось после одного события или человека, и с той точки полоса не кончается. Ты и сама помнишь этот момент, жизнь будто раскололась на до и после. То, что пришло тогда, сидит на тебе до сих пор.',
        13: 'В источнике легла Смерть. Идёт по роду, по женской линии. Приглядись: у матери или бабки была та же беда, тот же сценарий с деньгами или в личной жизни. Ты получила это по наследству, сама ничем не заслужила.',
        12: 'Источник это Повешенный. Ты сама это на себя навесила: обидой, виной, словами, что когда-то в сердцах сказала про себя. Брошенное себе бьёт не слабее чужого сглаза. Годами носишь и не замечаешь.',
        2: 'Источник это Жрица. На тебя посмотрели тяжёлым глазом, по-простому сглазили, и чаще такое делают даже не со зла. Хватило чужой зависти в неудачный для тебя день. С тех пор мелочи копятся и липнут одна к другой.',
      },
    },
    // Слот C «Что дальше»: вступление по карте (выходной набор) + хвост по бакету.
    C: {
      intros: {
        17: 'Последней легла Звезда, а это добрый знак: снять это с тебя можно.',
        19: 'Расклад закрыло Солнце. Выход есть, и он ближе, чем ты думаешь.',
        20: 'Последним лёг Суд. Это можно отменить и переиграть заново.',
        21: 'Расклад закрыл Мир. Этот круг реально разорвать и закрыть тему насовсем.',
        14: 'Последней легла Умеренность. Всё поправимо, если взяться сейчас, спокойно и по шагам.',
        8: 'Закрыла расклад Сила. Снять это тебе по плечу, ресурс на это есть.',
      },
      tails: {
        heavy: [
          'Только само оно не рассосётся: затянешь, вцепится крепче. Сейчас уходит быстро, а через год-два разгребать куда дольше.',
          'Ждать бесполезно, дальше будет только хуже. Пока свежее, снимается легко, потом врастает глубже.',
        ],
        light: [
          'Пока оно слабое, потому и уходит легко. Оставишь как есть, оно наберёт силу.',
          'Сейчас это ловится в самом начале. Прозеваешь, окрепнет, и снимать придётся долго.',
        ],
      },
    },
  },
  // Финал «На тебя ...» по карте источника (слот B) и бакету.
  final: {
    eyebrow: 'Итог расклада',
    headings: {
      // heavy: транскрипция брифа (все 6 карт).
      heavy: {
        18: 'На тебе чужая зависть, и идёт она от близкого человека, который рядом с тобой каждый день. Из-за неё утекают силы и деньги, а любое хорошее начинание вязнет и сходит на нет. Само это не отвалится: будешь тянуть, вцепится ещё крепче.',
        15: 'На тебе привязка к мужчине из прошлого, которую ты так и не разорвала до конца. Из-за неё не клеится ни с кем новым: ты сравниваешь, ждёшь, а отношения разваливаются на старте. Пока эта сцепка держится, всё пойдёт по одному кругу.',
        16: 'На тебе тяжёлый след после того перелома, с которого всё посыпалось. Он до сих пор тянет тебя вниз: деньги, работа, отношения так и не встали на место. Само не выправится, чем дольше тянешь, тем глубже увязаешь.',
        13: 'На тебе родовое, оно тянется по женской линии от матери и бабки. Из-за него ты раз за разом наступаешь на те же грабли в деньгах и в личной жизни, будто идёшь по чужому сценарию. Сам этот круг не разомкнётся, его закрывают осознанно.',
        12: 'На тебе то, что ты годами вешала на себя сама: обиды, вина, злые слова о себе. Оно давно держит тебя на месте и не даёт сдвинуться ни в чём. Само не рассосётся, пока не увидишь корень и не снимешь.',
        2: 'На тебе сглаз, тихий и незаметный, оттого ты и списывала всё на невезение. Он подъедает силы и удачу изо дня в день, а ты даже не знаешь, с чьего взгляда всё началось. Ждать бесполезно, само только окрепнет.',
      },
      // light: Луна из примера брифа; остальные 5 драфт Claude по правилу брифа
      // (лид + смягчённый вердикт + мягкая концовка). TODO(copy): вычитка Кириллом.
      light: {
        18: 'Тяжёлого на тебе нет, так что выдохни. Но чужая зависть рядом уже есть, и идёт она от близкого человека, который каждый день с тобой. Из-за неё по мелочи утекают силы и деньги. Пока это слабое и снимается легко. Поймаешь сейчас, до беды не дойдёт.',
        15: 'Открытой беды карты не показали. Но лёгкая привязка к мужчине из прошлого у тебя есть, до конца ты её так и не отпустила. Из-за неё с новыми пока не клеится: сравниваешь и ждёшь. Пока это слабое и снимается легко. Займёшься сейчас, круг не успеет затянуться.',
        16: 'Тяжёлого на тебе нет, так что выдохни. Но лёгкий след после того перелома остался, местами он ещё тянет тебя назад: то с деньгами, то с работой пробуксовка. Крупной беды в этом нет. Пока это слабое и снимается легко. Поймаешь сейчас, до беды не дойдёт.',
        13: 'Открытой беды карты не показали. Но тонкая родовая ниточка по женской линии у тебя есть, тот самый мамин и бабкин сценарий иногда мелькает в деньгах и в личном. Пока это только слабый намёк. Пока это слабое и снимается легко. Закроешь сейчас, дальше не пойдёт.',
        12: 'Тяжёлого на тебе нет, так что выдохни. Но кое-что ты всё же навесила на себя сама: мелкие обиды и привычку ругать себя. Иногда это придерживает тебя на месте. Пока это слабое и снимается легко. Разберёшься сейчас, глубже не врастёт.',
        2: 'Открытой беды карты не показали. Но лёгкий сглаз к тебе всё же прилип, оттого местами и накрывает невезением. Он по чуть-чуть подъедает силы и удачу. Пока это слабое и снимается легко. Поймаешь сейчас, до беды не дойдёт.',
      },
    },
    listIntro: 'Карты показали направление. Дальше открывается:',
    promises: [
      'Кто и за что: источник и почему это пришло именно к тебе',
      'На что оно уже влияет: деньги, отношения, здоровье, удача',
      'Пошагово, как снять и закрыться, чтобы не вернулось',
    ],
    cta: 'Узнать',
    restart: '← пройти заново',
  },
  microcopy: {
    back: 'назад',
    next: 'Далее',
  },
}
```

**Step 4: Запустить тест — убедиться, что проходит**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/content/landings/taro-porcha-copy.test.mjs
```
Expected: PASS.

**Step 5: Коммит (локальный)**

```
git add frontend/app/content/landings/taro-porcha-copy.js frontend/app/content/landings/taro-porcha-copy.test.mjs
git commit -m "feat(lp): копирайт taro-porcha (симптомы, пулы A/B/C, финалы heavy/light)"
```

---

## Task 3: Конфиг лендинга + регистрация в реестре

**Files:**
- Create: `frontend/app/content/landings/taro-porcha.js`
- Modify: `frontend/app/content/landings/index.js` (2 строки: import + запись в `LANDINGS`)
- Test: `frontend/app/content/landings/index.test.mjs` (добавить один тест)

**Step 1: Дописать падающий тест в `index.test.mjs`**

В конец `frontend/app/content/landings/index.test.mjs` добавить:

```js
test('getLanding отдаёт конфиг taro-porcha на движке diagnostic', () => {
  const l = getLanding('taro-porcha')
  assert.equal(l.slug, 'taro-porcha')
  assert.equal(l.engine, 'diagnostic')
  assert.equal(l.product, 'tarot')
  assert.equal(l.scan.symptoms.length, 9)
})
```

**Step 2: Запустить тест — убедиться, что падает**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/content/landings/index.test.mjs
```
Expected: FAIL (новый тест — `getLanding('taro-porcha')` возвращает `null`).

**Step 3: Создать конфиг и зарегистрировать**

Создать `frontend/app/content/landings/taro-porcha.js`:

```js
// Конфиг лендинга «Проверка на порчу». engine=diagnostic переключает клиента в page.jsx.
// Тексты в taro-porcha-copy.js. Пользовательский копирайт: без длинного тире.
import { TARO_PORCHA_COPY } from './taro-porcha-copy.js'

export const taroPorchaLanding = {
  slug: 'taro-porcha',
  product: 'tarot',
  engine: 'diagnostic',
  theme: 'diagnostic',
  ...TARO_PORCHA_COPY,
}
```

Изменить `frontend/app/content/landings/index.js` — добавить import и запись в реестр:

```js
import { loveLanding } from './love.js'
import { himLanding } from './him.js'
import { taroHimLanding } from './taro-him.js'
import { taroTerminalLanding } from './taro-terminal.js'
import { horoLoveLanding } from './horo-love.js'
import { taroPorchaLanding } from './taro-porcha.js'

export const LANDINGS = { love: loveLanding, him: himLanding, 'taro-him': taroHimLanding, 'taro-terminal': taroTerminalLanding, 'horo-love': horoLoveLanding, 'taro-porcha': taroPorchaLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
```

**Step 4: Запустить тест — убедиться, что проходит**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/content/landings/index.test.mjs
```
Expected: PASS (включая старые тесты love/him/taro-him/taro-terminal/horo-love).

**Step 5: Коммит (локальный)**

```
git add frontend/app/content/landings/taro-porcha.js frontend/app/content/landings/index.js frontend/app/content/landings/index.test.mjs
git commit -m "feat(lp): конфиг taro-porcha и регистрация слага в реестре"
```

---

## Task 4: Тема-каркас (`diagnostic.module.css`)

**Files:**
- Create: `frontend/app/lp/diagnostic.module.css`

Юнит-теста нет (CSS). Гейт это компиляция в финальном билде (задача 7) и совпадение имён классов с `DiagnosticClient.jsx` (задача 5). Это **рабочий каркас**, не финальный вид: полировку заказчик делает в Claude Design.

**Step 1: Создать файл**

Создать `frontend/app/lp/diagnostic.module.css`:

```css
/* =====================================================================
   Лендинг «Проверка на порчу» (движок diagnostic). Тёмная эзотерическая
   тема, скоуплена на .root. Каркас: финальную полировку делает заказчик
   в Claude Design.
   ===================================================================== */

.root {
  --bg: #0b0710;
  --ink: #efe7f6;
  --muted: #a596b6;
  --accent: #b57cf0;
  --danger: #e0607f;
  --line: rgba(181, 124, 240, .22);
  --panel: rgba(181, 124, 240, .06);
  --sans: var(--font-cosmic-sans), system-ui, sans-serif;

  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: clip;
  background: radial-gradient(120% 90% at 50% -10%, #1a0f28 0%, #060409 70%), var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
}

/* Фон: свечение. */
.backdrop { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.glow { position: absolute; top: -20%; left: 50%; width: 620px; height: 620px; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(circle, rgba(181, 124, 240, .18), transparent 62%); filter: blur(30px); }

/* Топбар. */
.topbar { position: relative; z-index: 2; display: flex; align-items: center; gap: 10px; padding: 16px 20px; }
.brand { width: 22px; height: 22px; border-radius: 6px; background: linear-gradient(135deg, var(--accent), #7a4fd0); }
.brandName { font-size: 13px; letter-spacing: .22em; text-transform: uppercase; color: var(--muted); }

/* Экран/колонка. */
.screen { position: relative; z-index: 2; display: flex; flex-direction: column; animation: screenIn .4s both; }
.pad { flex: 1; display: flex; flex-direction: column; gap: 18px; padding: 24px 22px 44px; max-width: 560px; margin: 0 auto; width: 100%; }
.center { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; }

/* Типографика. */
.eyebrow { font-size: 12px; letter-spacing: .26em; text-transform: uppercase; color: var(--accent); }
.h1 { font-weight: 600; font-size: 24px; line-height: 1.28; margin: 0; text-wrap: pretty; }
.lead { color: var(--muted); font-size: 15px; line-height: 1.6; margin: 0; max-width: 44ch; text-wrap: pretty; }
.note { color: var(--muted); font-size: 12.5px; opacity: .8; margin: 0; }
.hint { color: var(--muted); font-size: 12.5px; margin: 6px 0 0; }

/* Кнопки. */
.cta { align-self: center; font-size: 16px; color: #120a1c; background: var(--accent); border: 0; border-radius: 12px; padding: 15px 30px; cursor: pointer; box-shadow: 0 0 26px rgba(181, 124, 240, .3); transition: transform .12s, box-shadow .2s, background .2s; }
.cta:hover { background: #c795f5; box-shadow: 0 0 34px rgba(181, 124, 240, .45); }
.cta:active { transform: translateY(1px); }
.cta:disabled { opacity: .45; cursor: default; box-shadow: none; }
.ctaPulse { animation: pulse 2s ease-in-out infinite; }
.linkBtn { background: none; border: 0; color: var(--muted); font-size: 13px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.linkBtn:hover { color: var(--ink); }
.restart { margin-top: 16px; text-align: center; }

/* Шкала симптомов. */
.meterWrap { display: flex; flex-direction: column; gap: 18px; }
.chips { display: flex; flex-direction: column; gap: 10px; }
.chip { text-align: left; font-size: 14.5px; line-height: 1.4; color: var(--ink); background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; cursor: pointer; transition: background .16s, border-color .16s, transform .1s; }
.chip:hover { background: rgba(181, 124, 240, .12); }
.chipOn { background: rgba(181, 124, 240, .18); border-color: var(--accent); }
.meter { position: sticky; bottom: 12px; display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: 12px; background: rgba(12, 8, 18, .82); border: 1px solid var(--line); backdrop-filter: blur(6px); }
.meterLabel { display: flex; justify-content: space-between; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: var(--muted); }
.meterTrack { height: 8px; border-radius: 999px; background: rgba(181, 124, 240, .14); overflow: hidden; }
.meterFill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--accent), var(--danger)); transition: width .3s ease; }

/* Поле имени. */
.field { width: 100%; font-size: 16px; color: var(--ink); background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 15px 16px; outline: none; }
.field:focus { border-color: var(--accent); }

/* Расклад: карты. */
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.cardSlot { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.flip { width: 100%; aspect-ratio: 2 / 3; perspective: 900px; }
.flipInner { position: relative; width: 100%; height: 100%; transition: transform .7s cubic-bezier(.4, .1, .2, 1); transform-style: preserve-3d; }
.flipOn .flipInner { transform: rotateY(180deg); }
.flipFace { position: absolute; inset: 0; border-radius: 10px; backface-visibility: hidden; border: 1px solid var(--line); }
.flipBack { background: repeating-linear-gradient(45deg, #1a1026, #1a1026 6px, #241636 6px, #241636 12px); }
.flipFront { transform: rotateY(180deg); background-size: cover; background-position: center; background-color: #1a1026; box-shadow: 0 0 22px rgba(181, 124, 240, .3); }
.cardPos { font-size: 11.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); text-align: center; }

/* Расклад: тексты слотов. */
.slots { display: flex; flex-direction: column; gap: 16px; }
.slotText { font-size: 15.5px; line-height: 1.62; margin: 0; text-wrap: pretty; transition: opacity .4s ease; }
.slotHidden { opacity: 0; }
.revealFoot { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 6px; }

/* Финал. */
.finalHeading { font-size: 18px; line-height: 1.6; margin: 0; text-wrap: pretty; }
.listIntro { color: var(--muted); font-size: 14px; margin: 0; }
.promises { list-style: none; display: flex; flex-direction: column; gap: 10px; padding: 0; margin: 0; }
.promise { position: relative; padding-left: 22px; font-size: 15px; line-height: 1.5; color: var(--ink); }
.promise::before { content: '✦'; position: absolute; left: 0; color: var(--accent); }

/* Анимации. */
@keyframes screenIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 26px rgba(181, 124, 240, .3); } 50% { box-shadow: 0 0 38px rgba(181, 124, 240, .5); } }

@media (prefers-reduced-motion: reduce) {
  .screen, .cta, .ctaPulse, .flipInner, .chip, .slotText, .meterFill { animation: none !important; transition: none !important; }
  .flipOn .flipInner { transform: rotateY(180deg); }
  .slotHidden { opacity: 1; }
}

@media (min-width: 640px) {
  .h1 { font-size: 28px; }
  .cards { gap: 14px; }
}
```

**Step 2: Коммит (локальный)**

```
git add frontend/app/lp/diagnostic.module.css
git commit -m "feat(lp): каркас темы diagnostic.module.css"
```

---

## Task 5: Движок фаз (`DiagnosticClient.jsx` + `SymptomMeter`)

**Files:**
- Create: `frontend/app/lp/[slug]/DiagnosticClient.jsx`

Юнит-теста нет (React-компонент). Логика скоринга/бакета/расклада уже покрыта в задаче 1. Гейт это компиляция в финальном билде (задача 7). Имена классов должны совпадать с `diagnostic.module.css`. Возврат подписчика редиректит в `/lk` (фазы `full` нет). `Calculating` переиспользуем из `../components/Calculating`.

**Step 1: Создать файл**

Создать `frontend/app/lp/[slug]/DiagnosticClient.jsx`:

```jsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { saveQuiz, loadQuiz } from '../logic/quizStorage.js'
import { normalizeName, scoreTicks, bucketFor, buildReading } from '../logic/diagnosticMachine.js'
import Calculating from '../components/Calculating'
import styles from '../diagnostic.module.css'

const CARD_SRC = (n) => `/cards/${n}.png`

// Шкала симптомов: сетка чипов мультивыбора + наливающийся индикатор.
function SymptomMeter({ symptoms, ticks, onToggle, score, maxScore, label }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  return (
    <div className={styles.meterWrap}>
      <div className={styles.chips}>
        {symptoms.map((s) => {
          const on = ticks.includes(s.key)
          return (
            <button key={s.key} type="button" aria-pressed={on}
              className={`${styles.chip} ${on ? styles.chipOn : ''}`}
              onClick={() => onToggle(s.key)}>
              {s.label}
            </button>
          )
        })}
      </div>
      <div className={styles.meter}>
        <div className={styles.meterLabel}><span>{label}</span><span>{pct}%</span></div>
        <div className={styles.meterTrack}><div className={styles.meterFill} style={{ width: `${pct}%` }} /></div>
      </div>
    </div>
  )
}

export default function DiagnosticClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const router = useRouter()

  const [phase, setPhase] = useState('intro') // intro | scan | name | calculating | reveal | final
  const [ticks, setTicks] = useState([])
  const [name, setName] = useState('')
  const [flips, setFlips] = useState([false, false, false])
  const [shown, setShown] = useState(0) // сколько слотов текста раскрыто

  const timers = useRef([])
  const isSubscribed = user?.subscribed ?? false

  const maxScore = landing.scan.symptoms.reduce((sum, s) => sum + s.weight, 0)
  const score = scoreTicks(ticks, landing.scan.symptoms)
  const reading = buildReading(landing, { name, ticks })

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const after = (ms, fn) => { const t = setTimeout(fn, ms); timers.current.push(t); return t }

  useEffect(() => {
    track('lp_view', { slug: landing.slug })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат после оплаты: полный разбор живёт в ЛК.
  useEffect(() => {
    if (isSubscribed && loadQuiz(landing.slug)) router.push('/lk')
  }, [isSubscribed, landing.slug, router])

  useEffect(() => () => clearTimers(), [])

  // reveal: карты и тексты раскрываются по одной.
  useEffect(() => {
    if (phase !== 'reveal') return undefined
    setFlips([false, false, false]); setShown(0)
    track('reveal_view', { slug: landing.slug, bucket: reading.bucket })
    ;[0, 1, 2].forEach((i) => {
      after(500 + i * 1100, () => {
        setFlips((f) => f.map((v, idx) => (idx === i ? true : v)))
        setShown(i + 1)
      })
    })
    return undefined
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const go = (p) => { clearTimers(); setPhase(p) }

  const onStart = () => { track('scan_start', { slug: landing.slug }); go('scan') }
  const onToggle = (key) => setTicks((t) => (t.includes(key) ? t.filter((k) => k !== key) : [...t, key]))
  const onScanDone = () => {
    track('scan_complete', { slug: landing.slug, score, bucket: bucketFor(score, landing.scan.threshold) })
    go('name')
  }
  const onNameDone = () => {
    saveQuiz(landing.slug, { name: normalizeName(name), ticks })
    go('calculating')
  }
  const onRevealCta = () => { track('final_view', { slug: landing.slug }); go('final') }
  const onCta = () => {
    track('cta_click', { slug: landing.slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${landing.slug}`) } catch {}
    router.push(user ? '/lk' : '/register')
  }
  const onRestart = () => {
    clearTimers()
    setTicks([]); setName(''); setFlips([false, false, false]); setShown(0)
    setPhase('intro')
  }

  let view
  if (phase === 'intro') {
    view = (
      <div className={styles.pad}>
        <div className={styles.center}>
          <div className={styles.eyebrow}>{landing.intro.eyebrow}</div>
          <h1 className={styles.h1}>{landing.intro.title}</h1>
          <p className={styles.lead}>{landing.intro.subtitle}</p>
          <button className={`${styles.cta} ${styles.ctaPulse}`} onClick={onStart}>{landing.intro.cta}</button>
          <p className={styles.note}>{landing.intro.note}</p>
        </div>
      </div>
    )
  } else if (phase === 'scan') {
    view = (
      <div className={styles.pad}>
        <div className={styles.center}>
          <h1 className={styles.h1}>{landing.scan.title}</h1>
          <p className={styles.lead}>{landing.scan.subtitle}</p>
        </div>
        <SymptomMeter symptoms={landing.scan.symptoms} ticks={ticks} onToggle={onToggle}
          score={score} maxScore={maxScore} label={landing.scan.meterLabel} />
        <button className={`${styles.cta} ${styles.ctaPulse}`} onClick={onScanDone}>{landing.scan.cta}</button>
      </div>
    )
  } else if (phase === 'name') {
    view = (
      <div className={styles.pad}>
        <div className={styles.center}>
          <h1 className={styles.h1}>{landing.name.title}</h1>
          <p className={styles.lead}>{landing.name.subtitle}</p>
          <input className={styles.field} type="text" inputMode="text" maxLength={24} autoFocus
            placeholder={landing.name.placeholder} value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onNameDone() }} />
          <p className={styles.hint}>{landing.name.hint}</p>
          <button className={`${styles.cta} ${styles.ctaPulse}`} onClick={onNameDone}>{landing.name.cta}</button>
        </div>
      </div>
    )
  } else if (phase === 'calculating') {
    view = (
      <Calculating title={landing.calculating.title} lines={landing.calculating.lines}
        duration={2600} onDone={() => go('reveal')} />
    )
  } else if (phase === 'reveal') {
    view = (
      <div className={styles.pad}>
        <div className={styles.center}>
          <div className={styles.eyebrow}>{landing.reveal.eyebrow}</div>
          <h1 className={styles.h1}>{landing.reveal.title}</h1>
        </div>
        <div className={styles.cards}>
          {[0, 1, 2].map((i) => {
            const card = reading.cards[i]
            return (
              <div key={i} className={styles.cardSlot}>
                <div className={`${styles.flip} ${flips[i] ? styles.flipOn : ''}`}>
                  <div className={styles.flipInner}>
                    <div className={`${styles.flipFace} ${styles.flipBack}`} />
                    <div className={`${styles.flipFace} ${styles.flipFront}`}
                      style={{ backgroundImage: `url(${CARD_SRC(card.number)})` }} />
                  </div>
                </div>
                <div className={styles.cardPos}>{landing.reveal.positions[i]}</div>
              </div>
            )
          })}
        </div>
        <div className={styles.slots}>
          {reading.slots.map((text, i) => (
            <p key={i} className={`${styles.slotText} ${i < shown ? '' : styles.slotHidden}`}>{text}</p>
          ))}
        </div>
        {shown >= 3 && (
          <div className={styles.revealFoot}>
            <button className={`${styles.cta} ${styles.ctaPulse}`} onClick={onRevealCta}>{landing.reveal.cta}</button>
            <button className={styles.linkBtn} onClick={onRestart}>{landing.reveal.restart}</button>
          </div>
        )}
      </div>
    )
  } else {
    // final
    view = (
      <div className={styles.pad}>
        <div className={styles.center}>
          <div className={styles.eyebrow}>{landing.final.eyebrow}</div>
          <p className={styles.finalHeading}>{reading.final.heading}</p>
        </div>
        <p className={styles.listIntro}>{landing.final.listIntro}</p>
        <ul className={styles.promises}>
          {landing.final.promises.map((p, i) => <li key={i} className={styles.promise}>{p}</li>)}
        </ul>
        <button className={`${styles.cta} ${styles.ctaPulse}`} onClick={onCta}>{landing.final.cta}</button>
        <div className={styles.restart}>
          <button className={styles.linkBtn} onClick={onRestart}>{landing.final.restart}</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} aria-hidden="true"><div className={styles.glow} /></div>
      <div className={styles.topbar}>
        <div className={styles.brand} aria-hidden="true" />
        <span className={styles.brandName}>Таро</span>
      </div>
      <div className={styles.screen}>{view}</div>
    </div>
  )
}
```

**Step 2: Коммит (локальный)**

```
git add "frontend/app/lp/[slug]/DiagnosticClient.jsx"
git commit -m "feat(lp): движок фаз DiagnosticClient + SymptomMeter (intro..final, возврат в /lk)"
```

---

## Task 6: Ветка роутера в `page.jsx`

**Files:**
- Modify: `frontend/app/lp/[slug]/page.jsx` (импорт + одна ветка)

**Step 1: Подключить DiagnosticClient**

Изменить `frontend/app/lp/[slug]/page.jsx`:

```jsx
import { notFound } from 'next/navigation'
import { getLanding } from '../../content/landings/index.js'
import LandingClient from './LandingClient'
import CompatClient from './CompatClient'
import RevealClient from './RevealClient'
import TerminalClient from './TerminalClient'
import HoroLoveClient from './HoroLoveClient'
import DiagnosticClient from './DiagnosticClient'

export function generateMetadata({ params }) {
  const l = getLanding(params.slug)
  if (!l) return {}
  return { title: l.meta.title, description: l.meta.description, robots: { index: true, follow: true } }
}

export default function LandingPage({ params }) {
  const landing = getLanding(params.slug)
  if (!landing) notFound()
  const Client =
    landing.engine === 'compat-jealous' ? CompatClient :
    landing.engine === 'live-reveal' ? RevealClient :
    landing.engine === 'terminal' ? TerminalClient :
    landing.engine === 'horo-love' ? HoroLoveClient :
    landing.engine === 'diagnostic' ? DiagnosticClient :
    LandingClient
  return <Client landing={landing} />
}
```

**Step 2: Коммит (локальный)**

```
git add "frontend/app/lp/[slug]/page.jsx"
git commit -m "feat(lp): роутинг движка diagnostic в page.jsx"
```

---

## Task 7: Финальная верификация (весь пакет тестов + один прод-билд)

**Files:** нет новых.

**Step 1: Прогнать все затронутые node-тесты вместе**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/lp/logic/diagnosticMachine.test.mjs app/content/landings/taro-porcha-copy.test.mjs app/content/landings/index.test.mjs
```
Expected: PASS все три файла (в т.ч. старые тесты реестра love/him/taro-him/taro-terminal/horo-love не сломаны).

**Step 2: Один прод-билд (гейт компиляции)**

Требуется запущенный dev-контейнер `esoteric-main-frontend-1`. Билд именно с `NODE_ENV=production` (иначе спурьёзные ошибки `<Html>`/`useContext`, это не реальные баги).

Run (PowerShell):
```
docker exec -e NODE_ENV=production esoteric-main-frontend-1 npm run build
```
Expected: чистая компиляция, роут `/lp/[slug]` в списке, без ошибок.

Если dev-контейнер не поднят: `docker compose -f D:\Claude\Esoteric-main\docker-compose.dev.yml up -d frontend`, затем повторить билд.

**Step 3: Восстановить dev-сервер (прод-билд затирает общий `.next`)**

Run (PowerShell):
```
docker compose -f D:\Claude\Esoteric-main\docker-compose.dev.yml restart frontend
```

**Step 4: Спот-чек разметки (опционально, если dev поднят)**

Дев-контейнер не видит host-правки без рестарта, сначала `docker restart esoteric-main-frontend-1`, затем:
```
Invoke-WebRequest -UseBasicParsing http://localhost/lp/taro-porcha | Select-Object -ExpandProperty Content | Select-String 'Проверь, есть ли на тебе'
```
Expected: в HTML присутствует заголовок hero (движок diagnostic отрендерился).

**Step 5: Коммит (локальный)**

Если на шагах правились файлы — коммит; иначе пропустить.

```
git add -A
git commit -m "chore(lp): финальная верификация taro-porcha (тесты + прод-билд)"
```

---

## Файлы (сводка)

Создать:
- `frontend/app/lp/logic/diagnosticMachine.js` (+ `.test.mjs`)
- `frontend/app/content/landings/taro-porcha-copy.js` (+ `.test.mjs`)
- `frontend/app/content/landings/taro-porcha.js`
- `frontend/app/lp/diagnostic.module.css`
- `frontend/app/lp/[slug]/DiagnosticClient.jsx`

Изменить (минимально):
- `frontend/app/content/landings/index.js` (import + запись реестра)
- `frontend/app/content/landings/index.test.mjs` (один тест)
- `frontend/app/lp/[slug]/page.jsx` (import + ветка `engine === 'diagnostic'`)

## Вне скоупа (YAGNI)

- Фаза `full` и отдельный экран «полный разбор» на лендинге (возврат подписчика редиректит в `/lk`, разбор доставляет продукт; отклонение от дизайн-дока согласовано).
- Дата рождения и кросс-продажа в матрицу (спрашиваем только имя).
- Второй вариант вступления на каждый аркан (сейчас по одному; задел на разнообразие при повторных заходах).
- Активное использование `{name}` в копирайте (весь текст на «ты»; `interpolate()` токен поддерживает).
- Финальная полировка темы `diagnostic.module.css` и театр ревила (делает заказчик в Claude Design).
- Правки бэкенда.

## Незакрытые копи-вопросы (к вычитке Кириллом при исполнении)

- 5 light-финалов (Дьявол/Башня/Смерть/Повешенный/Жрица) это черновик Claude по правилу брифа. Кирилл вычитывает формулировки; тесты гарантируют только наличие и непустоту.
- Калибровка весов симптомов и порога `T` (сейчас веса из брифа, `T = 4`).
- Лейбл кнопки «Узнать» (варианты брифа: «Узнать всё», «Смотреть разбор», «Открыть»).
