# Taro live-reveal landing (флагман «на него») Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Собрать байт-лендинг `/lp/taro-him` на новом движке `live-reveal`: пользовательница выбирает вопрос про мужчину, вводит его имя, расклад разворачивается сам и обрывается на выбранном вопросе, дальше пейвол.

**Architecture:** Тот же паттерн, что у `compat-jealous`: `page.jsx` по `landing.engine` выбирает клиента. Новый `RevealClient` это фазовая стейт-машина (`input → attuning → reveal → paywall`), переиспользующая `Calculating`, `Paywall`, `TarotCard`, `deck.js`, `quizStorage`, `useTracking`. Вся уникальная логика (детерминированный подбор карт по имени, интерполяция имени, сборка расклада) вынесена в чистый модуль `revealMachine.js` с юнит-тестами. Всё клиентское, бэкенд не трогаем.

**Tech Stack:** Next.js 14 (app router), React 18, CSS-модули, `node:test` для юнит-тестов (`.test.mjs`). Существующая колода Таро (`content/tarot/deck.js`, картинки `public/cards/*.png`).

**Reference docs:** [дизайн](2026-07-15-taro-live-reveal-landing-design.md), [копи-бриф](2026-07-15-taro-live-reveal-copy-brief.md).

**Как гонять тесты:** из каталога `frontend/` в проектном Node (Docker): `node --test app/lp/logic/<file>.test.mjs`. Существующие `.test.mjs` запускаются так же (в `package.json` отдельного скрипта нет).

**Правила копирайта (соблюдать в текстах):** тон жёсткий, Барнум (никаких проверяемых событий), имя `{name}` только как подлежащее, без длинного тире.

---

## Task 1: Чистая логика `revealMachine.js`

**Files:**
- Create: `frontend/app/lp/logic/revealMachine.js`
- Test: `frontend/app/lp/logic/revealMachine.test.mjs`

**Step 1: Написать падающий тест**

Создать `frontend/app/lp/logic/revealMachine.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeName, interpolate, seedFromName, pickCards, buildReveal } from './revealMachine.js'

const question = {
  id: 'return',
  lockTitle: 'Вернётся ли {name} к тебе',
  cards: [
    { position: 'Где он сейчас', text: '{name} думает о тебе.' },
    { position: 'Что внутри', text: 'Его тянет к тебе.' },
    { position: 'Поворот', text: 'Рядом карта риска.' },
  ],
  lockText: 'Вернётся ли {name}, ответ закрыт',
}

test('normalizeName обрезает, схлопывает пробелы, режет управляющие символы', () => {
  assert.equal(normalizeName('  Артём\t '), 'Артём')
  assert.equal(normalizeName('a'.repeat(50)).length, 24)
  assert.equal(normalizeName(null), '')
})

test('interpolate заменяет все {name}', () => {
  assert.equal(interpolate('{name} и {name}', 'Артём'), 'Артём и Артём')
})

test('seedFromName детерминирован и различает имена', () => {
  assert.equal(seedFromName('Артём'), seedFromName('Артём'))
  assert.notEqual(seedFromName('Артём'), seedFromName('Игорь'))
})

test('pickCards: детерминирован по имени, без дублей, нужное количество', () => {
  const a = pickCards('Артём', 4)
  const b = pickCards('Артём', 4)
  assert.deepEqual(a.map((c) => c.number), b.map((c) => c.number))
  assert.equal(a.length, 4)
  assert.equal(new Set(a.map((c) => c.number)).size, 4)
})

test('buildReveal: 3 открытых + 1 закрытая, {name} подставлен, детерминизм', () => {
  const r1 = buildReveal(question, ' Артём ')
  const r2 = buildReveal(question, 'Артём')
  assert.equal(r1.cards.length, 4)
  assert.equal(r1.cards.filter((c) => c.locked).length, 1)
  assert.equal(r1.cards[3].locked, true)
  assert.equal(r1.cards[0].locked, false)
  assert.ok(r1.cards[0].text.includes('Артём'))
  assert.ok(!r1.cards[0].text.includes('{name}'))
  assert.equal(r1.cards[3].position, 'Вернётся ли Артём к тебе')
  assert.deepEqual(r1.cards.map((c) => c.card.number), r2.cards.map((c) => c.card.number))
})
```

