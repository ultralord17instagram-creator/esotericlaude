# Таро Терминал: план реализации

> **For Claude:** REQUIRED SUB-SKILL: используй superpowers:executing-plans, чтобы реализовать этот план задача-за-задачей.

**Goal:** Собрать байт-лендинг `/lp/taro-terminal` — интерактивную мини-игру в эстетике ретро-терминала (выбор состояния → вытягивание карты → 2 проективных вопроса → персональный тизер с обрывом на замке → Paywall), переиспользуя колоду, `Paywall` и `quizStorage`.

**Architecture:** Новый движок `terminal` подключается одной веткой в `frontend/app/lp/[slug]/page.jsx` (как `live-reveal`). Клиент `TerminalClient.jsx` держит линейную фазовую машину; чистая логика (переходы, выбор карты, сборка тизера) вынесена в `terminalMachine.js` и покрыта `node:test`. Контент — в `taro-terminal-copy.js`, конфиг — в `taro-terminal.js`, тема — в `terminal.module.css`. Бэкенд не трогаем.

**Tech Stack:** Next.js 14 (App Router), React 18, CSS Modules, self-hosted шрифты (`--font-mono` = IBM Plex Mono, полная кириллица), `node --test` для юнит-тестов чистой логики/контента.

---

## Исходные документы (источник истины)

- Дизайн: [2026-07-16-taro-terminal-design.md](2026-07-16-taro-terminal-design.md)
- Копирайт (все 8 состояний, общие тексты, пейвол): [2026-07-16-taro-terminal-copy-brief.md](2026-07-16-taro-terminal-copy-brief.md)

Тексты в `taro-terminal-copy.js` — транскрипция из копи-брифа. При любом расхождении **копи-бриф главнее** (его правит заказчик).

## Зафиксированные решения (микро-развилки из дизайна закрыты)

- Экран `reveal`: **мягкий** таймер 10с с кнопкой «Пропустить» (переход не форсируется).
- `boot`: **анонимно**, без ввода имени. Карта — случайная каждое прохождение (сид не нужен).
- Глубина тизера: **3 открытые строки** (`teaserOpen` + `teaserPivot` + `thought`) + закрытый `teaserLock` под замком.

## Правила проекта (обязательно соблюдать)

- **Без длинного тире «—»** в отгружаемом тексте (пользовательское правило). Тесты копи-файла это проверяют.
- **Хэндл `@nastasya_and_cards` не используем нигде.**
- Токены `{answer1}`, `{answer2}`, `{cardRu}`, `{cardKw}` подставляются строго в именительном падеже; кавычки «…» уже в шаблоне, значение подставляется голым.
- Правки в существующих файлах — минимальные: 1 строка ветки роутера + 1 строка реестра. Другие лендинги не трогаем.

## Верификация в этом проекте (важно, среда нестандартная)

- **Node только в Docker** (нет host node/npm). Чистую логику и контент гоняем эфемерным контейнером:
  ```
  docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test <путь к .test.mjs>
  ```
  Запускать **через PowerShell-инструмент** (Git Bash ломает пути `-v`/`-w`). Предупреждение `MODULE_TYPELESS_PACKAGE_JSON` — безвредно.
- **Никаких `npm run build` после каждой задачи** и **никаких скриншотов** (браузерный инструмент до докер-сервера не достаёт). Для CSS/JSX гейт — «компилируется + один прод-билд в конце».
- Импорты в тест-файлах и подтягиваемых модулях — только явные `./x.js` (raw `node --test` не резолвит расширения). `terminalMachine.js` импортирует `../../content/tarot/deck.js` (уже с `.js`).
- Финальный прод-билд — с `-e NODE_ENV=production` (иначе спурьёзные ошибки `<Html>`/`useContext`), затем рестарт dev-контейнера. Детали — задача 7.
- Коммиты — **локальные** на текущей ветке `feat/astrix-homepage-redesign`. Пуш — только по явной просьбе пользователя.

---

## Task 1: Чистая логика движка (`terminalMachine.js`)

**Files:**
- Create: `frontend/app/lp/logic/terminalMachine.js`
- Test: `frontend/app/lp/logic/terminalMachine.test.mjs`

**Step 1: Написать падающий тест**

Создать `frontend/app/lp/logic/terminalMachine.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PHASES, nextPhase, prevPhase, canGoBack, pickCard, fillTokens, buildTeaser,
} from './terminalMachine.js'
import { DECK } from '../../content/tarot/deck.js'

test('PHASES: 10 фаз в правильном порядке', () => {
  assert.deepEqual(PHASES, [
    'boot', 'select', 'intro', 'pause', 'draw', 'reveal', 'q1', 'q2', 'reading', 'paywall',
  ])
})

test('nextPhase идёт по линейному порядку и упирается в paywall', () => {
  assert.equal(nextPhase('boot'), 'select')
  assert.equal(nextPhase('q2'), 'reading')
  assert.equal(nextPhase('reading'), 'paywall')
  assert.equal(nextPhase('paywall'), 'paywall')
})

test('prevPhase идёт назад и упирается в boot', () => {
  assert.equal(prevPhase('select'), 'boot')
  assert.equal(prevPhase('boot'), 'boot')
})

test('canGoBack: только на шагах уровня intro..q2', () => {
  assert.ok(canGoBack('intro'))
  assert.ok(canGoBack('q2'))
  assert.ok(!canGoBack('boot'))
  assert.ok(!canGoBack('select'))
  assert.ok(!canGoBack('reading'))
})

test('pickCard: карта из колоды, rand управляет выбором', () => {
  assert.equal(pickCard(() => 0, DECK).number, 0)        // Шут
  assert.equal(pickCard(() => 0.999, DECK).number, 21)   // Мир
  const c = pickCard(() => 0.5, DECK)
  assert.ok(DECK.some((d) => d.number === c.number))
})

test('fillTokens подставляет все вхождения токена', () => {
  assert.equal(fillTokens('{a} и {a}, {b}', { a: 'X', b: 'Y' }), 'X и X, Y')
})

test('buildTeaser: 3 открытые строки + замок, все токены подставлены', () => {
  const state = {
    teaserOpen: 'Ты назвала «{answer1}», не хватает «{answer2}».',
    teaserPivot: 'Карта «{cardRu}» про «{cardKw}».',
    thought: 'Мысль.',
    teaserLock: 'Что держит «{answer1}»,',
  }
  const card = { ru: 'Дьявол', keywords: ['Привязанность', 'a', 'b', 'c'] }
  const t = buildTeaser(state, card, 'Незавершённость', 'Опоры')
  assert.equal(t.open.length, 3)
  assert.equal(t.open[2], 'Мысль.')
  const blob = `${t.open.join(' ')} ${t.lock}`
  assert.ok(!blob.includes('{'))                 // нет неподставленных токенов
  assert.ok(blob.includes('Дьявол'))             // cardRu
  assert.ok(blob.includes('Привязанность'))      // cardKw
  assert.ok(blob.includes('Незавершённость'))    // answer1
})
```

