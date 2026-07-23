# Лендинг «Скрытый дар» (`/lp/dar`) — план реализации

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Собрать рабочий каркас лендинга «Скрытый дар» на движке матрицы (вариант A: 22 уникальных дара по аркану `purposes.personal.adult`), с открытыми/залоченными блоками и концовкой → регистрация. Полный копи-пак (22 аркана) наполняется в отдельном чате; здесь — только каркас + Аркан 1 эталоном.

**Architecture:** Повторяем паттерн лендинга `rod`. Чистая детерминированная логика в `content/landings/dar-copy.js` (без React/сети) покрыта тестами `node:test`. Конфиг `dar.js` регистрируется в реестре, React-клиент `DarClient.jsx` (форк `RodClient.jsx`) выбирается в `page.jsx` по `engine === 'dar'`. Визуал (`dar.module.css`) — за Кириллом; на старте сидируем копией `rod.module.css`, чтобы рендер работал.

**Tech Stack:** Next.js 14 (App Router), React 18, тесты — встроенный `node:test` (запуск `node --test <файл>` из каталога `frontend/`). Сборка — только в Docker (`next build`), в план не входит.

**Дизайн-док:** `docs/plans/2026-07-23-dar-landing-design.md`

---

## Ключевые факты кодовой базы (прочитай перед стартом)

- **Движок матрицы:** `frontend/app/content/matrix.js`. `calculateMatrix(birthDate)` возвращает `{ nodes, chakras, purposes, age, birthDate }`. Все числа сведены к 1..22 функцией `reduce`.
- **Точка чтения дара:** `purposes.personal.adult = reduce(top_left + bot_right)` — уже вычисляется, диапазон 1..22.
- **Стейт-машина квиза:** `frontend/app/lp/logic/quizMachine.js` (`initQuiz/currentStep/setAnswer/advance/back/isComplete`). Клиент её импортирует, менять не нужно.
- **Эталон паттерна:** `frontend/app/content/landings/rod.js` (конфиг), `rod-copy.js` (логика), `frontend/app/lp/[slug]/RodClient.jsx` (клиент). Копируем и адаптируем.
- **Реестр и роутинг:** `frontend/app/content/landings/index.js` (объект `LANDINGS`), `frontend/app/lp/[slug]/page.jsx` (выбор клиента по `landing.engine`).
- **Соглашения по копирайту** (из памяти проекта): голос женский, на «ты», без длинного тире «—». Тесты это проверяют.
- **Соглашение по ключам ответов:** шаг даты обязан иметь `id: 'birth_date'`, шаг имени — `id: 'name'` (клиент читает `answers.birth_date`, `answers.name`).
- **Запуск тестов:** из каталога `frontend/`: `node --test app/content/landings/<файл>.test.mjs`. Скрипта `npm test` нет — вызываем `node --test` напрямую.

---

## Task 1: Копи-модуль `dar-copy.js` (чистая логика + Аркан 1 эталоном)

**Files:**
- Create: `frontend/app/content/landings/dar-copy.js`
- Test: `frontend/app/content/landings/dar-copy.test.mjs`

**Step 1: Написать падающий тест**

