import { DECK } from './deck.js'
import { DAY_TEXTS } from './texts/day.js'
import { YESNO_TEXTS } from './texts/yesno.js'
import { THREE_TEXTS } from './texts/three.js'
import { ADVICE_TEXTS } from './texts/advice.js'

// Сид от даты в TZ проекта (Europe/Moscow) — совпадает с логикой суток на бэкенде.
export function moscowDayKey(date = new Date()) {
  // en-CA даёт формат YYYY-MM-DD
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  const [y, m, d] = s.split('-').map(Number)
  return y * 10000 + m * 100 + d
}

// «Карта дня» — детерминированно от даты, одна для всех.
export function getDayCard(date = new Date()) {
  const idx = moscowDayKey(date) % DECK.length
  return DECK[idx]
}

// Случайное назначение N карт без дублей, исключая номера из exclude.
export function assignRandomCards(count, exclude = []) {
  const local = DECK.filter((c) => !exclude.includes(c.number))
  const picked = []
  for (let i = 0; i < count && local.length > 0; i += 1) {
    const j = Math.floor(Math.random() * local.length)
    picked.push(local.splice(j, 1)[0])
  }
  return picked
}

// Косметическая «уверенность» для сценария Да/Нет — выводится из полюса карты
// детерминированно (у одной карты всегда одинаково). «да» → 58–77%, «нет» → 23–42%.
// Это презентационный приём (шкала в макете), а не измеряемая метрика.
export function yesNoConfidence(card) {
  const yes = card.yesno === 'yes'
  const base = yes ? 68 : 32
  const spread = ((card.number * 7) % 20) - 10 // -10..+9, стабильно по номеру аркана
  const pct = base + (yes ? spread : -spread)
  return Math.min(92, Math.max(8, pct))
}

// Единая точка доступа к заготовкам текстов.
export function getText({ scenario, number, themeId, intro = false }) {
  if (scenario === 'day') return DAY_TEXTS[number]
  if (scenario === 'yesno') return YESNO_TEXTS[number]
  if (scenario === 'advice') return ADVICE_TEXTS[number]
  if (scenario === 'three') {
    const theme = THREE_TEXTS[themeId]
    if (!theme) return ''
    return intro ? theme.intro : theme.cards[number]
  }
  return ''
}
