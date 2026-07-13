# Матрица-лендинг: движок квиз-воронки — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: используй superpowers:executing-plans, чтобы выполнять этот план задача-за-задачей.

**Goal:** Собрать переиспользуемый движок квиз-лендинга под партнёрский трафик: роут `/lp/[slug]`, воронка Hero → квиз → анимация расчёта → тизер результата → пейвол → подписка. Первый лендинг — «Матрица судьбы».

**Architecture:** Вся бизнес-логика воронки вынесена в чистые модули (`app/lp/logic/*`) и конфиг лендинга (`app/content/landings/*`), покрытые юнит-тестами. UI — тонкая стейт-машина (`LandingClient`), собранная из презентационных компонентов; она переиспользует готовый движок матрицы (`calculateMatrix`, `MatrixSVG`, `MatrixHeader`, `MatrixInterpretations`, `Paywall`). Внешний вид намеренно минимальный: визуал «переобувается» позже из макетов Claude Design, логика от него не зависит.

**Tech Stack:** Next.js 14 (App Router, JS), React 18. Юнит-тесты — встроенный `node --test` (без новых зависимостей), запуск в Docker. Оплата и подписка — существующие `usePayment` / `AuthContext` / `Paywall`.

**Дизайн-док:** `docs/plans/2026-07-13-matrix-landing-design.md`

---

## Верификация: как проверяем в этом проекте

В проекте **нет JS-тест-фреймворка** (в `frontend/package.json` только `dev/build/start`) и **нет Node на хосте** (только в Docker). Поэтому:

- **Чистая логика** (`app/lp/logic/*`, `app/content/landings/index.js`) тестируется встроенным `node --test` (Node 20, ноль зависимостей). Тест-файлы — `*.test.mjs`, в папке модуля лежит локальный `package.json` `{"type":"module"}`. Импорты — только явные `./x.js` (raw node не резолвит расширения). Next игнорирует и локальный `package.json`, и `*.test.mjs` (они не импортируются из кода приложения), прод-сборка остаётся чистой.
- **UI-компоненты** проверяются гейтом «компилируется + dev-страница рендерится», без юнит-тестов (React-тест-харнесса нет, заводить его — вне скоупа). Скриншот-тула нет: рендер проверяем разметкой через `Invoke-WebRequest`.
- **Прод-сборку** гоняем ОДИН раз в конце (не после каждой задачи).

**Точные команды** (docker-команды запускать через PowerShell-инструмент, не Bash — Git Bash ломает `-w /app/...` пути):

```powershell
# Юнит-тест одного файла (эфемерный контейнер, dev-сервер не нужен):
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/lp/logic/quizMachine.test.mjs

# Прод-сборка (финальный гейт). NODE_ENV=production обязателен, иначе next build падает ложно:
docker exec -e NODE_ENV=production esoteric-main-frontend-1 npm run build
# После прод-сборки вернуть корректный dev-сервер (прод-билд затирает общий .next):
docker compose -f D:\Claude\Esoteric-main\docker-compose.dev.yml restart frontend

# Спот-чек рендера dev-страницы (dev-сервер на nginx :80):
Invoke-WebRequest http://localhost/lp/matrix -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

**Коммиты:** ветка `feat/astrix-homepage-redesign` содержит посторонний незакоммиченный WIP. Каждый коммит делать **точечным `git add` только по путям задачи**, не `git add -A`. Сообщения — в стиле проекта, с трейлером `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## Task 1: Конфиг лендинга «Матрица» + реестр `getLanding`

**Files:**
- Create: `frontend/app/content/landings/matrix.js`
- Create: `frontend/app/content/landings/index.js`
- Create: `frontend/app/content/landings/package.json`
- Test: `frontend/app/content/landings/index.test.mjs`

**Step 1: Создать локальный `package.json` для node --test**

`frontend/app/content/landings/package.json`:
```json
{ "type": "module" }
```

**Step 2: Написать конфиг лендинга**