**Step 2: Запустить тест, убедиться что падает**

Run: `node --test app/lp/logic/revealMachine.test.mjs`
Expected: FAIL (`Cannot find module './revealMachine.js'`).

**Step 3: Написать минимальную реализацию**

Создать `frontend/app/lp/logic/revealMachine.js`:

```js
// Чистая логика движка live-reveal: нормализация имени, детерминированный
// подбор карт по имени, сборка расклада. Без React и без сети, тестируется node:test.
import { DECK } from '../../content/tarot/deck.js'

const MAX_NAME = 24

// Обрезать до MAX_NAME, схлопнуть пробелы, срезать управляющие символы.
export function normalizeName(raw) {
  if (!raw) return ''
  return String(raw)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME)
}

export function interpolate(text, name) {
  return String(text).split('{name}').join(name)
}

// Детерминированный 32-битный хеш строки (xmur3-подобный).
export function seedFromName(name) {
  let h = 1779033703 ^ name.length
  for (let i = 0; i < name.length; i += 1) {
    h = Math.imul(h ^ name.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

// mulberry32 PRNG от целочисленного сида.
function prng(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// count различных карт из колоды, детерминированно по имени.
export function pickCards(name, count, deck = DECK) {
  const rand = prng(seedFromName(name))
  const pool = deck.slice()
  const picked = []
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const j = Math.floor(rand() * pool.length)
    picked.push(pool.splice(j, 1)[0])
  }
  return picked
}

// Собрать расклад для выбранного вопроса и имени: 3 открытых карты + 1 закрытая.
export function buildReveal(question, rawName, deck = DECK) {
  const name = normalizeName(rawName)
  const cards = pickCards(name, question.cards.length + 1, deck)
  const open = question.cards.map((c, i) => ({
    card: cards[i],
    position: c.position,
    text: interpolate(c.text, name),
    locked: false,
  }))
  const last = cards[cards.length - 1]
  const lock = {
    card: last,
    position: interpolate(question.lockTitle, name),
    text: interpolate(question.lockText, name),
    locked: true,
  }
  return { name, cards: [...open, lock] }
}
```

**Step 4: Запустить тест, убедиться что проходит**

Run: `node --test app/lp/logic/revealMachine.test.mjs`
Expected: PASS (все тесты зелёные).

**Step 5: Коммит**

```bash
git add frontend/app/lp/logic/revealMachine.js frontend/app/lp/logic/revealMachine.test.mjs
git commit -m "feat(lp): чистая логика движка live-reveal (подбор карт по имени)"
```

---

## Task 2: Копирайт `taro-him-copy.js`

**Files:**
- Create: `frontend/app/content/landings/taro-him-copy.js`
- Test: `frontend/app/content/landings/taro-him-copy.test.mjs`

**Step 1: Написать падающий тест**

Создать `frontend/app/content/landings/taro-him-copy.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TARO_HIM_COPY } from './taro-him-copy.js'

test('4 вопроса, у каждого 3 карты + lockText + lockTitle', () => {
  assert.equal(TARO_HIM_COPY.questions.length, 4)
  for (const q of TARO_HIM_COPY.questions) {
    assert.equal(q.cards.length, 3)
    assert.ok(q.lockText && q.lockTitle && q.label && q.id)
  }
})

test('пейвол: ровно 4 выгоды и заголовок с {name}', () => {
  assert.equal(TARO_HIM_COPY.paywall.payoffs.length, 4)
  assert.ok(TARO_HIM_COPY.paywall.heading.includes('{name}'))
})

test('нигде нет длинного тире', () => {
  const blob = JSON.stringify(TARO_HIM_COPY)
  assert.ok(!blob.includes('—'))
})
```

**Step 2: Запустить тест, убедиться что падает**

Run: `node --test app/content/landings/taro-him-copy.test.mjs`
Expected: FAIL (`Cannot find module './taro-him-copy.js'`).

**Step 3: Написать реализацию (тексты из копи-брифа дословно)**

Создать `frontend/app/content/landings/taro-him-copy.js`:

