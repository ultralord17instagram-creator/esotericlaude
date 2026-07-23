// Чистая детерминированная логика лендинга horo-love. Без React и сети.
import { sign } from '../../content/horoscope/astro.js'
import { BRANCHES, BRANCH_IDS } from '../../content/horoscope/love/index.js'
import { AGE_POOL, INITIALS, MONTHS, LETTER_TEMPLATE, MONTH_TEMPLATE } from '../../content/horoscope/love/pools.js'

export function resolveBranch(v) {
  return BRANCH_IDS.includes(v) ? v : null
}

// 32-битный хеш + mulberry32 (детерминизм). Локально, чтобы не тянуть tarot-модуль.
export function seed(str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^= h >>> 16) >>> 0
}
function prng(a) {
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// values по ветке. Порядок pick() фиксирован -> результат стабилен.
export function generate({ branch, birthDate, name = '' }) {
  const rand = prng(seed(`${name}|${birthDate}|${branch}`))
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const her = sign(birthDate)

  if (branch === 'suzheny') {
    const d = BRANCHES.suzheny.dossier[her.id]
    const month = pick(MONTHS)
    const letter = pick(INITIALS)
    const ageHint = pick(AGE_POOL)
    return {
      destined: d.destined,
      ageHint,
      character: d.character,
      meetHow: d.meetHow,
      firstLetter: LETTER_TEMPLATE.replace('{L}', letter),
      meetMonth: MONTH_TEMPLATE.replace('{month}', month),
      howRecognize: d.howRecognize,
      whatObstacle: d.whatObstacle,
    }
  }

  if (branch === 'return') {
    const his = BRANCHES.return.hisSignBy[her.id]
    const d = BRANCHES.return.dossier[his]
    const month = pick(MONTHS)
    return {
      hisState: d.hisState,
      whyDistant: d.whyDistant,
      willReturn: d.willReturn,
      whenReturn: d.whenReturn.replace('{month}', month),
      whatToDo: d.whatToDo,
    }
  }

  // block
  const d = BRANCHES.block.dossier[her.id]
  return {
    blockName: d.blockName,
    howItShows: d.howItShows,
    rootScenario: d.rootScenario,
    howToRelease: d.howToRelease,
    whenClears: d.whenClears,
  }
}

export function buildReveal(branch, values) {
  return BRANCHES[branch].revealFields.map((f) => ({ ...f, value: values[f.id] }))
}
