# Лендинг «Проверь его» (совместимость, ревнивый угол) — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: используй superpowers:executing-plans, чтобы исполнять этот план задача за задачей.

**Goal:** Собрать второй трафиковый лендинг-funnel `/lp/him` на движке `/lp/love`: чёрный ревнивый угол, ввод двух дат, подкрученное число совместимости, тизер с замками про срок, пейвол-подписка на весь сайт.

**Architecture:** Переиспользуем всю инфраструктуру love (quiz-машина, `Calculating`, `Hero`, трекинг, `quizStorage`, возврат после оплаты, движок матрицы). Специфику выносим в параллельный `CompatClient` + четыре compat-компонента, love не трогаем кроме безопасного обобщения пейвола. Диспатч клиента по полю `engine` в конфиге лендинга. Единственная новая логика это детерминированный «подкрученный» счёт из двух дат.

**Tech Stack:** Next.js 14 (app router), React 18, CSS-модули. Пакет-менеджер и Node только внутри Docker. Дизайн-док: `docs/plans/2026-07-14-compat-jealous-landing-design.md`.

---

## Verification model (читать до старта)

В этом фронтенде нет тест-раннера, и Node доступен только в Docker. Классический per-task TDD неприменим. Поэтому:

- **Чистая логика** (`compatScore.js`) проверяется контрактом-инвариантами (раздел в задаче) и опциональным node-скриптом. Это единственный код, где есть смысл в исполняемой проверке.
- **UI-компоненты** проверяются ревью против готовой разметки love (те же классы `lp.module.css`, тот же паттерн фаз).
- **Финал** это ручной проход `/lp/him` в запущенном dev (Docker) плюс регресс-проверка, что `/lp/love` не сломан.
- **Не делаем:** `next build` после каждой задачи, скриншоты, непроверяемые команды запуска. Коммиты частые, каждый добавляет только свои файлы явным `git add <путь>` (в ветке уже лежат несвязанные правки, их не трогаем).

Ветка: текущая `feat/astrix-homepage-redesign` (на ней уже живут коммиты lp-funnel).

---

## Task 1: Движок числа `compatScore.js`

**Files:**
- Create: `frontend/app/lp/logic/compatScore.js`
- Optional check: `frontend/app/lp/logic/compatScore.check.mjs`

**Контракт (инварианты, соблюдать всегда):**
- Детерминизм: одна пара дат всегда даёт одни и те же числа.
- `herScore` в диапазоне 28..58 (тревожная зона, никогда не успокаивающе высокая).
- `idealScore` в 72..92 и всегда строго больше `herScore` (72 > 58 гарантировано).
- `rivalScore` (по реальной дате соперницы) всегда >= `herScore + 15` и <= 95.
- Только читает узлы через `calculateMatrix`, движок матрицы не меняет.

**Step 1: Создать файл с полным кодом**

```js
// frontend/app/lp/logic/compatScore.js
// Детерминированный «подкрученный» счёт совместимости лендинга «Проверь его».
// Одна пара дат всегда даёт одно значение. Числа подкручены осознанно:
// её процент всегда в тревожной зоне, идеальная и соперница всегда выше.
// Движок матрицы (calculateMatrix) не трогаем, только читаем узлы.
import { reduce, calculateMatrix } from '../../content/matrix.js'

// Её совместимость с ним + анонимная «идеальная» + точка притяжения.
export function herVsHim(herDate, hisDate) {
  const her = calculateMatrix(herDate).nodes
  const his = calculateMatrix(hisDate).nodes
  const base = reduce(her.center + his.center)            // 1..22
  const secondary = reduce(her.female1 + his.male1)       // 1..22
  const herScore = 28 + ((base * 7 + secondary * 3) % 31) // 28..58
  const idealScore = 72 + ((base * 5 + 11) % 21)          // 72..92, всегда > herScore
  const attraction = his.female1                          // 1..22, тип женщины, к которой его тянет
  return { herScore, idealScore, attraction }
}

// Соперница по реальной дате: всегда бьёт её на видимый отрыв.
export function rivalVsHim(rivalDate, hisDate, herScore) {
  const rival = calculateMatrix(rivalDate).nodes
  const his = calculateMatrix(hisDate).nodes
  const raw = 60 + ((reduce(rival.center + his.center) * 7) % 33) // 60..92
  return Math.min(95, Math.max(raw, herScore + 15))
}
```

**Step 2 (опционально): node-проверка инвариантов**

Только если твой Docker-node резолвит ESM. Файл `compatScore.check.mjs`:

```js
import { herVsHim, rivalVsHim } from './compatScore.js'
let ok = true
const pad = (n) => String(n).padStart(2, '0')
for (let y = 1970; y <= 2000; y += 3) {
  for (let m = 1; m <= 12; m += 4) {
    const her = `1990-06-15`
    const his = `${y}-${pad(m)}-10`
    const s = herVsHim(her, his)
    const r = rivalVsHim(`1988-03-22`, his, s.herScore)
    const inv =
      s.herScore >= 28 && s.herScore <= 58 &&
      s.idealScore >= 72 && s.idealScore <= 92 &&
      s.idealScore > s.herScore &&
      s.attraction >= 1 && s.attraction <= 22 &&
      r >= s.herScore + 15 && r <= 95
    // детерминизм
    const s2 = herVsHim(her, his)
    const det = s.herScore === s2.herScore && s.idealScore === s2.idealScore
    if (!inv || !det) { ok = false; console.log('FAIL', his, s, r) }
  }
}
console.log(ok ? 'ALL INVARIANTS OK' : 'INVARIANTS BROKEN')
```

Run (в Docker): `node frontend/app/lp/logic/compatScore.check.mjs`
Expected: `ALL INVARIANTS OK`. Если запустить нельзя, проверь инварианты чтением: диапазоны следуют из `% 31`, `% 21`, `% 33` и границ band'ов.

**Step 3: Удалить check-файл (если создавал) и закоммитить**

```bash
git add frontend/app/lp/logic/compatScore.js
git commit -m "feat(lp): движок подкрученного числа совместимости (him)"
```

---

## Task 2: Копирайт `him-copy.js`

**Files:**
- Create: `frontend/app/content/landings/him-copy.js`

Зеркало `love-copy.js`: данные + резолверы, ключ = точка притяжения (число 1..22). Тексты из Приложения A дизайн-дока.

**Step 1: Создать файл**

