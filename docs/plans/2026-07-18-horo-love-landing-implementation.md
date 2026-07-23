# Лендинг «Любовь» (гороскопы) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Собрать CPA-прелендинг `/lp/horo-love` с развилкой на 3 ветки (суженый / вернётся ли он / что блокирует), персональным ревилом с замком и финалом-регистрацией.

**Architecture:** Новый движок `horo-love`. Чистая детерминированная логика в `lp/logic/horoLove.js` (генерация из курируемых пулов по сиду, тесты `node:test`). Контент по знакам в `content/horoscope/love/`. Тонкий конфиг `content/landings/horo-love.js`. Фазовый клиент `HoroLoveClient.jsx`. Переиспользуем плумбинг (`Hero`, `Quiz`, `Calculating`, `Paywall`, `useTracking`, `quizStorage`, `sign()`).

**Tech Stack:** Next.js 14 (App Router, JSX, `'use client'`), React 18, CSS-модули. Тесты чистой логики через встроенный `node --test` (без новых зависимостей), запуск в контейнере `frontend`.

**Первоисточники (не переписывать, переносить дословно):**
- Дизайн: [2026-07-18-horo-love-landing-design.md](docs/plans/2026-07-18-horo-love-landing-design.md)
- Логика: [2026-07-18-horo-love-landing-logic.md](docs/plans/2026-07-18-horo-love-landing-logic.md)
- Тексты: [suzheny](docs/plans/2026-07-18-horo-love-suzheny-content.md) · [return](docs/plans/2026-07-18-horo-love-return-content.md) · [block](docs/plans/2026-07-18-horo-love-block-content.md)

---

## Соглашения

1. **Визуал вне scope.** Вёрстку/стили/цвета пользователь делает сам в Claude Design. Новые компоненты (`Fork`, `Reveal`) пишем структурно и функционально, переиспользуя классы `lp.module.css` где уместно; красоту наводят потом. Не тратить время на дизайн.
2. **Тесты чистой логики** (`horoLove.js`, контент, конфиг). Раннер `node --test` в контейнере `frontend` (Node 20). Команды из корня репозитория:
   - Логика: `docker compose -f docker-compose.dev.yml run --rm -w /app/app/lp/logic frontend node --test horoLove.test.mjs`
   - Контент: `docker compose -f docker-compose.dev.yml run --rm -w /app/app/content/horoscope/love frontend node --test`
   - Реестр лендингов: `docker compose -f docker-compose.dev.yml run --rm -w /app/app/content/landings frontend node --test`
   Ожидаемо в конце: `pass N`, `fail 0`.
3. **ID знаков** берём из `content/horoscope/astro.js` (`sign().id`): `aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces`.
4. **Тексты без длинного тире «—».** Переносить из контент-доков дословно.
5. Коммитим часто, по одному завершённому шагу.

---

## Task 1: Каркас папки контента + харнес тестов

**Files:**
- Create: `frontend/app/content/horoscope/love/package.json`
- Create: `frontend/app/content/horoscope/love/pools.js`
- Test: `frontend/app/content/horoscope/love/pools.test.mjs`

**Step 1: Каркас ESM-папки.** Создать `package.json`:
```json
{ "type": "module" }
```

**Step 2: Написать `pools.js`** (пуловые поля, варьируются по сиду):
```js
// Пуловые значения ревила ветки «Суженый» и месяц для «Вернётся».
export const AGE_POOL = [
  'Скорее всего старше тебя, от 3 до 8 лет. С ним ты впервые чувствуешь себя младшей, о которой заботятся.',
  'Примерно твоего возраста, разница в пару лет. Вы будете на одной волне, как ровесники по духу.',
  'Младше тебя, но зрелее своих лет. Его серьёзность удивит тебя с первой встречи.',
]

export const INITIALS = ['А', 'Д', 'М', 'С', 'Р', 'Н', 'К', 'В', 'И', 'Е', 'Т', 'О']

// Предложный падеж: «встреча вписана в {month}».
export const MONTHS = [
  'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне',
  'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре',
]

export const LETTER_TEMPLATE =
  'Его имя начинается на «{L}». Когда услышишь, внутри ёкнет ещё до того, как поймёшь почему.'
export const MONTH_TEMPLATE =
  'Ваша встреча вписана в {month}. Не подгоняй раньше и не пропусти: он придёт, когда ты перестанешь искать.'
```

**Step 3: Failing test** `pools.test.mjs`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AGE_POOL, INITIALS, MONTHS, LETTER_TEMPLATE, MONTH_TEMPLATE } from './pools.js'

