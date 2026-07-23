// Инлайн-SVG из макета Astrix (design-reference/numb-reference).
// Иконки наследуют currentColor: цвет задаёт плашка/CSS вызывающего.
// Направления и сценарные печати — viewBox 0 0 32 32; служебные — свои.

// Фабрика: оборачивает сырой SVG-контент. Так ближе всего к исходнику макета.
const mk = (inner, vb = '0 0 32 32') =>
  function Icon({ size = 30 }) {
    return (
      <svg
        width={size}
        height={size}
        viewBox={vb}
        fill="none"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    )
  }

// ── Сценарные печати (вариант 8b «Числовые печати») ──────────
const seal = (num) =>
  `<circle cx='16' cy='16' r='11' stroke='currentColor' stroke-width='1.1' opacity='.55'/>` +
  `<circle cx='16' cy='16' r='11' stroke='currentColor' stroke-width='1.1' stroke-dasharray='1.5 4' opacity='.9'/>` +
  `<text x='16' y='16' text-anchor='middle' dominant-baseline='central' font-family='Source Serif 4, Georgia, serif' font-size='15' font-weight='600' fill='currentColor'>${num}</text>`

export const SCENARIO_ICONS = {
  breakdown: mk(seal('7')),
  compatibility: mk(
    `<circle cx='16' cy='16' r='11' stroke='currentColor' stroke-width='1.1' opacity='.55'/>` +
      `<circle cx='16' cy='16' r='11' stroke='currentColor' stroke-width='1.1' stroke-dasharray='1.5 4' opacity='.9'/>` +
      `<path d='M16 21.5 C16 21.5 10.5 17.8 10.5 14 A3 3 0 0 1 16 12.4 A3 3 0 0 1 21.5 14 C21.5 17.8 16 21.5 16 21.5 Z' stroke='currentColor' stroke-width='1.2' stroke-linejoin='round' fill='none'/>`,
  ),
  forecast: mk(seal('9')),
}

// Медальон шапки «Нумерология» (астролябия из макета 1a/2a).
export const NumerologyMark = mk(
  `<circle cx='14' cy='14.5' r='8.5' stroke='currentColor' stroke-width='1.3'/>` +
    `<path d='M14 6.5 L21 20 L7 20 Z' stroke='currentColor' stroke-width='1.2'/>` +
    `<circle cx='14' cy='15.5' r='1.3' fill='currentColor'/>`,
  '0 0 28 28',
)

// ── Тематические иконки направлений ──────────────────────────
const star = `<circle cx='16' cy='16' r='10.5' stroke='currentColor' stroke-width='1.2' opacity='.5'/><path d='M16 8 L18.2 14.4 L24 16 L18.2 17.6 L16 24 L13.8 17.6 L8 16 L13.8 14.4 Z' stroke='currentColor' stroke-width='1.3' stroke-linejoin='round'/>`
const heartOutline = `<circle cx='16' cy='16' r='11' stroke='currentColor' stroke-width='1.1' opacity='.4' stroke-dasharray='1.5 4'/><path d='M16 22.5 C16 22.5 10 18.6 10 14.4 A3.4 3.4 0 0 1 16 12.6 A3.4 3.4 0 0 1 22 14.4 C22 18.6 16 22.5 16 22.5 Z' stroke='currentColor' stroke-width='1.3' stroke-linejoin='round'/>`
const heartFilled = `<circle cx='16' cy='16' r='11' stroke='currentColor' stroke-width='1.1' opacity='.4' stroke-dasharray='1.5 4'/><path d='M16 22.5 C16 22.5 10 18.6 10 14.4 A3.4 3.4 0 0 1 16 12.6 A3.4 3.4 0 0 1 22 14.4 C22 18.6 16 22.5 16 22.5 Z' stroke='currentColor' stroke-width='1.3' stroke-linejoin='round' fill='currentColor' fill-opacity='.28'/>`
const coin = `<circle cx='16' cy='16' r='10.5' stroke='currentColor' stroke-width='1.3'/><path d='M16 10 V22 M13 12.5 a3 3 0 0 1 3 -1.5 c2 0 3 1 3 2.4 c0 3 -6 1.6 -6 4.8 c0 1.4 1.2 2.4 3 2.4 a3 3 0 0 0 3 -1.5' stroke='currentColor' stroke-width='1.3' stroke-linecap='round' fill='none'/>`

