# План реализации: моно-лендинг «Отношения» (/lp/love)

> **For Claude:** REQUIRED SUB-SKILL: используй скил `executing-plans`, чтобы выполнять
> этот план задача за задачей.

**Goal:** превратить нейтральный `/lp/matrix` в агрессивный моно-лендинг `/lp/love`
с новым экраном вердикта, тремя залоченными вопросами-крючками на шве тизер → пейвол и честной выдачей
после оплаты (образец: механика + числа 1/6/12/15 + фолбэк).

**Architecture:** переиспользуем существующий движок квиз-лендинга `/lp/[slug]`
(стейт-машина в `LandingClient`, `calculateMatrix`, `MatrixSVG`, `MATRIX_CONTENT`).
Добавляем фазу `verdict` между `calculating` и `result`, новый компонент вердикта,
переделываем тизер под три залоченных вопроса-крючка, делаем отдельный лендинговый пейвол
и отдельную выдачу для подписчика. Деривация «числа совместимости» детерминирована
из узлов матрицы. Движок расчёта и движок оплаты по сути не меняются, кроме одной
точечной правки возврата после checkout.

**Tech Stack:** Next.js 14 (app router, RSC + `'use client'`), CSS-модули, чистые
JS-модули с юнит-тестами на `node:test`. Node только в Docker (`node:20-alpine`).

---

## Решения, зафиксированные с заказчиком (входные данные плана)

1. **«Число совместимости»** = детерминированная формула от узлов:
   «точка отношений» = `nodes.female1` (правый внутренний узел, на схеме «линия
   любви»); «число совместимости» (ядро подходящего партнёра) = `reduce(center + female1)`.
2. **«Переломный год»** переформулируем в **«персональный прогноз по годам»**:
   раскрываем платный блок `yearForecast` как есть, обещание не про один конкретный
   год (иначе bait-and-switch, т.к. `calculateMatrix` год не вычисляет).
3. **Пейвол у лендинга отдельный** (свой дизайн). Общий `Paywall.jsx` не трогаем.

## Что уже проверено в коде (не переизобретать)

- Движок есть: `frontend/app/lp/[slug]/LandingClient.jsx`, фазы `hero → quiz →
  calculating → result`. Роут динамический, без `generateStaticParams`.
- `calculateMatrix` (`frontend/app/content/matrix.js`) отдаёт `nodes` с
  `center, female1, female2, male1, male2, d, m, y, k, top_left...`. Функция
  `reduce` там есть, но **не экспортируется** (Задача 1 это чинит).
- `MATRIX_CONTENT` (`frontend/app/content/matrix-content.js`) содержит per-number
  `relationships` и `yearForecast` (платные аспекты). Файл огромный (~600 КБ),
  не читать целиком.
- Типы шагов квиза (`date/choice/scale/text`) поддержаны в
  `frontend/app/lp/components/QuizStep.jsx`. Шкала-«Никогда..Постоянно» делается
  как `choice` (пять кнопок-опций), правки `QuizStep` НЕ нужны.
- Трекинг (`frontend/app/api/tracking/[event]/route.js`) это сквозной прокси на
  внешний TS, без белого списка событий, fire-and-forget. Новые события
  (`verdict_view`) проходят **без правок в репозитории**. Агрегирует ли их внешний
  TS, это ops-настройка вне кода.
- Возврат после оплаты: `CheckoutClient.jsx:80` жёстко делает `router.push('/lk')`.
  Ref переживает через `localStorage('offer_ref_code')` (читается в
  `AuthForm.jsx`), квиз через `quizStorage`. Не хватает только возврата на
  `/lp/love` (Задача 9).

## Как запускать (проверено)

**Юнит-тесты (одноразовый контейнер, зависимости не нужны):**

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test <путь/к/файлу.test.mjs>
```

В PowerShell тот же вызов без префикса `MSYS_NO_PATHCONV=1`. Прогон всех тестов
lp-логики:

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/lp/logic/*.test.mjs app/content/landings/*.test.mjs
```

**Ручная проверка воронки (dev-стек, nginx на :80):**

```bash
docker compose -f docker-compose.dev.yml up -d
# затем открыть http://localhost/lp/love
```

Сборку (`next build`) гоняем **один раз в конце** (Задача 11), не после каждой
задачи. `NODE_ENV=development` ломает `next build`, для сборки окружение не
переопределять.

**Замечание про React-компоненты:** в репозитории нет харнесса для тестов React
(все существующие тесты это `node:test` над чистыми JS-модулями). Поэтому
юнит-тестами покрываем только чистую логику (Задачи 1-3, 9). Компоненты (Задачи
4-8, 10) проверяем сборкой и ручным проходом воронки в Задаче 11. Не выдумывать
RTL/jest, которых в проекте нет.

---

## Задача 1: Деривация «числа совместимости» (чистая логика)

**Files:**
- Modify: `frontend/app/content/matrix.js` (экспортировать `reduce`)
- Create: `frontend/app/lp/logic/compat.js`
- Create: `frontend/app/lp/logic/compat.test.mjs`

**Step 1: Экспортировать `reduce` из движка матрицы**

В `frontend/app/content/matrix.js` заменить `function reduce(n) {` на
`export function reduce(n) {`. Логику `calculateMatrix` не трогаем, добавляем
только видимость функции.

**Step 2: Написать падающий тест**