`frontend/app/content/landings/matrix.js` (копия без em-dash, тексты пользовательские):
```js
// Конфиг лендинга «Матрица судьбы». Один продукт = один такой файл.
// Тексты пользовательские: без длинного тире.
export const matrixLanding = {
  slug: 'matrix',
  product: 'matrix',
  meta: {
    title: 'Матрица судьбы: пройди тест и узнай свою программу',
    description: 'Ответь на 5 вопросов и получи персональный разбор матрицы судьбы по дате рождения.',
  },
  hero: {
    eyebrow: 'Матрица судьбы',
    title: 'Узнай, какая программа зашита в твоей дате рождения',
    subtitle: 'Ответь на 5 коротких вопросов и получи персональный разбор: предназначение, деньги, отношения.',
    cta: 'Пройти тест',
    proof: 'Более 100 000 расчётов',
  },
  quiz: {
    steps: [
      { id: 'birth_date', type: 'date', question: 'Когда ты родился?', required: true },
      { id: 'gender', type: 'choice', question: 'Твой пол?', required: true,
        options: [ { value: 'female', label: 'Женский' }, { value: 'male', label: 'Мужской' } ] },
      { id: 'focus', type: 'choice', question: 'Что сейчас волнует больше всего?', required: true,
        options: [
          { value: 'money', label: 'Деньги' },
          { value: 'relationships', label: 'Отношения' },
          { value: 'purpose', label: 'Предназначение' },
          { value: 'talents', label: 'Таланты и самореализация' },
        ] },
      { id: 'life_scale', type: 'scale', question: 'Насколько ощущаешь, что живёшь не свою жизнь?',
        min: 1, max: 5, required: true },
      { id: 'name', type: 'text', question: 'Как тебя зовут?', placeholder: 'Имя', required: true },
    ],
  },
  // Ответ шага focus -> ключ аспекта в MATRIX_CONTENT (см. matrix-content.js).
  focusToAspect: {
    money: 'money',
    relationships: 'relationships',
    purpose: 'personalPurpose',
    talents: 'talents',
  },
}
```

**Step 3: Написать реестр**

`frontend/app/content/landings/index.js`:
```js
import { matrixLanding } from './matrix.js'

export const LANDINGS = { matrix: matrixLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
```

**Step 4: Написать падающий тест**

`frontend/app/content/landings/index.test.mjs`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getLanding } from './index.js'

test('getLanding возвращает конфиг для существующего slug', () => {
  const l = getLanding('matrix')
  assert.equal(l.slug, 'matrix')
  assert.equal(l.quiz.steps.length, 5)
})

test('getLanding возвращает null для неизвестного slug', () => {
  assert.equal(getLanding('nope'), null)
})

test('каждый focus-вариант имеет маппинг в аспект', () => {
  const l = getLanding('matrix')
  const focusStep = l.quiz.steps.find(s => s.id === 'focus')
  for (const opt of focusStep.options) {
    assert.ok(l.focusToAspect[opt.value], `нет аспекта для focus=${opt.value}`)
  }
})
```

**Step 5: Запустить тест — убедиться, что проходит**

```powershell
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/content/landings/index.test.mjs
```
Ожидаемо: `pass 3`, `fail 0`.

**Step 6: Коммит**

```powershell
git add frontend/app/content/landings
git commit -m "feat(landing): конфиг матрицы + реестр getLanding

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Резолвер focus → аспект контента

**Files:**
- Create: `frontend/app/lp/logic/focus.js`
- Create: `frontend/app/lp/logic/package.json`
- Test: `frontend/app/lp/logic/focus.test.mjs`

**Step 1: Локальный `package.json`**

`frontend/app/lp/logic/package.json`:
```json
{ "type": "module" }
```

**Step 2: Написать падающий тест**

`frontend/app/lp/logic/focus.test.mjs`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveFocusAspect } from './focus.js'

const landing = { focusToAspect: { money: 'money', purpose: 'personalPurpose' } }

test('маппит известный focus в аспект', () => {
  assert.equal(resolveFocusAspect(landing, 'purpose'), 'personalPurpose')
})

test('падает в fallback для неизвестного focus', () => {
  assert.equal(resolveFocusAspect(landing, 'xxx'), 'money')
})

