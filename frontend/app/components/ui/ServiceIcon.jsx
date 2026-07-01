// Bespoke esoteric glyph per service, gold stroke on a dark medallion.
export default function ServiceIcon({ id, size = 28, color = '#D8B884' }) {
  const common = { width: size, height: size, viewBox: '0 0 28 28', 'aria-hidden': true }
  switch (id) {
    case 'matrix':
      return (
        <svg {...common}>
          <rect x="6" y="6" width="16" height="16" fill="none" stroke={color} strokeWidth="1.3"/>
          <rect x="6" y="6" width="16" height="16" transform="rotate(45 14 14)" fill="none" stroke={color} strokeWidth="1.3"/>
          <circle cx="14" cy="14" r="1.5" fill={color}/>
        </svg>
      )
    case 'tarot':
      return (
        <svg {...common}>
          <rect x="9" y="4" width="10" height="20" rx="2.5" fill="none" stroke={color} strokeWidth="1.3"/>
          <path d="M14 8.5 l1.1 2.9 2.9 1.1 -2.9 1.1 -1.1 2.9 -1.1 -2.9 -2.9 -1.1 2.9 -1.1 z" fill="none" stroke={color} strokeWidth="1.2"/>
        </svg>
      )
    case 'horoscope':
      return (
        <svg {...common}>
          <circle cx="14" cy="14" r="4" fill="none" stroke={color} strokeWidth="1.3"/>
          <ellipse cx="14" cy="14" rx="10.5" ry="5.5" transform="rotate(-22 14 14)" fill="none" stroke={color} strokeWidth="1.2"/>
          <circle cx="22.5" cy="10.5" r="1.4" fill={color}/>
        </svg>
      )
    case 'numerology':
      return (
        <svg {...common}>
          <circle cx="14" cy="14.5" r="8.5" fill="none" stroke={color} strokeWidth="1.3"/>
          <path d="M14 6.5 L21 20 L7 20 Z" fill="none" stroke={color} strokeWidth="1.2"/>
          <circle cx="14" cy="15.5" r="1.3" fill={color}/>
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M14 4 l2.2 7.2 7.2 2.2 -7.2 2.2 -2.2 7.2 -2.2 -7.2 -7.2 -2.2 7.2 -2.2 z" fill="none" stroke={color} strokeWidth="1.2"/>
        </svg>
      )
  }
}
