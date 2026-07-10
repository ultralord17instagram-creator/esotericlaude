import { SCENARIOS } from './scenarios.js'
import * as A from './astro.js'
import { SKY_TEXTS } from './texts/sky.js'
import { TODAY_TEXTS } from './texts/today.js'
import { PORTRAIT_TEXTS } from './texts/portrait.js'
import { LUNAR_TEXTS } from './texts/lunar.js'
import { LUNAR_RATINGS } from './texts/lunar_ratings.js'
import { BAIT } from './bait.js'

// ── Плейсхолдеры (страхуют пустые ключи, если контент неполон) ────────────────
const phFree = (l) => `[текст: ${l}]`
const phPaid = (l) => ({ teaser: `[тизер: ${l}]`, body: `[текст: ${l}]` })
const phBait = (l) => `[байт: ${l}]`

function seedNum(seed) {
  return String(seed).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)
}

// Байт платного блока для гостя. Пустой раздел -> видимый плейсхолдер.
export function getBait(section, block, seed) {
  const variants = BAIT[section]?.[block]
  if (!Array.isArray(variants) || variants.length === 0) return phBait(`${section}.${block}`)
  return variants[seedNum(seed) % variants.length]
}

// Выбор варианта дня: бесплатный -> строка, платный -> { teaser, body }.
function pickFree(arr, today, label) {
  if (!Array.isArray(arr) || arr.length === 0) return phFree(label)
  const v = arr[A.dayVariantIndex(today, arr.length)]
  return typeof v === 'string' && v ? v : phFree(label)
}
function pickPaid(arr, today, label) {
  if (!Array.isArray(arr) || arr.length === 0) return phPaid(label)
  const v = arr[A.dayVariantIndex(today, arr.length)]
  if (v && typeof v === 'object') {
    return { teaser: v.teaser || phPaid(label).teaser, body: v.body || phPaid(label).body }
  }
  return phPaid(label)
}

// ── Раздел «Сегодня» + живое небо ────────────────────────────────────────────
export function getToday(signId, today = new Date()) {
  const phase = A.moonPhase(today)
  const ld = A.lunarDay(today)
  const planetary = A.planetaryDay(today)
  const retro = A.retrogrades(today)

  const sky = {
    phase, lunarDay: ld, planetary, retro,
    texts: {
      phase: SKY_TEXTS.phases[phase.name] || phFree(`sky.phase.${phase.name}`),
      lunarDay: LUNAR_TEXTS.days[ld] || phFree(`lunar.days.${ld}`),
      planetary: SKY_TEXTS.planetaryDays[planetary.planet] || phFree(`sky.planet.${planetary.planet}`),
      retro: retro.map(p => ({ planet: p, text: SKY_TEXTS.retro[p] || phFree(`sky.retro.${p}`) })),
    },
  }

  const blocks = SCENARIOS.today.blocks.map(b => {
    const arr = TODAY_TEXTS[b.id]?.[signId]
    const label = `today.${b.id}.${signId}`
    if (b.free) {
      return { id: b.id, name: b.name, free: true, text: pickFree(arr, today, label) }
    }
    return {
      id: b.id, name: b.name, free: false,
      text: pickPaid(arr, today, label),
      bait: getBait('today', b.id, signId),
    }
  })

  return { sky, blocks }
}

// ── Раздел «Портрет знака» ───────────────────────────────────────────────────
export function getPortrait(signId) {
  const blocks = SCENARIOS.portrait.blocks.map(b => {
    const raw = PORTRAIT_TEXTS[b.id]?.[signId]
    const label = `portrait.${b.id}.${signId}`
    if (b.free) {
      return { id: b.id, name: b.name, free: true, text: (typeof raw === 'string' && raw) ? raw : phFree(label) }
    }
    const text = (raw && typeof raw === 'object')
      ? { teaser: raw.teaser || phPaid(label).teaser, body: raw.body || phPaid(label).body }
      : phPaid(label)
    return { id: b.id, name: b.name, free: false, text, bait: getBait('portrait', b.id, signId) }
  })
  return { blocks }
}

// ── Раздел «Лунный календарь» ────────────────────────────────────────────────
export function getLunar(today = new Date()) {
  const ld = A.lunarDay(today)
  const phase = A.moonPhase(today)
  const spheres = SCENARIOS.lunar.spheres.map(id => ({
    id,
    overview: LUNAR_TEXTS.spheres[id] || phFree(`lunar.spheres.${id}`),
    ratings: Array.from({ length: 30 }, (_, i) => LUNAR_RATINGS[id]?.[i + 1] || 'neutral'),
  }))
  return {
    lunarDay: ld,
    phase,
    todayMeaning: LUNAR_TEXTS.days[ld] || phFree(`lunar.days.${ld}`),
    spheres,
    bait: getBait('lunar', 'calendar', ld),
  }
}
