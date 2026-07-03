'use client'
import { useState } from 'react'
import styles from './tarot.module.css'

// Путь к картинке аркана по номеру (файлы в frontend/public/cards/0.png … 21.png).
const cardImageSrc = (number) => `/cards/${number}.png`

// Одна карта: рубашка (faceUp=false) или лицо (faceUp=true).
// card = { number, en, ru } | null. big — увеличенный размер для результата.
// На лице показывается картинка аркана; если она не загрузилась — текстовый фолбэк.
export default function TarotCard({ card, faceUp = false, big = false }) {
  const [imgError, setImgError] = useState(false)
  const cls = `${styles.card} ${faceUp ? styles.cardFace : styles.cardBack} ${big ? styles.bigCard : ''}`

  if (!faceUp || !card) {
    return <div className={cls} aria-hidden />
  }

  if (!imgError) {
    return (
      <div className={cls}>
        <img
          className={styles.cardImg}
          src={cardImageSrc(card.number)}
          alt={card.ru}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // Фолбэк, если картинка недоступна — показываем название текстом.
  return (
    <div className={cls}>
      <span className={styles.cardNum}>{card.number}</span>
      <span className={styles.cardNameRu}>{card.ru}</span>
      <span className={styles.cardNameEn}>{card.en}</span>
    </div>
  )
}
