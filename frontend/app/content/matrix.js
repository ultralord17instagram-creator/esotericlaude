// Matrix of Destiny calculation engine.
// Algorithm: Natalia Ladini standard method.
// All numbers reduced to range 1–22.

function digitSum(n) {
  return String(n).split('').reduce((a, c) => a + Number(c), 0)
}

export function reduce(n) {
  if (n <= 0) return 1
  while (n > 22) n = digitSum(n)
  return n
}

function parseDate(birthDate) {
  // Accepts 'YYYY-MM-DD' (HTML date input) or 'DD.MM.YYYY'
  if (birthDate.includes('-')) {
    const [yyyy, mm, dd] = birthDate.split('-').map(Number)
    return { day: dd, month: mm, year: yyyy }
  }
  const [dd, mm, yyyy] = birthDate.split('.').map(Number)
  return { day: dd, month: mm, year: yyyy }
}

function getAge(year, month, day) {
  const today = new Date()
  let age = today.getFullYear() - year
  const m = today.getMonth() + 1 - month
  if (m < 0 || (m === 0 && today.getDate() < day)) age--
  return age
}

export function calculateMatrix(birthDate) {
  const { day, month, year } = parseDate(birthDate)

  const d = reduce(day)
  const m = reduce(month)
  const y = reduce(digitSum(year))
  const k = reduce(d + m + y)
  const center = reduce(d + m + y + k)

  const top_left  = reduce(d + m)
  const top_right = reduce(m + y)
  const bot_right = reduce(y + k)
  const bot_left  = reduce(k + d)

  const male1   = reduce(d + center)
  const male2   = reduce(m + center)
  const female1 = reduce(y + center)
  const female2 = reduce(k + center)

  // Chakra mapping: [итог, причина, страх]
  // Standard mapping (verify against known sources):
  const chakras = {
    sahasrara:    { total: d,       cause: m,       fear: top_left  },
    ajna:         { total: center,  cause: male2,   fear: reduce(center * 2) },
    vishuddha:    { total: m,       cause: top_right, fear: y       },
    anahata:      { total: center,  cause: male1,   fear: k        },
    manipura:     { total: d,       cause: m,       fear: reduce(d + m + center) },
    svadhishthana:{ total: female2, cause: female2, fear: k        },
    muladhara:    { total: d,       cause: d,       fear: y        },
    general:      { total: reduce(d+m+y+k+center), cause: reduce(d+m+y+k+center), fear: reduce(bot_left) },
  }

  // Purpose blocks
  const purposes = {
    personal: {
      spiritual: top_left,
      material:  bot_right,
      adult:     reduce(top_left + bot_right),
    },
    social: {
      withMen:   top_right,
      withWomen: top_right,
      withSociety: reduce(top_right + center),
    },
    spiritual: {
      number: k,
    },
  }

  const nodes = { d, m, y, k, center, top_left, top_right, bot_right, bot_left, male1, male2, female1, female2 }

  return {
    nodes,
    chakras,
    purposes,
    age: getAge(year, month, day),
    birthDate,
  }
}