`frontend/app/lp/logic/compat.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateMatrix } from '../../content/matrix.js'
import { relationshipPoint, compatibleCore } from './compat.js'

test('точка отношений это female1', () => {
  const { nodes } = calculateMatrix('1990-05-12')
  assert.equal(relationshipPoint(nodes), nodes.female1)
})

test('число совместимости детерминировано и лежит в 1..22', () => {
  const a = calculateMatrix('1990-05-12').nodes
  const b = calculateMatrix('1990-05-12').nodes
  const v = compatibleCore(a)
  assert.equal(v, compatibleCore(b))            // одна дата = одно значение
  assert.ok(v >= 1 && v <= 22)
})

test('число совместимости = reduce(center + female1)', () => {
  const { nodes } = calculateMatrix('2001-11-30')
  assert.equal(compatibleCore(nodes), ((nodes.center + nodes.female1 - 1) % 22) + 1)
})
```

**Step 3: Запустить тест, убедиться что падает**

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/lp/logic/compat.test.mjs
```

Ожидаемо: FAIL, `Cannot find module './compat.js'`.

**Step 4: Реализовать модуль**

`frontend/app/lp/logic/compat.js`:

```javascript
// Деривация партнёрских чисел лендинга «Отношения».
// Детерминированно из узлов матрицы: одна дата всегда даёт одно значение.
// Движок расчёта (calculateMatrix) не трогается, используем готовые узлы.
import { reduce } from '../../content/matrix.js'

// «Точка отношений»: узел на женской линии (линия любви на схеме).
// Показывает, кого человек притягивает и почему держится.
export function relationshipPoint(nodes) {
  return nodes.female1
}

// «Число совместимости»: ядро подходящего партнёра, с которым круг обрывается.
export function compatibleCore(nodes) {
  return reduce(nodes.center + nodes.female1)
}
```

Примечание к тесту в Step 2: формула `((center + female1 - 1) % 22) + 1` верна
только пока `center + female1 <= 44` (оба в 1..22, сумма 2..44, одна редукция).
Если сомнения, сверить с `reduce` напрямую: тест можно упростить до
`assert.equal(compatibleCore(nodes), reduce(nodes.center + nodes.female1))`
с импортом `reduce`.

**Step 5: Запустить тест, убедиться что проходит**

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/lp/logic/compat.test.mjs
```

Ожидаемо: PASS (3 теста).

**Step 6: Commit**

```bash
git add frontend/app/content/matrix.js frontend/app/lp/logic/compat.js frontend/app/lp/logic/compat.test.mjs
git commit -m "feat(lp): детерминированная деривация числа совместимости"
```

---

## Задача 2: Конфиг лендинга love + подмена реестра

**Files:**
- Create: `frontend/app/content/landings/love.js`
- Modify: `frontend/app/content/landings/index.js`
- Delete: `frontend/app/content/landings/matrix.js`
- Rewrite: `frontend/app/content/landings/index.test.mjs`

**Step 1: Переписать тест реестра под love (падающий)**

`frontend/app/content/landings/index.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getLanding } from './index.js'

test('getLanding отдаёт конфиг love', () => {
  const l = getLanding('love')
  assert.equal(l.slug, 'love')
  assert.equal(l.quiz.steps.length, 9)
})

test('в квизе love нет шагов пол и focus', () => {
  const l = getLanding('love')
  const ids = l.quiz.steps.map(s => s.id)
  assert.ok(!ids.includes('gender'))
  assert.ok(!ids.includes('focus'))
  assert.ok(ids.includes('birth_date'))
  assert.ok(ids.includes('name'))
})

test('старый matrix удалён из реестра', () => {
  assert.equal(getLanding('matrix'), null)
})

test('неизвестный slug это null', () => {
  assert.equal(getLanding('nope'), null)
})
```