Создать `frontend/app/content/landings/dar-copy.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  revealFields, DAR_PACK, buildReveal, arcanaFromMatrix,
} from './dar-copy.js'
import { calculateMatrix } from '../matrix.js'

const BLOCK_IDS = ['gift', 'whyAsleep', 'realization', 'mission', 'firstStep']

test('revealFields: 5 блоков, 2 открытых, 3 залоченных, правильные id/порядок', () => {
  assert.deepEqual(revealFields.map(f => f.id), BLOCK_IDS)
  assert.deepEqual(revealFields.filter(f => !f.locked).map(f => f.id), ['gift', 'whyAsleep'])
  assert.deepEqual(revealFields.filter(f => f.locked).map(f => f.id),
    ['realization', 'mission', 'firstStep'])
})

test('DAR_PACK: Аркан 1 заполнен всеми блоками, без длинного тире', () => {
  const d = DAR_PACK[1]
  assert.ok(d, 'нет аркана 1')
  for (const key of BLOCK_IDS) {
    assert.equal(typeof d[key], 'string')
    assert.ok(d[key].length > 0, `1.${key} пустой`)
    assert.ok(!d[key].includes('—'), `1.${key} содержит длинное тире`)
  }
})

test('arcanaFromMatrix: 1..22 из точки личного предназначения', () => {
  const m = calculateMatrix('1990-01-01')
  const a = arcanaFromMatrix(m)
  assert.equal(a, m.purposes.personal.adult)
  assert.ok(Number.isInteger(a) && a >= 1 && a <= 22, `аркан вне диапазона: ${a}`)
})

test('buildReveal: 5 полей с label/locked/value для заполненного аркана', () => {
  const fields = buildReveal(1, { name: 'Аня' })
  assert.equal(fields.length, 5)
  assert.deepEqual(fields.map(f => f.id), BLOCK_IDS)
  for (const f of fields) {
    assert.equal(typeof f.label, 'string')
    assert.equal(typeof f.locked, 'boolean')
    assert.equal(typeof f.value, 'string')
    assert.ok(f.value.length > 0)
  }
})

test('buildReveal: токен {name} подставлен, литерал не остаётся', () => {
  const fields = buildReveal(1, { name: 'Аня' })
  for (const f of fields) assert.ok(!f.value.includes('{name}'), `${f.id}: остался {name}`)
})

test('buildReveal: фолбэк на Аркан 1, пока пак не полон', () => {
  // Аркан без прозы должен не падать, а отдавать эталон.
  const fields = buildReveal(999, { name: 'Аня' })
  assert.equal(fields.length, 5)
  assert.deepEqual(fields.map(f => f.value), buildReveal(1, { name: 'Аня' }).map(f => f.value))
})

test('детерминизм: одинаковый вход -> одинаковый выход', () => {
  assert.deepEqual(buildReveal(1, { name: 'Аня' }), buildReveal(1, { name: 'Аня' }))
})
```

**Step 2: Запустить тест, убедиться что падает**

Run: `cd frontend && node --test app/content/landings/dar-copy.test.mjs`
Expected: FAIL — `Cannot find module './dar-copy.js'`.

**Step 3: Написать минимальную реализацию**

Создать `frontend/app/content/landings/dar-copy.js`:

```js
// Тексты и детерминированная логика лендинга «Скрытый дар». Без React и сети.
// Продукт — Матрица судьбы. Точка чтения — личное предназначение
// (purposes.personal.adult, аркан 1..22). Голос женский, на «ты», без длинного тире.
// Полный пак DAR_PACK (22 аркана) наполняется отдельным копи-брифом; здесь Аркан 1 эталоном.

// Порядок и замки блоков результата.
export const revealFields = [
  { id: 'gift',        label: 'В чём твой дар',                         locked: false },
  { id: 'whyAsleep',   label: 'Почему ты им до сих пор не пользуешься', locked: false },
  { id: 'realization', label: 'Где твой дар оживает: дело и достаток',  locked: true  },
  { id: 'mission',     label: 'Зачем этот дар дан именно тебе',         locked: true  },
  { id: 'firstStep',   label: 'Первый шаг, чтобы включить его',         locked: true  },
]

// Пак по арканам 1..22. Каждый аркан -> 5 блоков. Токен {name} = имя из квиза.
// TODO(копи-чат): заполнить арканы 2..22. Сейчас только Аркан 1 «Маг» эталоном.
export const DAR_PACK = {
  1: {
    gift:        'Твой дар в том, чтобы словом и волей превращать замысел в дело. Там, где другие годами собираются с духом, ты можешь просто взять и начать: сказать, повести, сдвинуть. Люди рядом невольно слушают и идут за тобой, даже когда ты сама этого не замечаешь. В тебе с рождения записана сила первого шага, та, что двигает не только тебя.',
    whyAsleep:   'Ты почти не включаешь эту силу, потому что тебя приучили быть удобной и не высовываться. Свою яркость ты привыкла приглушать, чтобы не показаться слишком громкой и слишком заметной. Поэтому дар лежит внутри как сжатая пружина: ты чувствуешь, что способна на большее, но раз за разом делаешь себя тише, чем ты есть.',
    realization: 'Твоя сила оживает там, где ты ведёшь и создаёшь своё, а не обслуживаешь чужое. Это дело, где твоё слово решает. Пока ты на вторых ролях, поток проходит мимо, и деньги идут не к тебе. Матрица показывает, в какой именно сфере твой дар начинает кормить.',
    mission:     'Он дан тебе не просто так. Твоя задача в том, чтобы своим примером разрешать другим начинать: рядом с тобой люди впервые решаются на то, чего боялись. Ты здесь, чтобы зажигать, и пока ты прячешь себя, этот свет не доходит до тех, кому он предназначен.',
    firstStep:   'Тебе нужен один шаг, которого ты избегаешь дольше всего: заявить о себе вслух и взять ответственность там, где ты давно могла. Матрица показывает, какой именно это шаг и до какого года открыто твоё окно роста.',
  },
}

// Аркан личного предназначения из результата матрицы (1..22).
export function arcanaFromMatrix(matrix) {
  return matrix.purposes.personal.adult
}

function fill(tpl, map) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (k in map ? String(map[k]) : `{${k}}`))
}

// Резолвер: аркан задаёт прозу, answers.name подставляется в токены.
// Фолбэк на Аркан 1, пока пак не наполнен полностью.
export function buildReveal(arcana, answers) {
  const d = DAR_PACK[arcana] || DAR_PACK[1]
  const tokens = { name: (answers?.name || '').trim() || 'ты' }
  return revealFields.map((f) => ({ ...f, value: fill(d[f.id], tokens) }))
}
```

**Step 4: Запустить тест, убедиться что проходит**

Run: `cd frontend && node --test app/content/landings/dar-copy.test.mjs`
Expected: PASS — все тесты зелёные.

**Step 5: Коммит**

```bash
git add frontend/app/content/landings/dar-copy.js frontend/app/content/landings/dar-copy.test.mjs
git commit -m "feat(dar): копи-модуль dar-copy + Аркан 1 эталоном"
```

---

## Task 2: Конфиг лендинга `dar.js` + регистрация в реестре

**Files:**
- Create: `frontend/app/content/landings/dar.js`
- Modify: `frontend/app/content/landings/index.js` (импорт + запись в `LANDINGS`)
- Test: `frontend/app/content/landings/index.test.mjs` (добавить кейс)

**Step 1: Написать падающий тест**

Добавить в конец `frontend/app/content/landings/index.test.mjs`:

```js
test('getLanding отдаёт конфиг dar на движке dar', () => {
  const l = getLanding('dar')
  assert.equal(l.slug, 'dar')
  assert.equal(l.engine, 'dar')
  assert.equal(l.product, 'matrix')
  const ids = l.quiz.steps.map(s => s.id)
  assert.equal(ids.at(-2), 'birth_date')
  assert.equal(ids.at(-1), 'name')
  assert.equal(l.revealFields.length, 5)
})
```

**Step 2: Запустить тест, убедиться что падает**

Run: `cd frontend && node --test app/content/landings/index.test.mjs`
Expected: FAIL — `getLanding('dar')` возвращает `null`, падение на `l.slug`.

**Step 3: Реализовать конфиг и регистрацию**

Создать `frontend/app/content/landings/dar.js` (проза-каркас в женском голосе, без длинного тире; финальные формулировки квиза допускается уточнить в копи-чате):