```js
// Тексты лендинга Таро «на него». Пользовательский копирайт (НЕ боевые толкования
// из content/tarot/texts). Правила: тон жёсткий, Барнум, {name} только как подлежащее,
// без длинного тире. Источник: docs/plans/2026-07-15-taro-live-reveal-copy-brief.md.
export const TARO_HIM_COPY = {
  meta: {
    title: 'Расклад Таро на него: что он скрывает и вернётся ли',
    description: 'Введи его имя и вопрос, который не даёт покоя. Карты ответят честно, даже если будет больно.',
  },
  hero: {
    eyebrow: 'Расклад Таро на него',
    title: 'Введи его имя. Карты скажут о нём то, что ты чувствуешь, но не можешь проверить.',
    subtitle: 'Выбери вопрос, который не даёт тебе спать. Колода ответит именно на него.',
  },
  input: {
    heading: 'Как его зовут?',
    subhead: 'Того самого. Колода настроится лично на него.',
    placeholder: 'Его имя',
    cta: 'Разложить карты',
  },
  attuning: {
    title: 'Настраиваю колоду на него…',
    lines: [
      '{name} ещё не знает, что карты уже говорят о нём…',
      'Считываю, что он прячет за словами…',
      'Свожу его линию с твоей…',
    ],
  },
  revealIntro: 'Колода легла. Три карты открыты. Последняя ждёт тебя.',
  questions: [
    {
      id: 'return',
      label: 'Вернётся ли он ко мне',
      lockTitle: 'Вернётся ли {name} к тебе',
      cards: [
        { position: 'Где он сейчас', text: '{name} не так спокоен без тебя, как хочет казаться. Ты всё ещё всплываешь у него в мыслях, даже когда он это отрицает.' },
        { position: 'Что внутри', text: 'Его тянет к тебе сильнее, чем он готов признать, но гордость и страх снова проиграть держат его на расстоянии. Он ждёт от тебя знака и не получает его.' },
        { position: 'Поворот', text: 'Рядом легла карта, которую ты не захочешь видеть: ты рискуешь оказаться не единственной в его поле. Времени у тебя меньше, чем кажется.' },
      ],
      lockText: 'Последняя карта отвечает прямо, вернётся ли {name} и в каком месяце. Он вернётся, только если ты в ближайшие дни',
    },
    {
      id: 'feelings',
      label: 'Что он на самом деле ко мне чувствует',
      lockTitle: 'Что {name} чувствует к тебе',
      cards: [
        { position: 'Где он сейчас', text: '{name} держит лицо, но внутри не так спокойно, как показывает. Твоё имя всплывает у него чаще, чем он позволяет себе признать.' },
        { position: 'Что внутри', text: 'Под равнодушием прячется то, что он боится назвать. Он хочет тебя, но привык этого не показывать, чтобы держать контроль.' },
        { position: 'Поворот', text: 'Но есть вторая сторона: одна карта показывает, что часть его уже отпускает тебя. Каждый день без шага навстречу тушит то, что ещё горит.' },
      ],
      lockText: 'Последняя карта говорит без прикрас, что {name} чувствует к тебе: любовь, привычку или уже пустоту. Ответ перед тобой, но закрыт',
    },
    {
      id: 'hides',
      label: 'Что он от меня скрывает',
      lockTitle: 'Что {name} от тебя скрывает',
      cards: [
        { position: 'Где он сейчас', text: '{name} что-то не договаривает, и карты подтверждают это сразу. Есть тема, которую он обходит каждый раз, когда ты подходишь близко.' },
        { position: 'Что внутри', text: 'То, что он прячет, связано не с работой. Карта указывает на человека и на переписку, которую он не хочет тебе показывать.' },
        { position: 'Поворот', text: 'Он умеет уходить от прямого вопроса и делать так, что виноватой чувствуешь себя ты. Так ведут себя, когда есть что терять.' },
      ],
      lockText: 'Последняя карта называет прямо, что именно {name} скрывает и как давно. Она уже легла, но закрыта',
    },
    {
      id: 'rival',
      label: 'Есть ли у него другая',
      lockTitle: 'Есть ли у {name} другая',
      cards: [
        { position: 'Где он сейчас', text: 'В раскладе рядом с ним встаёт женская фигура. Она не случайна, карта ставит её слишком близко к нему.' },
        { position: 'Что внутри', text: 'Ей достаётся то внимание, которого тебе давно не хватает. Пока ты гадаешь, она получает его лёгким, той версией, которую ты почти не видишь.' },
        { position: 'Поворот', text: 'Это ещё не измена в открытую, но черта близко. Карта показывает, сколько у тебя осталось, прежде чем всё решится не в твою пользу.' },
      ],
      lockText: 'Последняя карта отвечает без жалости, есть ли другая, кто она и насколько это серьёзно. Ответ перевёрнут перед тобой',
    },
  ],
  paywall: {
    heading: 'Переверни последнюю карту и узнай, что {name} скрыл',
    payoffs: [
      'Прямой ответ на твой вопрос про него, без общих фраз',
      'Что он чувствует к тебе прямо сейчас и что будет дальше',
      'Есть ли рядом другая и чем именно она тебя обошла',
      'Что сделать в ближайшие дни, чтобы всё повернулось к тебе',
    ],
    urgency: 'Карты на него уже легли. Осталось перевернуть последнюю.',
  },
  microcopy: { back: 'назад', toLock: 'Открыть полный расклад' },
}
```

