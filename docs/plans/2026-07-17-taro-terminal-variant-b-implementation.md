# Taro Terminal — вариант B: план реализации

> **For Claude:** REQUIRED SUB-SKILL: используй executing-plans для выполнения этого плана задача-за-задачей.

**Goal:** Переработать движок лендинга `/lp/taro-terminal` под вариант B: свободный ввод (блок-тег + необязательное «своими словами»), карта закреплена от reveal до reading, честный инсайт-мысль в финале, экран analyze, курированные пулы карт под состояние; экран-paywall лендинга убран, reading ведёт на регистрацию.

**Architecture:** Фикс и расширение существующего движка `terminal` (не переписывание). Чистая логика в `terminalMachine.js` (фазы, выбор карты из пула, сборка тизера) покрыта unit-тестами через `node:test`. Данные в `taro-terminal-copy.js` покрыты схемным тестом. React-клиент `TerminalClient.jsx` рендерит фазы; его правки проверяются вручную в браузере (dev-сервер уже запущен в контейнере с hot-reload).

**Tech Stack:** Next.js 14 (App Router) + CSS Modules, React 18, тесты `node:test`. Node доступен только в Docker-контейнере `esoteric-main-frontend-1` (working_dir `/app`).

**Дизайн:** [2026-07-17-taro-terminal-variant-b-design.md](2026-07-17-taro-terminal-variant-b-design.md)

## Команды (проверены)

Прогон unit-тестов движка и данных:
```bash
docker exec esoteric-main-frontend-1 node --test app/lp/logic/terminalMachine.test.mjs app/content/landings/taro-terminal-copy.test.mjs
```
Ручная проверка клиента: открыть `http://localhost/lp/taro-terminal` (dev-сервер контейнера отдаёт изменения по hot-reload; пересобирать не нужно).

Правило проекта: в user-facing текстах не использовать длинный тире «—» (тест это проверяет).

---

## Задача 1: PHASES, навигация, canGoBack

**Files:**
- Modify: `frontend/app/lp/logic/terminalMachine.js:27-46`
- Test: `frontend/app/lp/logic/terminalMachine.test.mjs:8-32`

**Step 1: Обновить тесты фаз (сделать красными).** Заменить блоки тестов PHASES / nextPhase / prevPhase / canGoBack на:

```js
test('PHASES: 11 фаз, есть q3 и analyze, нет paywall', () => {
  assert.deepEqual(PHASES, [
    'boot', 'select', 'intro', 'pause', 'draw', 'reveal', 'q1', 'q2', 'q3', 'analyze', 'reading',
  ])
})

test('nextPhase идёт по порядку и упирается в reading', () => {
  assert.equal(nextPhase('q2'), 'q3')
  assert.equal(nextPhase('q3'), 'analyze')
  assert.equal(nextPhase('analyze'), 'reading')
  assert.equal(nextPhase('reading'), 'reading')
})

test('prevPhase идёт назад и упирается в boot', () => {
  assert.equal(prevPhase('select'), 'boot')
  assert.equal(prevPhase('boot'), 'boot')
})

test('canGoBack: шаги уровня intro..q3, не на analyze/reading', () => {
  assert.ok(canGoBack('intro'))
  assert.ok(canGoBack('q3'))
  assert.ok(!canGoBack('analyze'))
  assert.ok(!canGoBack('reading'))
  assert.ok(!canGoBack('boot'))
})
```

**Step 2: Запустить тесты — убедиться, что падают.**
Run: `docker exec esoteric-main-frontend-1 node --test app/lp/logic/terminalMachine.test.mjs`
Expected: FAIL (PHASES не совпадает).

**Step 3: Обновить PHASES и BACK_PHASES.** В `terminalMachine.js` заменить:
```js
export const PHASES = [
  'boot', 'select', 'intro', 'pause', 'draw', 'reveal', 'q1', 'q2', 'q3', 'analyze', 'reading',
]

export const BACK_PHASES = ['intro', 'pause', 'draw', 'reveal', 'q1', 'q2', 'q3']
```
`nextPhase`, `prevPhase`, `canGoBack` не меняются (уже опираются на PHASES/BACK_PHASES).

