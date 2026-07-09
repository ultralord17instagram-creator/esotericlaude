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
