// Иконки продукта «Гороскоп» (дизайн Astrix, design-reference/horo-reference).
// SVG перенесены из макета: у астро- и категорийных иконок цвета «зашиты»
// (они семантические — своя тема у каждой сферы), служебные наследуют currentColor.

/* ── Астросводка (живое небо) ─────────────────────────────── */
// Фаза Луны: два круга внахлёст. `cut` — цвет выемки, совпадает с фоном подложки.
export function PhaseIcon({ size = 40, cut = '#DCD0B6' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <circle cx="20" cy="20" r="11" fill="#B7A985" />
      <circle cx="24.5" cy="17" r="11" fill={cut} />
    </svg>
  )
}

// Лунный день: месяц.
export function MoonDayIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden>
      <path d="M20 4 a11 11 0 1 0 0 22 a13.5 13.5 0 0 1 0-22 z" fill="#D9A94E" />
    </svg>
  )
}

// День недели: планетарная звезда.
export function WeekdayIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12 1 l1.6 8.8 8.8 1.6 -8.8 1.6 -1.6 8.8 -1.6 -8.8 -8.8 -1.6 8.8 -1.6 z" fill="#211F30" />
    </svg>
  )
}

// Ретрограды: циферблат со стрелками.
export function RetroIcon({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 26 26" aria-hidden>
      <circle cx="13" cy="13" r="9" fill="none" stroke="#7FA07A" strokeWidth="1.6" />
      <path d="M13 8 v5 l3.2 2.2" fill="none" stroke="#7FA07A" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

/* ── Категории дня / блоки портрета ───────────────────────── */
export function HeartIcon({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M8 14 C2 9.5 1 6 3 4 c1.6-1.6 4-.6 5 1 1-1.6 3.4-2.6 5-1 2 2 1 5.5-5 10 z" fill="none" stroke="#C08497" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

export function CoinIcon({ size = 19, color = '#9A8D72' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="7" fill="none" stroke={color} strokeWidth="1.3" />
      <path d="M8 4.5 v7 M6 6.5 h3.2 a1.5 1.5 0 0 1 0 3 H6.4 M6 9.5 h3.6" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

export function PulseIcon({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M2 8.5 h3 l1.5-4 3 8 1.5-4 h3" fill="none" stroke="#7FA07A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LuckIcon({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M8 1 l1.9 4 4.4.5 -3.3 3 .9 4.3 -3.9-2.2 -3.9 2.2 .9-4.3 -3.3-3 4.4-.5 z" fill="none" stroke="#D9A94E" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

export function CharacterIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="5.5" r="3" fill="none" stroke="#9A8D72" strokeWidth="1.3" />
      <path d="M2.5 14 a5.5 5.5 0 0 1 11 0" fill="none" stroke="#9A8D72" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function SuperpowerIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <path d="M9.5 1 L4 9 h3.2 l-1 6 5.3-8.5 h-3.2 z" fill="none" stroke="#B9954F" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  )
}

export function ShadowIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="6.5" fill="none" stroke="#8E82A0" strokeWidth="1.3" />
      <path d="M8 1.5 a6.5 6.5 0 0 1 0 13 z" fill="#8E82A0" opacity=".55" />
    </svg>
  )
}

export function PurposeIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="7" fill="none" stroke="#7FA07A" strokeWidth="1.3" />
      <path d="M8 3.5 l1.4 3.1 3.1 1.4 -3.1 1.4 -1.4 3.1 -1.4-3.1 -3.1-1.4 3.1-1.4 z" fill="#7FA07A" />
    </svg>
  )
}

/* ── Лунный календарь ─────────────────────────────────────── */
export function CalendarIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <rect x="2.5" y="4" width="15" height="13" rx="2.5" fill="none" stroke="#B9954F" strokeWidth="1.3" />
      <path d="M2.5 8 H17.5" stroke="#B9954F" strokeWidth="1.3" />
      <path d="M6.5 2.5 V5.5 M13.5 2.5 V5.5" stroke="#B9954F" strokeWidth="1.3" />
    </svg>
  )
}

/* ── Служебные (наследуют currentColor) ───────────────────── */
export function Lock({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 15" fill="none" aria-hidden>
      <rect x="2.2" y="6.5" width="9.6" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.3 6.5 V4.7 a2.7 2.7 0 0 1 5.4 0 V6.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  )
}

export function Sparkle({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 0 l1.3 5 5 1.3 -5 1.3 -1.3 5 -1.3 -5 -5-1.3 5-1.3 z" fill="currentColor" />
    </svg>
  )
}

export function EditIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M9.5 2 l2.5 2.5 -7 7 -3 .5 .5-3 z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

// Иконки и оттенки подложки категорий дня (раздел «Сегодня»).
export const CATEGORY_ICON = {
  love: HeartIcon,
  money: CoinIcon,
  health: PulseIcon,
  luck: LuckIcon,
}
export const CATEGORY_TINT = {
  love: 'rgba(192,132,151,.14)',
  money: 'rgba(154,141,114,.16)',
  health: 'rgba(127,160,122,.16)',
  luck: 'rgba(217,169,78,.16)',
}

// Значок рейтинга благоприятности лунного дня.
export const RATING_GLYPH = { good: '●', neutral: '○', bad: '×' }
export const RATING_LABEL = { good: 'хорошо', neutral: 'нейтрально', bad: 'плохо' }