**Step 2: Запустить, убедиться что падает**

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/content/landings/index.test.mjs
```

Ожидаемо: FAIL (love ещё не зарегистрирован, matrix ещё есть).

**Step 3: Создать конфиг love**

`frontend/app/content/landings/love.js`. Квиз 9 шагов, женский голос, без «пол»
и без `focus`. Шкала (шаг 5) сделана как `choice` c пятью подписями, чтобы не
трогать `QuizStep`.

```javascript
// Конфиг моно-лендинга «Отношения». Тема одна, focus-развилки нет.
// Тексты пользовательские: без длинного тире.
export const loveLanding = {
  slug: 'love',
  product: 'matrix',
  theme: 'relationships',
  meta: {
    title: 'Почему ты выбираешь не тех: разбор по дате рождения',
    description: 'Пройди короткий тест и узнай, какой сценарий в отношениях зашит в твоей матрице по дате рождения.',
  },
  hero: {
    eyebrow: 'Матрица отношений',
    title: 'Твоя дата рождения знает, почему ты выбираешь не тех',
    subtitle: 'И почему это повторяется из раза в раз.',
    cta: 'Узнать свой паттерн',
  },
  quiz: {
    steps: [
      { id: 'mirror', type: 'choice', required: true,
        question: 'Что из этого больше всего про тебя?',
        options: [
          { value: 'fast', label: 'Влюбляюсь быстро, а потом разочаровываюсь' },
          { value: 'hold', label: 'Держусь за того, кто меня не выбирает' },
          { value: 'closed', label: 'Закрываюсь первой, чтобы не сделали больно' },
          { value: 'empty', label: 'Вроде всё нормально, но внутри пусто' },
        ] },
      { id: 'situation', type: 'choice', required: true,
        question: 'Что у тебя сейчас?',
        options: [
          { value: 'in_bad', label: 'В отношениях, но что-то не так' },
          { value: 'alone', label: 'Одна, и это уже давит' },
          { value: 'unwanted', label: 'Люблю того, кому я не нужна' },
          { value: 'onoff', label: 'То вместе, то нет, полная неясность' },
          { value: 'ended', label: 'Недавно всё закончилось' },
        ] },
      { id: 'repeat', type: 'choice', required: true,
        question: 'Замечала, что твои истории заканчиваются примерно одинаково?',
        options: [
          { value: 'always', label: 'Да, почти каждый раз' },
          { value: 'why', label: 'Да, но не понимаю почему' },
          { value: 'sometimes', label: 'Иногда' },
          { value: 'no', label: 'Нет, все разные' },
        ] },
      { id: 'emotion', type: 'choice', required: true,
        question: 'Что ты чаще всего чувствуешь в отношениях?',
        options: [
          { value: 'abandon', label: 'Тревогу, что бросят' },
          { value: 'undervalued', label: 'Что меня недооценивают' },
          { value: 'lose_self', label: 'Что теряю себя' },
          { value: 'boredom', label: 'Скуку' },
        ] },
      { id: 'giving', type: 'choice', required: true,
        question: 'Как часто ты даёшь больше, чем получаешь?',
        options: [
          { value: 'never', label: 'Никогда' },
          { value: 'rarely', label: 'Редко' },
          { value: 'sometimes', label: 'Иногда' },
          { value: 'often', label: 'Часто' },
          { value: 'always', label: 'Постоянно' },
        ] },
      { id: 'desire', type: 'choice', required: true,
        question: 'Чего хочешь на самом деле?',
        options: [
          { value: 'calm', label: 'Спокойных, взрослых отношений' },
          { value: 'understand', label: 'Понять, что со мной не так' },
          { value: 'meet', label: 'Встретить своего человека' },
          { value: 'stop_circle', label: 'Перестать ходить по кругу' },
        ] },
      { id: 'yes_ladder', type: 'choice', required: true,
        question: 'Если в твоей матрице записано, с каким человеком круг наконец обрывается, хочешь узнать?',
        options: [
          { value: 'yes', label: 'Да, конечно' },
          { value: 'doubt', label: 'Да, но не верю, что это реально' },
          { value: 'badly', label: 'Очень хочу' },
        ] },
      { id: 'birth_date', type: 'date', required: true,
        question: 'Теперь дата рождения, чтобы построить твою матрицу отношений' },
      { id: 'name', type: 'text', required: true, placeholder: 'Имя',
        question: 'Как тебя зовут?' },
    ],
  },
}
```

**Step 4: Обновить реестр и удалить matrix**

`frontend/app/content/landings/index.js`:

```javascript
import { loveLanding } from './love.js'

