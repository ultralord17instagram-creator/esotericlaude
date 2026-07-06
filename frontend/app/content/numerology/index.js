import { SCENARIOS } from './scenarios.js'
import * as N from './numbers.js'
import { BREAKDOWN_TEXTS } from './texts/breakdown.js'
import { COMPATIBILITY_TEXTS } from './texts/compatibility.js'
import { FORECAST_DAY_TEXTS } from './texts/forecast_day.js'
import { FORECAST_MONTH_TEXTS } from './texts/forecast_month.js'
import { FORECAST_YEAR_TEXTS } from './texts/forecast_year.js'

const PLACEHOLDER_TEASER = (label) => `[тизер: ${label}]`
const PLACEHOLDER_BODY = (label) => `[текст: ${label}]`
const PLACEHOLDER_FREE = (label) => `[текст: ${label}]`

// Считает число блока по его basis из конфига.
function blockNumber(basis, ctx) {
  switch (basis) {
    case 'lifePath':   return N.lifePath(ctx.date)
    case 'expression': return N.expression(ctx.name)
    case 'soul':       return N.soul(ctx.name)
    case 'pairNumber': return N.pairNumber(ctx.lp1, ctx.lp2)
    case 'pairKey':    return N.pairKey(ctx.lp1, ctx.lp2)
    case 'personalMonth': return N.personalMonth(ctx.date, ctx.today)
    case 'personalYear':  return N.personalYear(ctx.date, ctx.today)
    default: return null
  }
}

// Достаёт сырой текст из нужного набора по (scenario, block, key). undefined если нет.
function rawText({ scenario, block, key, group }) {
  if (scenario === 'breakdown') return BREAKDOWN_TEXTS[block]?.[key]
  if (scenario === 'compatibility') {
    if (group === 'nameTouch') return COMPATIBILITY_TEXTS.nameTouch[block]?.[key]
    return (COMPATIBILITY_TEXTS.hot[block] ?? COMPATIBILITY_TEXTS.background[block])?.[key]
  }
  if (scenario === 'month') return FORECAST_MONTH_TEXTS[block]?.[key]
  if (scenario === 'year')  return FORECAST_YEAR_TEXTS[block]?.[key]
  if (scenario === 'day')   return FORECAST_DAY_TEXTS[key]
  return undefined
}

// Единая точка доступа. free блок -> строка; платный -> { teaser, body }.
// Отсутствующий ключ -> видимый плейсхолдер (структура важнее наполнения на этом этапе).
export function getText({ scenario, block, key, free = false, group }) {
  const label = `${scenario}.${block ?? ''}.${key}`
  const raw = rawText({ scenario, block, key, group })
  if (free) return typeof raw === 'string' ? raw : PLACEHOLDER_FREE(label)
  // платный: ожидаем { teaser, body }
  if (raw && typeof raw === 'object') {
    return { teaser: raw.teaser ?? PLACEHOLDER_TEASER(label), body: raw.body ?? PLACEHOLDER_BODY(label) }
  }
  return { teaser: PLACEHOLDER_TEASER(label), body: PLACEHOLDER_BODY(label) }
}

// ── Сборка результатов сценариев ─────────────────────────────────────────────
export function buildBreakdown({ date, name }) {
  const ctx = { date, name }
  const blocks = SCENARIOS.breakdown.blocks.map(b => {
    const number = blockNumber(b.basis, ctx)
    return {
      id: b.id, name: b.name, number, free: !!b.free,
      text: getText({ scenario: 'breakdown', block: b.id, key: number, free: b.free }),
    }
  })
  return { blocks }
}

export function buildCompatibility({ date, name, date2, name2 }) {
  const lp1 = N.lifePath(date), lp2 = N.lifePath(date2)
  const nameKey = N.nameCompat(N.expression(name), N.expression(name2))
  const ctx = { lp1, lp2 }
  const blocks = SCENARIOS.compatibility.blocks.map(b => {
    const number = blockNumber(b.basis, ctx) // число пары или ключ пары
    const block = {
      id: b.id, name: b.name, number, free: !!b.free, hot: !!b.hot, showcase: !!b.showcase,
      text: getText({ scenario: 'compatibility', block: b.id, key: number, free: b.free }),
    }
    if (b.nameTouch) {
      block.nameTouch = getText({
        scenario: 'compatibility', block: b.id, key: nameKey, group: 'nameTouch', free: b.free,
      })
    }
    return block
  })
  return { blocks, lp1, lp2, nameKey }
}

export function buildForecast({ date, horizon, today = new Date() }) {
  if (horizon === 'day') {
    const number = N.personalDay(date, today)
    const variants = FORECAST_DAY_TEXTS[number]
    const count = Array.isArray(variants) ? variants.length : 0
    const idx = N.dayVariantIndex(today, count || 1)
    const text = count > 0 ? variants[idx] : `[текст: day.${number} (вариант ${idx})]`
    return { horizon: 'day', number, free: true, text }
  }
  const conf = SCENARIOS.forecast.horizons[horizon] // month | year
  const number = blockNumber(conf.basis, { date, today })
  const blocks = conf.blocks.map(b => ({
    id: b.id, name: b.name, number, free: !!b.free,
    text: getText({ scenario: horizon, block: b.id, key: number, free: b.free }),
  }))
  return { horizon, number, blocks }
}

// ── localStorage-профиль (дизайн §14). Только браузер. ────────────────────────
const PROFILE_KEY = 'numerology.profile'
export function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null') } catch { return null }
}
export function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)) } catch {}
}
export function clearProfile() {
  try { localStorage.removeItem(PROFILE_KEY) } catch {}
}