**Step 4: Запустить тесты — фазовые зелёные** (другие тесты этого файла пока могут падать, их чиним в задачах 2-3).
Run: `docker exec esoteric-main-frontend-1 node --test app/lp/logic/terminalMachine.test.mjs`
Expected: тесты PHASES/nextPhase/prevPhase/canGoBack — PASS.

**Step 5: Commit.**
```bash
git add frontend/app/lp/logic/terminalMachine.js frontend/app/lp/logic/terminalMachine.test.mjs
git commit -m "feat(lp): фазы terminal под вариант B (+q3 +analyze, -paywall)"
```

---

## Задача 2: isMeaningful + buildTeaser (сборка тизера)

**Files:**
- Modify: `frontend/app/lp/logic/terminalMachine.js:57-82`
- Test: `frontend/app/lp/logic/terminalMachine.test.mjs:45-61`

**Step 1: Заменить тест buildTeaser и добавить тест isMeaningful (красные).**

```js
test('isMeaningful: порог 12 символов, пустое/короткое не проходит', () => {
  assert.ok(!isMeaningful(''))
  assert.ok(!isMeaningful('   '))
  assert.ok(!isMeaningful('страх'))
  assert.ok(isMeaningful('люди которые падают'))
})

test('buildTeaser: 4 слоя, цитаты тегов + свои слова при осмысленном тексте', () => {
  const state = { teaser: {
    quote1: 'Тяжелее всего «{tag}».',
    quote2: 'Опора это «{tag}».',
    cardLine: 'Карта «{cardRu}» про «{cardKw}».',
    thought: 'Мысль.',
    lock: 'Что держит «{tag}» при «{cardRu}»,',
  } }
  const card = { ru: 'Башня', keywords: ['Слом', 'a', 'b', 'c'] }
  const a1 = { tag: 'перегруз', text: 'люди которые падают' } // >=12 → цитируется
  const a2 = { tag: 'пауза', text: '' }                       // пусто → без цитаты
  const t = buildTeaser(state, card, a1, a2)
  assert.equal(t.open.length, 4)
  assert.ok(t.open[0].includes('перегруз') && t.open[0].includes('Твоими словами') && t.open[0].includes('люди которые падают'))
  assert.ok(!t.open[1].includes('Твоими словами'))
  assert.ok(t.open[2].includes('Башня') && t.open[2].includes('Слом'))
  assert.equal(t.open[3], 'Мысль.')
  const blob = `${t.open.join(' ')} ${t.lock}`
  assert.ok(!blob.includes('{'))
})
```

И добавить `isMeaningful` в импорт вверху теста:
```js
import {
  PHASES, nextPhase, prevPhase, canGoBack, pickCard, fillTokens, buildTeaser, isMeaningful,
} from './terminalMachine.js'
```

**Step 2: Запустить — падает** (isMeaningful не определён, buildTeaser старой формы).
Run: `docker exec esoteric-main-frontend-1 node --test app/lp/logic/terminalMachine.test.mjs`
Expected: FAIL.

**Step 3: Заменить `buildTeaser` и добавить `isMeaningful`** в `terminalMachine.js` (блок после `fillTokens`):

```js
// Порог осмысленности свободного текста игрока. Никакого разбора смысла:
// просто фильтр против «.», «хз», случайного мусора.
export function isMeaningful(text) {
  return String(text ?? '').trim().length >= 12
}

// Собрать тизер: 2 цитаты тегов (+ опц. свои слова игрока) + Барнум по карте +
// мысль; закрытый хвост (замок). a1/a2 = { tag, text }. Свободный текст только
// цитируется в кавычках (падеж не важен) или опускается, но не интерпретируется.
export function buildTeaser(state, card, a1, a2, ownLabel = 'Твоими словами') {
  const t = state.teaser
  const own = (text) => (isMeaningful(text) ? ` ${ownLabel}: «${String(text).trim()}».` : '')
  return {
    open: [
      fillTokens(t.quote1, { tag: a1.tag }) + own(a1.text),
      fillTokens(t.quote2, { tag: a2.tag }) + own(a2.text),
      fillTokens(t.cardLine, { cardRu: card.ru, cardKw: card.keywords[0] }),
      t.thought,
    ],
    lock: fillTokens(t.lock, { cardRu: card.ru, tag: a1.tag }),
  }
}
```

