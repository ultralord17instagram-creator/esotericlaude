'use client'
import { useState } from 'react'
import styles from './tarot.module.css'

// Путь к картинке аркана по номеру (файлы в frontend/public/cards/0.png … 21.png).
const cardImageSrc = (number) => `/cards/${number}.png`

// Крупная рубашка «геройского» размера с лого Astrix (экран вытягивания одной карты).
const HeroBack = () => (
  <div className={styles.hero}>
    <div className={styles.heroInner}>
      <svg width="118" height="118" viewBox="0 0 120 120" aria-hidden>
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(185,149,79,.4)" strokeWidth="1" />
        <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(185,149,79,.25)" strokeWidth="1" />
        <path d="M60 24 l3.5 18.5 18.5 3.5 -18.5 3.5 -3.5 18.5 -3.5 -18.5 -18.5 -3.5 18.5 -3.5 z" fill="#B9954F" />
      </svg>
      <span className={styles.heroLogo}>Astrix</span>
    </div>
  </div>
)

// Одна карта: рубашка (faceUp=false) или лицо (faceUp=true).
// card = { number, en, ru } | null. big — крупный размер (день / ответ / вытягивание).
export default function TarotCard({ card, faceUp = false, big = false, hero = false }) {
  const [imgError, setImgError] = useState(false)

  // Крупная рубашка с лого — для экрана «Открыть карту».
  if (hero && !faceUp) return <HeroBack />

  const cls = `${styles.card} ${faceUp ? styles.cardFace : styles.cardBack} ${big ? styles.heroFace : ''}`

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