```js
// Острый копирайт лендинга «Проверь его». Ключ = точка притяжения (число 1..22).
// opener это холодный ввод с числами (A/B-варианты), verdict это тело-приговор про тип женщины.
// Тексты пользовательские: без длинного тире.

export const OPENERS = {
  a: 'Ваша совместимость: {her}%. В его числах записана другая, и с ней он совпадает на {ideal}%. Это не абстракция. Это разница, которую он чувствует каждый день, даже когда молчит рядом с тобой.',
  b: 'Я свела ваши даты. Ты совпадаешь с ним на {her}%. А теперь то, ради чего ты пришла: в его матрице есть тип женщины, который подходит ему на {ideal}%. И судя по твоим ответам, ты уже видела её тень в его телефоне.',
  c: '{her}%. Столько между вами осталось. Его точка притяжения показывает на {ideal}%, и это не про тебя. Он ещё дома, ещё рядом, ещё говорит «тебе кажется». Но числа уже развернулись.',
}

export function fillOpener(variant, score) {
  const t = OPENERS[variant] ?? OPENERS.a
  return t.replaceAll('{her}', String(score.herScore)).replaceAll('{ideal}', String(score.idealScore))
}

export const VERDICT_FALLBACK =
  'Его тянет туда, где легче. Где им восхищаются, а не проверяют. Где его ждут, а не считают его вину. Ты не стала хуже, ты просто стала своей, привычной, разгаданной, а его числа устроены так, что новизна для него сильнее верности. Он не злодей и не собирался тебя предавать. Он просто каждый день выбирает между тем, как чувствует себя с тобой, и тем, каким мог бы быть с ней. Пока это только тяга, не поступок. Но окно, в котором его ещё можно вернуть, уже начало закрываться, и ты сама это почувствовала раньше, чем открыла эту страницу.'

// Заточенные типы (образец, ключи иллюстративны, остальные числа через FALLBACK).
export const VERDICTS = {
  3: 'Его точка притяжения это женщина без веса. С ней ничего не надо решать, не надо отчитываться, не надо быть виноватым. Ты за годы стала для него домом, а дом не будоражит, дом просто есть. А она пахнет новым, и его числа реагируют именно на это, не на её ум и не на её душу, а на то, что рядом с ней он снова чувствует азарт, который к тебе давно не приходит. Ты дала ему всё, а она не дала ничего, и именно поэтому он смотрит на неё. Это несправедливо, но так устроена его матрица. И чем дольше он это чувствует, тем короче становится время, за которое ты ещё можешь всё развернуть.',
  6: 'Ему нужно, чтобы на него смотрели снизу вверх. Ты слишком хорошо его знаешь, чтобы восхищаться: ты видела его слабым, уставшим, неправым, и он это чувствует. А она смотрит на него так, будто он лучший, и его числа тают именно от этого взгляда, а не от твоей преданности. Ты стала его зеркалом, а он ищет ту, кто станет его сценой. Проблема в том, что чем больше ты стараешься и доказываешь, тем сильнее толкаешь его к той, рядом с кем стараться не нужно. Он ещё колеблется. Но месяц, в котором колебание превращается в решение, уже близко, и он записан в ваших числах.',
  9: 'Его тянет к тишине. Не потому что ты скандалистка, а потому что рядом с тобой он всегда немного виноват, всегда на проверке, всегда чувствует твою тревогу, даже когда ты молчишь. А её образ в его числах это покой: с ней он не оправдывается. Ты держишь его контролем, а контроль он читает как клетку, и чем крепче ты сжимаешь, тем громче в нём звучит та, с которой можно просто выдохнуть. Ты боишься его потерять и этим страхом сама открываешь ей дверь. Это ещё обратимо. Но у обратимости есть срок, и он короче, чем ты думаешь.',
  11: 'Ему интересны те, кого не удержать. Ты выбрала его целиком, отдала всё и этим перестала быть загадкой, а его числа гоняются за тем, что ускользает. Она не бегает за ним, у неё своя жизнь, и именно поэтому он думает о ней в те минуты, когда ты рядом. Твоя любовь стала для него гарантией, а гарантию не завоёвывают, к ней остывают. Он всё ещё твой на бумаге. Но внутри он уже наполовину там, и есть дата, после которой «наполовину» станет «весь», если ты ничего не сделаешь.',
}

export function resolveVerdict(attraction) {
  return VERDICTS[attraction] ?? VERDICT_FALLBACK
}

// Замки тизера: три про срок + один про надежду.
export const LOCKED_QUESTIONS = [
  'Сколько у тебя осталось, прежде чем он сделает выбор',
  'Месяц, когда он решит уйти, если ты ничего не изменишь',
  'Дата, после которой удержать его будет уже нельзя',
  'Успеешь ли ты его вернуть и что для этого сделать',
]

// Result (подписчик): детерминированный месяц ухода + фолбэк-тексты.
const MONTHS = ['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре']
export function leaveMonth(score) {
  return MONTHS[(score.herScore + score.attraction) % 12]
}

export const RESULT_FALLBACK = {
  timeLeft: 'У тебя не годы, а месяцы. Его тяга уже перешла из «интересно» в «думаю о ней», и по вашим числам этот переход почти пройден. Пока он ещё не сделал выбор вслух, но внутри он его почти сделал.',
  leaveWhen: 'Это не приговор задним числом, это точка, в которой всё ещё можно вмешаться, если начать сейчас, а не после того, как он соберёт вещи.',
  keepHow: 'Вернуть его можно не тем, чтобы стараться сильнее, а тем, чтобы перестать быть предсказуемой гарантией. По вашим числам ему нужно снова почувствовать, что тебя можно потерять. Конкретные шаги под ваш расклад ниже в личном кабинете.',
}
```

**Step 2: Ревью** — проверь, что нет длинного тире, плейсхолдеры `{her}`/`{ideal}` есть только в OPENERS, ключи VERDICTS в диапазоне 1..22.

**Step 3: Коммит**

```bash
git add frontend/app/content/landings/him-copy.js
git commit -m "feat(lp): копирайт лендинга him (опенеры, приговоры, замки, result)"
```

---

## Task 3: Конфиг `him.js` + регистрация

**Files:**
- Create: `frontend/app/content/landings/him.js`
- Modify: `frontend/app/content/landings/index.js`

**Step 1: Создать конфиг**