export const LANDINGS = { love: loveLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
```

Удалить файл `frontend/app/content/landings/matrix.js`:

```bash
git rm frontend/app/content/landings/matrix.js
```

**Step 5: Запустить тест, убедиться что проходит**

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/content/landings/index.test.mjs
```

Ожидаемо: PASS (4 теста).

**Step 6: Commit**

```bash
git add frontend/app/content/landings/
git commit -m "feat(lp): конфиг лендинга love, matrix убран из реестра"
```

---

## Задача 3: Копирайт love (вердикт, вопросы-крючки, признаки) + резолвер

**Files:**
- Create: `frontend/app/content/landings/love-copy.js`
- Create: `frontend/app/content/landings/love-copy.test.mjs`

Образец: числа 1/6/12/15 заточены, остальные через фолбэк. Признаки партнёра
(`signs`) это новый короткий шаблон на «число совместимости»; образец даёт фолбэк
на все числа плюс несколько заточенных. Копирайт женским голосом, без длинного тире.

**Step 1: Написать падающий тест**

`frontend/app/content/landings/love-copy.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveCopy, resolveSigns, LOCKED_QUESTIONS_TAIL } from './love-copy.js'

test('заточенные числа возвращают вердикт и вопрос-крючок', () => {
  for (const n of [1, 6, 12, 15]) {
    const c = resolveCopy(n)
    assert.ok(c.verdict && c.verdict.length > 0)
    assert.ok(c.hookQuestion && c.hookQuestion.length > 0)
  }
})

test('незаточенное число падает в фолбэк, но не пусто', () => {
  const c = resolveCopy(3)
  assert.ok(c.verdict.length > 0)
  assert.ok(c.hookQuestion.length > 0)
})

test('два общих вопроса-замка (Q2/Q3) на месте', () => {
  assert.equal(LOCKED_QUESTIONS_TAIL.length, 2)
  for (const q of LOCKED_QUESTIONS_TAIL) assert.ok(q.length > 0)
})

test('признаки партнёра всегда непусты (фолбэк на любое число)', () => {
  for (const n of [1, 7, 22]) {
    assert.ok(resolveSigns(n).length > 0)
  }
})
```

**Step 2: Запустить, убедиться что падает**

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/content/landings/love-copy.test.mjs
```

Ожидаемо: FAIL, модуль не найден.

**Step 3: Реализовать копирайт**

`frontend/app/content/landings/love-copy.js`. Тон утверждён заказчиком (раздел 6
дизайна). `hookQuestion` это Q1: вопрос-крючок под замком, заточен под рану
архетипа. Q2/Q3 общие (`LOCKED_QUESTIONS_TAIL`). Без длинного тире.

```javascript
// Острый копирайт лендинга «Отношения». Ключ = центральное число матрицы (1..22).
// verdict      это щедрый бесплатный диагноз (~3 фразы), доказывает «он про меня всё знает».
// hookQuestion это Q1: вопрос-крючок под замком, заточен под рану архетипа (пейофф «кто»).
// Образец: 1/6/12/15 заточены, остальные через FALLBACK.

export const LOVE_COPY = {
  1: {
    verdict: 'Твоё ядро: 1. Лидер. Ты не строишь отношения, ты ими управляешь, потому что довериться для тебя значит проиграть. Ты выбираешь тех, кем можешь крутить, а потом презираешь их за слабость. Ты остаёшься одна не потому, что сильная, а потому, что рядом с тобой невозможно расслабиться.',
    hookQuestion: 'Рядом с кем можно выдохнуть и не держать оборону?',
  },
  6: {
    verdict: 'Твоё ядро: 6. Воспитатель. Ты выбираешь сломанных, потому что здоровому мужчине не знаешь, чем быть полезной. Ты вкладываешь себя в тех, кто без тебя не встанет, а когда встаёт, уходит к другой. Тебя используют как костыль и отбрасывают, как только перестают хромать.',
    hookQuestion: 'Кто любит тебя саму, а не пока ты его спасаешь?',
  },
  12: {
    verdict: 'Твоё ядро: 12. Жертва. Ты сама выбираешь тех, кто берёт и не даёт, а своё терпение называешь любовью. Ты молчишь, подстраиваешься и ждёшь, пока тебя выбросят, и снова ищешь такого же. Тебя бросают не из-за невезения, а потому что рядом с тобой можно ничего не давать и всё получать.',
    hookQuestion: 'Рядом с кем ты перестаёшь быть удобной и наконец становишься любимой?',
  },
  15: {
    verdict: 'Твоё ядро: 15. Искуситель. Тебе нужна не любовь, а доза. Спокойный мужчина кажется тебе скучным, поэтому ты снова бежишь к тому, кто унижает и возвращается. Ты зовёшь это страстью, но это зависимость, и в этих качелях от тебя самой ничего не остаётся.',
    hookQuestion: 'Рядом с кем близость перестаёт быть болью, а не ломкой?',
  },
}

// Живой обобщённый диагноз для остальных 18 чисел (образец).
export const FALLBACK = {
  verdict: 'Твоя матрица отношений вскрывает жёсткий сценарий, который ты повторяешь с разными людьми: как ты сближаешься, от чего бежишь и почему всё заканчивается одинаково. Это не характер и не невезение. Это программа, зашитая в числах твоей даты, и пока ты её не видишь, она выбирает за тебя.',
  hookQuestion: 'Рядом с кем твой круг наконец обрывается?',
}

// Q2/Q3: два общих вопроса-замка (одинаковы для всех чисел). Q1 берётся из hookQuestion.
// Пейоффы: Q2 это «как узнать» (признаки), Q3 это «когда» (прогноз по годам).
export const LOCKED_QUESTIONS_TAIL = [
  'Как узнать его при первой встрече и не выбрать снова того, кто бросит?',
  'В какие годы у тебя открывается окно оборвать этот круг?',
]

// Признаки, как узнать подходящего партнёра. Ключ = «число совместимости».
// Образец: фолбэк покрывает все числа, дописать заточенные позже.
export const SIGNS_FALLBACK =
  'Его выдаёт спокойствие: он не играет в качели, не исчезает и не заставляет добиваться. Рядом с ним тебе не нужно доказывать, что ты достаточно хороша.'

export const COMPAT_SIGNS = {
  // Пример заточки (дописать по мере утверждения тона):
  // 4: 'Он надёжный до скуки на первый взгляд: слово держит, планы не меняет...',
}

export function resolveCopy(center) {
  return LOVE_COPY[center] ?? FALLBACK
}

export function resolveSigns(compatCore) {
  return COMPAT_SIGNS[compatCore] ?? SIGNS_FALLBACK
}
```

**Step 4: Запустить, убедиться что проходит**

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/content/landings/love-copy.test.mjs
```

Ожидаемо: PASS (3 теста).

**Step 5: Commit**

```bash
git add frontend/app/content/landings/love-copy.js frontend/app/content/landings/love-copy.test.mjs
git commit -m "feat(lp): копирайт love (образец 1/6/12/15 + фолбэк + признаки партнёра)"
```

---

## Задача 4: Проп подсветки узлов в MatrixSVG (обратная совместимость)

**Files:**
- Modify: `frontend/app/matrix/MatrixSVG.jsx`

MatrixSVG используется и на основном `/matrix`, поэтому проп необязательный, дефолт
пустой, текущий рендер не меняется. Лок узла совместимости на схеме делаем позже
overlay-чипом в тизере (Задача 6), а не внутри SVG (совместимость это производное
число, а не геометрический узел).

**Step 1: Добавить проп `highlight`**

Сигнатуру `export default function MatrixSVG({ nodes }) {` заменить на
`export default function MatrixSVG({ nodes, highlight = [] }) {`.

Ключи `highlight` это имена узлов (`center`, `female1`, `female2`, `male1`,
`male2`, `d`, `m`, `y`, `k`). В `POS` центр называется `centre`, отобразим.
Перед закрывающим `</svg>` (после блока «Центр — медальон» и «Зоны-символы»)
добавить слой золотых колец:

```jsx
        {/* ===== Подсветка узлов (проп highlight, лендинги) ===== */}
        <g fill="none" stroke={GOLD_TEXT} strokeWidth="3" opacity="0.95">
          {highlight.map((key) => {
            const p = POS[key === 'center' ? 'centre' : key]
            if (!p) return null
            const r = key === 'center' ? 64 : 32
            return <circle key={key} cx={p.x} cy={p.y} r={r} />
          })}
        </g>
```

**Step 2: Убедиться в обратной совместимости**

Существующие вызовы `<MatrixSVG nodes={...} />` (в `MatrixClient`, старый Teaser)
остаются валидны: `highlight` по умолчанию `[]`, слой ничего не рисует. Отдельный
тест не пишем (нет React-харнесса), корректность подтвердит сборка (Задача 11).

**Step 3: Commit**

```bash
git add frontend/app/matrix/MatrixSVG.jsx
git commit -m "feat(matrix): необязательный проп highlight для подсветки узлов"
```

---

## Задача 5: Экран «Вердикт» + фаза verdict в стейт-машине

**Files:**
- Create: `frontend/app/lp/components/Verdict.jsx`
- Modify: `frontend/app/lp/[slug]/LandingClient.jsx`

**Step 1: Создать компонент Verdict**

`frontend/app/lp/components/Verdict.jsx`. Сверху реальная диаграмма как пруф
(подсветка ядра и точки отношений), ниже персональный диагноз и кнопка к тизеру.

```jsx
'use client'
import MatrixSVG from '../../matrix/MatrixSVG'
import { resolveCopy } from '../../content/landings/love-copy.js'
import styles from '../lp.module.css'

export default function Verdict({ answers, matrixData, onNext }) {
  const center = matrixData.nodes.center
  const copy = resolveCopy(center)
  const name = (answers?.name || '').trim()

  return (
    <div className={styles.page}>
      <p className={styles.subtitle}>
        {name ? `${name}, твоя матрица отношений` : 'Твоя матрица отношений'}
      </p>
      <MatrixSVG nodes={matrixData.nodes} highlight={['center', 'female1']} />
      <div className={styles.verdict}>
        <p>{copy.verdict}</p>
      </div>
      <button className={styles.cta} onClick={onNext}>
        Показать, почему ты выбираешь именно таких →
      </button>
    </div>
  )
}
```

**Step 2: Вставить фазу verdict в LandingClient**

`frontend/app/lp/[slug]/LandingClient.jsx`:

1. Импортировать компонент рядом с остальными:
   `import Verdict from '../components/Verdict'`
2. В `handleCalculated` убрать трекинг `paywall_view` и вести на `verdict`:

```javascript
  const handleCalculated = () => {
    setMatrixData(calculateMatrix(answers.birth_date))
    track('verdict_view', { slug: landing.slug })
    setPhase('verdict')
  }

  const handleVerdictNext = () => {
    if (!isSubscribed) track('paywall_view', { slug: landing.slug })
    setPhase('result')
  }
```

3. Добавить ветку рендера перед финальным `return`:

```javascript
  if (phase === 'verdict')
    return <Verdict answers={answers} matrixData={matrixData} onNext={handleVerdictNext} />
```

Возвратный эффект после оплаты (подписан + сохранённый квиз) как и раньше ставит
`phase = 'result'`, пропуская вердикт. Это корректно.

**Step 3: Commit**

```bash
git add frontend/app/lp/components/Verdict.jsx frontend/app/lp/[slug]/LandingClient.jsx
git commit -m "feat(lp): экран вердикта и фаза verdict в воронке"
```

---

## Задача 6: Тизер под вопросы-замки (только неоплаченный)

**Files:**
- Modify: `frontend/app/lp/components/Teaser.jsx`
- Modify: `frontend/app/lp/[slug]/LandingClient.jsx` (развести Teaser и Result)

Тизер теперь показывается только неподписанному. Подписчик уходит в `Result`
(Задача 8). Убираем `focusAspect` (у love темы одна). Механика: реальная «точка
отношений» показана бесплатно (пруф), а три вопроса-крючка (Q1 из `hookQuestion`
+ Q2/Q3 из `LOCKED_QUESTIONS_TAIL`) стоят под замком. «Число совместимости» на
схеме показано залоченным overlay-чипом поверх узла.

**Step 1: Переписать Teaser**

`frontend/app/lp/components/Teaser.jsx`:

```jsx
'use client'
import MatrixSVG from '../../matrix/MatrixSVG'
import LovePaywall from './LovePaywall'
import { resolveCopy, LOCKED_QUESTIONS_TAIL } from '../../content/landings/love-copy.js'
import { relationshipPoint } from '../logic/compat.js'
import styles from '../lp.module.css'

export default function Teaser({ landing, answers, matrixData }) {
  const center = matrixData.nodes.center
  const copy = resolveCopy(center)
  const point = relationshipPoint(matrixData.nodes)
  const questions = [copy.hookQuestion, ...LOCKED_QUESTIONS_TAIL]

  return (
    <div className={styles.page}>
      {/* Диаграмма как пруф + залоченное «замочное место» */}
      <div className={styles.diagramWrap}>
        <MatrixSVG nodes={matrixData.nodes} highlight={['female1']} />
        <span className={styles.compatLock} aria-label="Число совместимости заблокировано">🔒</span>
      </div>

      {/* Точка отношений реальна и показана бесплатно (пруф расчёта) */}
      <div className={styles.pointChip}>точка отношений <b>{point}</b></div>

      <p className={styles.subtitle}>
        Три вопроса, ответы на которые уже посчитаны в твоей матрице:
      </p>

      <ul className={styles.lockList}>
        {questions.map((q) => (
          <li key={q} className={styles.lockRow}>
            <span className={styles.lockRowIcon} aria-hidden>🔒</span>
            <span>{q}</span>
          </li>
        ))}
      </ul>

      <LovePaywall slug={landing.slug} />
    </div>
  )
}
```

Примечание: секретные ответы (число совместимости, признаки, годы) в тизере **не
раскрываются** — под замком стоят только вопросы, реальные значения показываем
после оплаты (Задача 8). Показанная «точка отношений» это реальный узел `female1`,
её видно бесплатно (пруф расчёта). Экран вердикта (Задача 5) с полным текстом
диагноза идёт ПЕРЕД этим экраном: сначала щедрый вердикт, тапом дальше, тут вопросы.

**Step 2: Развести Teaser и Result в LandingClient**

Финальный `return` в `LandingClient.jsx` заменить на явную развилку:

```javascript
  if (isSubscribed)
    return <Result landing={landing} answers={answers} matrixData={matrixData} />
  return <Teaser landing={landing} answers={answers} matrixData={matrixData} />
```

Добавить импорт `import Result from '../components/Result'` (компонент из Задачи 8;
до неё код не соберётся, поэтому Задачи 6 и 8 коммитим последовательно, а сборку
гоняем в Задаче 11).

**Step 3: Commit**

```bash
git add frontend/app/lp/components/Teaser.jsx frontend/app/lp/[slug]/LandingClient.jsx
git commit -m "feat(lp): тизер с вопросами-замками и локом совместимости"
```

---

## Задача 7: Отдельный лендинговый пейвол

**Files:**
- Create: `frontend/app/lp/components/LovePaywall.jsx`

Пейвол свой (решение заказчика), общий `Paywall.jsx` не трогаем. Копия §4.6:
не «подписка», а «доузнать про себя». CTA перед переходом кладёт в `localStorage`
путь возврата `/lp/love` (Задача 9 его читает в checkout). Навигация как у общего
пейвола: залогинен → `/lk`, иначе → `/register` (цепочка сама доводит до checkout).

```jsx
'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import styles from '../lp.module.css'

const PAYOFFS = [
  'с каким числом партнёра твой сценарий обрывается',
  'как узнать его при первой встрече',
  'твой персональный прогноз по годам, когда всё может развернуться',
]

export default function LovePaywall({ slug }) {
  const { user } = useAuth()
  const router = useRouter()
  const { track } = useTracking()

  const onClick = () => {
    track('cta_click', { slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${slug}`) } catch {}
    router.push(user ? '/lk' : '/register')
  }

  return (
    <div className={styles.paywall}>
      <h2 className={styles.title}>Тебе осталось узнать самое важное</h2>
      <ul className={styles.payoffs}>
        {PAYOFFS.map((p) => <li key={p}>{p}</li>)}
      </ul>
      <p className={styles.subtitle}>
        Плюс полный разбор всех сфер жизни. Первые 7 дней бесплатно.
      </p>
      <button className={styles.cta} onClick={onClick}>Открыть полный разбор →</button>
      {!user && (
        <p className={styles.subtitle}>Уже оформили? <a href="/login">Войти</a></p>
      )}
    </div>
  )
}
```

**Commit:**

```bash
git add frontend/app/lp/components/LovePaywall.jsx
git commit -m "feat(lp): отдельный пейвол love с тремя пейоффами"
```

---

## Задача 8: Выдача после оплаты (три пейоффа + триумф)

**Files:**
- Create: `frontend/app/lp/components/Result.jsx`

Требование честности (§4.7): раскрываем ровно те три петли, что обрывались.
С КЕМ = «число совместимости» + признаки; КОГДА = блок `yearForecast`; КАК =
блок `relationships`. Диаграмма с раскрытым узлом (без лока). Внизу триумф +
кнопка на главную `/`.

```jsx
'use client'
import { useRouter } from 'next/navigation'
import MatrixSVG from '../../matrix/MatrixSVG'
import { MATRIX_CONTENT } from '../../content/matrix-content'
import { resolveSigns } from '../../content/landings/love-copy.js'
import { compatibleCore, relationshipPoint } from '../logic/compat.js'
import styles from '../lp.module.css'

