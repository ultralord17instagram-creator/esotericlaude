// Чистая логика движка terminal: линейная фазовая машина, выбор одной карты,
// сборка тизера из слотов состояния. Без React и без сети, тестируется node:test.
import { getCard } from '../../content/tarot/deck.js'

// Пиксельная колода лендинга: 10 арканов, для которых есть арт в
// /public/cards/terminal/<slug>.png. slug совпадает с en-слагом; ru/keywords
// берём из deck.js по number (имена и трактовки не дублируем).
const TERMINAL_SLUGS = [
  { number: 18, slug: 'the-moon' },
  { number: 5, slug: 'the-hierophant' },
  { number: 17, slug: 'the-star' },
  { number: 7, slug: 'the-chariot' },
  { number: 16, slug: 'the-tower' },
  { number: 19, slug: 'the-sun' },
  { number: 4, slug: 'the-emperor' },
  { number: 15, slug: 'the-devil' },
  { number: 13, slug: 'death' },
  { number: 10, slug: 'wheel-of-fortune' },
]

export const TERMINAL_DECK = TERMINAL_SLUGS.map(({ number, slug }) => {
  const c = getCard(number)
  return { number, slug, ru: c.ru, en: c.en, keywords: c.keywords }
})

// Линейный порядок фаз прохождения.
export const PHASES = [
  'boot', 'select', 'intro', 'pause', 'draw', 'reveal', 'q1', 'q2', 'q3', 'analyze', 'reading',
]

// Фазы, где доступна кнопка «назад» (шаги уровня, как в оригинале PDF).
export const BACK_PHASES = ['intro', 'pause', 'draw', 'reveal', 'q1', 'q2', 'q3']

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

// Случайная карта из пула номеров pool (курирование под состояние). Пустой или
// отсутствующий пул → вся пиксельная колода. rand: () => [0,1) (в тестах детерм.).
export function pickCard(pool, rand = Math.random, deck = TERMINAL_DECK) {
  const nums = Array.isArray(pool) && pool.length ? pool : deck.map((c) => c.number)
  const num = nums[Math.min(Math.floor(rand() * nums.length), nums.length - 1)]
  return deck.find((c) => c.number === num) ?? deck[0]
}

// Подстановка токенов {key} значениями (голыми: кавычки уже в шаблоне).
export function fillTokens(text, tokens) {
  return Object.keys(tokens).reduce(
    (acc, k) => acc.split(`{${k}}`).join(tokens[k]),
    String(text),
  )
}

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