**Step 4: Запустить — isMeaningful и buildTeaser зелёные** (pickCard пока падает, чиним в задаче 3).
Run: `docker exec esoteric-main-frontend-1 node --test app/lp/logic/terminalMachine.test.mjs`
Expected: тесты isMeaningful/buildTeaser — PASS.

**Step 5: Commit.**
```bash
git add frontend/app/lp/logic/terminalMachine.js frontend/app/lp/logic/terminalMachine.test.mjs
git commit -m "feat(lp): buildTeaser 4 слоя (цитаты тегов + свои слова + Барнум) и isMeaningful"
```

---

## Задача 3: pickCard из курированного пула

**Files:**
- Modify: `frontend/app/lp/logic/terminalMachine.js:48-55`
- Test: `frontend/app/lp/logic/terminalMachine.test.mjs:34-39`

**Step 1: Заменить тест pickCard (красный).**

```js
test('pickCard: тянет по номеру из пула состояния', () => {
  assert.equal(pickCard([16], () => 0, DECK).number, 16)         // Башня
  assert.equal(pickCard([16, 18], () => 0.99, DECK).number, 18)  // Луна
})

test('pickCard: пустой или отсутствующий пул → вся колода', () => {
  assert.equal(pickCard([], () => 0, DECK).number, 0)            // Шут
  assert.equal(pickCard(undefined, () => 0.999, DECK).number, 21) // Мир
})
```

**Step 2: Запустить — падает** (сигнатура сменилась).
Run: `docker exec esoteric-main-frontend-1 node --test app/lp/logic/terminalMachine.test.mjs`
Expected: FAIL.

**Step 3: Заменить `pickCard`** в `terminalMachine.js`:

```js
// Случайная карта из пула номеров pool (курирование под состояние). Пустой или
// отсутствующий пул → вся пиксельная колода. rand: () => [0,1) (в тестах детерм.).
export function pickCard(pool, rand = Math.random, deck = TERMINAL_DECK) {
  const nums = Array.isArray(pool) && pool.length ? pool : deck.map((c) => c.number)
  const num = nums[Math.min(Math.floor(rand() * nums.length), nums.length - 1)]
  return deck.find((c) => c.number === num) ?? deck[0]
}
```

**Step 4: Запустить — весь файл зелёный.**
Run: `docker exec esoteric-main-frontend-1 node --test app/lp/logic/terminalMachine.test.mjs`
Expected: PASS (все тесты движка).

**Step 5: Commit.**
```bash
git add frontend/app/lp/logic/terminalMachine.js frontend/app/lp/logic/terminalMachine.test.mjs
git commit -m "feat(lp): pickCard тянет из курированного пула карт состояния"
```

---

## Задача 4: данные copy — схема варианта B

**Files:**
- Modify: `frontend/app/content/landings/taro-terminal-copy.js`
- Test: `frontend/app/content/landings/taro-terminal-copy.test.mjs`

**Step 1: Переписать тест copy под новую схему (красный).** Заменить содержимое `taro-terminal-copy.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TARO_TERMINAL_COPY } from './taro-terminal-copy.js'
import { TERMINAL_DECK } from '../../lp/logic/terminalMachine.js'

const C = TARO_TERMINAL_COPY

test('8 состояний, полная схема варианта B', () => {
  assert.equal(C.states.length, 8)
  for (const s of C.states) {
    assert.ok(s.id && s.menuLabel && s.intro && s.pause, `база ${s.id}`)
    assert.ok(s.q1.prompt && Array.isArray(s.q1.blocks) && s.q1.blocks.length === 4 && s.q1.placeholder, `q1 ${s.id}`)
    assert.ok(s.q2.prompt && Array.isArray(s.q2.blocks) && s.q2.blocks.length === 4 && s.q2.placeholder, `q2 ${s.id}`)
    assert.ok(s.q3.prompt && Array.isArray(s.q3.options) && s.q3.options.length >= 3, `q3 ${s.id}`)
    assert.ok(Array.isArray(s.cardPool) && s.cardPool.length >= 1, `cardPool ${s.id}`)
    const t = s.teaser
    assert.ok(t.quote1 && t.quote2 && t.cardLine && t.thought && t.lock, `teaser ${s.id}`)
  }
})

test('id состояний уникальны', () => {
  assert.equal(new Set(C.states.map((s) => s.id)).size, 8)
})

test('cardPool ссылается только на карты TERMINAL_DECK', () => {
  const valid = new Set(TERMINAL_DECK.map((c) => c.number))
  for (const s of C.states) for (const n of s.cardPool) assert.ok(valid.has(n), `${s.id}: карта ${n}`)
})

test('общие экраны и chrome на месте (вкл. q3, analyze; без paywall)', () => {
  assert.ok(C.boot.title && C.select.title && C.draw.cta && C.reveal.cta)
  assert.ok(C.reading.title && C.reading.cta && C.reading.payoffs.length === 4)
  assert.ok(Array.isArray(C.analyze.lines) && C.analyze.lines.length >= 2)
  for (const k of ['intro', 'pause', 'draw', 'reveal', 'q1', 'q2', 'q3', 'analyze', 'reading']) {
    assert.ok(C.chrome[k], `chrome.${k}`)
  }
})

test('тизер-слоты используют только валидные токены', () => {
  const allowed = new Set(['tag', 'cardRu', 'cardKw'])
  for (const s of C.states) {
    const blob = Object.values(s.teaser).join(' ')
    for (const m of blob.matchAll(/\{(\w+)\}/g)) assert.ok(allowed.has(m[1]), `${s.id}: {${m[1]}}`)
  }
})

test('нигде нет длинного тире', () => {
  assert.ok(!JSON.stringify(C).includes('—'))
})
```

