'use client'
import { useState } from 'react'
import Link from 'next/link'
import CardFan from '../components/CardFan'
import TarotCard from '../components/TarotCard'
import { getDayCard, getText } from '../../content/tarot'
import styles from '../components/tarot.module.css'

// «Карта дня»: одна рубашка. Карта детерминирована датой (одна для всех, без бэкенда).
export default function DayClient() {
  const [card, setCard] = useState(null)

  const reveal = () => setCard(getDayCard())

  return (
    <div className={styles.page}>
      <Link href="/tarot" className={styles.backLink}>← Все расклады</Link>
      <h1 className={styles.title}>Карта дня</h1>
      <p className={styles.subtitle}>Переверни карту, чтобы увидеть послание дня</p>

      {!card ? (
        <CardFan count={1} reveals={{}} onPick={reveal} />
      ) : (
        <div className={styles.center}>
          <TarotCard card={card} faceUp big />
          <p className={styles.positionText} style={{ marginTop: 18 }}>
            {getText({ scenario: 'day', number: card.number })}
          </p>
        </div>
      )}
    </div>
  )
}