```js
// Конфиг лендинга «Скрытый дар». engine=dar переключает DarClient в page.jsx.
// Продукт — Матрица судьбы (calculateMatrix), точка чтения — личное предназначение.
import { revealFields } from './dar-copy.js'

export const darLanding = {
  slug: 'dar',
  product: 'matrix',
  engine: 'dar',
  theme: 'gift',
  meta: {
    title: 'Скрытый дар по дате рождения: в чём твоя настоящая сила',
    description: 'Пройди короткий тест и узнай по матрице, какой дар заложен в тебе от рождения, почему он до сих пор спит и где он начинает приносить отдачу.',
  },
  brand: 'Скрытый дар',
  hero: {
    eyebrow: 'Матрица судьбы по дате рождения',
    title: 'В тебе есть сила, которую ты так и не включила.',
    titleAccent: 'ты так и не включила',
    subtitle: '2 минуты и только дата рождения. Матрица покажет, какой дар заложен в тебе от рождения и почему он до сих пор молчит.',
    cta: 'Узнать свой скрытый дар',
    note: 'Даже если сейчас в это не верится.',
    trust: ['Анонимно', 'Без регистрации', '2 минуты'],
  },
  landing: {
    howItWorks: {
      eyebrow: 'Как это работает',
      title: 'Три шага до твоего дара',
      steps: [
        { n: 1, title: 'Вводишь дату рождения', text: 'Больше ничего не нужно, ни анкет, ни лишних вопросов.' },
        { n: 2, title: 'Считаем точку предназначения', text: 'Разбираем узел матрицы, где записан твой личный дар.' },
        { n: 3, title: 'Получаешь разбор', text: 'В чём твой дар, почему он спит и где он оживает.' },
      ],
    },
    whatShows: {
      title: 'Что покажет матрица',
      bullets: [
        'Какой дар заложен в тебе от рождения',
        'Почему ты им до сих пор не пользуешься',
        'Где он начинает приносить отдачу',
        'Зачем этот дар дан именно тебе',
      ],
      quote: {
        text: '«Я всю жизнь считала это ерундой, а оказалось, это и есть моя сила.»',
        author: 'Ольга, 31 · прошла разбор',
      },
    },
    finalCta: {
      title: 'Готова увидеть свой дар?',
      cta: 'Узнать свой скрытый дар',
      note: '2 минуты · только дата рождения · анонимно',
      disclaimer: 'Матрица судьбы — инструмент саморефлексии, а не медицинская или психологическая услуга.',
    },
  },
  quiz: {
    steps: [
      { id: 'more', type: 'choice', required: true,
        question: 'Часто чувствуешь, что способна на большее, чем живёшь сейчас?',
        options: [
          { value: 'always', label: 'Да, почти всё время' },
          { value: 'often',  label: 'Часто ловлю это ощущение' },
          { value: 'rare',   label: 'Иногда, вспышками' },
          { value: 'no',     label: 'Нет, меня всё устраивает' },
        ] },
      { id: 'toomuch', type: 'choice', required: true,
        question: 'Тебе в жизни говорили, что ты «слишком»?',
        options: [
          { value: 'bright',    label: 'Слишком яркая, много о себе' },
          { value: 'sensitive', label: 'Слишком чувствительная' },
          { value: 'smart',     label: 'Слишком умная, лезешь не туда' },
          { value: 'none',      label: 'Нет, скорее наоборот' },
        ] },
      { id: 'dim', type: 'choice', required: true,
        question: 'Где ты сильнее всего гасишь себя?',
        options: [
          { value: 'work',   label: 'В работе, где я на вторых ролях' },
          { value: 'people', label: 'Рядом с людьми, чтобы не выделяться' },
          { value: 'family', label: 'В семье, ради других' },
          { value: 'self',   label: 'Сама, из-за сомнений' },
        ] },
      { id: 'block', type: 'choice', required: true,
        question: 'Что чаще всего мешает тебе раскрыться?',
        options: [
          { value: 'fear',   label: 'Страх, что не получится' },
          { value: 'time',   label: 'Нет времени и сил' },
          { value: 'doubt',  label: 'Не понимаю, в чём вообще моё' },
          { value: 'guilt',  label: 'Кажется, что это эгоизм' },
        ] },
      { id: 'want', type: 'choice', required: true,
        question: 'Если в твоей матрице записано, в чём твой настоящий дар, хочешь узнать?',
        options: [
          { value: 'yes',   label: 'Да, конечно' },
          { value: 'badly', label: 'Очень хочу' },
          { value: 'doubt', label: 'Да, но не верю, что это реально' },
        ] },
      { id: 'birth_date', type: 'date', required: true,
        question: 'Теперь дата рождения, чтобы построить твою матрицу' },
      { id: 'name', type: 'text', required: true, placeholder: 'Имя',
        question: 'Как тебя зовут?' },
    ],
  },
  calculating: {
    title: 'Читаю твою точку предназначения…',
    lines: [
      'Свожу числа твоей даты…',
      'Ищу узел, где записан твой дар…',
      'Смотрю, что глушит его сейчас…',
    ],
    steps: [
      { title: 'Собираю числа твоей даты…', sub: 'Секунду, считаю ядро матрицы' },
      { title: 'Ищу узел твоего предназначения…', sub: '{name}, дар почти виден…' },
      { title: 'Смотрю, что глушит его сейчас…', sub: 'Ещё пара секунд' },
      { title: 'Готовлю разбор твоего дара…', sub: '{name}, почти всё' },
    ],
  },
  result: {
    kicker: 'ТВОЙ СКРЫТЫЙ ДАР',
    captionWithName: '{name}, твоя точка предназначения',
    caption: 'Твоя точка предназначения',
    chipLabel: 'точка дара',
    unlockCta: 'Узнать',
    readingEyebrow: 'Разбор для {name}',
    readingTitle: 'Какой дар заложен в тебе',
  },
  revealFields,
}
```