test('пулы заполнены', () => {
  assert.equal(AGE_POOL.length, 3)
  assert.equal(INITIALS.length, 12)
  assert.equal(MONTHS.length, 12)
  assert.ok(LETTER_TEMPLATE.includes('{L}'))
  assert.ok(MONTH_TEMPLATE.includes('{month}'))
})
```

**Step 4: Run.** `docker compose -f docker-compose.dev.yml run --rm -w /app/app/content/horoscope/love frontend node --test`
Ожидаемо: `pass 1`, `fail 0`.

**Step 5: Commit**
```bash
git add frontend/app/content/horoscope/love/
git commit -m "chore(horo-love): scaffold content folder + pools"
```

---

## Task 2: Контент ветки «Суженый»

**Files:**
- Create: `frontend/app/content/horoscope/love/suzheny.js`

Перенести тексты **дословно** из [suzheny-content](docs/plans/2026-07-18-horo-love-suzheny-content.md). Структура:

```js
export const suzheny = {
  hero: {
    eyebrow: 'Твоя любовная карта',
    title: 'Звёзды уже знают, кто станет твоим',
    subtitle: 'Узнай его знак, приметы и когда вы встретитесь. Вплоть до первой буквы его имени',
    cta: 'Узнать, кто он',
    note: '2 минуты, только твоя дата рождения',
  },
  // Квиз: 3 choice-шага (лестница да) + дата + имя. Формат шагов как в content/landings/love.js.
  quiz: [
    { id: 'life', type: 'choice', required: true, question: 'Как у тебя сейчас с личной жизнью?',
      options: [
        { value: 'alone', label: 'Одна и устала ждать' },
        { value: 'notit', label: 'Варианты есть, но не то' },
        { value: 'ended', label: 'Недавно всё закончилось' },
      ] },
    { id: 'belief', type: 'choice', required: true, question: 'Во что ты уже почти перестала верить?',
      options: [
        { value: 'mine', label: 'Что встречу своего' },
        { value: 'nopain', label: 'Что можно без боли' },
        { value: 'chosen', label: 'Что меня выберут' },
      ] },
    { id: 'ready', type: 'choice', required: true,
      question: 'Если звёзды прямо сейчас покажут, кто твой человек, хочешь увидеть?',
      options: [
        { value: 'yes', label: 'Да, очень' },
        { value: 'afraid', label: 'Да, но страшно' },
      ] },
    { id: 'birth_date', type: 'date', required: true, question: 'Твоя дата рождения' },
    { id: 'name', type: 'text', required: true, placeholder: 'Имя', question: 'Как тебя зовут?' },
  ],
  calcLines: ['Определяю твой знак…', 'Читаю твою любовную карту…', 'Ищу того, кто тебе предназначен…'],
  paywall: {
    heading: 'Открой, кто он на самом деле',
    payoffs: [
      'Первая буква его имени и как ты его узнаешь',
      'Месяц вашей встречи и где это случится',
      'Что чуть не помешает вам и как не допустить',
      'Полный портрет твоего человека по звёздам',
    ],
  },
  // Порядок и locked-флаги ревила.
  revealFields: [
    { id: 'destined',     label: 'Его знак',                     locked: false },
    { id: 'ageHint',      label: 'Возраст',                      locked: false },
    { id: 'character',    label: 'Какой он',                     locked: false },
    { id: 'meetHow',      label: 'Как познакомитесь',            locked: false },
    { id: 'firstLetter',  label: 'Первая буква его имени',       locked: true  },
    { id: 'meetMonth',    label: 'Месяц, когда вы встретитесь',  locked: true  },
    { id: 'howRecognize', label: 'Как ты узнаешь его среди других', locked: true },
    { id: 'whatObstacle', label: 'Что чуть не помешает вам',     locked: true  },
  ],
  // Её знак -> его знак (фиксированная пара под написанный текст).
  destinedSign: {
    aries: 'leo', taurus: 'cancer', gemini: 'libra', cancer: 'scorpio',
    leo: 'aquarius', virgo: 'scorpio', libra: 'leo', scorpio: 'cancer',
    sagittarius: 'aquarius', capricorn: 'pisces', aquarius: 'sagittarius', pisces: 'taurus',
  },
  // Досье по ЕЁ знаку. destined = reasoning (называет его знак).
  dossier: {
    virgo: {
      destined: 'Твой человек по звёздам это Скорпион. Вода к твоей Земле: он даёт глубину, которой тебе не хватало, и не боится твоей серьёзности.',
      character: 'Спокойный снаружи, страстный внутри. Немногословный, но если сказал, то сделал. Его ревность даст тебе ощущение, что ты по-настоящему его.',
      meetHow: 'Через общий круг, там, где ты будешь занята делом, а не поиском. Он заметит тебя первым.',
      howRecognize: 'По взгляду, который держится на секунду дольше, чем принято, и по спокойствию рядом, будто вы знакомы годами.',
      whatObstacle: 'Ты будешь искать в нём изъян, чтобы заранее не было больно, и почти найдёшь повод уйти. Не ищи.',
    },
    // TODO: перенести остальные 11 знаков (aries, taurus, gemini, cancer, leo, libra,
    // scorpio, sagittarius, capricorn, aquarius, pisces) дословно из suzheny-content.md.
  },
}
```

**Проверка полноты** делается в Task 5 (общий контент-тест). Здесь только перенос.

**Commit:**
```bash
git add frontend/app/content/horoscope/love/suzheny.js
git commit -m "feat(horo-love): контент ветки Суженый (12 знаков)"
```

---

## Task 3: Контент ветки «Вернётся ли он»

**Files:**
- Create: `frontend/app/content/horoscope/love/return.js`

`return` это зарезервированное слово, экспорт называем `returnBranch`. Квиз завершается
choice-шагом `his_sign` с 12 опциями (value = id знака) это и есть тап-выбор его знака,
новый тип шага НЕ нужен.

```js
export const returnBranch = {
  hero: {
    eyebrow: 'Он всё ещё на твоём сердце',
    title: 'Узнай, что он чувствует к тебе прямо сейчас',
    subtitle: 'И вернётся ли он. По звёздам, честно, даже если ответ непростой',
    cta: 'Узнать правду о нём',
    note: 'Нужны только твоя дата и его знак',
  },
  quiz: [
    { id: 'now', type: 'choice', required: true, question: 'Что у вас сейчас?',
      options: [
        { value: 'split', label: 'Расстались, но я не отпустила' },
        { value: 'silent', label: 'Он отдалился и молчит' },
        { value: 'onoff', label: 'То пишет, то пропадает' },
      ] },
    { id: 'who', type: 'choice', required: true, question: 'Кто сделал шаг к разрыву?',
      options: [
        { value: 'he', label: 'Он' },
        { value: 'me', label: 'Я, сгоряча' },
        { value: 'itself', label: 'Как-то само' },
      ] },
    { id: 'ready', type: 'choice', required: true,
      question: 'Если звёзды покажут, что творится у него в голове, ты готова услышать правду?',
      options: [
        { value: 'yes', label: 'Да' },
        { value: 'afraid', label: 'Боюсь, но да' },
      ] },
    { id: 'birth_date', type: 'date', required: true, question: 'Твоя дата рождения' },
    { id: 'his_sign', type: 'choice', required: true, question: 'Его знак',
      options: [
        { value: 'aries', label: 'Овен' }, { value: 'taurus', label: 'Телец' },
        { value: 'gemini', label: 'Близнецы' }, { value: 'cancer', label: 'Рак' },
        { value: 'leo', label: 'Лев' }, { value: 'virgo', label: 'Дева' },
        { value: 'libra', label: 'Весы' }, { value: 'scorpio', label: 'Скорпион' },
        { value: 'sagittarius', label: 'Стрелец' }, { value: 'capricorn', label: 'Козерог' },
        { value: 'aquarius', label: 'Водолей' }, { value: 'pisces', label: 'Рыбы' },
      ] },
  ],
  calcLines: ['Определяю твой знак…', 'Читаю его по звёздам…', 'Смотрю, что между вами осталось…'],
  paywall: {
    heading: 'Узнай, вернётся ли он',
    payoffs: [
      'Вернётся ли он и при каком условии',
      'В каком месяце ждать от него шага',
      'Что сделать по звёздам, чтобы он вернулся сам',
      'Что он чувствует на самом деле, без иллюзий',
    ],
  },
  revealFields: [
    { id: 'hisState',   label: 'Что он чувствует',                 locked: false },
    { id: 'whyDistant', label: 'Почему отдалился',                 locked: false },
    { id: 'willReturn', label: 'Вернётся ли он',                   locked: true  },
    { id: 'whenReturn', label: 'Когда он сделает шаг',             locked: true  },
    { id: 'whatToDo',   label: 'Что сделать, чтобы он вернулся',   locked: true  },
  ],
  // Досье по ЕГО знаку. whenReturn содержит {month}.
  dossier: {
    scorpio: {
      hisState: 'Он молчит, но ты не выходишь у него из головы. Скорпион не отпускает то, что считал своим.',
      whyDistant: 'Он закрылся резко, из боли или ревности, и наказывает молчанием.',
      willReturn: 'Да, и всерьёз. Скорпион не возвращается наполовину: если придёт, то за тобой по-настоящему. Отпустить тебя ему почти невозможно.',
      whenReturn: 'Он вернётся к {month}, когда поймёт, что не может тебя забыть.',
      whatToDo: 'Держи достоинство и не унижайся, но дай понять, что дверь не заперта. Слабость он не простит, силу уважает.',
    },
    // TODO: перенести остальные 11 знаков дословно из return-content.md.
  },
}
```

**Commit:**
```bash
git add frontend/app/content/horoscope/love/return.js
git commit -m "feat(horo-love): контент ветки Вернётся ли он (12 знаков)"
```

---

## Task 4: Контент ветки «Что блокирует»

**Files:**
- Create: `frontend/app/content/horoscope/love/block.js`

```js
export const block = {
  hero: {
    eyebrow: 'Не в тебе дело, а в сценарии',
    title: 'Узнай, что закрывает тебе любовь',
    subtitle: 'Почему у тебя не складывается и как это снять. По твоей звёздной карте',
    cta: 'Узнать свой блок',
    note: '2 минуты, только твоя дата рождения',
  },
  quiz: [
    { id: 'ending', type: 'choice', required: true, question: 'Как обычно заканчиваются твои истории?',
      options: [
        { value: 'destroy', label: 'Сама разрушаю' },
        { value: 'unavailable', label: 'Выбираю недоступных' },
        { value: 'fade', label: 'Всё сходит на нет' },
      ] },
    { id: 'feel', type: 'choice', required: true, question: 'Что чаще всего чувствуешь в отношениях?',
      options: [
        { value: 'abandon', label: 'Что меня бросят' },
        { value: 'lose', label: 'Что теряю себя' },
        { value: 'notenough', label: 'Что недостаточно хороша' },
      ] },
    { id: 'ready', type: 'choice', required: true,
      question: 'Если у твоего невезения в любви есть причина, ты хочешь её увидеть?',
      options: [
        { value: 'yes', label: 'Да' },
        { value: 'tired', label: 'Да, устала повторять' },
      ] },
    { id: 'birth_date', type: 'date', required: true, question: 'Твоя дата рождения' },
    { id: 'name', type: 'text', required: true, placeholder: 'Имя', question: 'Как тебя зовут?' },
  ],
  calcLines: ['Определяю твой знак…', 'Ищу узор в твоих историях…', 'Нахожу, что закрывает тебе любовь…'],
  paywall: {
    heading: 'Сними то, что закрывает тебе любовь',
    payoffs: [
      'Откуда взялся твой сценарий и чей он на самом деле',
      'Как снять его по звёздам, шаг за шагом',
      'Когда для тебя откроется путь к любви',
      'Что перестать делать уже сейчас',
    ],
  },
  revealFields: [
    { id: 'blockName',    label: 'Твой сценарий',               locked: false },
    { id: 'howItShows',   label: 'Как проявляется',             locked: false },
    { id: 'rootScenario', label: 'Откуда взялся твой блок',     locked: true  },
    { id: 'howToRelease', label: 'Как его снять',               locked: true  },
    { id: 'whenClears',   label: 'Когда откроется путь к любви', locked: true  },
  ],
  // Досье по ЕЁ знаку.
  dossier: {
    virgo: {
      blockName: 'Сценарий «идеал»: ты видишь изъяны и уходишь, не дав чувству вырасти.',
      howItShows: 'Ты замечаешь мелкие «не то» и заранее ставишь крест, чтобы не разочароваться.',
      rootScenario: 'Он от страха ошибиться и потому всё контролировать. Где-то тебе внушили, что любовь надо заслужить безупречностью.',
      howToRelease: 'Разреши человеку быть неидеальным, как и себе. Живое теплее правильного.',
      whenClears: 'Путь откроется, когда ты один раз останешься, несмотря на «изъян». Это ближе, чем ты думаешь.',
    },
    // TODO: перенести остальные 11 знаков дословно из block-content.md.
  },
}
```

**Commit:**
```bash
git add frontend/app/content/horoscope/love/block.js
git commit -m "feat(horo-love): контент ветки Что блокирует (12 знаков)"
```

---

## Task 5: Сборка контента + тест полноты

**Files:**
- Create: `frontend/app/content/horoscope/love/index.js`
- Test: `frontend/app/content/horoscope/love/index.test.mjs`

**Step 1: `index.js`**
```js
import { suzheny } from './suzheny.js'
import { returnBranch } from './return.js'
import { block } from './block.js'

