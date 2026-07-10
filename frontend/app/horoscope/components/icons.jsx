// Иконки продукта «Гороскоп». Эмодзи фаз берутся из astro.PHASES.
// Служебные SVG — инлайн, наследуют currentColor. Финальный визуал за владельцем.
export function Lock({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export function Sparkle({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" fill="currentColor" />
    </svg>
  )
}

// Значок рейтинга благоприятности лунного дня.
export const RATING_GLYPH = { good: '●', neutral: '○', bad: '×' }
export const RATING_LABEL = { good: 'хорошо', neutral: 'нейтрально', bad: 'плохо' }