**Step 2: Запустить — падает.**
Run: `docker exec esoteric-main-frontend-1 node --test app/content/landings/taro-terminal-copy.test.mjs`
Expected: FAIL.

**Step 3: Переписать данные.** В `taro-terminal-copy.js`:

(а) Заменить `reading` и убрать `paywall`, добавить `analyze`:
```js
reading: {
  eyebrow: 'TERMINAL READS…',
  title: 'Твой вывод',
  unlockTitle: 'Что откроется в полном разборе',
  payoffs: [
    'Полное значение твоей карты',
    'Что делать с этим состоянием',
    'Личный вывод и шаг на сегодня',
    'Доступ ко всем 22 картам',
  ],
  cta: 'Что с этим делать →',
},
analyze: {
  lines: [
    '> считываю твои ответы…',
    '> сверяю с картой «{cardRu}»…',
    '> сопоставляю состояние…',
    '> формирую вывод…',
  ],
},
```

(б) В `chrome` добавить `q3` и `analyze`, пересчитать шаги на 08:
```js
chrome: {
  intro:   { mode: 'LEVEL START',     status: 'STATUS: READY', step: 'STEP 01-08', eyebrow: 'СОСТОЯНИЕ //' },
  pause:   { mode: 'SELF-CHECK',      status: 'STATUS: PAUSE', step: 'STEP 02-08', title: 'Сделай паузу' },
  draw:    { mode: 'SHUFFLING…',      status: 'CARD: HIDDEN',  step: 'STEP 03-08' },
  reveal:  { mode: 'CARD: REVEAL',    status: 'STATUS: REVEAL', step: 'STEP 04-08' },
  q1:      { mode: 'QUESTION MODE',   status: 'STATUS: INPUT', step: 'STEP 05-08', eyebrow: 'ВОПРОС 1 / 3 //' },
  q2:      { mode: 'QUESTION MODE',   status: 'STATUS: INPUT', step: 'STEP 06-08', eyebrow: 'ВОПРОС 2 / 3 //' },
  q3:      { mode: 'QUESTION MODE',   status: 'STATUS: INPUT', step: 'STEP 07-08', eyebrow: 'ВОПРОС 3 / 3 //' },
  analyze: { mode: 'PROCESSING…',     status: 'STATUS: SYNC',  step: 'STEP 08-08' },
  reading: { mode: 'TERMINAL READS…', status: 'STATUS: DONE',  step: 'STEP 08-08' },
},
```

(в) В `microcopy` добавить `own`:
```js
microcopy: { back: 'назад', next: 'Далее', restart: '← пройти заново', own: 'Твоими словами' },
```