test('не падает, если landing пустой', () => {
  assert.equal(resolveFocusAspect(null, 'money'), 'money')
})
```

**Step 3: Запустить — убедиться, что падает** (модуля нет)

```powershell
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/lp/logic/focus.test.mjs
```
Ожидаемо: ошибка резолва `./focus.js`.

**Step 4: Реализация**

`frontend/app/lp/logic/focus.js`:
```js
// Возвращает ключ аспекта MATRIX_CONTENT под выбранный на квизе запрос.
export function resolveFocusAspect(landing, focusValue, fallback = 'money') {
  const map = (landing && landing.focusToAspect) || {}
  return map[focusValue] || fallback
}
```

**Step 5: Запустить — проходит** (`pass 3`).

**Step 6: Коммит**

```powershell
git add frontend/app/lp/logic/focus.js frontend/app/lp/logic/focus.test.mjs frontend/app/lp/logic/package.json
git commit -m "feat(landing): резолвер focus -> аспект контента

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Стейт-машина квиза (чистая логика)

**Files:**
- Create: `frontend/app/lp/logic/quizMachine.js`
- Test: `frontend/app/lp/logic/quizMachine.test.mjs`

**Step 1: Написать падающий тест**

`frontend/app/lp/logic/quizMachine.test.mjs`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initQuiz, currentStep, setAnswer, canAdvance, advance, back, isComplete, progress } from './quizMachine.js'

const steps = [
  { id: 'a', required: true },
  { id: 'b', required: false },
  { id: 'c', required: true },
]

test('initQuiz стартует с нулевого шага и пустых ответов', () => {
  const s = initQuiz()
  assert.equal(s.index, 0)
  assert.deepEqual(s.answers, {})
})

test('canAdvance=false пока обязательный шаг без ответа', () => {
  const s = initQuiz()
  assert.equal(canAdvance(steps, s), false)
})

test('setAnswer + advance двигают индекс', () => {
  let s = initQuiz()
  s = setAnswer(s, 'a', '1990-01-01')
  assert.equal(canAdvance(steps, s), true)
  s = advance(steps, s)
  assert.equal(s.index, 1)
  assert.equal(currentStep(steps, s).id, 'b')
})

test('advance не двигает, если обязательный шаг пуст', () => {
  let s = initQuiz()
  s = advance(steps, s) // a обязателен, ответа нет
  assert.equal(s.index, 0)
})

test('необязательный шаг можно проскочить', () => {
  let s = { index: 1, answers: { a: 'x' } }
  assert.equal(canAdvance(steps, s), true)
})

test('back не уходит ниже нуля', () => {
  const s = back(initQuiz())
  assert.equal(s.index, 0)
})

test('isComplete=true когда индекс дошёл до конца', () => {
  let s = { index: 3, answers: {} }
  assert.equal(isComplete(steps, s), true)
  assert.equal(progress(steps, s), 1)
})
```

**Step 2: Запустить — падает.**

```powershell
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/lp/logic/quizMachine.test.mjs
```

**Step 3: Реализация**

`frontend/app/lp/logic/quizMachine.js`:
```js
// Чистая стейт-машина квиза. Никакого React/DOM — только данные.
export function initQuiz() {
  return { index: 0, answers: {} }
}

export function currentStep(steps, state) {
  return steps[state.index] ?? null
}

export function setAnswer(state, id, value) {
  return { ...state, answers: { ...state.answers, [id]: value } }
}

export function canAdvance(steps, state) {
  const step = steps[state.index]
  if (!step) return false
  if (!step.required) return true
  const v = state.answers[step.id]
  return v !== undefined && v !== null && v !== ''
}

export function advance(steps, state) {
  if (!canAdvance(steps, state)) return state
  return { ...state, index: Math.min(state.index + 1, steps.length) }
}

export function back(state) {
  return { ...state, index: Math.max(state.index - 1, 0) }
}

export function isComplete(steps, state) {
  return state.index >= steps.length
}

export function progress(steps, state) {
  return steps.length ? Math.min(state.index / steps.length, 1) : 0
}
```

**Step 4: Запустить — проходит** (`pass 7`).

**Step 5: Коммит**

```powershell
git add frontend/app/lp/logic/quizMachine.js frontend/app/lp/logic/quizMachine.test.mjs
git commit -m "feat(landing): чистая стейт-машина квиза

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Персистентность ответов квиза (localStorage)

