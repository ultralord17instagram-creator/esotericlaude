// Инлайн-SVG из макета Astrix. Наследуют currentColor, размеры задаёт вызывающий CSS.

export const StarMark = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 3 l1.5 7.5 7.5 1.5 -7.5 1.5 -1.5 7.5 -1.5 -7.5 -7.5 -1.5 7.5 -1.5 z" fill="currentColor" />
  </svg>
)

export const Check = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden>
    <path d="M2 6.3 l2.5 2.5 5-5.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
  </svg>
)

export const Arrow = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M4 12 h15 M13 6 l6 6 -6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ── Иконки тем ────────────────────────────────────────────
export const IconGeneral = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M12 7 l1 3.9 3.9 1 -3.9 1 -1 3.9 -1 -3.9 -3.9 -1 3.9 -1 z" fill="currentColor" />
  </svg>
)
export const IconShadow = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M20 15.5 A8.5 8.5 0 1 1 11 4 A6.6 6.6 0 0 0 20 15.5 z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
)
export const IconPurpose = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" />
  </svg>
)
export const IconPartner = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 20 C4 14 4 7 8.5 7 C11 7 12 9 12 9 C12 9 13 7 15.5 7 C20 7 20 14 12 20 z" fill="none" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)
export const IconAncestral = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M12 21 V10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="12" cy="7" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M12 14 L7.5 18 M12 14 L16.5 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
)

// ── Иконки позиций «три карты» (Прошлое · Настоящее · Будущее) ──
export const IconPast = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M12 8 v4 l3 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)
export const IconFuture = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M12 3 v2 M12 19 v2 M3 12 h2 M19 12 h2 M5.5 5.5 l1.5 1.5 M17 17 l1.5 1.5 M18.5 5.5 l-1.5 1.5 M7 17 l-1.5 1.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

// ── Иконки расшифровки ────────────────────────────────────
export const IconSays = ({ size = 19 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M12 11 v5 M12 8 v.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)
export const VerdictYes = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M5 12.5 l4.5 4.5 9.5 -10.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
export const VerdictNo = ({ size = 38 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M7 7 l10 10 M17 7 l-10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// Иконки тем по id (для конфига SPREADS.three.themes)
export const THEME_ICONS = {
  ppf: IconGeneral,
  shadow: IconShadow,
  purpose: IconPurpose,
  partner: IconPartner,
  ancestral: IconAncestral,
}