**Step 4: Запустить тест, убедиться что проходит**

Run: `node --test app/content/landings/taro-him-copy.test.mjs`
Expected: PASS.

**Step 5: Коммит**

```bash
git add frontend/app/content/landings/taro-him-copy.js frontend/app/content/landings/taro-him-copy.test.mjs
git commit -m "feat(lp): копирайт лендинга Таро на него (4 ветки, пейвол)"
```

---

## Task 3: Конфиг `taro-him.js` + регистрация в реестре

**Files:**
- Create: `frontend/app/content/landings/taro-him.js`
- Modify: `frontend/app/content/landings/index.js`
- Test: `frontend/app/content/landings/index.test.mjs` (дополнить)

**Step 1: Дополнить тест реестра**

В `frontend/app/content/landings/index.test.mjs` добавить в конец:

```js
test('getLanding отдаёт конфиг taro-him на движке live-reveal', () => {
  const l = getLanding('taro-him')
  assert.equal(l.slug, 'taro-him')
  assert.equal(l.engine, 'live-reveal')
  assert.equal(l.product, 'tarot')
  assert.equal(l.questions.length, 4)
})
```

**Step 2: Запустить тест, убедиться что падает**

Run: `node --test app/content/landings/index.test.mjs`
Expected: FAIL (`getLanding('taro-him')` вернёт `null`, `l.slug` бросит на `null`).

**Step 3: Создать конфиг и зарегистрировать**

Создать `frontend/app/content/landings/taro-him.js`:

```js
// Конфиг лендинга «Расклад Таро на него». engine=live-reveal переключает клиента в page.jsx.
// Тексты в taro-him-copy.js. Тексты пользовательские: без длинного тире.
import { TARO_HIM_COPY } from './taro-him-copy.js'

export const taroHimLanding = {
  slug: 'taro-him',
  product: 'tarot',
  engine: 'live-reveal',
  theme: 'him',
  ...TARO_HIM_COPY,
}
```

Изменить `frontend/app/content/landings/index.js`:

```js
import { loveLanding } from './love.js'
import { himLanding } from './him.js'
import { taroHimLanding } from './taro-him.js'

export const LANDINGS = { love: loveLanding, him: himLanding, 'taro-him': taroHimLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
```

**Step 4: Запустить тест, убедиться что проходит**

Run: `node --test app/content/landings/index.test.mjs`
Expected: PASS (включая старые тесты love/matrix/null).

**Step 5: Коммит**

```bash
git add frontend/app/content/landings/taro-him.js frontend/app/content/landings/index.js frontend/app/content/landings/index.test.mjs
git commit -m "feat(lp): конфиг taro-him + регистрация в реестре лендингов"
```

---

## Task 4: Стили движка в `lp.module.css`

**Files:**
- Modify: `frontend/app/lp/lp.module.css` (добавить в конец)

Компонентных тестов в проекте нет, поэтому шаги 4-7 верифицируются сборкой и ручной проверкой в конце. Стили добавляем до компонентов, чтобы они сразу выглядели правильно.

**Step 1: Добавить классы**

В конец `frontend/app/lp/lp.module.css` дописать (существующие `.cosmic*`, `.cta`, `.field`, `.options`, `.option`, `.hero*`, `.h1`, `.lead`, `.eyebrow`, `.linkBtn`, `.micro` переиспользуем как есть):