export const BRANCH_IDS = ['suzheny', 'return', 'block']
export const BRANCHES = { suzheny, return: returnBranch, block }

export const FORK = {
  title: 'Что у тебя с любовью прямо сейчас?',
  options: [
    { branch: 'suzheny', label: 'Жду своего человека', sub: 'Хочу узнать, кто он и когда' },
    { branch: 'return',  label: 'Не могу отпустить одного', sub: 'Он на уме, а что у него, непонятно' },
    { branch: 'block',   label: 'Всё время не складывается', sub: 'Хочу понять, что мешает' },
  ],
}
```

**Step 2: Failing test** `index.test.mjs` (гарантирует полноту всех 12 знаков и корректность полей):
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BRANCHES, BRANCH_IDS, FORK } from './index.js'
import { SIGNS } from '../astro.js'

const SIGN_IDS = [...new Set(SIGNS.map(s => s.id))] // 12 уникальных

test('три ветки на месте', () => {
  assert.deepEqual(BRANCH_IDS, ['suzheny', 'return', 'block'])
  for (const id of BRANCH_IDS) assert.ok(BRANCHES[id], `ветка ${id}`)
})

test('в каждой ветке досье на все 12 знаков', () => {
  for (const id of BRANCH_IDS) {
    const d = BRANCHES[id].dossier
    for (const s of SIGN_IDS) assert.ok(d[s], `${id}: нет знака ${s}`)
    // все поля непустые строки под revealFields
    for (const s of SIGN_IDS) {
      for (const f of BRANCHES[id].revealFields) {
        // пуловые поля (ageHint, firstLetter, meetMonth, whenReturn-месяц) генерятся в логике,
        // в досье их может не быть — пропускаем те, что не хранятся в dossier.
      }
    }
  }
})

test('suzheny: destinedSign задан для всех 12 знаков', () => {
  for (const s of SIGN_IDS) assert.ok(BRANCHES.suzheny.destinedSign[s], `нет пары для ${s}`)
})

test('revealFields: у каждой ветки есть и free, и locked', () => {
  for (const id of BRANCH_IDS) {
    const rf = BRANCHES[id].revealFields
    assert.ok(rf.some(f => !f.locked), `${id}: нет free`)
    assert.ok(rf.some(f => f.locked), `${id}: нет locked`)
  }
})

test('fork: три опции с корректными ветками', () => {
  assert.equal(FORK.options.length, 3)
  assert.deepEqual(FORK.options.map(o => o.branch), BRANCH_IDS)
})
```