**Files:**
- Create: `frontend/app/lp/logic/quizStorage.js`
- Test: `frontend/app/lp/logic/quizStorage.test.mjs`

Пер-версионный ключ `lp_quiz_<slug>`. Чистые `serializeQuiz`/`deserializeQuiz` тестируем; тонкие `save/load/clear` — обёртки над localStorage с guard'ом `typeof window`.

**Step 1: Падающий тест (только чистые функции)**

`frontend/app/lp/logic/quizStorage.test.mjs`:
```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { serializeQuiz, deserializeQuiz } from './quizStorage.js'

test('round-trip сериализации', () => {
  const raw = serializeQuiz('matrix', { birth_date: '1990-01-01', focus: 'money' })
  assert.deepEqual(deserializeQuiz(raw, 'matrix'), { birth_date: '1990-01-01', focus: 'money' })
})

test('deserialize отклоняет чужой slug', () => {
  const raw = serializeQuiz('matrix', { a: 1 })
  assert.equal(deserializeQuiz(raw, 'tarot'), null)
})

test('deserialize не падает на мусоре', () => {
  assert.equal(deserializeQuiz('{{{', 'matrix'), null)
  assert.equal(deserializeQuiz('', 'matrix'), null)
})
```

**Step 2: Запустить — падает.**

**Step 3: Реализация**

`frontend/app/lp/logic/quizStorage.js`:
```js
const VERSION = 1
const key = (slug) => `lp_quiz_${slug}`

export function serializeQuiz(slug, answers) {
  return JSON.stringify({ v: VERSION, slug, answers })
}

export function deserializeQuiz(raw, slug) {
  try {
    const data = JSON.parse(raw)
    if (!data || data.v !== VERSION || data.slug !== slug) return null
    return data.answers ?? null
  } catch {
    return null
  }
}

export function saveQuiz(slug, answers) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key(slug), serializeQuiz(slug, answers)) } catch {}
}

export function loadQuiz(slug) {
  if (typeof window === 'undefined') return null
  try { return deserializeQuiz(localStorage.getItem(key(slug)) || '', slug) } catch { return null }
}

export function clearQuiz(slug) {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(key(slug)) } catch {}
}
```

**Step 4: Запустить — проходит** (`pass 3`).

**Step 5: Коммит**