// Иконки направлений по ключу (см. directions.js). Один общий словарь.
export const DIRECTION_ICONS = {
  // Разбор
  fate: mk(star),
  karma: mk(
    `<path d='M11 16 a4 4 0 1 1 4 4 a5 5 0 1 0 2 -9.5' stroke='currentColor' stroke-width='1.4' stroke-linecap='round' fill='none'/>` +
      `<path d='M11 16 a4 4 0 0 0 4 -4' stroke='currentColor' stroke-width='1.4' stroke-linecap='round' fill='none'/>` +
      `<circle cx='21' cy='11.5' r='1.3' fill='currentColor'/>`,
  ),
  love: mk(heartOutline),
  rod: mk(
    `<path d='M16 26 V13' stroke='currentColor' stroke-width='1.4' stroke-linecap='round'/>` +
      `<path d='M16 17 L11 12 M16 15 L21 10.5 M16 20 L12.5 17' stroke='currentColor' stroke-width='1.3' stroke-linecap='round'/>` +
      `<circle cx='16' cy='9' r='2.6' stroke='currentColor' stroke-width='1.3'/>` +
      `<circle cx='10' cy='11' r='1.9' stroke='currentColor' stroke-width='1.2'/>` +
      `<circle cx='22' cy='9.5' r='1.9' stroke='currentColor' stroke-width='1.2'/>`,
  ),
  talents: mk(
    `<path d='M16 5 L20.5 11 L16 27 L11.5 11 Z' stroke='currentColor' stroke-width='1.3' stroke-linejoin='round'/>` +
      `<path d='M11.5 11 L20.5 11 M16 5 L16 11' stroke='currentColor' stroke-width='1.1' opacity='.7'/>`,
  ),
  money: mk(coin),

  // Совместимость
  gen: mk(
    `<circle cx='16' cy='16' r='11' stroke='currentColor' stroke-width='1.1' opacity='.4' stroke-dasharray='1.5 4'/>` +
      `<circle cx='12.5' cy='16' r='5.2' stroke='currentColor' stroke-width='1.3'/>` +
      `<circle cx='19.5' cy='16' r='5.2' stroke='currentColor' stroke-width='1.3'/>`,
  ),
  passion: mk(
    `<path d='M16 26 C10 22 8 17 11 12.5 C12.5 10.2 15 10 16 12 C17 10 19.5 10.2 21 12.5 C24 17 22 22 16 26 Z' stroke='currentColor' stroke-width='1.3' stroke-linejoin='round' fill='none'/>` +
      `<path d='M16 21 c-2 -1.6 -3 -3.4 -1.8 -5.2 c.7 -1 1.8 -.8 1.8 .2 c0 -1 1.1 -1.2 1.8 -.2 c1.2 1.8 .2 3.6 -1.8 5.2 Z' fill='currentColor' opacity='.55'/>`,
  ),
  cheat: mk(
    `<path d='M15.4 24 C10 20.4 8 15.8 10.6 11.8 C12 9.7 14.4 9.6 15.4 11.4 M16.6 11.4 C17.6 9.6 20 9.7 21.4 11.8 C23.2 14.6 22.6 17.8 20 20.8' stroke='currentColor' stroke-width='1.3' stroke-linecap='round' fill='none'/>` +
      `<path d='M16 10 L14 16 L18 17.5 L15.5 24' stroke='currentColor' stroke-width='1.4' stroke-linejoin='round' stroke-linecap='round' fill='none'/>`,
  ),
  home: mk(
    `<path d='M7 15 L16 8 L25 15' stroke='currentColor' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round' fill='none'/>` +
      `<path d='M9.5 13.2 V24 H22.5 V13.2' stroke='currentColor' stroke-width='1.3' stroke-linejoin='round' fill='none'/>` +
      `<path d='M14 24 V18 H18 V24' stroke='currentColor' stroke-width='1.2' stroke-linejoin='round' fill='none'/>`,
  ),
  conflict: mk(
    `<path d='M9 9 L15 15 M23 9 L17 15 M9 23 L15 17 M23 23 L17 17' stroke='currentColor' stroke-width='1.3' stroke-linecap='round'/>` +
      `<path d='M16 12 L13.5 16 L16.5 16 L14 20' stroke='currentColor' stroke-width='1.4' stroke-linejoin='round' stroke-linecap='round' fill='none'/>`,
  ),
  future: mk(
    `<circle cx='13' cy='17' r='4.6' stroke='currentColor' stroke-width='1.3'/>` +
      `<circle cx='19' cy='17' r='4.6' stroke='currentColor' stroke-width='1.3'/>` +
      `<path d='M22 8.5 l.7 2 2 .7 -2 .7 -.7 2 -.7 -2 -2 -.7 2 -.7 z' fill='currentColor'/>` +
      `<path d='M9 9.5 l.5 1.4 1.4 .5 -1.4 .5 -.5 1.4 -.5 -1.4 -1.4 -.5 1.4 -.5 z' fill='currentColor' opacity='.7'/>`,
  ),

  // Прогноз
  focus: mk(
    `<circle cx='16' cy='16' r='10' stroke='currentColor' stroke-width='1.2' opacity='.5'/>` +
      `<circle cx='16' cy='16' r='5.4' stroke='currentColor' stroke-width='1.3'/>` +
      `<circle cx='16' cy='16' r='1.6' fill='currentColor'/>` +
      `<path d='M16 3.5 V6.5 M16 25.5 V28.5 M3.5 16 H6.5 M25.5 16 H28.5' stroke='currentColor' stroke-width='1.3' stroke-linecap='round'/>`,
  ),
  warn: mk(
    `<path d='M16 6 L26 23 L6 23 Z' stroke='currentColor' stroke-width='1.3' stroke-linejoin='round'/>` +
      `<path d='M16 12.5 V17.5' stroke='currentColor' stroke-width='1.6' stroke-linecap='round'/>` +
      `<circle cx='16' cy='20.4' r='1.2' fill='currentColor'/>`,
  ),
  loveFilled: mk(heartFilled),
  challenge: mk(
    `<path d='M7 25 L10 8 L11 13 L15 10 L18 14 L23 11 L25 25 Z' stroke='currentColor' stroke-width='1.3' stroke-linejoin='round' fill='none'/>` +
      `<path d='M12 7 L12 12 L17 10 Z' fill='currentColor'/>` +
      `<path d='M12 6 V25' stroke='currentColor' stroke-width='1.3' stroke-linecap='round'/>`,
  ),
  advice: mk(
    `<circle cx='16' cy='16' r='10.5' stroke='currentColor' stroke-width='1.2' opacity='.55'/>` +
      `<path d='M20.5 11.5 L14.5 14.5 L11.5 20.5 L17.5 17.5 Z' stroke='currentColor' stroke-width='1.3' stroke-linejoin='round' fill='currentColor' fill-opacity='.28'/>` +
      `<circle cx='16' cy='16' r='1.4' fill='currentColor'/>`,
  ),
}

// ── Служебные иконки ─────────────────────────────────────────
export const Check = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" fill="none" aria-hidden>
    <path d="M2.5 6.2 l2.4 2.4 4.4-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const Arrow = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M4 12 h15 M13 6 l6 6 -6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const BackChevron = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M15 5 L8 12 L15 19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const Sparkle = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden>
    <path d="M6 0 l1 3.8 3.8 1 -3.8 1 -1 3.8 -1 -3.8 -3.8 -1 3.8 -1 z" fill="currentColor" />
  </svg>
)

export const Calendar = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="4" y="5.5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M4 10 H20 M8.5 3 V7 M15.5 3 V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
