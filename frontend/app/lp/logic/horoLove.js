// Чистая детерминированная логика лендинга horo-love. Без React и сети.
import { sign } from '../../content/horoscope/astro.js'
import { BRANCHES, BRANCH_IDS } from '../../content/horoscope/love/index.js'
import { AGE_POOL, INITIALS, MONTHS, LETTER_TEMPLATE, MONTH_TEMPLATE } from '../../content/horoscope/love/pools.js'

export function resolveBranch(v) {
  return BRANCH_IDS.includes(v) ? v : null
}