```js
// Конфиг лендинга «Проверь его». engine=compat-jealous переключает клиента в page.jsx.
// Тексты пользовательские: без длинного тире.
export const himLanding = {
  slug: 'him',
  product: 'matrix',
  engine: 'compat-jealous',
  theme: 'jealousy',
  verdictOpener: 'a', // A/B: 'a' | 'b' | 'c'
  meta: {
    title: 'Введи две даты рождения: кого он выбрал бы вместо тебя',
    description: 'Сверь ваши даты рождения и узнай, есть ли та, кто подходит ему больше тебя, и сколько у тебя осталось.',
  },
  hero: {
    eyebrow: 'Совместимость пары',
    title: 'Введи две даты рождения. Узнай, кого он выбрал бы вместо тебя',
    titleAccent: 'вместо тебя',
    subtitle: '2 минуты и только даты рождения. Числа не умеют щадить.',
    cta: 'Проверить его',
    note: 'Честно. Даже если больно.',
  },
  quiz: {
    steps: [
      { id: 'late', type: 'choice', required: true,
        question: 'Он стал отвечать на сообщения позже, чем раньше?',
        options: [
          { value: 'yes', label: 'Да, заметно' },
          { value: 'sometimes', label: 'Иногда' },
          { value: 'no', label: 'Нет' },
        ] },
      { id: 'phone', type: 'choice', required: true,
        question: 'Кладёт телефон экраном вниз?',
        options: [
          { value: 'always', label: 'Всегда' },
          { value: 'sometimes', label: 'Бывает' },
          { value: 'no', label: 'Нет' },
        ] },
      { id: 'name', type: 'choice', required: true,
        question: 'Есть женщина, чьё имя всплывает слишком часто?',
        options: [
          { value: 'yes', label: 'Да, есть такая' },
          { value: 'maybe', label: 'Кажется, да' },
          { value: 'no', label: 'Нет' },
        ] },
      { id: 'checked', type: 'choice', required: true,
        question: 'Ты уже проверяла его переписку или хотела?',
        options: [
          { value: 'checked', label: 'Проверяла' },
          { value: 'wanted', label: 'Очень хотела' },
          { value: 'no', label: 'Нет' },
        ] },
      { id: 'distant', type: 'choice', required: true,
        question: 'Он отдалился, но говорит, что тебе кажется?',
        options: [
          { value: 'yes', label: 'Да, именно так' },
          { value: 'sometimes', label: 'Иногда' },
          { value: 'no', label: 'Нет' },
        ] },
      { id: 'ready', type: 'choice', required: true,
        question: 'Если в ваших числах записано, что он уже смотрит на другую, ты готова это увидеть?',
        options: [
          { value: 'yes', label: 'Да' },
          { value: 'afraid', label: 'Боюсь, но да' },
        ] },
      { id: 'her_date', type: 'date', required: true,
        question: 'Твоя дата рождения' },
      { id: 'his_date', type: 'date', required: true,
        question: 'Его дата рождения' },
    ],
  },
  paywall: {
    heading: 'Открой всю правду о вашей паре',
    payoffs: [
      'Вся правда про его взгляд на сторону, по вашим числам, без общих фраз',
      'Чем берёт соперница и что ты перестала давать',
      'Уйдёт ли он и в каком месяце',
      'Что сделать по вашим числам, чтобы вернуть его к тебе',
    ],
  },
}
```

**Step 2: Зарегистрировать в реестре**

Modify `frontend/app/content/landings/index.js`:

```js
import { loveLanding } from './love.js'
import { himLanding } from './him.js'

export const LANDINGS = { love: loveLanding, him: himLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
```

**Step 3: Коммит**

```bash
git add frontend/app/content/landings/him.js frontend/app/content/landings/index.js
git commit -m "feat(lp): конфиг лендинга him + регистрация в реестре"
```

---

## Task 4: Обобщить пейвол (не сломав love)

**Files:**
- Create: `frontend/app/lp/components/Paywall.jsx`
- Modify: `frontend/app/content/landings/love.js` (добавить `paywall`)
- Modify: `frontend/app/lp/components/Teaser.jsx` (love) — перейти на `Paywall`
- Delete: `frontend/app/lp/components/LovePaywall.jsx`

**Step 1: Создать `Paywall.jsx`** (копия `LovePaywall`, где heading и payoffs приходят пропсами; ценовой блок и логика без изменений)