Изменить `frontend/app/content/landings/index.js`:

```js
import { darLanding } from './dar.js'
```
и добавить `dar: darLanding` в объект `LANDINGS`.

**Step 4: Запустить тест, убедиться что проходит**

Run: `cd frontend && node --test app/content/landings/index.test.mjs`
Expected: PASS.

Дополнительно (регрессия логики): `cd frontend && node --test app/content/landings/dar-copy.test.mjs` — PASS.

**Step 5: Коммит**

```bash
git add frontend/app/content/landings/dar.js frontend/app/content/landings/index.js frontend/app/content/landings/index.test.mjs
git commit -m "feat(dar): конфиг лендинга dar + регистрация в реестре"
```

---

## Task 3: Клиент `DarClient.jsx` (форк RodClient) + роутинг + сид CSS

React-клиент юнит-тестами не покрываем (нет тест-раннера для JSX в репозитории). Задача механическая: форкаем `RodClient.jsx` и точечно меняем источник числа и копи-модуль. Визуал сидируем копией `rod.module.css`, чтобы страница рендерилась; финальный стиль сделает Кирилл.

**Files:**
- Create: `frontend/app/lp/[slug]/DarClient.jsx` (форк `RodClient.jsx`)
- Create: `frontend/app/lp/dar.module.css` (сид: копия `rod.module.css`)
- Modify: `frontend/app/lp/[slug]/page.jsx` (импорт + ветка `engine === 'dar'`)

**Step 1: Сидировать CSS-модуль**

Скопировать содержимое `frontend/app/lp/rod.module.css` в новый `frontend/app/lp/dar.module.css` без изменений (Кирилл переоформит позже).

```bash
cp frontend/app/lp/rod.module.css frontend/app/lp/dar.module.css
```

**Step 2: Создать `DarClient.jsx` как форк `RodClient.jsx`**

Скопировать `frontend/app/lp/[slug]/RodClient.jsx` в `frontend/app/lp/[slug]/DarClient.jsx`, затем применить ровно эти правки:

1. Имя компонента и импорты:
   - `export default function RodClient` → `export default function DarClient`
   - `import { buildReveal } from '../../content/landings/rod-copy.js'`
     → `import { buildReveal, arcanaFromMatrix } from '../../content/landings/dar-copy.js'`
   - `import styles from '../rod.module.css'` → `import styles from '../dar.module.css'`
   - `RodOctagram` оставить как есть (переиспользуем фигуру матрицы; принимает `nodes`).

2. Возврат после оплаты (проверка сохранённого квиза). Заменить завязку на `s.mirror`:
   ```js
   // было: if (s?.mirror && s.birth_date) {
   if (s?.birth_date) {
   ```