export default function Result({ answers, matrixData }) {
  const router = useRouter()
  const center = matrixData.nodes.center
  const content = MATRIX_CONTENT[center] || MATRIX_CONTENT[1]
  const point = relationshipPoint(matrixData.nodes)
  const compat = compatibleCore(matrixData.nodes)
  const name = (answers?.name || '').trim()

  return (
    <div className={styles.page}>
      <p className={styles.subtitle}>
        {name ? `${name}, вот полный разбор` : 'Твой полный разбор'}
      </p>
      <MatrixSVG nodes={matrixData.nodes} highlight={['center', 'female1']} />

      {/* Ответы идут в порядке трёх залоченных вопросов тизера (честностная сцепка) */}
      <section className={styles.block}>
        <h3 className={styles.title}>Рядом с кем твой круг обрывается</h3>
        <p>Твоя точка отношений это {point}. Тебе подходит партнёр с ядром {compat}.</p>
      </section>

      <section className={styles.block}>
        <h3 className={styles.title}>Как узнать его при первой встрече</h3>
        <p>{resolveSigns(compat)}</p>
      </section>

      <section className={styles.block}>
        <h3 className={styles.title}>В какие годы открывается окно</h3>
        <p>{content.yearForecast}</p>
      </section>

      <section className={styles.block}>
        <h3 className={styles.title}>Полный разбор твоего сценария</h3>
        <p>{content.relationships}</p>
      </section>

      <div className={styles.triumph}>
        <h3 className={styles.title}>Готово. Теперь тебе доступны все продукты Astrix</h3>
        <p className={styles.subtitle}>
          Матрица, таро, гороскоп и нумерология. Подписка открыта во всём сервисе.
        </p>
        <button className={styles.cta} onClick={() => router.push('/')}>
          Перейти в Astrix →
        </button>
      </div>
    </div>
  )
}
```

**Commit:**

```bash
git add frontend/app/lp/components/Result.jsx
git commit -m "feat(lp): выдача после оплаты (три пейоффа + доступ ко всем продуктам)"
```

---

## Задача 9: Возврат на /lp/love после оплаты

**Files:**
- Create: `frontend/app/lp/logic/returnPath.js`
- Create: `frontend/app/lp/logic/returnPath.test.mjs`
- Modify: `frontend/app/checkout/CheckoutClient.jsx`

Логику чтения/валидации пути выносим в чистый модуль, чтобы протестировать без
React. `CheckoutClient` в обработчике успеха читает путь и уходит туда, иначе
дефолт `/lk`. Валидация: только внутренние пути вида `/lp/...` (защита от open
redirect).

**Step 1: Падающий тест**

`frontend/app/lp/logic/returnPath.test.mjs`:

```javascript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeReturnPath } from './returnPath.js'

