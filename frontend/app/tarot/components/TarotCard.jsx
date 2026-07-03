'use client'
import styles from './tarot.module.css'

// Одна карта: рубашка (faceUp=false) или лицо (faceUp=true).
// card = { number, en, ru } | null. big — увеличенный размер для результата.
export default function TarotCard({ card, faceUp = false, big = false }) {
  const cls = `${styles.card} ${faceUp ? styles.cardFace : styles.cardBack} ${big ? styles.bigCard : ''}`
  if (!faceUp || !card) {
    return <div className={cls} aria-hidden />
  }
  return (
    <div className={cls}>
      <span className={styles.cardNum}>{card.number}</span>
      <span className={styles.cardNameRu}>{card.ru}</span>
      <span className={styles.cardNameEn}>{card.en}</span>
    </div>
  )
}