```powershell
git add frontend/app/lp/logic/quizStorage.js frontend/app/lp/logic/quizStorage.test.mjs
git commit -m "feat(landing): персистентность ответов квиза

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Роут `/lp/[slug]`, layout без Nav, скрытие Nav

Каркас страницы: серверный компонент резолвит конфиг и рендерит клиентскую стейт-машину. Nav (в корневом layout) прячем на `/lp/*`.

**Files:**
- Create: `frontend/app/lp/layout.jsx`
- Create: `frontend/app/lp/[slug]/page.jsx`
- Create: `frontend/app/lp/[slug]/LandingClient.jsx` (заглушка на этот шаг)
- Create: `frontend/app/lp/lp.module.css`
- Modify: `frontend/app/components/Nav.jsx`

**Step 1: Layout группы**

`frontend/app/lp/layout.jsx`:
```jsx
export const metadata = { robots: { index: true, follow: true } }

export default function LpLayout({ children }) {
  return <div className="lp-root">{children}</div>
}
```

**Step 2: Скрыть Nav на `/lp/*`**

`frontend/app/components/Nav.jsx` — добавить импорт и ранний выход:
```jsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import styles from './Nav.module.css'

export default function Nav() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { openAuth } = useAuthModal()

  if (pathname?.startsWith('/lp/')) return null
  // ...остальное без изменений
```

**Step 3: Минимальный CSS-каркас**

`frontend/app/lp/lp.module.css`:
```css
.page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: 32px 20px; max-width: 640px; margin: 0 auto; text-align: center; }
.title { font-size: 28px; line-height: 1.2; }
.subtitle { opacity: .8; }
.cta { padding: 14px 28px; font-size: 17px; border-radius: 12px; cursor: pointer; }
.progress { width: 100%; height: 4px; background: rgba(255,255,255,.12); border-radius: 2px; overflow: hidden; }
.progressBar { height: 100%; background: currentColor; transition: width .3s ease; }
.option { display: block; width: 100%; padding: 14px; margin: 6px 0; border-radius: 12px; cursor: pointer; }
.locked { filter: blur(6px); user-select: none; pointer-events: none; }
```

**Step 4: Клиентская заглушка**

`frontend/app/lp/[slug]/LandingClient.jsx`:
```jsx
'use client'
import styles from '../lp.module.css'

export default function LandingClient({ landing }) {
  return (
    <div className={styles.page}>
      <p className={styles.subtitle}>{landing.hero.eyebrow}</p>
      <h1 className={styles.title}>{landing.hero.title}</h1>
    </div>
  )
}
```

**Step 5: Серверная страница**

`frontend/app/lp/[slug]/page.jsx`:
```jsx
import { notFound } from 'next/navigation'
import { getLanding } from '../../content/landings/index.js'
import LandingClient from './LandingClient'

export function generateMetadata({ params }) {
  const l = getLanding(params.slug)
  if (!l) return {}
  return { title: l.meta.title, description: l.meta.description, robots: { index: true, follow: true } }
}

export default function LandingPage({ params }) {
  const landing = getLanding(params.slug)
  if (!landing) notFound()
  return <LandingClient landing={landing} />
}
```

**Step 6: Проверить рендер в dev**

Dev-сервер уже поднят (nginx :80). Проверить статус и наличие заголовка:
```powershell
Invoke-WebRequest http://localhost/lp/matrix -UseBasicParsing | Select-Object StatusCode
(Invoke-WebRequest http://localhost/lp/matrix -UseBasicParsing).Content -match 'зашита в твоей дате'
```
Ожидаемо: `200`, `True`. Проверить, что `/lp/nope` даёт 404.

**Step 7: Коммит**

```powershell
git add frontend/app/lp/layout.jsx frontend/app/lp/[slug]/page.jsx frontend/app/lp/[slug]/LandingClient.jsx frontend/app/lp/lp.module.css frontend/app/components/Nav.jsx
git commit -m "feat(landing): роут /lp/[slug] + скрытие Nav на лендингах

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Hero-экран

**Files:**
- Create: `frontend/app/lp/components/Hero.jsx`

**Step 1: Реализация**

`frontend/app/lp/components/Hero.jsx`:
```jsx
'use client'
import styles from '../lp.module.css'

export default function Hero({ hero, onStart }) {
  return (
    <div className={styles.page}>
      <p className={styles.subtitle}>{hero.eyebrow}</p>
      <h1 className={styles.title}>{hero.title}</h1>
      <p className={styles.subtitle}>{hero.subtitle}</p>
      <button className={styles.cta} onClick={onStart}>{hero.cta}</button>
      {hero.proof && <p className={styles.subtitle}>{hero.proof}</p>}
    </div>
  )
}
```

**Step 2: Верификация** — компонент подключим в Task 10; на этом шаге гейт «файл компилируется» проверится вместе с финальной сборкой. Отдельная dev-проверка не нужна (компонент ещё не смонтирован).

**Step 3: Коммит**

```powershell
git add frontend/app/lp/components/Hero.jsx
git commit -m "feat(landing): Hero-экран лендинга

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Экраны квиза (Quiz + QuizStep)

**Files:**
- Create: `frontend/app/lp/components/QuizStep.jsx`
- Create: `frontend/app/lp/components/Quiz.jsx`

**Step 1: Рендер одного шага по типу**

`frontend/app/lp/components/QuizStep.jsx`:
```jsx
'use client'
import styles from '../lp.module.css'

export default function QuizStep({ step, value, onChange, onAdvance }) {
  if (step.type === 'date') {
    return (
      <input type="date" value={value ?? ''} required
        onChange={(e) => onChange(e.target.value)} />
    )
  }
  if (step.type === 'text') {
    return (
      <input type="text" placeholder={step.placeholder} value={value ?? ''}
        onChange={(e) => onChange(e.target.value)} />
    )
  }
  if (step.type === 'choice') {
    return (
      <div>
        {step.options.map((o) => (
          <button key={o.value} className={styles.option}
            onClick={() => { onChange(o.value); onAdvance() }}>
            {o.label}
          </button>
        ))}
      </div>
    )
  }
  if (step.type === 'scale') {
    const nums = []
    for (let n = step.min; n <= step.max; n++) nums.push(n)
    return (
      <div>
        {nums.map((n) => (
          <button key={n} className={styles.option}
            onClick={() => { onChange(n); onAdvance() }}>
            {n}
          </button>
        ))}
      </div>
    )
  }
  return null
}
```

**Step 2: Обёртка квиза (прогресс + навигация)**

`frontend/app/lp/components/Quiz.jsx`:
```jsx
'use client'
import { useState } from 'react'
import { initQuiz, currentStep, setAnswer, canAdvance, advance, isComplete, progress } from '../logic/quizMachine.js'
import QuizStep from './QuizStep'
import styles from '../lp.module.css'

export default function Quiz({ steps, onComplete }) {
  const [state, setState] = useState(initQuiz)

  const step = currentStep(steps, state)

  const handleChange = (val) => setState((s) => setAnswer(s, step.id, val))

  const handleAdvance = () => {
    setState((s) => {
      const next = advance(steps, s)
      if (isComplete(steps, next)) onComplete(next.answers)
      return next
    })
  }

  if (!step) return null

  return (
    <div className={styles.page}>
      <div className={styles.progress}>
        <div className={styles.progressBar} style={{ width: `${progress(steps, state) * 100}%` }} />
      </div>
      <h2 className={styles.title}>{step.question}</h2>
      <QuizStep step={step} value={state.answers[step.id]} onChange={handleChange} onAdvance={handleAdvance} />
      {(step.type === 'date' || step.type === 'text') && (
        <button className={styles.cta} disabled={!canAdvance(steps, state)} onClick={handleAdvance}>
          Далее
        </button>
      )}
    </div>
  )
}
```

Примечание: choice/scale двигают шаг сразу по выбору (`onAdvance` внутри). date/text требуют кнопки «Далее».

**Step 3: Верификация** — вместе с Task 10 / финальной сборкой.

**Step 4: Коммит**

```powershell
git add frontend/app/lp/components/QuizStep.jsx frontend/app/lp/components/Quiz.jsx
git commit -m "feat(landing): экраны квиза с прогрессом

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Экран анимации расчёта

**Files:**
- Create: `frontend/app/lp/components/Calculating.jsx`

**Step 1: Реализация (таймер -> onDone)**

`frontend/app/lp/components/Calculating.jsx`:
```jsx
'use client'
import { useEffect } from 'react'
import styles from '../lp.module.css'

export default function Calculating({ onDone, duration = 2500 }) {
  useEffect(() => {
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [onDone, duration])

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Строим твою матрицу...</h2>
      <p className={styles.subtitle}>Считаем числа по дате рождения</p>
    </div>
  )
}
```

**Step 2: Коммит**

```powershell
git add frontend/app/lp/components/Calculating.jsx
git commit -m "feat(landing): экран анимации расчёта

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 9: Тизер результата (частичный разбор + пейвол)

Переиспользует движок матрицы. Бесплатно: шапка + диаграмма + блок `personality`. Под замком: блок под запрос (заблюренное превью) + `Paywall`. Для подписчика — полный `MatrixInterpretations`.

**Files:**
- Create: `frontend/app/lp/components/Teaser.jsx`

**Step 1: Реализация**

`frontend/app/lp/components/Teaser.jsx`:
```jsx
'use client'
import MatrixHeader from '../../matrix/MatrixHeader'
import MatrixSVG from '../../matrix/MatrixSVG'
import MatrixInterpretations from '../../matrix/MatrixInterpretations'
import Paywall from '../../components/ui/Paywall'
import { MATRIX_CONTENT, ASPECT_LABELS } from '../../content/matrix-content'
import { resolveFocusAspect } from '../logic/focus.js'
import styles from '../lp.module.css'

export default function Teaser({ landing, answers, matrixData, isSubscribed }) {
  const center = matrixData.nodes.center
  const content = MATRIX_CONTENT[center] || MATRIX_CONTENT[1]
  const focusAspect = resolveFocusAspect(landing, answers.focus)

  return (
    <div className={styles.page}>
      <MatrixHeader
        name={answers.name || ''}
        birthDate={matrixData.birthDate}
        age={matrixData.age}
        personalNumber={center}
      />
      <MatrixSVG nodes={matrixData.nodes} />

      {isSubscribed ? (
        <MatrixInterpretations centerNumber={center} isSubscribed />
      ) : (
        <>
          {/* Бесплатный блок */}
          <div>
            <h3 className={styles.title}>{ASPECT_LABELS.personality}</h3>
            <p>{content.personality}</p>
          </div>
          {/* Заблюренный блок под запрос пользователя */}
          <div>
            <h3 className={styles.title}>{ASPECT_LABELS[focusAspect]}</h3>
            <p className={styles.locked}>{content[focusAspect]}</p>
          </div>
          <Paywall />
        </>
      )}
    </div>
  )
}
```

**Step 2: Проверить, что импортируемые компоненты принимают эти пропсы** — сверить сигнатуры `MatrixHeader` (`name/birthDate/age/personalNumber`), `MatrixSVG` (`nodes`), `MatrixInterpretations` (`centerNumber/isSubscribed`) в `frontend/app/matrix/*`. Они уже используются так в `MatrixClient.jsx`.

**Step 3: Коммит**

```powershell
git add frontend/app/lp/components/Teaser.jsx
git commit -m "feat(landing): тизер результата с пейволом

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 10: Стейт-машина лендинга (LandingClient) + хендофф

Связывает фазы `hero → quiz → calculating → result`. Считает матрицу, сохраняет ответы, и на маунте: если пользователь подписан и есть сохранённые ответы — сразу показывает полный результат (возврат после оплаты).

**Files:**
- Modify: `frontend/app/lp/[slug]/LandingClient.jsx` (заменить заглушку из Task 5)

**Step 1: Полная реализация**

`frontend/app/lp/[slug]/LandingClient.jsx`:
```jsx
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { calculateMatrix } from '../../content/matrix'
import { loadQuiz, saveQuiz } from '../logic/quizStorage.js'
import Hero from '../components/Hero'
import Quiz from '../components/Quiz'
import Calculating from '../components/Calculating'
import Teaser from '../components/Teaser'

export default function LandingClient({ landing }) {
  const { user } = useAuth()
  const [phase, setPhase] = useState('hero')
  const [answers, setAnswers] = useState(null)
  const [matrixData, setMatrixData] = useState(null)

  const isSubscribed = user?.subscribed ?? false

  // Возврат после оплаты: подписан + есть сохранённый квиз -> сразу полный результат.
  useEffect(() => {
    if (!isSubscribed) return
    const saved = loadQuiz(landing.slug)
    if (saved?.birth_date) {
      setAnswers(saved)
      setMatrixData(calculateMatrix(saved.birth_date))
      setPhase('result')
    }
  }, [isSubscribed, landing.slug])

  const handleComplete = (a) => {
    saveQuiz(landing.slug, a)
    setAnswers(a)
    setPhase('calculating')
  }

  const handleCalculated = () => {
    setMatrixData(calculateMatrix(answers.birth_date))
    setPhase('result')
  }

  if (phase === 'hero') return <Hero hero={landing.hero} onStart={() => setPhase('quiz')} />
  if (phase === 'quiz') return <Quiz steps={landing.quiz.steps} onComplete={handleComplete} />
  if (phase === 'calculating') return <Calculating onDone={handleCalculated} />
  return <Teaser landing={landing} answers={answers} matrixData={matrixData} isSubscribed={isSubscribed} />
}
```

**Step 2: Прогнать всю воронку в dev вручную**

Открыть `http://localhost/lp/matrix`, пройти Hero → 5 шагов квиза → анимация → тизер с пейволом. Проверить, что:
- выбор в choice/scale двигает шаг сразу;
- date/text двигаются кнопкой «Далее»;
- на тизере видно диаграмму, бесплатный блок `personality` и заблюренный блок под выбранный запрос;
- виден `Paywall`.

Спот-чек разметки:
```powershell
(Invoke-WebRequest http://localhost/lp/matrix -UseBasicParsing).Content -match 'Пройти тест'
```

**Step 3: Коммит**

```powershell
git add frontend/app/lp/[slug]/LandingClient.jsx
git commit -m "feat(landing): стейт-машина воронки + хендофф после оплаты

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 11: Трекинг воронки (best-effort, не блокирующий)

`useTracking().track(event, body)` шлёт `POST /api/tracking/[event]`, а Next-прокси форвардит ЛЮБОЕ имя события на внешний TS. **Важно:** принимает ли TS кастомные события воронки (`quiz_start` и т.п.) — вне нашего контроля, это внешний трекер партнёрки. Поэтому события шлём fire-and-forget, ничего на них не завязываем. Атрибуция партнёра (`click`/`host`) уже работает и не трогается.

**Files:**
- Modify: `frontend/app/lp/[slug]/LandingClient.jsx`

**Step 1: Вплести ключевые события**

В `LandingClient` подключить `useTracking` и вызвать:
- `track('lp_view', { slug: landing.slug })` в `useEffect` на маунте (один раз);
- `track('quiz_start', { slug })` в `onStart`;
- `track('quiz_complete', { slug, focus: a.focus })` в `handleComplete`;
- `track('paywall_view', { slug })` при переходе в `result` для неподписанного.

Обернуть каждый вызов в try/catch не нужно — `track` уже `.catch(() => {})`.

**Step 2: Проверка** — открыть `/lp/matrix`, в devtools Network убедиться, что уходят `POST /api/tracking/lp_view` со статусом 200 (наш прокси всегда 200). Реальный приём на TS подтвердить у владельца трекера отдельно (записано в зависимостях дизайн-дока).

**Step 3: Коммит**

```powershell
git add frontend/app/lp/[slug]/LandingClient.jsx
git commit -m "feat(landing): best-effort трекинг событий воронки

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 12: Финальный гейт — прод-сборка

**Step 1: Прогнать все юнит-тесты разом**

```powershell
docker run --rm -v "D:\Claude\Esoteric-main\frontend:/app" -w /app node:20-alpine node --test app/lp/logic/focus.test.mjs app/lp/logic/quizMachine.test.mjs app/lp/logic/quizStorage.test.mjs app/content/landings/index.test.mjs
```
Ожидаемо: все `pass`, `fail 0`.

**Step 2: Прод-сборка**

```powershell
docker exec -e NODE_ENV=production esoteric-main-frontend-1 npm run build
```
Ожидаемо: чистый билд, в списке роутов появляется `/lp/[slug]`. Если билд падает по `<Html>`/`useContext` на `/404`,`/500` — это ложняк NODE_ENV, убедиться что передан `-e NODE_ENV=production`.

**Step 3: Вернуть корректный dev-сервер** (прод-билд затирает общий `.next`)

```powershell
docker compose -f D:\Claude\Esoteric-main\docker-compose.dev.yml restart frontend
```

**Step 4: Финальный дым-тест**

```powershell
Invoke-WebRequest http://localhost/lp/matrix -UseBasicParsing | Select-Object StatusCode
```
Ожидаемо: `200`.

**Step 5: Коммит (если остались несохранённые правки)** — иначе пропустить.

---

## Definition of Done

- [ ] `/lp/matrix` открывается, воронка Hero → квиз (5 шагов) → анимация → тизер работает.
- [ ] Тизер показывает реальную диаграмму, бесплатный `personality` и заблюренный блок под запрос + `Paywall`.
- [ ] Подписчик с сохранённым квизом при заходе на `/lp/matrix` сразу видит полный разбор (хендофф после оплаты).
- [ ] Nav скрыт на `/lp/*`, виден на остальных страницах.
- [ ] Все `*.test.mjs` зелёные; прод-сборка `NODE_ENV=production` чистая, роут `/lp/[slug]` в выдаче.
- [ ] Новый продукт-лендинг заводится добавлением одного конфига в `app/content/landings/`.

## Вне скоупа (по дизайн-доку)

Финальный визуал (переобувается из макетов Claude Design в `design-reference/landings/matrix/`), самостоятельный конструктор лендингов, email-капча и ретаргет, тематические боль-вариации (вариант C), A/B. Прямой вызов `startPayment()` с лендинга вместо перехода через `/register`→`/lk` — при желании оптимизировать конверсию позже; сейчас переиспользуем штатный путь `Paywall`.
```