(г) Каждое из 8 состояний привести к новой схеме. **Эталон (`tired`)** — сделать точно так, остальные 7 по образцу:
```js
{
  id: 'tired',
  menuLabel: 'Я устала',
  intro: 'Иногда усталость просит не мотивации, а честного взгляда на то, что забирает силы.',
  pause: 'Скажи про себя: я хочу увидеть, что сейчас больше всего истощает меня. Не нужно собираться. Сейчас нужно только заметить.',
  q1: {
    prompt: 'Что на карте кажется тебе самым тяжёлым? Что в ней похоже на твою усталость?',
    blocks: ['Тяжесть', 'Пустота', 'Перегруз', 'Гонка без паузы'],
    placeholder: 'Опиши своими словами (по желанию)',
  },
  q2: {
    prompt: 'Есть ли на карте что-то, что похоже на опору? Что помогло бы тебе немного выдохнуть?',
    blocks: ['Пауза', 'Поддержка', 'Тишина', 'Смена ритма'],
    placeholder: 'Опиши своими словами (по желанию)',
  },
  q3: {
    prompt: 'Если бы карта сказала тебе одну фразу, с чего бы она начала?',
    options: ['Разреши себе меньше', 'Обопрись на опору', 'Сбавь темп'],
  },
  cardPool: [13, 10, 4, 18, 16],
  teaser: {
    quote1: 'Самым тяжёлым ты назвала «{tag}».',
    quote2: 'А опорой для тебя стало «{tag}».',
    cardLine: 'Карта «{cardRu}» про тебя говорит: дело не в том, что ты мало стараешься, а в том, на что уходят силы. Ключ к ней сейчас это «{cardKw}».',
    thought: 'Не всякая усталость лечится усилием. Иногда отдых и есть действие.',
    lock: 'Что именно забирает твой ресурс при карте «{cardRu}» и с чего начать восстановление,',
  },
},
```

Остальные 7 состояний (`scared, confused, cant_choose, everything_stopped, hear_myself, hold_on_person, dont_know_want`): `prompt` брать из формулировок оригинала PDF (уже близки к текущим), `blocks` = текущие `options`, `q3` дописать короткий (3-4 варианта), `cardPool` из таблицы дизайна, `teaser.quote1/quote2` переразложить из текущего `teaserOpen`, `cardLine` из `teaserPivot` (добавив `{cardKw}`), `thought` и `lock` из текущих `thought`/`teaserLock`. Пулы карт из таблицы дизайн-дока:

| id | cardPool |
|---|---|
| tired | 13, 10, 4, 18, 16 |
| scared | 18, 15, 16, 13 |
| confused | 18, 10, 16, 5 |
| cant_choose | 7, 10, 5, 4 |
| everything_stopped | 13, 10, 18, 16 |
| hear_myself | 17, 18, 5, 19 |
| hold_on_person | 15, 13, 18, 17 |
| dont_know_want | 19, 17, 7, 4 |

**Step 4: Запустить — зелёный.**
Run: `docker exec esoteric-main-frontend-1 node --test app/content/landings/taro-terminal-copy.test.mjs`
Expected: PASS.

**Step 5: Commit.**
```bash
git add frontend/app/content/landings/taro-terminal-copy.js frontend/app/content/landings/taro-terminal-copy.test.mjs
git commit -m "feat(lp): данные taro-terminal под вариант B (blocks, q3, cardPool, teaser-слоты)"
```

> Финальную выверку копий, вариантов q3 и пулов делает пользователь-копирайтер; тест гарантирует полноту схемы.

---

## Задача 5: клиент — состояние и компонент CardFace

**Files:**
- Modify: `frontend/app/lp/[slug]/TerminalClient.jsx`

Проверка задач 5-9 — ручная в браузере (`http://localhost/lp/taro-terminal`), плюс регрессия unit-тестов. Автотестов на клиент в проекте нет.

**Step 1: Импорт fillTokens.** Строка 7:
```js
import { nextPhase, prevPhase, canGoBack, pickCard, buildTeaser, fillTokens } from '../logic/terminalMachine.js'
```

**Step 2: Заменить стейт ответов.** Вместо `answer1/answer2` (строки 45-46):
```js
const [a1Tag, setA1Tag] = useState(null)
const [a1Text, setA1Text] = useState('')
const [a2Tag, setA2Tag] = useState(null)
const [a2Text, setA2Text] = useState('')
const [a3, setA3] = useState(null)
const [analyzeLines, setAnalyzeLines] = useState([])
const [analyzePct, setAnalyzePct] = useState(0)
```

