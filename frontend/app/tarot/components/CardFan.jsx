'use client'
import styles from './tarot.module.css'

// Дуга-веер из `count` рубашек (макет 2e). Тап по невыбранной → onPick(index).
// picked: массив выбранных индексов в порядке выбора (для номеров-бейджей).
// done: расклад завершён — новые тапы игнорируются.
export default function CardFan({ count, picked = [], onPick, done = false }) {
  const half = (count - 1) / 2
  return (
    <div className={styles.fan}>
      {Array.from({ length: count }, (_, i) => {
        const pickIndex = picked.indexOf(i)
        const isPicked = pickIndex !== -1
        const d = i - half
        const rot = count > 1 ? d * (36 / (count - 1)) : 0
        // Сдвиги в % от высоты карты → масштабируются с адаптивным размером (десктоп/мобайл).
        // amp подобран так, чтобы крайние карты опускались ~на 30% высоты (как в макете).
        const amp = half > 0 ? 34 / (half * half) : 0
        const baseY = -4 + d * d * amp
        const y = isPicked ? baseY - 28 : baseY
        return (
          <button
            key={i}
            type="button"
            className={`${styles.fanSlot} ${isPicked ? styles.picked : ''}`}
            style={{ transform: `rotate(${rot}deg) translateY(${y}%)`, zIndex: isPicked ? 6 : i }}
            disabled={isPicked || done}
            onClick={() => !isPicked && !done && onPick(i)}
            aria-label={isPicked ? `Выбрана карта ${pickIndex + 1}` : 'Выбрать карту'}
          >
            {isPicked && <span className={styles.pickBadge}>{pickIndex + 1}</span>}
            <div className={`${styles.card} ${styles.cardBack} ${isPicked ? styles.cardPicked : ''}`} aria-hidden>
              <TarotCardMark />
            </div>
          </button>
        )
      })}
    </div>
  )
}

// Звезда по центру рубашки.
const TarotCardMark = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden style={{ position: 'relative', zIndex: 1 }}>
    <path d="M12 3 l1.5 7.5 7.5 1.5 -7.5 1.5 -1.5 7.5 -1.5 -7.5 -7.5 -1.5 7.5 -1.5 z" fill="currentColor" />
  </svg>
)
