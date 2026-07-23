'use client'
import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Paywall from '../../components/ui/Paywall'
import { Lock } from './icons'
import styles from '../horoscope.module.css'

// Платный блок без подписки: байт-крючок читается целиком, ниже приглушённая
// строка-продолжение растворяется в фон, а триггер пейвола — тихая ссылка.
// Paywall всплывает оверлеем (тот же паттерн, что в numerology/ResultReading).
export default function PaidReveal({ bait, ghost, cta = 'Смотреть полный разбор' }) {
  const [payOpen, setPayOpen] = useState(false)
  return (
    <div className={styles.locked}>
      <div className={styles.baitReveal}>
        <p className={styles.lockedTeaser}>{bait}</p>
        {ghost && <p className={styles.baitGhost} aria-hidden>{ghost}</p>}
      </div>
      <button type="button" className={styles.baitCta} onClick={() => setPayOpen(true)}>
        <Lock size={14} /> {cta} <span aria-hidden>→</span>
      </button>
      <span className={styles.lockNote}>Откроется по подписке, отмена в любой момент</span>
      <Modal open={payOpen} onClose={() => setPayOpen(false)}>
        <Paywall />
      </Modal>
    </div>
  )
}