test('пропускает внутренний путь лендинга', () => {
  assert.equal(safeReturnPath('/lp/love'), '/lp/love')
})

test('отбрасывает внешние и мусорные значения', () => {
  assert.equal(safeReturnPath('https://evil.com'), null)
  assert.equal(safeReturnPath('//evil.com'), null)
  assert.equal(safeReturnPath('/lk'), null)     // не лендинг
  assert.equal(safeReturnPath(null), null)
  assert.equal(safeReturnPath(''), null)
})
```

**Step 2: Запустить, убедиться что падает**

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/lp/logic/returnPath.test.mjs
```

Ожидаемо: FAIL.

**Step 3: Реализовать**

`frontend/app/lp/logic/returnPath.js`:

```javascript
// Безопасный путь возврата после оплаты. Разрешаем только внутренние лендинги
// /lp/<slug>, чтобы исключить open redirect.
export function safeReturnPath(value) {
  if (typeof value !== 'string') return null
  if (!/^\/lp\/[a-z0-9-]+$/i.test(value)) return null
  return value
}
```

**Step 4: Запустить, убедиться что проходит**

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test app/lp/logic/returnPath.test.mjs
```

Ожидаемо: PASS (2 теста).

**Step 5: Подключить в CheckoutClient**

В `frontend/app/checkout/CheckoutClient.jsx`:

1. Импорт: `import { safeReturnPath } from '../lp/logic/returnPath.js'`
2. В колбэке успеха оплаты (строки ~77-81) заменить жёсткий `/lk`:

```javascript
        () => {
          // Успех
          setStatus('success')
          let dest = '/lk'
          try {
            const raw = localStorage.getItem('post_checkout_return')
            const safe = safeReturnPath(raw)
            if (safe) { dest = safe; localStorage.removeItem('post_checkout_return') }
          } catch {}
          setTimeout(() => router.push(dest), 1500)
        },