**Step 2: Запустить тест — убедиться, что падает**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/lp/logic/terminalMachine.test.mjs
```
Expected: FAIL (модуль `./terminalMachine.js` не найден / экспорты не определены).

**Step 3: Написать минимальную реализацию**

Создать `frontend/app/lp/logic/terminalMachine.js`:

```js
// Чистая логика движка terminal: линейная фазовая машина, выбор одной карты,
// сборка тизера из слотов состояния. Без React и без сети, тестируется node:test.
import { DECK } from '../../content/tarot/deck.js'

// Линейный порядок фаз прохождения.
export const PHASES = [
  'boot', 'select', 'intro', 'pause', 'draw', 'reveal', 'q1', 'q2', 'reading', 'paywall',
]

// Фазы, где доступна кнопка «назад» (шаги уровня, как в оригинале PDF).
export const BACK_PHASES = ['intro', 'pause', 'draw', 'reveal', 'q1', 'q2']

export function nextPhase(phase) {
  const i = PHASES.indexOf(phase)
  return i >= 0 && i < PHASES.length - 1 ? PHASES[i + 1] : phase
}

export function prevPhase(phase) {
  const i = PHASES.indexOf(phase)
  return i > 0 ? PHASES[i - 1] : phase
}

export function canGoBack(phase) {
  return BACK_PHASES.includes(phase)
}

// Одна случайная карта из колоды. rand: () => [0,1). По умолчанию Math.random,
// в тестах передаём детерминированную заглушку. Игра анонимна, сид не нужен.
export function pickCard(rand = Math.random, deck = DECK) {
  const i = Math.floor(rand() * deck.length)
  return deck[Math.min(i, deck.length - 1)]
}

// Подстановка токенов {key} значениями (голыми: кавычки уже в шаблоне).
export function fillTokens(text, tokens) {
  return Object.keys(tokens).reduce(
    (acc, k) => acc.split(`{${k}}`).join(tokens[k]),
    String(text),
  )
}

// Собрать тизер состояния: 3 открытые строки + закрытый (замок) хвост.
// Токены строго в именительном падеже: значения тапов и card.ru как есть.
export function buildTeaser(state, card, answer1, answer2) {
  const tokens = {
    answer1,
    answer2,
    cardRu: card.ru,
    cardKw: card.keywords[0],
  }
  return {
    open: [
      fillTokens(state.teaserOpen, tokens),
      fillTokens(state.teaserPivot, tokens),
      state.thought,
    ],
    lock: fillTokens(state.teaserLock, tokens),
  }
}
```

**Step 4: Запустить тест — убедиться, что проходит**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/lp/logic/terminalMachine.test.mjs
```
Expected: PASS (все тесты зелёные).

**Step 5: Коммит (локальный)**

```
git add frontend/app/lp/logic/terminalMachine.js frontend/app/lp/logic/terminalMachine.test.mjs
git commit -m "feat(lp): чистая логика движка terminal (фазы, выбор карты, сборка тизера)"
```

---

## Task 2: Контент лендинга (`taro-terminal-copy.js`)

**Files:**
- Create: `frontend/app/content/landings/taro-terminal-copy.js`
- Test: `frontend/app/content/landings/taro-terminal-copy.test.mjs`

**Step 1: Написать падающий тест**

Создать `frontend/app/content/landings/taro-terminal-copy.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TARO_TERMINAL_COPY } from './taro-terminal-copy.js'

const C = TARO_TERMINAL_COPY

test('8 состояний, у каждого полный набор полей', () => {
  assert.equal(C.states.length, 8)
  for (const s of C.states) {
    assert.ok(s.id && s.menuLabel && s.intro && s.pause && s.thought, `поля состояния ${s.id}`)
    assert.ok(s.q1.prompt && Array.isArray(s.q1.options) && s.q1.options.length === 4)
    assert.ok(s.q2.prompt && Array.isArray(s.q2.options) && s.q2.options.length === 4)
    assert.ok(s.teaserOpen && s.teaserPivot && s.teaserLock)
  }
})

test('id состояний уникальны', () => {
  const ids = C.states.map((s) => s.id)
  assert.equal(new Set(ids).size, 8)
})

test('общие экраны на месте: boot, select, draw, reveal, reading, paywall, chrome', () => {
  assert.ok(C.boot.title && C.boot.cta && C.boot.status)
  assert.ok(C.select.title)
  assert.ok(C.draw.cta && C.reveal.cta && typeof C.reveal.seconds === 'number')
  assert.ok(C.reading.title && C.reading.cta)
  assert.ok(C.paywall.heading && C.paywall.payoffs.length === 4)
  for (const k of ['intro', 'pause', 'draw', 'reveal', 'q1', 'q2', 'reading']) {
    assert.ok(C.chrome[k].step && C.chrome[k].status, `chrome.${k}`)
  }
})

test('тизер-слоты используют только валидные токены', () => {
  const allowed = new Set(['answer1', 'answer2', 'cardRu', 'cardKw'])
  for (const s of C.states) {
    const blob = `${s.teaserOpen} ${s.teaserPivot} ${s.teaserLock}`
    for (const m of blob.matchAll(/\{(\w+)\}/g)) {
      assert.ok(allowed.has(m[1]), `неизвестный токен {${m[1]}} в состоянии ${s.id}`)
    }
  }
})

test('нигде нет длинного тире', () => {
  assert.ok(!JSON.stringify(C).includes('—'))
})
```