**Step 3: Обновить сборку teaser** (строка 56):
```js
const teaser = state && card
  ? buildTeaser(state, card, { tag: a1Tag, text: a1Text }, { tag: a2Tag, text: a2Text }, landing.microcopy.own)
  : null
```

**Step 4: Обновить `onDraw`** — тянуть из пула (строка ~130):
```js
const cc = pickCard(state.cardPool)
```

**Step 5: Обновить `onRestart`** — сбросить новые поля:
```js
setA1Tag(null); setA1Text(''); setA2Tag(null); setA2Text(''); setA3(null)
setAnalyzeLines([]); setAnalyzePct(0)
```
(и убрать старые `setAnswer1/2`).

**Step 6: Добавить компонент `CardFace`** рядом с `LockSvg` (статичное лицо карты для закреплённого показа):
```jsx
const CardFace = ({ card, small }) => (
  <div className={`${styles.cardFace} ${small ? styles.cardSmall : ''}`}
    style={card ? { backgroundImage: `url(${CARD_SRC(card.slug)})` } : undefined} aria-hidden="true">
    {card && <span className={styles.cardTag}>{ROMAN[card.number]} · {card.ru}</span>}
  </div>
)
```

**Step 7:** Убрать `confirmQ1/confirmQ2` (строки 140-141) — заменяются инлайн-обработчиками в задаче 6.

**Step 8: Проверка регрессии** (движок не сломан импортом):
Run: `docker exec esoteric-main-frontend-1 node --test app/lp/logic/terminalMachine.test.mjs`
Expected: PASS.

**Step 9: Commit.**
```bash
git add frontend/app/lp/[slug]/TerminalClient.jsx
git commit -m "feat(lp): стейт вариантов B и компонент CardFace в TerminalClient"
```

---

## Задача 6: клиент — экраны q1/q2 (блоки + поле + карта)

**Files:**
- Modify: `frontend/app/lp/[slug]/TerminalClient.jsx` (блок `else if (phase === 'q1' || phase === 'q2')`)

**Step 1: Заменить рендер q1/q2:**
```jsx
} else if (phase === 'q1' || phase === 'q2') {
  const isQ1 = phase === 'q1'
  const q = isQ1 ? state.q1 : state.q2
  const tag = isQ1 ? a1Tag : a2Tag
  const setTag = isQ1 ? setA1Tag : setA2Tag
  const text = isQ1 ? a1Text : a2Text
  const setText = isQ1 ? setA1Text : setA2Text
  view = (
    <div className={styles.pad}>
      <BackBtn />
      <StatusBar left={c.mode} right={c.step} back />
      <div className={styles.qEyebrow}>{c.eyebrow}</div>
      <div className={styles.qLayout}>
        <CardFace card={card} small />
        <div className={styles.qBody}>
          <p className={styles.qPrompt}>{q.prompt}</p>
          <div className={styles.blocks}>
            {q.blocks.map((b) => (
              <button key={b} type="button" aria-pressed={tag === b}
                className={`${styles.block} ${tag === b ? styles.blockOn : ''}`}
                onClick={() => setTag(b)}>{b}</button>
            ))}
          </div>
          <input className={styles.ownInput} type="text" value={text} maxLength={60}
            placeholder={q.placeholder} onChange={(e) => setText(e.target.value)} />
        </div>
      </div>
      <button className={styles.cta} onClick={() => {
        track(isQ1 ? 'q1_answer' : 'q2_answer', { slug: landing.slug, tag })
        goNext()
      }} disabled={!tag}>{landing.microcopy.next} ▶</button>
    </div>
  )
}
```

**Step 2: Ручная проверка.** Открыть `http://localhost/lp/taro-terminal`, дойти до q1/q2: карта видна, блок выбирается, поле принимает текст, «Далее» активна только при выбранном блоке.

**Step 3: Commit.**
```bash
git add frontend/app/lp/[slug]/TerminalClient.jsx
git commit -m "feat(lp): экраны q1/q2 с блоком-тегом, полем и закреплённой картой"
```

---

## Задача 7: клиент — экран q3 (быстрый тап)

**Files:**
- Modify: `frontend/app/lp/[slug]/TerminalClient.jsx` (новый `else if` после блока q1/q2)

