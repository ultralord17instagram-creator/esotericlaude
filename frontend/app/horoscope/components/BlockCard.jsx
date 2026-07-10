'use client'
import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Paywall from '../../components/ui/Paywall'
import { Lock } from './icons'
import styles from '../horoscope.module.css'

// block: { id, name, free, text, bait? }. text: строка (free) или { teaser, body } (платный).
export default function BlockCard({ block, isSubscribed }) {
  const [payOpen, setPayOpen] = useState(false)
  const unlocked = block.free || isSubscribed
  const isPaid = typeof block.text === 'object'
  const full = isPaid ? `${block.text.teaser} ${block.text.body}` : block.text
  const teaser = isPaid ? block.text.teaser : block.text
  const bait = block.bait || teaser

  return (
    <div className={styles.block}>
      <div className={styles.blockName}>{block.name}</div>
      {unlocked ? (
        <p className={styles.blockText}>{full}</p>
      ) : (
        <div className={styles.locked}>
          <p className={styles.lockedTeaser}>{teaser}</p>
          <p className={styles.bait}>{bait}</p>
          <button type="button" className={styles.lockCta} onClick={() => setPayOpen(true)}>
            <Lock size={14} /> Открыть по подписке
          </button>
          <span className={styles.lockNote}>Отмена в любой момент</span>
          <Modal open={payOpen} onClose={() => setPayOpen(false)}>
            <Paywall />
          </Modal>
        </div>
      )}
    </div>
  )
}