**Step 2: Запустить тест — убедиться, что падает**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/content/landings/taro-terminal-copy.test.mjs
```
Expected: FAIL (`./taro-terminal-copy.js` не найден).

**Step 3: Написать контент**

Создать `frontend/app/content/landings/taro-terminal-copy.js`. Тексты транскрибированы из копи-брифа; **проверь на «—» перед сохранением** (используются только запятые/двоеточия). Не добавляй хэндл автора.

```js
// Тексты лендинга «Таро Терминал» (движок terminal, копи-бриф 2026-07-16-taro-terminal-copy-brief).
// Проективный самокоучинг в эстетике ретро-терминала. Тон тёплый, бережный.
// Правила: обращение на «ты», Барнум в тизере, токены в именительном падеже,
// без длинного тире, хэндл автора не используем.
export const TARO_TERMINAL_COPY = {
  meta: {
    title: 'Таро Терминал: мини-игра с картой и вопросами к себе',
    description: 'Выбери своё состояние, вытяни карту и услышь, что она говорит именно тебе. Мини-игра, где не нужно знать значения карт.',
  },
  // Экран boot (обложка терминала).
  boot: {
    status: 'TAROT SYSTEM: ONLINE',
    title: 'ТАРО ТЕРМИНАЛ',
    subtitle: 'Мини-игра с картой и вопросами к себе',
    cta: '▶ Начать',
  },
  // Экран select (выбор состояния). Кнопки строятся из states[].menuLabel.
  select: {
    title: 'Выбери состояние',
    subtitle: 'Выбери то, что ближе прямо сейчас.',
  },
  // Терминальная «хромировка» экранов уровня (декор статус-строк, общий на все состояния).
  chrome: {
    intro:   { step: 'LEVEL START / STEP 01-07',    status: 'STATUS: READY',        tag: 'УРОВЕНЬ' },
    pause:   { step: 'SELF-CHECK MODE / STEP 02-07', status: 'STATUS: PAUSE',        tag: 'СДЕЛАЙ ПАУЗУ' },
    draw:    { step: 'CARD MODE / STEP 03-07',       status: 'CARD: HIDDEN',         tag: 'ВОЗЬМИ КАРТУ' },
    reveal:  { step: 'CARD MODE / STEP 04-07',       status: 'CARD: REVEAL',         tag: 'ПЕРЕВЕРНИ КАРТУ' },
    q1:      { step: 'QUESTION MODE / STEP 05-07',   status: 'INPUT: HONEST ANSWER', tag: 'ВОПРОС 1' },
    q2:      { step: 'QUESTION MODE / STEP 06-07',   status: 'INPUT: INNER VOICE',   tag: 'ВОПРОС 2' },
    reading: { step: 'LEVEL COMPLETE / STEP 07-07',  status: 'TERMINAL READS…',      tag: '' },
  },
  // Экран draw (вытягивание, автоматизировано).
  draw: {
    title: 'Возьми карту',
    line: 'Терминал перемешивает колоду. Вытяни свою карту.',
    hint: 'Пока не переворачивай.',
    cta: 'Вытянуть',
  },
  // Экран reveal (переворот, мягкий таймер).
  reveal: {
    title: 'Переверни карту',
    line: 'Посмотри на неё 10 секунд. Не вспоминай значение. Не ищи трактовку. Просто смотри.',
    seconds: 10,
    skip: 'Пропустить',
    cta: 'Далее',
  },
  // Экран reading (рамка вокруг собранного тизера).
  reading: {
    eyebrow: 'TERMINAL READS…',
    title: 'Что терминал понял о твоём состоянии',
    cta: 'Что с этим делать →',
  },
  // Экран paywall (heading + payoffs передаются в компонент Paywall).
  paywall: {
    heading: 'Терминал показал направление. Полный разбор показывает, что с этим делать.',
    payoffs: [
      'Точный разбор твоего состояния по выпавшей карте, без общих фраз',
      'Что именно тебя держит и что даёт тебе силу прямо сейчас',
      'Один конкретный первый шаг, а не туманные советы',
      'Личный расклад на твою ситуацию внутри приложения',
    ],
  },
  microcopy: {
    back: 'назад',
    next: 'Далее',
    restart: '← пройти заново',
  },
  states: [
    {
      id: 'tired',
      menuLabel: 'Я устала',
      intro: 'Иногда усталость просит не мотивации, а честного взгляда на то, что забирает силы.',
      pause: 'Скажи про себя: я хочу увидеть, что сейчас больше всего истощает меня. Не нужно собираться. Сейчас нужно только заметить.',
      q1: {
        prompt: 'Что на карте похоже на твою усталость?',
        options: ['Тяжесть', 'Пустота', 'Перегруз', 'Гонка без паузы'],
      },
      q2: {
        prompt: 'А что на карте похоже на опору, от которой можно выдохнуть?',
        options: ['Пауза', 'Поддержка', 'Тишина', 'Смена ритма'],
      },
      thought: 'Не всякая усталость лечится усилием. Иногда отдых и есть действие.',
      teaserOpen: 'В карте ты первым увидела «{answer1}», а опору для тебя держит «{answer2}».',
      teaserPivot: 'Карта «{cardRu}» показывает: дело не в том, что ты мало стараешься, а в том, на что уходят твои силы.',
      teaserLock: 'Что именно забирает твой ресурс и с чего начать восстановление,',
    },
    {
      id: 'scared',
      menuLabel: 'Мне страшно',
      intro: 'Страх не всегда говорит, что всё плохо. Иногда он просто показывает, где тебе особенно нужна опора.',
      pause: 'Скажи про себя: я хочу увидеть, чего я боюсь на самом деле. Не борись со страхом. Сейчас мы просто смотрим на него.',
      q1: {
        prompt: 'Если бы твой страх жил внутри этой карты, где бы он находился?',
        options: ['В человеке', 'В движении', 'В фоне', 'В ожидании'],
      },
      q2: {
        prompt: 'А что на карте выглядит сильнее страха, пусть даже маленькая деталь?',
        options: ['Свет в кадре', 'Устойчивая фигура', 'Открытый путь', 'Спокойный фон'],
      },
      thought: 'Страх становится яснее, когда у него появляется форма.',
      teaserOpen: 'Свой страх ты разместила «{answer1}», а сильнее него для тебя «{answer2}».',
      teaserPivot: 'Карта «{cardRu}» намекает: страх показывает не опасность, а место, где тебе сейчас нужна опора.',
      teaserLock: 'Чего именно ты боишься на самом деле и на что можешь опереться прямо сейчас,',
    },
    {
      id: 'confused',
      menuLabel: 'Я запуталась',
      intro: 'Когда мыслей слишком много, не всегда нужен быстрый ответ. Иногда сначала нужно понять, какой вопрос на самом деле главный.',
      pause: 'Сформулируй про себя: я хочу увидеть, что сейчас создаёт путаницу. Не старайся звучать красиво. Достаточно одной честной фразы.',
      q1: {
        prompt: 'Что на карте ты заметила первым?',
        options: ['Цвет', 'Фигуру', 'Движение', 'Деталь'],
      },
      q2: {
        prompt: 'А что в карте похоже на твою ситуацию по ощущению?',
        options: ['Слишком много всего', 'Развилка', 'Туман', 'Хождение по кругу'],
      },
      thought: 'Иногда мы ищем ответ, хотя сначала стоит понять вопрос.',
      teaserOpen: 'Первым тебя зацепило «{answer1}», а твоя ситуация ощущается как «{answer2}».',
      teaserPivot: 'Карта «{cardRu}» подсказывает: тебе сейчас нужен не ответ, а точный вопрос.',
      teaserLock: 'Какой вопрос на самом деле главный и что за ним прячется,',
    },
    {
      id: 'cant_choose',
      menuLabel: 'Не могу выбрать',
      intro: 'Выбор становится тяжелее, когда мы пытаемся выбрать идеально. Но иногда важнее не идеальность, а честность.',
      pause: 'Подумай о своём выборе. Скажи про себя: я хочу увидеть, что мне важно понять в этой развилке.',
      q1: {
        prompt: 'Какой из вариантов ближе к настроению этой карты? Не логически, а по ощущению.',
        options: ['Тот, что спокойнее', 'Тот, что живее', 'Тот, что привычнее', 'Тот, что пугает, но манит'],
      },
      q2: {
        prompt: 'Если убрать страх ошибиться, к чему ты склоняешься честно?',
        options: ['К переменам', 'К покою', 'К риску', 'К привычному'],
      },
      thought: 'Иногда мы не выбираем, потому что ждём гарантий. Но выбор редко приходит с гарантией.',
      teaserOpen: 'По настроению карты тебе ближе «{answer1}», а без страха ошибиться ты склоняешься «{answer2}».',
      teaserPivot: 'Карта «{cardRu}» показывает: внутри ты уже почти выбрала, осталось себе в этом признаться.',
      teaserLock: 'К какому варианту ты склоняешься на самом деле и что мешает сказать это прямо,',
    },
    {
      id: 'everything_stopped',
      menuLabel: 'Всё остановилось',
      intro: 'Пауза не всегда означает конец. Иногда жизнь просто не пускает дальше старым способом.',
      pause: 'Скажи про себя: я хочу увидеть, что стоит за этой остановкой. Не торопи ответ. Сейчас важнее заметить.',
      q1: {
        prompt: 'Что на карте выглядит неподвижным? Тишина, ожидание, застывшая сцена?',
        options: ['Полная тишина', 'Ожидание', 'Застывшая сцена', 'Скрытое движение'],
      },
      q2: {
        prompt: 'А есть ли на карте намёк на маленькое движение вперёд?',
        options: ['Едва заметный шаг', 'Сначала отпустить', 'Дать себе время', 'Пока не вижу'],
      },
      thought: 'Иногда движение начинается не с действия, а с признания, что так больше не работает.',
      teaserOpen: 'В остановке ты видишь «{answer1}», а следующий шаг для тебя это «{answer2}».',
      teaserPivot: 'Карта «{cardRu}» говорит: это не тупик, а пауза, которая не пускает тебя старым путём.',
      teaserLock: 'Что стоит за этой остановкой и какой первый маленький шаг её сдвигает,',
    },
    {
      id: 'hear_myself',
      menuLabel: 'Хочу услышать себя',
      intro: 'Внутренний голос редко говорит громко. Чаще он звучит тихо, и его легко заглушить чужими ожиданиями.',
      pause: 'Скажи про себя: я хочу услышать то, что уже знаю внутри. Не нужно ничего выдумывать. Просто побудь с вопросом.',
      q1: {
        prompt: 'Какая деталь на карте ощущается как знак для тебя?',
        options: ['Фигура', 'Свет', 'Символ', 'Общее настроение'],
      },
      q2: {
        prompt: 'Если бы карта сказала тебе одну честную фразу, начни с «Ты уже знаешь, что…»',
        options: ['…пора выбрать себя', '…это не твоё', '…ты готова', '…можно отпустить'],
      },
      thought: 'Иногда услышать себя это не найти новый ответ, а перестать спорить со старым.',
      teaserOpen: 'Знаком для тебя стало «{answer1}», а честная фраза карты звучит как «{answer2}».',
      teaserPivot: 'Карта «{cardRu}» подтверждает: ты уже знаешь ответ, просто пока споришь с ним.',
      teaserLock: 'Что твой внутренний голос говорит тебе прямо сейчас и почему ты его глушишь,',
    },
    {
      id: 'hold_on_person',
      menuLabel: 'Не отпускает человек',
      intro: 'Иногда нас держит не сам человек, а то чувство, которое мы рядом с ним пережили.',
      pause: 'Подумай об этом человеке. Скажи про себя: я хочу увидеть, что именно меня держит. Не спеши отвечать сразу.',
      q1: {
        prompt: 'Что в этой карте напоминает твою привязанность?',
        options: ['Боль', 'Надежда', 'Ожидание', 'Незавершённость'],
      },
      q2: {
        prompt: 'Если бы карта говорила не о человеке, а о тебе, чего тебе сейчас не хватает?',
        options: ['Опоры', 'Свободы', 'Ясности', 'Близости'],
      },
      thought: 'Иногда мы скучаем не по человеку, а по той версии себя, которая рядом с ним оживала.',
      teaserOpen: 'Свою привязанность ты назвала «{answer1}», а не хватает тебе «{answer2}».',
      teaserPivot: 'Карта «{cardRu}» показывает: дело не в нём, а в том, чем ты сама себя держишь.',
      teaserLock: 'Что именно тебя держит и какой первый шаг тебя отпускает,',
    },
    {
      id: 'dont_know_want',
      menuLabel: 'Не понимаю, чего хочу',
      intro: 'Желание не всегда появляется сразу. Иногда сначала нужно убрать шум из «надо», «правильно» и «как у всех».',
      pause: 'Скажи про себя: я хочу увидеть, что во мне настоящее, а не навязанное. Не ищи большой ответ. Начни с малого.',
      q1: {
        prompt: 'Что на карте тебе нравится больше всего? Не «что правильно», а что правда притягивает.',
        options: ['Простор', 'Тепло и свет', 'Движение', 'Спокойствие'],
      },
      q2: {
        prompt: 'Если бы эта деталь была желанием, о чём бы она говорила?',
        options: ['Свобода', 'Покой', 'Новый опыт', 'Близость'],
      },
      thought: 'Иногда желание начинается не с большого плана, а с маленького «мне туда интересно».',
      teaserOpen: 'Тебя притягивает «{answer1}», а за этим стоит желание «{answer2}».',
      teaserPivot: 'Карта «{cardRu}» подсказывает: это и есть твоё настоящее, а не то, что «надо».',
      teaserLock: 'Чего ты хочешь на самом деле и с какого маленького шага это начинается,',
    },
  ],
}
```

**Step 4: Запустить тест — убедиться, что проходит**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/content/landings/taro-terminal-copy.test.mjs
```
Expected: PASS.