**Step 1: Добавить рендер q3:**
```jsx
} else if (phase === 'q3') {
  view = (
    <div className={styles.pad}>
      <BackBtn />
      <StatusBar left={c.mode} right={c.step} back />
      <div className={styles.qEyebrow}>{c.eyebrow}</div>
      <div className={styles.qLayout}>
        <CardFace card={card} small />
        <div className={styles.qBody}>
          <p className={styles.qPrompt}>{state.q3.prompt}</p>
          <div className={styles.options}>
            {state.q3.options.map((o) => (
              <button key={o} type="button" aria-pressed={a3 === o}
                className={`${styles.option} ${a3 === o ? styles.optionOn : ''}`}
                onClick={() => setA3(o)}>
                <span className={styles.optBox}>✓</span>{o}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button className={styles.cta} onClick={() => {
        track('q3_answer', { slug: landing.slug, value: a3 })
        goNext()
      }} disabled={!a3}>Узнать вывод ▶</button>
    </div>
  )
}
```

**Step 2: Ручная проверка.** До q3: карта видна, выбор варианта, «Узнать вывод» активна при выборе, ведёт на analyze.

**Step 3: Commit.**
```bash
git add frontend/app/lp/[slug]/TerminalClient.jsx
git commit -m "feat(lp): экран q3 (быстрый вопрос-тап)"
```

---

## Задача 8: клиент — экран analyze (псевдо-обработка)

**Files:**
- Modify: `frontend/app/lp/[slug]/TerminalClient.jsx` (эффект + новый `else if`)

**Step 1: Добавить эффект analyze** (рядом с эффектом reveal):
```jsx
// analyze: печать строк лога + прогресс, затем авто-переход на reading.
useEffect(() => {
  if (phase !== 'analyze') return undefined
  const lines = landing.analyze.lines.map((l) => fillTokens(l, { cardRu: card?.ru ?? '' }))
  if (reduced) {
    setAnalyzeLines(lines); setAnalyzePct(100)
    after(500, goNext)
    return () => clearTimers()
  }
  setAnalyzeLines([]); setAnalyzePct(0)
  let i = 0
  const id = setInterval(() => {
    i += 1
    setAnalyzeLines(lines.slice(0, i))
    setAnalyzePct(Math.round((i / lines.length) * 100))
    if (i >= lines.length) { clearInterval(id); after(700, goNext) }
  }, 600)
  return () => { clearInterval(id); clearTimers() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [phase])
```

**Step 2: Добавить рендер analyze:**
```jsx
} else if (phase === 'analyze') {
  view = (
    <div className={styles.pad}>
      <StatusBar left={c.mode} right={c.status} />
      <div className={styles.center}>
        <CardFace card={card} small />
        <div className={styles.analyzeLog}>
          {analyzeLines.map((l, i) => <p key={i}>{l}</p>)}
        </div>
        <div className={styles.analyzeBar} aria-hidden="true"><span style={{ width: `${analyzePct}%` }} /></div>
      </div>
    </div>
  )
}
```

**Step 3: Ручная проверка.** После q3 экран analyze печатает лог с именем карты, прогресс идёт до 100% и авто-переходит на reading; при системном reduced-motion переход почти мгновенный.

**Step 4: Commit.**
```bash
git add frontend/app/lp/[slug]/TerminalClient.jsx
git commit -m "feat(lp): экран analyze (псевдо-обработка перед выводом)"
```

---

## Задача 9: клиент — reading (карта + буллеты + регистрация), убрать paywall

**Files:**
- Modify: `frontend/app/lp/[slug]/TerminalClient.jsx` (блок `reading` и удаление блока `paywall`)

