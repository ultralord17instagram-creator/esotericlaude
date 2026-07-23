'use client'
import { useState } from 'react'
import styles from './tarot.module.css'

const cardImageSrc = (number) => `/cards/${number}.png`

// Оформленная карта в расшифровке: рамка Astrix + арт + угловые цифры номера.
// variant: 'hero' (одна карта) | 'triad' (три карты) | 'mini' (строка Да/Нет).
// active — золотая подсветка (центральная позиция / текущая карта).
export default function ReadingCard({ card, variant = 'hero', active = false }) {
  const [imgError, setImgError] = useState(false)
  const sizeClass = variant === 'triad' ? styles.fcTriad : variant === 'mini' ? styles.fcMini : styles.fcHero
  const cls = `${styles.framedCard} ${sizeClass} ${active ? styles.fcActive : ''}`

  return (
    <div className={cls}>
      <span className={`${styles.corner} ${styles.cornerTL}`}>{card?.number ?? ''}</span>
      <span className={`${styles.corner} ${styles.cornerBR}`}>{card?.number ?? ''}</span>
      <div className={styles.framedInner}>
        {card && !imgError ? (
          <img src={cardImageSrc(card.number)} alt={card.ru} loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className={`${styles.card} ${styles.cardFace}`} style={{ width: '100%', height: '100%', boxShadow: 'none', borderRadius: 0 }}>
            <span className={styles.cardNameRu}>{card?.ru}</span>
            <span className={styles.cardNameEn}>{card?.en}</span>
          </div>
        )}
      </div>
    </div>
  )
}
