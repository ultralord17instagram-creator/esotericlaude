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