**Step 3: Run.** `docker compose -f docker-compose.dev.yml run --rm -w /app/app/content/horoscope/love frontend node --test`
Ожидаемо: FAIL, если в каком-то знаке не перенесён текст (test «досье на все 12 знаков»). Дозаполнить Tasks 2-4 до зелёного.

**Step 4:** Довести до `fail 0`.

**Step 5: Commit**
```bash
git add frontend/app/content/horoscope/love/index.js frontend/app/content/horoscope/love/index.test.mjs
git commit -m "feat(horo-love): сборка веток + тест полноты 12 знаков"
```

---

## Task 6: Логика `resolveBranch` (TDD)

**Files:**
- Create: `frontend/app/lp/logic/horoLove.js`
- Test: `frontend/app/lp/logic/horoLove.test.mjs`

**Step 1: Failing test:**
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveBranch } from './horoLove.js'

test('resolveBranch: валидные ветки', () => {
  assert.equal(resolveBranch('suzheny'), 'suzheny')
  assert.equal(resolveBranch('return'), 'return')
  assert.equal(resolveBranch('block'), 'block')
})
test('resolveBranch: мусор -> null', () => {
  assert.equal(resolveBranch('nope'), null)
  assert.equal(resolveBranch(null), null)
  assert.equal(resolveBranch(''), null)
})
```

**Step 2: Run, verify FAIL** (`resolveBranch not defined`).
`docker compose -f docker-compose.dev.yml run --rm -w /app/app/lp/logic frontend node --test horoLove.test.mjs`

**Step 3: Минимальная реализация** (начало `horoLove.js`):
```js
// Чистая детерминированная логика лендинга horo-love. Без React и сети.
import { sign } from '../../content/horoscope/astro.js'
import { BRANCHES, BRANCH_IDS } from '../../content/horoscope/love/index.js'
import { AGE_POOL, INITIALS, MONTHS, LETTER_TEMPLATE, MONTH_TEMPLATE } from '../../content/horoscope/love/pools.js'