3. `finishQuiz`: убрать `flavor` из трекинга (в варианте A его нет):
   ```js
   // было: track('quiz_complete', { slug, flavor: a.mirror })
   track('quiz_complete', { slug })
   ```

4. Кнопка последнего шага (имя). В JSX ветки `step.type === 'text'`:
   `Построить матрицу рода` → `Узнать свой дар`.

5. Блок результата (`phase === 'result'`). Заменить получение числа и полей:
   ```js
   // было:
   //   const matrix = calculateMatrix(answers.birth_date)
   //   const female2 = matrix.nodes.female2
   //   const flavor = answers.mirror
   //   const realName = (answers.name || '').trim()
   //   const fields = buildReveal(flavor, female2)
   // стало:
   const matrix = calculateMatrix(answers.birth_date)
   const realName = (answers.name || '').trim()
   const fields = buildReveal(arcanaFromMatrix(matrix), answers)
   ```
   Строку `<RodOctagram nodes={matrix.nodes} />` оставить без изменений.

Остальной файл (фазы hero/quiz/loading, оракул, сегменты, рендер открытых/залоченных блоков, `onUnlock` → `/register`|`/lk`, `post_checkout_return`) не трогаем — он уже реализует нужную концовку и трекинг.

**Step 3: Подключить клиент в роутинге**

Изменить `frontend/app/lp/[slug]/page.jsx`:
- добавить импорт: `import DarClient from './DarClient'`
- в цепочку выбора клиента добавить ветку перед `RodClient`:
  ```js
  landing.engine === 'dar' ? DarClient :
  landing.engine === 'rod' ? RodClient :
  ```

**Step 4: Проверка (без сборки)**

Полноценный `next build` — только в Docker и в план не входит. Лёгкая проверка, что модули логики и конфиг импортируются и связаны без ошибок, выполняется тестами из Task 1–2 (они уже гоняют `dar-copy.js`, `dar.js`, `index.js` через реальные импорты).

Прогнать оба набора и убедиться в зелёном:
Run: `cd frontend && node --test app/content/landings/dar-copy.test.mjs app/content/landings/index.test.mjs`
Expected: PASS.

Визуальную проверку страницы `/lp/dar` (рендер, квиз, reveal, переход на `/register`) выполняет Кирилл при оформлении `dar.module.css` в Docker-окружении.

**Step 5: Коммит**

```bash
git add frontend/app/lp/[slug]/DarClient.jsx frontend/app/lp/dar.module.css frontend/app/lp/[slug]/page.jsx
git commit -m "feat(dar): клиент DarClient + ветка движка dar в роуте /lp/[slug]"
```

---

## Итог и передача

После Task 3 лендинг `/lp/dar` рабочий на каркасе: Аркан 1 показывает реальную прозу, арканы 2..22 отдают фолбэк (Аркан 1), пока не наполнены. Дальше:

1. **Копи-чат** — отдельная сессия наполняет `DAR_PACK[2..22]` по копи-брифу (22 аркана × 5 блоков, женский голос, без длинного тире). Тест `dar-copy.test.mjs` расширить проверкой полноты пака (все 22 ключа заполнены), когда пак готов.
2. **Визуал** — Кирилл оформляет `frontend/app/lp/dar.module.css` (тема «дар», отличная от бордо rod) и, при желании, свою фигуру матрицы вместо `RodOctagram`.
3. **Опционально** — окно роста `{year}` в блоке `firstStep` (детерминированная формула без `Date`, по образцу `windowYear` из `rod-copy.js`), если решим показывать конкретный год.

## Осознанные упрощения (YAGNI)

- Реюз `RodOctagram` вместо новой фигуры — визуал всё равно за Кириллом.
- Сид `dar.module.css` копией rod — чтобы рендер не падал до рестайла.
- Фолбэк `buildReveal` на Аркан 1 — каркас рабочий с одним заполненным арканом, остальные добираются волной.
- Ответы квиза не влияют на чтение (вариант A = чисто аркан); хранятся для возврата после оплаты и трекинга.