```

**Проверка честности возврата (ручная, Задача 11):** после оплаты и возврата на
`/lp/love` `LandingClient` в эффекте читает `user.subscribed`. Убедиться, что к
моменту возврата контекст успел обновить подписку (если нет, `AuthContext`
подтягивает статус при заходе на страницу). Если статус запаздывает, это
существующее поведение чекаута, помечаем как отдельный тикет, из скоупа образца
не выносим.

**Step 6: Commit**

```bash
git add frontend/app/lp/logic/returnPath.js frontend/app/lp/logic/returnPath.test.mjs frontend/app/checkout/CheckoutClient.jsx
git commit -m "feat(checkout): возврат на /lp/<slug> после оплаты (safe redirect)"
```

---

## Задача 10: Стили лендинга (частичный блюр, лок-чип, вердикт, триумф)

**Files:**
- Modify: `frontend/app/lp/lp.module.css`

Добавляем классы, использованные в компонентах: `.verdict`, `.diagramWrap`,
`.compatLock`, `.pointChip`, `.lockList`, `.lockRow`, `.lockRowIcon`, `.paywall`,
`.payoffs`, `.block`, `.triumph`. Значения выравниваем по текущим токенам файла
(сверить существующие переменные/цвета перед вставкой).

**Step 1: Дописать стили**

Ориентир (подогнать под текущие токены `lp.module.css`):

```css
.verdict { max-width: 640px; margin: 0 auto; line-height: 1.6; }
.verdict p { margin: 0 0 14px; }