export function resolveBranch(v) {
  return BRANCH_IDS.includes(v) ? v : null
}
```

**Step 4: Run, verify PASS.**

**Step 5: Commit**
```bash
git add frontend/app/lp/logic/horoLove.js frontend/app/lp/logic/horoLove.test.mjs
git commit -m "feat(horo-love): resolveBranch"
```

---

## Task 7: Детерминированный генератор (TDD)

**Files:**
- Modify: `frontend/app/lp/logic/horoLove.js`
- Modify: `frontend/app/lp/logic/horoLove.test.mjs`

**Step 1: Failing tests** (детерминизм + правильный ключевой знак + гейтинг):
```js
import { generate, buildReveal } from './horoLove.js'

const SUZH = { branch: 'suzheny', birthDate: '1994-09-10', name: 'Аня' } // Дева

test('generate suzheny: детерминизм', () => {
  const a = generate(SUZH)
  const b = generate(SUZH)
  assert.deepEqual(a, b)
})
test('generate suzheny: free-поля из досье её знака', () => {
  const v = generate(SUZH)
  assert.match(v.destined, /Скорпион/)         // Дева -> Скорпион
  assert.ok(v.character && v.meetHow && v.ageHint)
})
test('generate suzheny: locked-поля собраны из шаблонов', () => {
  const v = generate(SUZH)
  assert.ok(/«.»/.test(v.firstLetter))          // буква подставлена
  assert.ok(!v.meetMonth.includes('{month}'))   // месяц подставлен
})
test('generate return: ключ это выбранный his_sign', () => {
  const v = generate({ branch: 'return', birthDate: '1994-09-10', hisSign: 'scorpio' })
  assert.match(v.willReturn, /Скорпион|всерьёз/)
  assert.ok(!v.whenReturn.includes('{month}'))
})
test('buildReveal: возвращает поля с value и locked', () => {
  const v = generate(SUZH)
  const fields = buildReveal('suzheny', v)
  assert.equal(fields.length, 8)
  assert.ok(fields.every(f => 'value' in f && 'locked' in f))
  assert.ok(fields.filter(f => f.locked).length === 4)
})
```

**Step 2: Run, verify FAIL.**

**Step 3: Реализация** (дополнить `horoLove.js`):
```js
// 32-битный хеш + mulberry32 (детерминизм). Локально, чтобы не тянуть tarot-модуль.
export function seed(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^= h >>> 16) >>> 0
}
function prng(a) {
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// values по ветке. Порядок pick() фиксирован -> результат стабилен.
export function generate({ branch, birthDate, name = '', hisSign = null }) {
  const rand = prng(seed(`${name}|${birthDate}|${branch}`))
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const her = sign(birthDate)

  if (branch === 'suzheny') {
    const d = BRANCHES.suzheny.dossier[her.id]
    const month = pick(MONTHS)
    const letter = pick(INITIALS)
    const ageHint = pick(AGE_POOL)
    return {
      destined: d.destined,
      ageHint,
      character: d.character,
      meetHow: d.meetHow,
      firstLetter: LETTER_TEMPLATE.replace('{L}', letter),
      meetMonth: MONTH_TEMPLATE.replace('{month}', month),
      howRecognize: d.howRecognize,
      whatObstacle: d.whatObstacle,
    }
  }

  if (branch === 'return') {
    const d = BRANCHES.return.dossier[hisSign]
    const month = pick(MONTHS)
    return {
      hisState: d.hisState,
      whyDistant: d.whyDistant,
      willReturn: d.willReturn,
      whenReturn: d.whenReturn.replace('{month}', month),
      whatToDo: d.whatToDo,
    }
  }

  // block
  const d = BRANCHES.block.dossier[her.id]
  return {
    blockName: d.blockName,
    howItShows: d.howItShows,
    rootScenario: d.rootScenario,
    howToRelease: d.howToRelease,
    whenClears: d.whenClears,
  }
}

export function buildReveal(branch, values) {
  return BRANCHES[branch].revealFields.map((f) => ({ ...f, value: values[f.id] }))
}
```

**Step 4: Run, verify PASS** (`fail 0`).

**Step 5: Commit**
```bash
git add frontend/app/lp/logic/horoLove.js frontend/app/lp/logic/horoLove.test.mjs
git commit -m "feat(horo-love): детерминированный генератор + buildReveal"
```

---

## Task 8: Конфиг лендинга + регистрация в реестре

**Files:**
- Create: `frontend/app/content/landings/horo-love.js`
- Modify: `frontend/app/content/landings/index.js`
- Modify: `frontend/app/content/landings/index.test.mjs`

**Step 1: `horo-love.js`**
```js
// Конфиг лендинга horo-love. engine=horo-love переключает клиента в page.jsx.
import { BRANCHES, BRANCH_IDS, FORK } from '../horoscope/love/index.js'

export const horoLoveLanding = {
  slug: 'horo-love',
  product: 'horoscope',
  engine: 'horo-love',
  meta: {
    title: 'Кто станет твоим: узнай по дате рождения',
    description: 'Звёзды уже знают, кто тебе подходит, вернётся ли он и что закрывает тебе любовь. Узнай по дате рождения.',
  },
  fork: FORK,
  branchIds: BRANCH_IDS,
  branches: BRANCHES,
}
```

**Step 2: Зарегистрировать в `index.js`:**
```js
import { horoLoveLanding } from './horo-love.js'
// ...
export const LANDINGS = { love: loveLanding, him: himLanding, 'taro-him': taroHimLanding, 'taro-terminal': taroTerminalLanding, 'horo-love': horoLoveLanding }
```

**Step 3: Failing test** (добавить в `index.test.mjs`):
```js
test('getLanding отдаёт конфиг horo-love на движке horo-love', () => {
  const l = getLanding('horo-love')
  assert.equal(l.slug, 'horo-love')
  assert.equal(l.engine, 'horo-love')
  assert.equal(l.product, 'horoscope')
  assert.equal(l.branchIds.length, 3)
  assert.ok(l.fork.options.length === 3)
})
```

**Step 4: Run.** `docker compose -f docker-compose.dev.yml run --rm -w /app/app/content/landings frontend node --test`
Ожидаемо: `fail 0`.

**Step 5: Commit**
```bash
git add frontend/app/content/landings/horo-love.js frontend/app/content/landings/index.js frontend/app/content/landings/index.test.mjs
git commit -m "feat(horo-love): конфиг лендинга + регистрация в реестре"
```

---

## Task 9: Компонент развилки `Fork` (структурный)

**Files:**
- Create: `frontend/app/lp/components/Fork.jsx`

Минимальный функциональный компонент. Визуал позже в Claude Design.
```jsx
'use client'
import styles from '../lp.module.css'

// Экран-развилка: выбор состояния -> onSelect(branch).
export default function Fork({ fork, onSelect }) {
  return (
    <section className={styles.funnel}>
      <div className={styles.quizBody}>
        <h2 className={`${styles.h2} ${styles.quizQuestion}`}>{fork.title}</h2>
        <div className={styles.options}>
          {fork.options.map((o, i) => (
            <button key={o.branch}
              className={styles.option}
              style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              onClick={() => onSelect(o.branch)}>
              <strong>{o.label}</strong>
              <span className={styles.micro}> {o.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
```

**Commit:**
```bash
git add frontend/app/lp/components/Fork.jsx
git commit -m "feat(horo-love): компонент развилки Fork (структурный)"
```

---

## Task 10: Компонент ревила `Reveal` (структурный)

**Files:**
- Create: `frontend/app/lp/components/Reveal.jsx`

Показывает free-поля текстом, locked как ярлык-замок. При `unlocked` (фаза full)
раскрывает всё и не показывает пейвол. Пейвол переиспользуем как есть.
```jsx
'use client'
import styles from '../lp.module.css'
import Paywall from './Paywall'

// fields: [{ id, label, value, locked }]. unlocked=true -> раскрыть всё, без пейвола.
export default function Reveal({ slug, fields, paywall, unlocked }) {
  return (
    <section className={styles.funnel}>
      <div className={styles.quizBody}>
        {fields.map((f) => {
          const show = unlocked || !f.locked
          return (
            <div key={f.id} className={styles.revealRow}>
              <div className={styles.eyebrow}>{f.label}</div>
              {show
                ? <p className={styles.lead}>{f.value}</p>
                : <p className={`${styles.lead} ${styles.locked}`}>🔒</p>}
            </div>
          )
        })}
      </div>
      {!unlocked && <Paywall slug={slug} heading={paywall.heading} payoffs={paywall.payoffs} />}
    </section>
  )
}
```

> Классы `revealRow` / `locked` можно не заводить сейчас, если их нет в `lp.module.css`:
> компонент отрисуется без стилей, это ок (визуал в Claude Design). Не блокируемся на CSS.

**Commit:**
```bash
git add frontend/app/lp/components/Reveal.jsx
git commit -m "feat(horo-love): компонент ревила Reveal (структурный)"
```

---

## Task 11: Клиент `HoroLoveClient` (фазовая машина)

**Files:**
- Create: `frontend/app/lp/[slug]/HoroLoveClient.jsx`

Фазы: `fork -> hero -> quiz -> calculating -> reveal`, плюс `full` для подписанной на
возврате. Диплинк `?v=` минует развилку, стартуя с hero нужной ветки.
```jsx
'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { loadQuiz, saveQuiz } from '../logic/quizStorage.js'
import { resolveBranch, generate, buildReveal } from '../logic/horoLove.js'
import Hero from '../components/Hero'
import Quiz from '../components/Quiz'
import Calculating from '../components/Calculating'
import Fork from '../components/Fork'
import Reveal from '../components/Reveal'

export default function HoroLoveClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const searchParams = useSearchParams()
  const isSubscribed = user?.subscribed ?? false

  const deepLink = resolveBranch(searchParams.get('v'))
  const [branch, setBranch] = useState(deepLink)
  const [phase, setPhase] = useState(deepLink ? 'hero' : 'fork')
  const [answers, setAnswers] = useState(null)
  const [values, setValues] = useState(null)

  useEffect(() => {
    track('lp_view', { slug: landing.slug })
    if (deepLink) track('deeplink_enter', { slug: landing.slug, branch: deepLink })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат после оплаты: подписана + сохранённый квиз -> полный ревил.
  useEffect(() => {
    if (!isSubscribed) return
    const s = loadQuiz(landing.slug)
    if (s?.branch && s.birth_date) {
      setBranch(s.branch)
      setAnswers(s)
      setValues(generate({ branch: s.branch, birthDate: s.birth_date, name: s.name, hisSign: s.his_sign }))
      setPhase('full')
    }
  }, [isSubscribed, landing.slug])

  const b = branch ? landing.branches[branch] : null

  const selectBranch = (br) => {
    track('fork_select', { slug: landing.slug, branch: br })
    setBranch(br)
    setPhase('hero')
  }
  const onStart = () => { track('quiz_start', { slug: landing.slug, branch }); setPhase('quiz') }

  const onComplete = (a) => {
    track('quiz_complete', { slug: landing.slug, branch })
    saveQuiz(landing.slug, { branch, ...a })
    setAnswers(a)
    setPhase('calculating')
  }

  const onCalculated = () => {
    setValues(generate({ branch, birthDate: answers.birth_date, name: answers.name, hisSign: answers.his_sign }))
    track('reveal_view', { slug: landing.slug, branch })
    if (!isSubscribed) track('paywall_view', { slug: landing.slug, branch })
    setPhase('reveal')
  }

  if (phase === 'fork') return <Fork fork={landing.fork} onSelect={selectBranch} />
  if (phase === 'hero') return <Hero hero={b.hero} onStart={onStart} variant="cosmic" />
  if (phase === 'quiz')
    return <Quiz steps={b.quiz} onComplete={onComplete} onBack={() => setPhase(deepLink ? 'hero' : 'fork')} variant="cosmic" />
  if (phase === 'calculating')
    return <Calculating onDone={onCalculated} title={b.calcLines[0]} lines={b.calcLines} variant="cosmic" />

  const fields = buildReveal(branch, values)
  return (
    <Reveal slug={landing.slug} fields={fields} paywall={b.paywall} unlocked={phase === 'full'} />
  )
}
```

> Проверить сигнатуру `Calculating` (props `onDone`, `title`, `lines`, `variant`) по
> [Calculating.jsx](frontend/app/lp/components/Calculating.jsx) и поправить при расхождении.

**Commit:**
```bash
git add frontend/app/lp/[slug]/HoroLoveClient.jsx
git commit -m "feat(horo-love): клиент фазовой машины"
```

---

## Task 12: Роут движка в `page.jsx`

**Files:**
- Modify: `frontend/app/lp/[slug]/page.jsx`

**Step 1:** Добавить импорт и ветку движка:
```jsx
import HoroLoveClient from './HoroLoveClient'
// ...
const Client =
  landing.engine === 'compat-jealous' ? CompatClient :
  landing.engine === 'live-reveal' ? RevealClient :
  landing.engine === 'terminal' ? TerminalClient :
  landing.engine === 'horo-love' ? HoroLoveClient :
  LandingClient
```

**Step 2: Commit**
```bash
git add frontend/app/lp/[slug]/page.jsx
git commit -m "feat(horo-love): роут движка horo-love в page.jsx"
```

---

## Task 13: Финальная проверка

**Step 1: Все юнит-тесты зелёные.**
```bash
docker compose -f docker-compose.dev.yml run --rm -w /app/app/content/horoscope/love frontend node --test
docker compose -f docker-compose.dev.yml run --rm -w /app/app/lp/logic frontend node --test horoLove.test.mjs
docker compose -f docker-compose.dev.yml run --rm -w /app/app/content/landings frontend node --test
```
Ожидаемо: во всех `fail 0`.

**Step 2: Прод-сборка** (проверяет импорты/клиент; NODE_ENV не трогать в dev-режим, см.
[build-verification-esoteric](../../memory)):
```bash
docker compose -f docker-compose.dev.yml run --rm frontend npm run build
```
Ожидаемо: `Compiled successfully`, страница `/lp/[slug]` в списке маршрутов, без ошибок.

**Step 3: Ручная проверка (браузер).** Поднять dev (`docker compose -f docker-compose.dev.yml up -d`) и пройти:
- `/lp/horo-love` показывает развилку из 3 состояний.
- Выбор состояния -> hero -> квиз -> «расчёт» -> ревил (free видно, locked под замком) -> пейвол ведёт на `/register`.
- Ветка `return`: последний шаг это выбор его знака; ревил соответствует выбранному знаку.
- Диплинк `/lp/horo-love?v=block` минует развилку, сразу hero ветки «блок».
- Повторный заход с тем же вводом даёт тот же результат (детерминизм).

**Step 4: Commit (если были правки по ходу проверки).**

---

## Порядок и зависимости

Tasks 1-5 (контент) -> Tasks 6-7 (логика, зависит от контента) -> Task 8 (конфиг) ->
Tasks 9-11 (UI-компоненты и клиент) -> Task 12 (роут) -> Task 13 (проверка).

Визуальная доводка (вёрстка/стили `Fork`, `Reveal`, hero/квиз/ревил) вне этого плана,
её делает пользователь в Claude Design.
