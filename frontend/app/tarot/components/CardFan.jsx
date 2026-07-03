'use client'
import TarotCard from './TarotCard'
import styles from './tarot.module.css'

// Веер из `count` одинаковых рубашек. Тап по невыбранной рубашке → onPick(index).
// reveals: { [index]: card } — какие слоты уже перевёрнуты (показывают лицо).
// done: расклад завершён — новые тапы игнорируются.
export default function CardFan({ count, reveals = {}, onPick, done = false }) {
  return (
    <div className={styles.fan}>
      {Array.from({ length: count }, (_, i) => {
        const card = reveals[i]
        const revealed = Boolean(card)
        return (
          <button
            key={i}
            type="button"
            className={styles.slot}
            disabled={revealed || done}
            onClick={() => !revealed && !done && onPick(i)}
            aria-label={revealed ? `${card.ru}` : 'Перевернуть карту'}
          >
            <TarotCard card={card} faceUp={revealed} />
          </button>
        )
      })}
    </div>
  )
}