.diagramWrap { position: relative; }
/* Лок «числа совместимости» поверх узла female1 (66% x, 50% y viewBox 800). */
.compatLock {
  position: absolute; left: 66%; top: 50%;
  transform: translate(-50%, -50%);
  font-size: 22px; filter: drop-shadow(0 1px 2px rgba(0,0,0,.4));
  pointer-events: none;
}

/* Чип реальной «точки отношений» (показана бесплатно как пруф). */
.pointChip {
  display: inline-flex; gap: 8px; align-items: center;
  margin: 8px auto 18px; padding: 5px 12px; border-radius: 999px;
  background: rgba(192,118,78,.16); font-size: 13px;
}

/* Три вопроса-крючка под замком. */
.lockList { list-style: none; padding: 0; margin: 12px auto 20px; max-width: 560px; }
.lockRow {
  display: flex; gap: 11px; align-items: flex-start;
  padding: 13px 14px; margin: 0 0 10px; text-align: left; line-height: 1.5;
  border: 1px solid rgba(185,149,79,.28); border-radius: 12px;
  background: rgba(255,255,255,.04);
}
.lockRowIcon { flex: none; }

.paywall { max-width: 560px; margin: 24px auto 0; text-align: center; }
.payoffs { list-style: none; padding: 0; margin: 16px 0; text-align: left;
  display: inline-block; }
.payoffs li { position: relative; padding-left: 22px; margin: 8px 0; }
.payoffs li::before { content: '🔒'; position: absolute; left: 0; }

.block { max-width: 640px; margin: 0 auto 24px; line-height: 1.6; }
.triumph { max-width: 560px; margin: 32px auto 0; text-align: center; }
```

Примечание: класс `.locked` (блюр) больше в тизере не используется (механика ушла
от блюр-хвоста к вопросам-замкам). Трогать его не нужно.

**Step 2: Commit**

```bash
git add frontend/app/lp/lp.module.css
git commit -m "style(lp): вопросы-замки, чип точки отношений, вердикт, триумф"
```

---

## Задача 11: Definition of Done (сборка + ручной проход)

**Files:** нет (проверочная задача)

**Step 1: Прогнать все юнит-тесты логики и контента**

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "D:/Claude/Esoteric-main/frontend:/app" \
  -w /app node:20-alpine node --test \
  app/lp/logic/compat.test.mjs \
  app/lp/logic/quizMachine.test.mjs \
  app/lp/logic/quizStorage.test.mjs \
  app/lp/logic/focus.test.mjs \
  app/lp/logic/returnPath.test.mjs \
  app/content/landings/index.test.mjs \
  app/content/landings/love-copy.test.mjs
```

Ожидаемо: все PASS, 0 fail. (`focus.test.mjs`/`focus.js` остаются как есть, love
их не использует, но они не должны сломаться.)

**Step 2: Продакшн-сборка (одна, в конце)**

Собрать образ по `frontend/Dockerfile` (окружение НЕ переопределять в
`development`, иначе `next build` падает):

```bash
docker build -t love-lp-check ./frontend
```

Ожидаемо: сборка проходит, в выводе `next build` присутствует роут `/lp/[slug]`.
Если Dockerfile ожидает env/аргументы, свериться с `docker-compose.prod.yml`.

**Step 3: Ручной проход воронки**

```bash
docker compose -f docker-compose.dev.yml up -d
```

Открыть `http://localhost/lp/love` и проверить по чек-листу дизайна:

- [ ] Hero A с одной кнопкой, без навигации сайта.
- [ ] Квиз 9 шагов, без «пол» и без «focus», шаги 1-7 в один тап, дата и имя в конце.
- [ ] Экран расчёта ~2.5с.
- [ ] Вердикт: реальная диаграмма с подсветкой ядра и точки отношений, диагноз по
      реальному числу, бесплатно и целиком; для 1/6/12/15 заточенный текст,
      для остальной даты корректный фолбэк.
- [ ] Тизер: реальная «точка отношений» показана, три вопроса-крючка под замком
      (Q1 заточен под архетип, Q2/Q3 общие), на схеме подсвечена точка отношений и
      виден лок совместимости, снизу пейвол с тремя пейоффами.
- [ ] `http://localhost/lp/matrix` отдаёт 404.
- [ ] Оплата (тестовый CloudPayments) возвращает на `/lp/love`, показывается
      выдача: «с кем» (реальное число совместимости + признаки), «когда»
      (прогноз по годам), «как» (разбор relationships), узел совместимости на
      схеме раскрыт, снизу блок «доступны все продукты» + кнопка на `/`.
- [ ] Одна и та же дата всегда даёт одни и те же числа (детерминизм).

**Step 4: Финальный коммит (если правились мелочи по итогам прохода)**

```bash
git add -A
git commit -m "chore(lp): образец love-лендинга готов (DoD)"
```

---

## Открытые пункты (вне образца, не блокируют)

- **Признаки партнёра (`COMPAT_SIGNS`)**: образец на фолбэке; дописать заточку по
  числам после утверждения тона.
- **Оставшиеся 18 чисел вердикта/hookQuestion**: дописать после утверждения образца.
- **Свежесть `user.subscribed`** на возврате после оплаты: если статус запаздывает,
  отдельный тикет на форс-обновление контекста в `LandingClient`.
- **Свой визуал лендинга** (включая пейвол): скин по макету заказчика в
  `design-reference/landings/love/` отдельным заходом. Этот план даёт структуру и
  механику на общих `lp.module.css`.
- **Лендинги money/purpose**: через тот же движок отдельным заходом (YAGNI сейчас).
