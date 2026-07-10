// Источник правды по астро-расчётам продукта «Гороскоп» (дизайн §5, §12.1).
// Всё детерминировано и чисто: «сегодня» передаётся аргументом.

// ── Знаки: границы (месяц,день × 2), стихия, планета, диапазон ────────────────
export const SIGNS = [
  { id: 'capricorn',   name: 'Козерог',  dates: [1, 1, 1, 19],    element: 'Земля',  planet: 'Сатурн',   range: '22.12 – 19.01' },
  { id: 'aquarius',    name: 'Водолей',  dates: [1, 20, 2, 18],   element: 'Воздух', planet: 'Уран',     range: '20.01 – 18.02' },
  { id: 'pisces',      name: 'Рыбы',     dates: [2, 19, 3, 20],   element: 'Вода',   planet: 'Нептун',   range: '19.02 – 20.03' },
  { id: 'aries',       name: 'Овен',     dates: [3, 21, 4, 19],   element: 'Огонь',  planet: 'Марс',     range: '21.03 – 19.04' },
  { id: 'taurus',      name: 'Телец',    dates: [4, 20, 5, 20],   element: 'Земля',  planet: 'Венера',   range: '20.04 – 20.05' },
  { id: 'gemini',      name: 'Близнецы', dates: [5, 21, 6, 21],   element: 'Воздух', planet: 'Меркурий', range: '21.05 – 21.06' },
  { id: 'cancer',      name: 'Рак',      dates: [6, 22, 7, 22],   element: 'Вода',   planet: 'Луна',     range: '22.06 – 22.07' },
  { id: 'leo',         name: 'Лев',      dates: [7, 23, 8, 22],   element: 'Огонь',  planet: 'Солнце',   range: '23.07 – 22.08' },
  { id: 'virgo',       name: 'Дева',     dates: [8, 23, 9, 22],   element: 'Земля',  planet: 'Меркурий', range: '23.08 – 22.09' },
  { id: 'libra',       name: 'Весы',     dates: [9, 23, 10, 22],  element: 'Воздух', planet: 'Венера',   range: '23.09 – 22.10' },
  { id: 'scorpio',     name: 'Скорпион', dates: [10, 23, 11, 21], element: 'Вода',   planet: 'Плутон',   range: '23.10 – 21.11' },
  { id: 'sagittarius', name: 'Стрелец',  dates: [11, 22, 12, 21], element: 'Огонь',  planet: 'Юпитер',   range: '22.11 – 21.12' },
  { id: 'capricorn',   name: 'Козерог',  dates: [12, 22, 12, 31], element: 'Земля',  planet: 'Сатурн',   range: '22.12 – 19.01' },
]

export function sign(birthDate) {
  const [, m, d] = String(birthDate).split('-').map(Number)
  return SIGNS.find(s => (m === s.dates[0] && d >= s.dates[1]) || (m === s.dates[2] && d <= s.dates[3])) ?? SIGNS[0]
}

// ── «Сегодня» в TZ проекта (Europe/Moscow). Дублируется намеренно. ───────────
export function moscowDayKey(date = new Date()) {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
  const [y, m, d] = s.split('-').map(Number)
  return y * 10000 + m * 100 + d
}

// Детерминированный выбор варианта дневного текста: стабилен в течение дня.
export function dayVariantIndex(today = new Date(), count = 1) {
  return count > 0 ? moscowDayKey(today) % count : 0
}

// ── Луна: возраст, фаза (8), лунный день (1..30) ─────────────────────────────
// Опорное новолуние (UTC) и синодический месяц как константы (дизайн §5.2, §17.1).
export const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) // 2000-01-06 18:14 UTC
export const SYNODIC = 29.530588853                       // средний синодический месяц, дней

// Порядок фаз важен: индекс 0..7 соответствует долям возраста (дизайн, Прил. B).
export const PHASES = [
  { name: 'Новолуние',        emoji: '🌑' },
  { name: 'Растущий серп',    emoji: '🌒' },
  { name: 'Первая четверть',  emoji: '🌓' },
  { name: 'Растущая Луна',    emoji: '🌔' },
  { name: 'Полнолуние',       emoji: '🌕' },
  { name: 'Убывающая Луна',   emoji: '🌖' },
  { name: 'Последняя четверть', emoji: '🌗' },
  { name: 'Старая Луна',      emoji: '🌘' },
]

export function moonAge(date = new Date()) {
  const days = (date.getTime() - REF_NEW_MOON) / 86400000
  let age = days % SYNODIC
  if (age < 0) age += SYNODIC
  return age // [0, SYNODIC)
}

export function moonPhase(date = new Date()) {
  const idx = Math.floor((moonAge(date) / SYNODIC) * 8 + 0.5) % 8
  return PHASES[idx]
}

export function lunarDay(date = new Date()) {
  return Math.min(30, Math.floor(moonAge(date)) + 1) // 1..30
}

// ── Планетарный день недели (Europe/Moscow) ──────────────────────────────────
const WEEKDAY_PLANET = {
  Mon: 'Луна', Tue: 'Марс', Wed: 'Меркурий', Thu: 'Юпитер',
  Fri: 'Венера', Sat: 'Сатурн', Sun: 'Солнце',
}

export function planetaryDay(date = new Date()) {
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Moscow', weekday: 'short' }).format(date)
  return { planet: WEEKDAY_PLANET[wd] ?? 'Солнце', weekday: wd }
}

// ── Ретрограды: статическая таблица периодов (дизайн §5.4, §16) ───────────────
// ПЛЕЙСХОЛДЕР: реальные периоды Меркурия/Венеры/Марса на 2026-2028+ берутся из
// открытых эфемерид при наполнении контента. Продлевается вручную раз в год.
export const RETROGRADES = [
  { planet: 'Меркурий', from: '2026-02-25', to: '2026-03-20' },
]

function isoKey(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return y * 10000 + m * 100 + d
}

export function retrogrades(date = new Date()) {
  const k = moscowDayKey(date)
  return RETROGRADES.filter(r => k >= isoKey(r.from) && k <= isoKey(r.to)).map(r => r.planet)
}