```css
/* --- Движок live-reveal --- */
.reveal { max-width: 560px; margin: 0 auto; padding: 24px 20px 40px; text-align: center; }
.revealIntro { color: var(--lp-muted, #b9b4d0); font-size: 15px; margin-bottom: 20px; }
.revealRow { display: flex; justify-content: center; gap: 12px; margin: 8px 0 20px; }
.revealSlot { display: flex; flex-direction: column; align-items: center; gap: 8px; opacity: .35; transform: translateY(6px); transition: opacity .5s ease, transform .5s ease; }
.revealSlotOpen { opacity: 1; transform: none; }
.revealPos { font-size: 12px; letter-spacing: .04em; color: var(--lp-muted, #b9b4d0); }
.revealText { font-size: 15px; line-height: 1.55; margin: 10px auto; max-width: 460px; animation: revealFade .5s ease both; }
@keyframes revealFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

.lock { margin-top: 24px; display: flex; flex-direction: column; align-items: center; gap: 14px; }
.lockTitle { font-size: 18px; font-weight: 600; }
.lockCard { position: relative; width: 96px; }
.lockIcon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #eecb7a; }
.lockBlur { filter: blur(5px); user-select: none; letter-spacing: 2px; color: var(--lp-muted, #b9b4d0); }
.lockUrgency { font-size: 14px; color: #eecb7a; }

@media (prefers-reduced-motion: reduce) {
  .revealSlot, .revealText { transition: none; animation: none; }
}
```

**Step 2: Коммит**

```bash
git add frontend/app/lp/lp.module.css
git commit -m "style(lp): классы движка live-reveal (карты, замок, блюр)"
```

---

## Task 5: Компонент ввода `RevealInput.jsx`

**Files:**
- Create: `frontend/app/lp/components/RevealInput.jsx`

**Step 1: Реализация**

Создать `frontend/app/lp/components/RevealInput.jsx`:

```jsx
'use client'
import { useState } from 'react'
import styles from '../lp.module.css'

// Двухшаговый вход движка live-reveal: сначала выбор вопроса, потом ввод его имени.
// Отдаёт наверх { questionId, name }.
export default function RevealInput({ landing, onSubmit }) {
  const [questionId, setQuestionId] = useState(null)
  const [name, setName] = useState('')

  if (!questionId) {
    return (
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <span className={`${styles.wordmark} ${styles.heroWordmark}`}>Astrix</span>
        </div>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>{landing.hero.eyebrow}</div>
          <h1 className={`${styles.h1} ${styles.heroTitle}`}>{landing.hero.title}</h1>
          <p className={`${styles.lead} ${styles.heroSub}`}>{landing.hero.subtitle}</p>
          <div className={styles.options}>
            {landing.questions.map((q, i) => (
              <button key={q.id} className={styles.option}
                style={{ animationDelay: `${0.05 + i * 0.06}s` }}
                onClick={() => setQuestionId(q.id)}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const submit = () => {
    const trimmed = name.trim()
    if (trimmed) onSubmit({ questionId, name: trimmed })
  }

  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <button className={styles.linkBtn} onClick={() => setQuestionId(null)}>← {landing.microcopy.back}</button>
        <h1 className={`${styles.h1} ${styles.heroTitle}`}>{landing.input.heading}</h1>
        <p className={`${styles.lead} ${styles.heroSub}`}>{landing.input.subhead}</p>
        <input className={styles.field} type="text" inputMode="text" autoFocus maxLength={24}
          placeholder={landing.input.placeholder} value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
        <div className={styles.heroFoot}>
          <button className={`${styles.cta} ${styles.ctaFull}`} onClick={submit} disabled={!name.trim()}>
            {landing.input.cta}
          </button>
        </div>
      </div>
    </section>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/lp/components/RevealInput.jsx
git commit -m "feat(lp): экран выбора вопроса и ввода имени (RevealInput)"
```

---

## Task 6: Компонент раскрытия `LiveReveal.jsx`

**Files:**
- Create: `frontend/app/lp/components/LiveReveal.jsx`

**Step 1: Реализация**

Создать `frontend/app/lp/components/LiveReveal.jsx`:

```jsx
'use client'
import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import styles from '../lp.module.css'
import TarotCard from '../../tarot/components/TarotCard'
import { buildReveal } from '../logic/revealMachine.js'

const OPEN_DELAY = 1100 // мс между открытием карт

function prefersReduced() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Карты открываются по очереди, затем показывается закрытая карта (выбранный вопрос)
// с обрывом текста и кнопкой на пейвол.
export default function LiveReveal({ question, name, landing, onDone }) {
  const [reveal] = useState(() => buildReveal(question, name))
  const openCards = reveal.cards.filter((c) => !c.locked)
  const lock = reveal.cards.find((c) => c.locked)
  const reduced = prefersReduced()
  const [shown, setShown] = useState(reduced ? openCards.length : 0)
  const [atLock, setAtLock] = useState(reduced)

  useEffect(() => {
    if (reduced || atLock) return
    if (shown < openCards.length) {
      const t = setTimeout(() => setShown((n) => n + 1), OPEN_DELAY)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setAtLock(true), OPEN_DELAY)
    return () => clearTimeout(t)
  }, [shown, atLock, reduced, openCards.length])

  return (
    <section className={styles.reveal}>
      <p className={styles.revealIntro}>{landing.revealIntro}</p>
      <div className={styles.revealRow}>
        {openCards.map((c, i) => (
          <div key={i} className={`${styles.revealSlot} ${i < shown ? styles.revealSlotOpen : ''}`}>
            <TarotCard card={c.card} faceUp={i < shown} />
            <div className={styles.revealPos}>{c.position}</div>
          </div>
        ))}
      </div>

      {openCards.slice(0, shown).map((c, i) => (
        <p key={i} className={styles.revealText}>{c.text}</p>
      ))}

      {atLock && (
        <div className={styles.lock}>
          <div className={styles.lockTitle}>{lock.position}</div>
          <div className={styles.lockCard}>
            <TarotCard card={lock.card} faceUp={false} />
            <span className={styles.lockIcon}><Lock size={28} /></span>
          </div>
          <p className={styles.revealText}>
            {lock.text} <span className={styles.lockBlur}>▨▨▨▨ ▨▨▨▨▨▨ ▨▨▨</span>
          </p>
          <p className={styles.lockUrgency}>{landing.paywall.urgency}</p>
          <button className={`${styles.cta} ${styles.ctaFull}`} onClick={onDone}>
            {landing.microcopy.toLock}
          </button>
        </div>
      )}
    </section>
  )
}
```

**Step 2: Коммит**

```bash
git add frontend/app/lp/components/LiveReveal.jsx
git commit -m "feat(lp): покартное раскрытие с обрывом на замке (LiveReveal)"
```

---

## Task 7: Клиент движка `RevealClient.jsx`

**Files:**
- Create: `frontend/app/lp/[slug]/RevealClient.jsx`

**Step 1: Реализация**

Создать `frontend/app/lp/[slug]/RevealClient.jsx`:

```jsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { saveQuiz, loadQuiz } from '../logic/quizStorage.js'
import { interpolate, normalizeName } from '../logic/revealMachine.js'
import styles from '../lp.module.css'
import RevealInput from '../components/RevealInput'
import Calculating from '../components/Calculating'
import LiveReveal from '../components/LiveReveal'
import Paywall from '../components/Paywall'

export default function RevealClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const router = useRouter()
  const [phase, setPhase] = useState('input')
  const [data, setData] = useState(null) // { questionId, name }

  const isSubscribed = user?.subscribed ?? false
  const question = data ? landing.questions.find((q) => q.id === data.questionId) : null
  const name = data?.name ?? ''

  useEffect(() => {
    track('lp_view', { slug: landing.slug })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат после оплаты: полный расклад живёт в ЛК.
  useEffect(() => {
    if (isSubscribed && loadQuiz(landing.slug)) router.push('/lk')
  }, [isSubscribed, landing.slug, router])

  const handleSubmit = ({ questionId, name: raw }) => {
    const clean = normalizeName(raw)
    track('name_submit', { slug: landing.slug, question: questionId })
    saveQuiz(landing.slug, { questionId, name: clean })
    setData({ questionId, name: clean })
    setPhase('attuning')
  }

  const handleAttuned = () => setPhase('reveal')

  const handleReachPaywall = () => {
    track('reveal_complete', { slug: landing.slug })
    if (!isSubscribed) track('paywall_view', { slug: landing.slug })
    setPhase('paywall')
  }

  const handleRestart = () => { setData(null); setPhase('input') }

  const attuneLines = landing.attuning.lines.map((l) => interpolate(l, name))

  let view
  if (phase === 'input') view = <RevealInput landing={landing} onSubmit={handleSubmit} />
  else if (phase === 'attuning')
    view = <Calculating onDone={handleAttuned} title={landing.attuning.title} lines={attuneLines} variant="cosmic" />
  else if (phase === 'reveal')
    view = <LiveReveal question={question} name={name} landing={landing} onDone={handleReachPaywall} />
  else
    view = (
      <Paywall slug={landing.slug}
        heading={interpolate(landing.paywall.heading, name)}
        payoffs={landing.paywall.payoffs}
        onRestart={handleRestart} />
    )

  return (
    <div className={styles.cosmic}>
      <div className={styles.cosmicBackdrop} aria-hidden="true">
        <div className={styles.cosmicGlow1} />
        <div className={styles.cosmicGlow2} />
        <div className={styles.cosmicStars} />
      </div>
      {view}
    </div>
  )
}
```