**Step 1: Заменить блок reading и удалить блок `else { // paywall … }`:**
```jsx
} else {
  // reading (финальная фаза): вывод + замок + что откроется + переход на регистрацию.
  const lines = typed.split('\n')
  view = (
    <div className={styles.pad}>
      <StatusBar left={c.mode} right={c.status} />
      <Progress step={8} />
      <div className={styles.split}>
        <div className={styles.colCard}><CardFace card={card} /></div>
        <div className={styles.colBody}>
          <h1 className={styles.readTitle}>{landing.reading.title}</h1>
          <div className={styles.readText}>
            {lines.map((line, i) => (
              <p key={i}>{line}{i === lines.length - 1 && <span className={styles.caret}>▊</span>}</p>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.lockBlock}>
        <div className={styles.lockBlur}>{teaser?.lock}</div>
        <div className={styles.lockOverlay}>
          <LockSvg size={32} />
          <div className={styles.lockLabel}>РАЗБОР ЗАКРЫТ</div>
        </div>
      </div>
      <div className={styles.unlock}>
        <div className={styles.unlockTitle}>{landing.reading.unlockTitle}</div>
        <ul className={styles.payoffs}>
          {landing.reading.payoffs.map((row) => (
            <li key={row} className={styles.payoffRow}><span className={styles.payoffMark}>✦</span><span>{row}</span></li>
          ))}
        </ul>
      </div>
      <button className={`${styles.cta} ${styles.ctaLock}`} onClick={onOpenFull}>{landing.reading.cta}</button>
      <div className={styles.restart}>
        <button className={styles.linkBtn} onClick={onRestart}>{landing.microcopy.restart}</button>
      </div>
    </div>
  )
}
```

**Step 2:** Обновить `wide` (строка 57) — reading остаётся широким на десктопе, paywall убран:
```js
const wide = phase === 'reveal' || phase === 'reading'
```

**Step 3: Ручная проверка полного флоу.** Пройти игру целиком: карта закреплена на всех экранах после reveal; на reading вывод содержит выбранные блоки, «Твоими словами» появляется при осмысленном вводе и исчезает при пустом; замок и буллеты на месте; «Что с этим делать →» ведёт на `/register` (или `/lk` для авторизованного). Проверить пустой ввод и мусор («ъуъ») — вывод остаётся осмысленным на теге.

**Step 4: Регрессия unit-тестов.**
Run: `docker exec esoteric-main-frontend-1 node --test app/lp/logic/terminalMachine.test.mjs app/content/landings/taro-terminal-copy.test.mjs`
Expected: PASS.

**Step 5: Commit.**
```bash
git add frontend/app/lp/[slug]/TerminalClient.jsx
git commit -m "feat(lp): reading с картой, буллетами и переходом на регистрацию; убрать paywall-фазу"
```

---

## Задача 10: стили новых элементов (каркас под макет пользователя)

**Files:**
- Modify: `frontend/app/lp/terminal.module.css`

**Step 1:** Добавить классы, на которые ссылается клиент: `.cardFace`, `.cardSmall`, `.cardTag`, `.qLayout`, `.qBody`, `.blocks`, `.block`, `.blockOn`, `.ownInput`, `.analyzeLog`, `.analyzeBar`, `.unlock`, `.unlockTitle`. Базовая рабочая вёрстка в существующей CRT-палитре (переменные уже в `.root`): карта закреплена и видна, блоки выбираемы, поле читаемо. Финальный визуал пользователь доводит по макету из Claude Design.

**Step 2: Ручная проверка.** Все новые экраны отображаются без «поехавшей» вёрстки; карта видна на q1/q2/q3/analyze/reading.

**Step 3: Commit.**
```bash
git add frontend/app/lp/terminal.module.css
git commit -m "style(lp): каркас стилей новых экранов terminal (карта, блоки, поле, analyze, буллеты)"
```

---

## Финальная проверка (один раз, не per-task)

1. Все unit-тесты зелёные:
   `docker exec esoteric-main-frontend-1 node --test app/lp/logic/terminalMachine.test.mjs app/content/landings/taro-terminal-copy.test.mjs`
2. Полный проход игры в браузере на 2-3 состояниях с разными картами: цитаты, «Твоими словами», замок, буллеты, переход на регистрацию.
3. (Опционально, если менялись серверные части) продакшн-сборка: `docker exec esoteric-main-frontend-1 npm run build` — но помнить, что в контейнере `NODE_ENV=development`, который ломает `next build`; сборку гонять в отдельном prod-окружении, не в dev-контейнере.

## Заметки по объёму и порядку
- Задачи 1-4 (движок + данные) полностью под TDD, дают зелёные тесты и безопасный фундамент.
- Задачи 5-10 (клиент + стили) проверяются вручную в браузере (dev hot-reload) + регрессия unit-тестов.
- Вне скоупа v1: микрореакции между шагами, полные значения карт (контент основного сайта), финальная выверка копий и пулов (за пользователем).