```jsx
'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import styles from '../lp.module.css'

export default function Paywall({ slug, heading, payoffs, onRestart }) {
  const { user } = useAuth()
  const router = useRouter()
  const { track } = useTracking()

  const onClick = () => {
    track('cta_click', { slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${slug}`) } catch {}
    router.push(user ? '/lk' : '/register')
  }

  return (
    <div className={`${styles.paywall} ${styles.paywallGrid}`}>
      <div>
        <div className={styles.eyebrow}>Полный разбор</div>
        <h2 className={styles.h2} style={{ marginTop: 12 }}>{heading}</h2>
        <ul className={styles.payoffs} style={{ marginTop: 24 }}>
          {payoffs.map((p) => (
            <li key={p} className={styles.payoffRow}>
              <span className={styles.payoffMark}>✦</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.priceCard}>
        <div className={styles.priceCardLabel}>Доступ к полному разбору</div>
        <div className={styles.priceRow}>
          <span className={styles.price}>7 дней</span>
        </div>
        <div className={styles.priceNote}>Бесплатно, дальше по подписке. Отмена в любой момент.</div>
        <button className={`${styles.cta} ${styles.ctaFull}`} onClick={onClick}>
          Открыть полный разбор →
        </button>
        <div className={styles.priceSecure}>🔒 Безопасно · доступ сразу после оформления</div>
        {!user && (
          <p className={styles.loginNote}>Уже оформили? <a href="/login">Войти</a></p>
        )}
      </div>

      {onRestart && (
        <button className={`${styles.linkBtn} ${styles.restart}`} onClick={onRestart}>
          ← пройти заново
        </button>
      )}
    </div>
  )
}
```

**Step 2: Добавить `paywall` в `love.js`** (тексты дословно из текущего `LovePaywall`, чтобы love не изменился визуально). В объект `loveLanding` добавить поле:

```js
  paywall: {
    heading: 'Открой, что твоя матрица уже знает о твоих отношениях',
    payoffs: [
      'Ответы на все три вопроса, по твоей матрице, без общих фраз',
      'Твой повторяющийся сценарий и точка, где он рвётся',
      'Годы, когда открывается окно для настоящей связи',
    ],
  },
```

**Step 3: Переключить love `Teaser.jsx`** на `Paywall`. Заменить импорт и использование:

```jsx
// было: import LovePaywall from './LovePaywall'
import Paywall from './Paywall'
// ...
// было: <LovePaywall slug={landing.slug} onRestart={onRestart} />
<Paywall slug={landing.slug} heading={landing.paywall.heading} payoffs={landing.paywall.payoffs} onRestart={onRestart} />
```

**Step 4: Удалить `LovePaywall.jsx`**

**Step 5: Ревью-регресс** — grep, что `LovePaywall` больше нигде не импортируется; heading и три payoff'а love совпадают с прежними дословно.

**Step 6: Коммит**

```bash
git add frontend/app/lp/components/Paywall.jsx frontend/app/content/landings/love.js frontend/app/lp/components/Teaser.jsx
git rm frontend/app/lp/components/LovePaywall.jsx
git commit -m "refactor(lp): обобщить пейвол в Paywall (heading/payoffs из конфига)"
```

---

## Task 5: Параметризовать `Calculating`

**Files:**
- Modify: `frontend/app/lp/components/Calculating.jsx`

Добавить опциональные пропсы `title` и `lines` с дефолтами = текущие тексты love, чтобы love не изменился.

**Step 1: Правка сигнатуры и дефолтов**

```jsx
const DEFAULT_LINES = [
  'Раскладываю числа твоей даты…',
  'Строю мужскую и женскую линии…',
  'Нахожу твой повторяющийся сценарий…',
]

export default function Calculating({ onDone, duration = 2600, title = 'Считываю твою матрицу отношений…', lines = DEFAULT_LINES }) {
  // ...без изменений до вычисления sub...
  const sub = pct < 40 ? lines[0] : pct < 75 ? lines[1] : lines[2]
  // в разметке: <h2 ...>{title}</h2> и <p ...>{sub}</p>
}
```

**Step 2: Ревью** — love вызывает `<Calculating onDone=... />` без новых пропсов, значит поведение прежнее.

**Step 3: Коммит**

```bash
git add frontend/app/lp/components/Calculating.jsx
git commit -m "refactor(lp): Calculating принимает title/lines (дефолты love)"
```

---

## Task 6: Экран вердикта `CompatVerdict.jsx`

**Files:**
- Create: `frontend/app/lp/components/CompatVerdict.jsx`

Переиспользует классы `lp.module.css` (funnel, shell, matrix, verdictText, body, eyebrow, pointChip, cta, center). Новых классов не заводим.

**Step 1: Создать компонент**

```jsx
'use client'
import { fillOpener, resolveVerdict } from '../../content/landings/him-copy.js'
import styles from '../lp.module.css'

export default function CompatVerdict({ score, landing, onNext }) {
  const opener = fillOpener(landing.verdictOpener ?? 'a', score)
  const body = resolveVerdict(score.attraction)

  return (
    <section className={`${styles.funnel} ${styles.shell}`}>
      <div className={styles.matrix}>
        <div className={styles.matrixCopy}>
          <div className={styles.eyebrow}>Ваш разбор готов</div>
          <div className={styles.center} style={{ margin: '14px 0' }}>
            <span className={styles.pointChip}>ты <b>{score.herScore}%</b></span>{' '}
            <span className={styles.pointChip}>идеальная для него <b>{score.idealScore}%</b></span>
          </div>
          <div className={styles.verdictText}>
            <p className={styles.body}>{opener}</p>
            <p className={styles.body}>{body}</p>
          </div>
          <div className={styles.center} style={{ margin: '8px 0 18px' }}>
            <span className={styles.pointChip}>точка притяжения <b>{score.attraction}</b></span>
          </div>
          <button className={`${styles.cta} ${styles.ctaFull}`} onClick={onNext}>
            Показать, кто она →
          </button>
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/lp/components/CompatVerdict.jsx
git commit -m "feat(lp): экран вердикта him (опенер + приговор + пруф-числа)"
```

---

## Task 7: Экран соперницы `RivalCheck.jsx`

**Files:**
- Create: `frontend/app/lp/components/RivalCheck.jsx`

**Step 1: Создать компонент**

```jsx
'use client'
import { useState } from 'react'
import styles from '../lp.module.css'

export default function RivalCheck({ score, onDone }) {
  const [date, setDate] = useState('')

  return (
    <section className={`${styles.funnel} ${styles.shell}`}>
      <div className={styles.teaser}>
        <div className={styles.eyebrow}>Проверка соперницы</div>
        <h2 className={styles.h2} style={{ marginTop: 12 }}>
          Знаешь её дату рождения? Введи, и я сравню вас напрямую.
        </h2>
        <p className={styles.body} style={{ marginTop: 10 }}>
          Ты совпадаешь с ним на {score.herScore}%. Посмотрим, насколько совпадает она.
        </p>
        <div className={styles.fieldRow} style={{ marginTop: 18 }}>
          <input className={styles.field} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button className={`${styles.cta} ${styles.ctaFull}`} style={{ marginTop: 16 }}
          disabled={!date} onClick={() => onDone(date)}>
          Сравнить нас →
        </button>
        <button className={styles.linkBtn} style={{ marginTop: 10 }} onClick={() => onDone(null)}>
          Пропустить
        </button>
      </div>
    </section>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/lp/components/RivalCheck.jsx
git commit -m "feat(lp): экран проверки соперницы (опциональная третья дата)"
```

---

## Task 8: Тизер `CompatTeaser.jsx`

**Files:**
- Create: `frontend/app/lp/components/CompatTeaser.jsx`

**Step 1: Создать компонент**

```jsx
'use client'
import Paywall from './Paywall'
import { LOCKED_QUESTIONS } from '../../content/landings/him-copy.js'
import styles from '../lp.module.css'

export default function CompatTeaser({ landing, score, rivalScore, onRestart }) {
  return (
    <section className={`${styles.funnel} ${styles.shell}`}>
      <div className={styles.teaser}>
        <div className={styles.teaserHead}>
          <div className={styles.eyebrow}>Твой разбор готов</div>
          <h2 className={styles.h2} style={{ marginTop: 14 }}>
            Четыре ответа, которые уже посчитаны по вашим числам
          </h2>
        </div>

        <div className={styles.center} style={{ marginTop: 18 }}>
          <span className={styles.pointChip}>ты <b>{score.herScore}%</b></span>{' '}
          {rivalScore != null
            ? <span className={styles.pointChip}>она <b>{rivalScore}%</b></span>
            : <span className={styles.pointChip}>идеальная <b>{score.idealScore}%</b></span>}
        </div>

        <ul className={styles.lockList}>
          {LOCKED_QUESTIONS.map((q, i) => (
            <li key={q} className={styles.lockRow} style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
              <span className={styles.lockRowIcon} aria-hidden>🔒</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>

        <div className={styles.assurance}>
          Ответы уже рассчитаны по вашим датам. Осталось их открыть.
        </div>

        <Paywall slug={landing.slug} heading={landing.paywall.heading} payoffs={landing.paywall.payoffs} onRestart={onRestart} />
      </div>
    </section>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/lp/components/CompatTeaser.jsx
git commit -m "feat(lp): тизер him (замки про срок + пейвол)"
```

---

## Task 9: Result подписчика `CompatResult.jsx`

**Files:**
- Create: `frontend/app/lp/components/CompatResult.jsx`

Переиспользует классы love `Result` (result, resultBlock, triumph, center, pointChip).

**Step 1: Создать компонент**

```jsx
'use client'
import { useRouter } from 'next/navigation'
import { resolveVerdict, leaveMonth, RESULT_FALLBACK } from '../../content/landings/him-copy.js'
import styles from '../lp.module.css'

export default function CompatResult({ score, rivalScore }) {
  const router = useRouter()
  const month = leaveMonth(score)

  return (
    <section className={`${styles.funnel} ${styles.shell}`}>
      <div className={styles.result}>
        <div className={`${styles.eyebrow} ${styles.center}`}>Вот вся правда о вашей паре</div>

        <div className={styles.center} style={{ marginBottom: 8 }}>
          <span className={styles.pointChip}>ты <b>{score.herScore}%</b></span>{' '}
          <span className={styles.pointChip}>
            {rivalScore != null ? 'она' : 'идеальная'} <b>{rivalScore ?? score.idealScore}%</b>
          </span>
        </div>

        <div className={styles.resultBlock}>
          <h3>Сколько у тебя осталось</h3>
          <p>{RESULT_FALLBACK.timeLeft}</p>
        </div>

        <div className={styles.resultBlock}>
          <h3>Когда он решит уйти</h3>
          <p>Если ничего не менять, поворот приходится на {month}. {RESULT_FALLBACK.leaveWhen}</p>
        </div>

        <div className={styles.resultBlock}>
          <h3>Чем она берёт его</h3>
          <p>{resolveVerdict(score.attraction)}</p>
        </div>

        <div className={styles.resultBlock}>
          <h3>Как вернуть его к тебе</h3>
          <p>{RESULT_FALLBACK.keepHow}</p>
        </div>

        <div className={styles.triumph}>
          <h3>Готово. Теперь тебе доступны все продукты Astrix</h3>
          <p>Матрица, таро, гороскоп и нумерология. Подписка открыта во всём сервисе.</p>
          <button className={`${styles.cta} ${styles.ctaFull}`} onClick={() => router.push('/')}>
            Перейти в Astrix →
          </button>
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/lp/components/CompatResult.jsx
git commit -m "feat(lp): полный разбор подписчику (him result)"
```

---

## Task 10: Оркестратор `CompatClient.jsx`

**Files:**
- Create: `frontend/app/lp/[slug]/CompatClient.jsx`

Аналог `LandingClient`, но две даты, фаза `rival`, compat-расчёт. Фазы: hero → quiz → calculating → verdict → rival → teaser | result.

**Step 1: Создать компонент**

```jsx
'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { herVsHim, rivalVsHim } from '../logic/compatScore.js'
import { loadQuiz, saveQuiz } from '../logic/quizStorage.js'
import Hero from '../components/Hero'
import Quiz from '../components/Quiz'
import Calculating from '../components/Calculating'
import CompatVerdict from '../components/CompatVerdict'
import RivalCheck from '../components/RivalCheck'
import CompatTeaser from '../components/CompatTeaser'
import CompatResult from '../components/CompatResult'

const CALC_LINES = [
  'Сверяю ваши числа…',
  'Строю его точку притяжения…',
  'Ищу зону риска…',
]

export default function CompatClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const [phase, setPhase] = useState('hero')
  const [answers, setAnswers] = useState(null)
  const [score, setScore] = useState(null)
  const [rivalScore, setRivalScore] = useState(null)

  const isSubscribed = user?.subscribed ?? false

  useEffect(() => {
    track('lp_view', { slug: landing.slug })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат после оплаты: подписан + сохранённые даты -> сразу result.
  useEffect(() => {
    if (!isSubscribed) return
    const saved = loadQuiz(landing.slug)
    if (saved?.her_date && saved?.his_date) {
      setAnswers(saved)
      setScore(herVsHim(saved.her_date, saved.his_date))
      setPhase('result')
    }
  }, [isSubscribed, landing.slug])

  const handleStart = () => { track('quiz_start', { slug: landing.slug }); setPhase('quiz') }

  const handleComplete = (a) => {
    track('quiz_complete', { slug: landing.slug })
    saveQuiz(landing.slug, a)
    setAnswers(a)
    setPhase('calculating')
  }

  const handleCalculated = () => {
    setScore(herVsHim(answers.her_date, answers.his_date))
    track('verdict_view', { slug: landing.slug })
    setPhase('verdict')
  }

  const handleRival = (rivalDate) => {
    if (rivalDate) {
      setRivalScore(rivalVsHim(rivalDate, answers.his_date, score.herScore))
      track('rival_check', { slug: landing.slug, entered: true })
    } else {
      track('rival_check', { slug: landing.slug, entered: false })
    }
    if (!isSubscribed) track('paywall_view', { slug: landing.slug })
    setPhase('teaser')
  }

  const handleRestart = () => {
    setAnswers(null); setScore(null); setRivalScore(null); setPhase('hero')
  }

  if (phase === 'hero') return <Hero hero={landing.hero} onStart={handleStart} />
  if (phase === 'quiz')
    return <Quiz steps={landing.quiz.steps} onComplete={handleComplete} onBack={() => setPhase('hero')} />
  if (phase === 'calculating')
    return <Calculating onDone={handleCalculated} title="Сверяю ваши числа…" lines={CALC_LINES} />
  if (phase === 'verdict')
    return <CompatVerdict score={score} landing={landing} onNext={() => setPhase('rival')} />
  if (phase === 'rival')
    return <RivalCheck score={score} onDone={handleRival} />
  if (isSubscribed)
    return <CompatResult score={score} rivalScore={rivalScore} />
  return <CompatTeaser landing={landing} score={score} rivalScore={rivalScore} onRestart={handleRestart} />
}
```

**Step 2: Ревью** — импорты путей совпадают с love `LandingClient` (те же относительные пути `../components`, `../logic`, `../../context`, `../../hooks`).

**Step 3: Коммит**

```bash
git add "frontend/app/lp/[slug]/CompatClient.jsx"
git commit -m "feat(lp): CompatClient — оркестратор фаз лендинга him"
```

---

## Task 11: Диспатч клиента в `page.jsx`

**Files:**
- Modify: `frontend/app/lp/[slug]/page.jsx`

**Step 1: Правка** — выбрать клиента по `landing.engine` (love без `engine` -> LandingClient).

```jsx
import { notFound } from 'next/navigation'
import { getLanding } from '../../content/landings/index.js'
import LandingClient from './LandingClient'
import CompatClient from './CompatClient'

export function generateMetadata({ params }) {
  const l = getLanding(params.slug)
  if (!l) return {}
  return { title: l.meta.title, description: l.meta.description, robots: { index: true, follow: true } }
}

export default function LandingPage({ params }) {
  const landing = getLanding(params.slug)
  if (!landing) notFound()
  const Client = landing.engine === 'compat-jealous' ? CompatClient : LandingClient
  return <Client landing={landing} />
}
```

**Step 2: Коммит**

```bash
git add "frontend/app/lp/[slug]/page.jsx"
git commit -m "feat(lp): диспатч клиента лендинга по engine"
```

---

## Task 12: Финальная проверка (ручной проход + регресс love)

**Не пишем код.** В запущенном dev (Docker), если доступен, проверяем сквозной сценарий. Если запуск недоступен, проходим тот же чеклист ревью-ом кода.

**Чеклист `/lp/him`:**
1. `/lp/him` открывается, hero показывает заголовок с акцентом «вместо тебя».
2. Кнопка ведёт в квиз, 6 choice-шагов + 2 поля дат, прогресс-бар растёт.
3. После ввода двух дат идёт `Calculating` с текстом «Сверяю ваши числа…».
4. Вердикт: два чипа процентов (ты X% < идеальная Y%), опенер с этими же числами, тело-приговор, чип точки притяжения, кнопка «Показать, кто она».
5. Экран соперницы: ввод даты -> в тизере чип «она Z%», где Z >= X+15; «Пропустить» -> в тизере чип «идеальная Y%».
6. Тизер: 4 замка про срок, пейвол «Открой всю правду о вашей паре» с 4 payoff'ами, кнопка ведёт на `/register` (гость) или `/lk`.
7. Одна и та же пара дат при повторном проходе даёт те же числа.

**Регресс `/lp/love`:**
8. `/lp/love` проходит весь funnel как раньше, пейвол показывает прежний заголовок и три payoff'а, вёрстка не поехала.

**Аналитика:** в консоли/сети видны события `lp_view`, `quiz_start`, `quiz_complete`, `verdict_view`, `rival_check`, `paywall_view`, `cta_click`.

Если всё зелёное, фича готова. Финальный коммит не нужен (код уже закоммичен по задачам).

---

## Карта файлов (итог)

**Создаём:**
- `frontend/app/lp/logic/compatScore.js`
- `frontend/app/content/landings/him-copy.js`
- `frontend/app/content/landings/him.js`
- `frontend/app/lp/components/Paywall.jsx`
- `frontend/app/lp/components/CompatVerdict.jsx`
- `frontend/app/lp/components/RivalCheck.jsx`
- `frontend/app/lp/components/CompatTeaser.jsx`
- `frontend/app/lp/components/CompatResult.jsx`
- `frontend/app/lp/[slug]/CompatClient.jsx`

**Меняем:**
- `frontend/app/content/landings/index.js` (регистрация him)
- `frontend/app/content/landings/love.js` (+paywall)
- `frontend/app/lp/components/Teaser.jsx` (love -> Paywall)
- `frontend/app/lp/components/Calculating.jsx` (пропсы title/lines)
- `frontend/app/lp/[slug]/page.jsx` (диспатч по engine)

**Удаляем:**
- `frontend/app/lp/components/LovePaywall.jsx`

**Новой CSS не требуется:** все экраны переиспользуют существующие классы `lp.module.css`.