**Step 2: Коммит**

```bash
git add "frontend/app/lp/[slug]/RevealClient.jsx"
git commit -m "feat(lp): клиент движка live-reveal (фазы input→attuning→reveal→paywall)"
```

---

## Task 8: Ветка движка в `page.jsx`

**Files:**
- Modify: `frontend/app/lp/[slug]/page.jsx`

**Step 1: Добавить ветку и импорт**

В `frontend/app/lp/[slug]/page.jsx`:
- добавить импорт `import RevealClient from './RevealClient'`,
- заменить выбор клиента:

```jsx
export default function LandingPage({ params }) {
  const landing = getLanding(params.slug)
  if (!landing) notFound()
  const Client =
    landing.engine === 'compat-jealous' ? CompatClient :
    landing.engine === 'live-reveal' ? RevealClient :
    LandingClient
  return <Client landing={landing} />
}
```

**Step 2: Коммит**

```bash
git add "frontend/app/lp/[slug]/page.jsx"
git commit -m "feat(lp): подключить движок live-reveal в page.jsx"
```

---

## Task 9: Сборка и ручная проверка

**Files:** нет (верификация).

**Step 1: Прогнать все юнит-тесты движка и контента**

Run (из `frontend/`):
```
node --test app/lp/logic/revealMachine.test.mjs
node --test app/content/landings/taro-him-copy.test.mjs
node --test app/content/landings/index.test.mjs
```
Expected: все PASS.

**Step 2: Собрать фронтенд**

Собрать так, как принято в проекте (Node в Docker; НЕ под `NODE_ENV=development`, иначе `next build` падает): `npm run build`.
Expected: сборка без ошибок, страница `/lp/[slug]` в выводе.

**Step 3: Ручной смоук в браузере**

Открыть `/lp/taro-him` и пройти флоу:
1. Виден крючок и 4 вопроса. Тап по вопросу открывает ввод имени.
2. Ввод имени и «Разложить карты» ведёт на «настройку колоды» (лоадер со строками, где мелькает имя).
3. Карты открываются по очереди, текст называет введённое имя, длинного тире нет.
4. Последняя карта закрыта на замок, заголовок = выбранный вопрос, текст обрывается и заблюрен.
5. Кнопка «Открыть полный расклад» ведёт на пейвол; заголовок пейвола содержит имя; CTA уходит в `/register` (гость) или `/lk` (залогинен).
6. Повторный ввод того же имени даёт тот же расклад (детерминизм).
7. Проверить `prefers-reduced-motion`: карты и замок показываются сразу, без анимации.

**Step 4: Финальный коммит (если были правки после смоука)**

```bash
git add -A
git commit -m "fix(lp): правки по итогам смоука taro-him"
```

---

## Готово / вне рамок

- Вторая ниша (страх/паттерны, `input.mode='charge'`) реализуется отдельным конфигом позже, движок уже готов.
- Реальные боевые толкования не выводим на лендинге (за пейволом, в продукте).
- A/B крючка (`verdictOpener`-подобно) и per-ветка выгоды пейвола не делаем в этой итерации.