**Step 5: Коммит (локальный)**

```
git add frontend/app/content/landings/taro-terminal-copy.js frontend/app/content/landings/taro-terminal-copy.test.mjs
git commit -m "feat(lp): копирайт лендинга taro-terminal (8 состояний, тизеры, пейвол)"
```

---

## Task 3: Конфиг лендинга + регистрация в реестре

**Files:**
- Create: `frontend/app/content/landings/taro-terminal.js`
- Modify: `frontend/app/content/landings/index.js` (2 строки: import + запись в `LANDINGS`)
- Test: `frontend/app/content/landings/index.test.mjs` (добавить один тест)

**Step 1: Дописать падающий тест в `index.test.mjs`**

В конец `frontend/app/content/landings/index.test.mjs` добавить:

```js
test('getLanding отдаёт конфиг taro-terminal на движке terminal', () => {
  const l = getLanding('taro-terminal')
  assert.equal(l.slug, 'taro-terminal')
  assert.equal(l.engine, 'terminal')
  assert.equal(l.product, 'tarot')
  assert.equal(l.states.length, 8)
})
```

**Step 2: Запустить тест — убедиться, что падает**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/content/landings/index.test.mjs
```
Expected: FAIL (новый тест — `getLanding('taro-terminal')` возвращает `null`).

**Step 3: Создать конфиг и зарегистрировать**

Создать `frontend/app/content/landings/taro-terminal.js`:

```js
// Конфиг лендинга «Таро Терминал». engine=terminal переключает клиента в page.jsx.
// Тексты в taro-terminal-copy.js. Пользовательский копирайт: без длинного тире.
import { TARO_TERMINAL_COPY } from './taro-terminal-copy.js'

