'use client'
import { useState } from 'react'
import Paywall from '../../components/ui/Paywall'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import styles from '../numerology.module.css'

// free блок или подписчик -> полный текст. Платный без подписки -> тизер + замок.
export default function BlockCard({ title, number, text, free, isSubscribed, nameTouch }) {
  const [payOpen, setPayOpen] = useState(false)
  const unlocked = free || isSubscribed

  const full = typeof text === 'string' ? text : `${text.teaser} ${text.body}`
  const teaser = typeof text === 'string' ? text : text.teaser

  return (
    <div className={styles.block}>
      <div className={styles.blockHead}>
        <h3 className={styles.blockTitle}>{title}</h3>
        {number != null && <span className={styles.blockNum}>{number}</span>}
      </div>

      {unlocked ? (
        <p className={styles.blockText}>{full}</p>
      ) : (
        <div className={styles.blockLocked}>
          <p className={styles.blockTeaser}>{teaser}</p>
          <Button variant="unlock" size="sm" onClick={() => setPayOpen(true)}>
            Открыть полный разбор
          </Button>
        </div>
      )}

      {nameTouch && unlocked && <p className={styles.blockNameTouch}>{nameTouch}</p>}

      {!isSubscribed && (
        <Modal open={payOpen} onClose={() => setPayOpen(false)}>
          <Paywall />
        </Modal>
      )}
    </div>
  )
}