export const taroTerminalLanding = {
  slug: 'taro-terminal',
  product: 'tarot',
  engine: 'terminal',
  theme: 'terminal',
  ...TARO_TERMINAL_COPY,
}
```

Изменить `frontend/app/content/landings/index.js` — добавить import и запись в реестр:

```js
import { loveLanding } from './love.js'
import { himLanding } from './him.js'
import { taroHimLanding } from './taro-him.js'
import { taroTerminalLanding } from './taro-terminal.js'

export const LANDINGS = { love: loveLanding, him: himLanding, 'taro-him': taroHimLanding, 'taro-terminal': taroTerminalLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
```

**Step 4: Запустить тест — убедиться, что проходит**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/content/landings/index.test.mjs
```
Expected: PASS (включая старые тесты love/taro-him).

**Step 5: Коммит (локальный)**

```
git add frontend/app/content/landings/taro-terminal.js frontend/app/content/landings/index.js frontend/app/content/landings/index.test.mjs
git commit -m "feat(lp): конфиг taro-terminal и регистрация слага в реестре"
```

---

## Task 4: Тема-скелет (`terminal.module.css`)

**Files:**
- Create: `frontend/app/lp/terminal.module.css`

Юнит-теста нет (CSS). Гейт — компиляция в финальном билде (задача 7) и совпадение имён классов с `TerminalClient.jsx` (задача 5). Направление — ретро-терминал: моноширинный `--font-mono` (IBM Plex Mono, self-hosted, полная кириллица), «экранная» рамка, статус-строки, скан-линии. Полировку заказчик делает отдельно в Claude Design; это рабочий, но не финальный вид.

**Step 1: Создать файл**

Создать `frontend/app/lp/terminal.module.css`:

```css
/* =====================================================================
   Лендинг «Таро Терминал» (движок terminal). Ретро-терминальная тема,
   скоуплена на .root. Моно-акцент из глобального --font-mono (IBM Plex
   Mono, self-host, полная кириллица). Скелет: финальную полировку темы
   делает заказчик в Claude Design.
   ===================================================================== */

.root {
  --bg: #0a0f0a;
  --screen: #0d140d;
  --ink: #d7f5d0;
  --muted: #7fae7a;
  --accent: #62e06a;
  --line: rgba(120, 220, 120, .22);
  --lock: rgba(120, 220, 120, .5);
  --mono: var(--font-mono), ui-monospace, 'Cascadia Mono', Menlo, Consolas, monospace;
  --sans: var(--font-cosmic-sans), system-ui, sans-serif;

  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: clip;
  background: radial-gradient(120% 90% at 50% -10%, #12211200 0%, #060a06 70%), var(--bg);
  color: var(--ink);
  font-family: var(--sans);
  -webkit-font-smoothing: antialiased;
}

/* Скан-линии поверх «экрана». */
.scanlines {
  position: fixed; inset: 0; z-index: 5; pointer-events: none;
  background: repeating-linear-gradient(0deg, rgba(0, 0, 0, .18) 0, rgba(0, 0, 0, .18) 1px, transparent 2px, transparent 3px);
  mix-blend-mode: multiply; opacity: .5;
}

/* Экран-рамка. */
.screen {
  position: relative; z-index: 2; min-height: 100dvh;
  display: flex; flex-direction: column;
  animation: screenIn .4s both;
}
.pad { flex: 1; display: flex; flex-direction: column; padding: 56px 22px 40px; max-width: 560px; margin: 0 auto; width: 100%; }
.center { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; text-align: center; }

/* Типографика. */
.h1 { font-family: var(--mono); font-weight: 500; font-size: 22px; line-height: 1.35; letter-spacing: .01em; margin: 0; color: var(--ink); text-wrap: pretty; }
.lead { color: var(--muted); font-size: 15px; line-height: 1.6; margin: 0; max-width: 44ch; text-wrap: pretty; }
.hint { color: var(--muted); font-size: 12.5px; letter-spacing: .04em; opacity: .8; margin: 0; }
.eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: var(--accent); }

/* boot. */
.bootStatus { font-family: var(--mono); font-size: 12px; letter-spacing: .3em; color: var(--accent); text-transform: uppercase; }
.bootTitle { font-family: var(--mono); font-weight: 600; font-size: 34px; letter-spacing: .14em; margin: 6px 0 0; color: var(--ink); text-shadow: 0 0 18px rgba(98, 224, 106, .35); }
.bootSub { color: var(--muted); font-size: 15px; margin: 0; }

/* Кнопки. */
.cta {
  font-family: var(--mono); font-size: 15px; letter-spacing: .04em;
  color: #071007; background: var(--accent);
  border: 0; border-radius: 8px; padding: 15px 26px; cursor: pointer;
  box-shadow: 0 0 22px rgba(98, 224, 106, .28); transition: transform .12s, box-shadow .2s, background .2s;
}
.cta:hover { background: #7bf083; box-shadow: 0 0 30px rgba(98, 224, 106, .45); }
.cta:active { transform: translateY(1px); }
.cta:disabled { opacity: .5; cursor: default; box-shadow: none; }
.ctaPulse { animation: pulse 2s ease-in-out infinite; }

.linkBtn { background: none; border: 0; color: var(--muted); font-family: var(--mono); font-size: 13px; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.linkBtn:hover { color: var(--ink); }
.restart { margin-top: 18px; text-align: center; }

.backBtn {
  position: absolute; top: 18px; left: 16px; z-index: 10;
  width: 40px; height: 40px; border-radius: 8px; cursor: pointer;
  background: rgba(120, 220, 120, .06); border: 1px solid var(--line); color: var(--ink);
  font-size: 18px; line-height: 1;
}
.backBtn:hover { background: rgba(120, 220, 120, .14); }

/* Статус-строка (хромировка). */
.chrome {
  display: flex; flex-wrap: wrap; gap: 6px 14px; align-items: baseline;
  font-family: var(--mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--muted); border-bottom: 1px dashed var(--line); padding-bottom: 12px; margin-bottom: 8px;
}
.chromeStep { color: var(--muted); }
.chromeStatus { color: var(--accent); margin-left: auto; }
.chromeTag { flex-basis: 100%; color: var(--ink); letter-spacing: .2em; font-size: 12px; }

/* Меню (select и q1/q2). */
.menu { display: flex; flex-direction: column; gap: 10px; margin-top: 22px; }
.menuItem {
  display: flex; align-items: center; gap: 12px; text-align: left;
  font-family: var(--mono); font-size: 15px; color: var(--ink);
  background: rgba(120, 220, 120, .05); border: 1px solid var(--line);
  border-radius: 10px; padding: 16px 18px; cursor: pointer;
  transition: background .18s, border-color .18s, transform .12s;
}
.menuItem:hover { background: rgba(120, 220, 120, .12); border-color: var(--accent); transform: translateX(3px); }
.menuArrow { color: var(--accent); font-weight: 700; }

/* Колода (экран draw). */
.deck { position: relative; width: 120px; height: 188px; margin: 8px auto; }
.deckCard {
  position: absolute; inset: 0; border-radius: 12px;
  background: repeating-linear-gradient(45deg, #0e1f0e, #0e1f0e 6px, #133013 6px, #133013 12px);
  border: 1px solid var(--line); box-shadow: 0 6px 20px rgba(0, 0, 0, .5);
}
.deckCard:nth-child(2) { transform: translate(4px, 4px) rotate(2deg); }
.deckCard:nth-child(3) { transform: translate(8px, 8px) rotate(4deg); }
.deckShuffle .deckCard { animation: shuffle 1.1s ease-in-out; }
.deckShuffle .deckCard:nth-child(2) { animation-delay: .08s; }
.deckShuffle .deckCard:nth-child(3) { animation-delay: .16s; }

/* Карта flip (экран reveal). */
.flip { width: 150px; height: 236px; margin: 6px auto; perspective: 1000px; }
.flipInner { position: relative; width: 100%; height: 100%; transition: transform .7s cubic-bezier(.4, .1, .2, 1); transform-style: preserve-3d; }
.flipOn .flipInner { transform: rotateY(180deg); }
.flipFace { position: absolute; inset: 0; border-radius: 12px; backface-visibility: hidden; border: 1px solid var(--line); }
.flipBack { background: repeating-linear-gradient(45deg, #0e1f0e, #0e1f0e 6px, #133013 6px, #133013 12px); }
.flipFront { transform: rotateY(180deg); background-size: cover; background-position: center; background-color: #0e1f0e; box-shadow: 0 0 26px rgba(98, 224, 106, .3); }

.revealFoot { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.timer { font-family: var(--mono); font-size: 13px; letter-spacing: .2em; color: var(--accent); }

/* reading (тизер). */
.readHead { text-align: center; display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.teaser { display: flex; flex-direction: column; gap: 14px; }
.teaserLine { font-size: 16px; line-height: 1.62; color: var(--ink); margin: 0; text-wrap: pretty; }
.lockBlock { margin-top: 8px; padding: 18px; border: 1px dashed var(--line); border-radius: 12px; background: rgba(120, 220, 120, .04); }
.lockText { color: var(--lock); font-size: 15px; line-height: 1.55; filter: blur(.4px); }

/* Анимации. */
@keyframes screenIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes pulse { 0%, 100% { box-shadow: 0 0 22px rgba(98, 224, 106, .28); } 50% { box-shadow: 0 0 34px rgba(98, 224, 106, .5); } }
@keyframes shuffle {
  0% { transform: translate(0, 0) rotate(0); }
  40% { transform: translate(-18px, -8px) rotate(-8deg); }
  70% { transform: translate(14px, 6px) rotate(6deg); }
  100% { transform: translate(0, 0) rotate(0); }
}

/* Доступность: гасим анимации. */
@media (prefers-reduced-motion: reduce) {
  .screen, .cta, .ctaPulse, .deckShuffle .deckCard, .flipInner, .menuItem { animation: none !important; transition: none !important; }
  .flipOn .flipInner { transform: rotateY(180deg); }
}

/* Десктоп: чуть крупнее. */
@media (min-width: 640px) {
  .h1 { font-size: 24px; }
  .bootTitle { font-size: 42px; }
}
```

**Step 2: Коммит (локальный)**

```
git add frontend/app/lp/terminal.module.css
git commit -m "feat(lp): скелет ретро-терминальной темы terminal.module.css"
```

---

## Task 5: Движок фаз (`TerminalClient.jsx`)

**Files:**
- Create: `frontend/app/lp/[slug]/TerminalClient.jsx`

Юнит-теста нет (React-компонент). Логика переходов/тизера уже покрыта в задаче 1. Гейт — компиляция в финальном билде (задача 7). Имена классов должны совпадать с `terminal.module.css`.

**Step 1: Создать файл**

Создать `frontend/app/lp/[slug]/TerminalClient.jsx`:

```jsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { saveQuiz, loadQuiz } from '../logic/quizStorage.js'
import { nextPhase, prevPhase, canGoBack, pickCard, buildTeaser } from '../logic/terminalMachine.js'
import Paywall from '../components/Paywall'
import styles from '../terminal.module.css'

const CARD_SRC = (n) => `/cards/${n}.png`

export default function TerminalClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const router = useRouter()

  const [phase, setPhase] = useState('boot')
  const [stateId, setStateId] = useState(null)
  const [card, setCard] = useState(null)
  const [answer1, setAnswer1] = useState(null)
  const [answer2, setAnswer2] = useState(null)
  const [drawing, setDrawing] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [secs, setSecs] = useState(0)

  const timers = useRef([])
  const isSubscribed = user?.subscribed ?? false
  const state = stateId ? landing.states.find((s) => s.id === stateId) : null
  const levelNo = state ? landing.states.indexOf(state) + 1 : 0
  const teaser = state && card ? buildTeaser(state, card, answer1, answer2) : null

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

  // reading: событие воронки.
  useEffect(() => {
    if (phase === 'reading') track('reading_view', { slug: landing.slug })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // reveal: переворот + мягкий 10с обратный отсчёт (переход не форсирует).
  useEffect(() => {
    if (phase !== 'reveal') return undefined
    setFlipped(false)
    after(80, () => setFlipped(true))
    let left = landing.reveal.seconds
    setSecs(left)
    const id = setInterval(() => {
      left -= 1
      setSecs(left)
      if (left <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const go = (p) => { clearTimers(); setPhase(p) }
  const goNext = () => go(nextPhase(phase))
  const goBack = () => go(prevPhase(phase))

  const onStart = () => { track('game_start', { slug: landing.slug }); go('select') }

  const onSelectState = (id) => {
    track('state_select', { slug: landing.slug, stateId: id })
    setStateId(id)
    saveQuiz(landing.slug, { stateId: id })
    go('intro')
  }

  const onDraw = () => {
    if (drawing) return
    setDrawing(true)
    after(1100, () => {
      const c = pickCard()
      setCard(c)
      track('card_drawn', { slug: landing.slug, card: c.number })
      saveQuiz(landing.slug, { stateId, card: c.number })
      setDrawing(false)
      go('reveal')
    })
  }

  const onAnswer1 = (value) => { setAnswer1(value); track('q1_answer', { slug: landing.slug, value }); go('q2') }
  const onAnswer2 = (value) => { setAnswer2(value); track('q2_answer', { slug: landing.slug, value }); go('reading') }

  const onRestart = () => {
    clearTimers()
    setStateId(null); setCard(null); setAnswer1(null); setAnswer2(null)
    setDrawing(false); setFlipped(false); setSecs(0)
    setPhase('boot')
  }

  // Статус-строка (хромировка) для фаз уровня.
  const Chrome = ({ k }) => {
    const c = landing.chrome[k]
    if (!c) return null
    const tag = c.tag && k === 'intro' ? `${c.tag} ${String(levelNo).padStart(2, '0')}` : c.tag
    return (
      <div className={styles.chrome}>
        <span className={styles.chromeStep}>{c.step}</span>
        <span className={styles.chromeStatus}>{c.status}</span>
        {tag && <span className={styles.chromeTag}>{tag}</span>}
      </div>
    )
  }

  const BackBtn = () => (canGoBack(phase)
    ? <button className={styles.backBtn} onClick={goBack} aria-label={landing.microcopy.back}>←</button>
    : null)

  let view
  if (phase === 'boot') {
    view = (
      <div className={styles.center}>
        <div className={styles.bootStatus}>{landing.boot.status}</div>
        <h1 className={styles.bootTitle}>{landing.boot.title}</h1>
        <p className={styles.bootSub}>{landing.boot.subtitle}</p>
        <button className={`${styles.cta} ${styles.ctaPulse}`} onClick={onStart}>{landing.boot.cta}</button>
      </div>
    )
  } else if (phase === 'select') {
    view = (
      <div className={styles.pad}>
        <div className={styles.center} style={{ flex: 'none' }}>
          <h1 className={styles.h1}>{landing.select.title}</h1>
          <p className={styles.lead}>{landing.select.subtitle}</p>
        </div>
        <div className={styles.menu}>
          {landing.states.map((s) => (
            <button key={s.id} className={styles.menuItem} onClick={() => onSelectState(s.id)}>
              <span className={styles.menuArrow}>›</span>{s.menuLabel}
            </button>
          ))}
        </div>
      </div>
    )
  } else if (phase === 'intro') {
    view = (
      <div className={styles.pad}>
        <BackBtn />
        <Chrome k="intro" />
        <div className={styles.center}>
          <h1 className={styles.h1}>{state.menuLabel}</h1>
          <p className={styles.lead}>{state.intro}</p>
          <button className={styles.cta} onClick={goNext}>{landing.microcopy.next}</button>
        </div>
      </div>
    )
  } else if (phase === 'pause') {
    view = (
      <div className={styles.pad}>
        <BackBtn />
        <Chrome k="pause" />
        <div className={styles.center}>
          <p className={styles.lead}>{state.pause}</p>
          <button className={styles.cta} onClick={goNext}>{landing.microcopy.next}</button>
        </div>
      </div>
    )
  } else if (phase === 'draw') {
    view = (
      <div className={styles.pad}>
        <BackBtn />
        <Chrome k="draw" />
        <div className={styles.center}>
          <h1 className={styles.h1}>{landing.draw.title}</h1>
          <p className={styles.lead}>{landing.draw.line}</p>
          <div className={`${styles.deck} ${drawing ? styles.deckShuffle : ''}`} aria-hidden="true">
            <div className={styles.deckCard} /><div className={styles.deckCard} /><div className={styles.deckCard} />
          </div>
          <p className={styles.hint}>{landing.draw.hint}</p>
          <button className={styles.cta} onClick={onDraw} disabled={drawing}>{landing.draw.cta}</button>
        </div>
      </div>
    )
  } else if (phase === 'reveal') {
    view = (
      <div className={styles.pad}>
        <BackBtn />
        <Chrome k="reveal" />
        <div className={styles.center}>
          <h1 className={styles.h1}>{landing.reveal.title}</h1>
          <div className={`${styles.flip} ${flipped ? styles.flipOn : ''}`}>
            <div className={styles.flipInner}>
              <div className={`${styles.flipFace} ${styles.flipBack}`} />
              <div className={`${styles.flipFace} ${styles.flipFront}`}
                style={card ? { backgroundImage: `url(${CARD_SRC(card.number)})` } : undefined} />
            </div>
          </div>
          <p className={styles.lead}>{landing.reveal.line}</p>
          <div className={styles.revealFoot}>
            {secs > 0 && <span className={styles.timer}>{secs}</span>}
            <button className={styles.cta} onClick={goNext}>{landing.reveal.cta}</button>
            {secs > 0 && <button className={styles.linkBtn} onClick={goNext}>{landing.reveal.skip}</button>}
          </div>
        </div>
      </div>
    )
  } else if (phase === 'q1' || phase === 'q2') {
    const q = phase === 'q1' ? state.q1 : state.q2
    const onPick = phase === 'q1' ? onAnswer1 : onAnswer2
    view = (
      <div className={styles.pad}>
        <BackBtn />
        <Chrome k={phase} />
        <div className={styles.center} style={{ flex: 'none' }}>
          <p className={styles.lead}>{q.prompt}</p>
        </div>
        <div className={styles.menu}>
          {q.options.map((o) => (
            <button key={o} className={styles.menuItem} onClick={() => onPick(o)}>
              <span className={styles.menuArrow}>›</span>{o}
            </button>
          ))}
        </div>
      </div>
    )
  } else if (phase === 'reading') {
    view = (
      <div className={styles.pad}>
        <Chrome k="reading" />
        <div className={styles.readHead}>
          <div className={styles.eyebrow}>{landing.reading.eyebrow}</div>
          <h1 className={styles.h1}>{landing.reading.title}</h1>
        </div>
        <div className={styles.teaser}>
          {teaser.open.map((line, i) => <p key={i} className={styles.teaserLine}>{line}</p>)}
          <div className={styles.lockBlock}>
            <div className={styles.lockText}>🔒 {teaser.lock} ▨▨▨▨▨…</div>
          </div>
        </div>
        <button className={`${styles.cta} ${styles.ctaPulse}`} style={{ marginTop: 22 }} onClick={goNext}>
          {landing.reading.cta}
        </button>
        <div className={styles.restart}>
          <button className={styles.linkBtn} onClick={onRestart}>{landing.microcopy.restart}</button>
        </div>
      </div>
    )
  } else {
    // paywall
    view = (
      <div className={styles.pad}>
        <Paywall
          slug={landing.slug}
          heading={landing.paywall.heading}
          payoffs={landing.paywall.payoffs}
          onRestart={onRestart}
        />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.scanlines} aria-hidden="true" />
      <div className={styles.screen}>{view}</div>
    </div>
  )
}
```

**Step 2: Коммит (локальный)**

```
git add frontend/app/lp/[slug]/TerminalClient.jsx
git commit -m "feat(lp): движок фаз TerminalClient (boot..reading + Paywall)"
```

---

## Task 6: Ветка роутера в `page.jsx`

**Files:**
- Modify: `frontend/app/lp/[slug]/page.jsx` (импорт + одна ветка)

**Step 1: Подключить TerminalClient**

Изменить `frontend/app/lp/[slug]/page.jsx`:

```jsx
import { notFound } from 'next/navigation'
import { getLanding } from '../../content/landings/index.js'
import LandingClient from './LandingClient'
import CompatClient from './CompatClient'
import RevealClient from './RevealClient'
import TerminalClient from './TerminalClient'

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
    LandingClient
  return <Client landing={landing} />
}
```

**Step 2: Коммит (локальный)**

```
git add frontend/app/lp/[slug]/page.jsx
git commit -m "feat(lp): роутинг движка terminal в page.jsx"
```

---

## Task 7: Финальная верификация (весь пакет тестов + один прод-билд)

**Files:** нет новых.

**Step 1: Прогнать все затронутые node-тесты вместе**

Run (PowerShell):
```
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/lp/logic/terminalMachine.test.mjs app/content/landings/taro-terminal-copy.test.mjs app/content/landings/index.test.mjs
```
Expected: PASS все три файла (в т.ч. старые тесты реестра love/taro-him не сломаны).

**Step 2: Один прод-билд (гейт компиляции)**

Требуется запущенный dev-контейнер `esoteric-main-frontend-1`. Билд именно с `NODE_ENV=production` (иначе спурьёзные ошибки `<Html>`/`useContext`, это не реальные баги).

Run (PowerShell):
```
docker exec -e NODE_ENV=production esoteric-main-frontend-1 npm run build
```
Expected: чистая компиляция, страница `/lp/[slug]` в списке роутов, без ошибок.

Если dev-контейнер не поднят — поднять `docker compose -f D:\Claude\Esoteric-main\docker-compose.dev.yml up -d frontend`, затем повторить билд.

**Step 3: Восстановить dev-сервер (прод-билд затирает общий `.next`)**

Run (PowerShell):
```
docker compose -f D:\Claude\Esoteric-main\docker-compose.dev.yml restart frontend
```

**Step 4: Спот-чек разметки (опционально, если dev поднят)**

Дев-контейнер не видит host-правки без рестарта — сначала `docker restart esoteric-main-frontend-1`, затем:
```
Invoke-WebRequest -UseBasicParsing http://localhost/lp/taro-terminal | Select-Object -ExpandProperty Content | Select-String 'ТАРО ТЕРМИНАЛ'
```
Expected: в HTML присутствует заголовок обложки (движок terminal отрендерился).

**Step 5: Коммит (локальный)**

Если на шагах правились файлы — коммит; иначе пропустить.

```
git add -A
git commit -m "chore(lp): финальная верификация taro-terminal (тесты + прод-билд)"
```

---

## Файлы (сводка)

Создать:
- `frontend/app/lp/logic/terminalMachine.js` (+ `.test.mjs`)
- `frontend/app/content/landings/taro-terminal-copy.js` (+ `.test.mjs`)
- `frontend/app/content/landings/taro-terminal.js`
- `frontend/app/lp/terminal.module.css`
- `frontend/app/lp/[slug]/TerminalClient.jsx`

Изменить (минимально):
- `frontend/app/content/landings/index.js` (import + запись реестра)
- `frontend/app/content/landings/index.test.mjs` (один тест)
- `frontend/app/lp/[slug]/page.jsx` (import + ветка `engine === 'terminal'`)

## Вне скоупа (YAGNI)

- Ввод имени / детерминизм карты по имени (игра анонимна; `pickCard` уже принимает `rand`, засев по `seedFromName` — задел на потом).
- Свободный ввод текста (только тапы).
- Отдельный экран «полный разбор» на лендинге (разбор доставляет продукт в ЛК; возврат по `post_checkout_return` — штатный).
- Правки бэкенда.
- Финальная полировка темы `terminal.module.css` (делает заказчик в Claude Design).
