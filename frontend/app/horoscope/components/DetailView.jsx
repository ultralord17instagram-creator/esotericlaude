'use client'
import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Paywall from '../../components/ui/Paywall'
import { CATEGORY_ICON, Lock } from './icons'
import styles from '../horoscope.module.css'

// Экран деталей категории дня (drill-down из плиток «Сегодня»).
// block: { id, name, free, text: { teaser, body }, bait }.
export default function DetailView({ block, signName, isSubscribed, onBack }) {
  const [payOpen, setPayOpen] = useState(false)
  const Icon = CATEGORY_ICON[block.id]
  const unlocked = block.free || isSubscribed

  const teaser = typeof block.text === 'object' ? block.text.teaser : block.text
  const body = typeof block.text === 'object' ? block.text.body : ''
  const bait = block.bait ?? teaser

  return (
    <section className={styles.detail}>
      <div className={styles.detailHead}>
        <button type="button" className={styles.detailBack} onClick={onBack} aria-label="Назад">‹</button>
        <div className={styles.detailKicker}>{signName} · {block.name}</div>
      </div>

      <div className={styles.detailIcon}>{Icon && <Icon size={30} />}</div>
      <h1 className={styles.detailTitle}>{block.name}</h1>

      {unlocked ? (
        <>
          <p className={styles.detailLead}>{teaser}</p>
          {body && <p className={styles.detailBody}>{body}</p>}
        </>
      ) : (
        <>
          <p className={styles.detailLead}>{teaser}</p>
          <div className={styles.fadeWrap}>
            <p className={styles.fadeText}>{bait}</p>
            <div className={styles.fadeMask} />
          </div>
          <button type="button" className={styles.baitCta} onClick={() => setPayOpen(true)}>
            <Lock size={15} /> Смотреть полный разбор <span aria-hidden>→</span>
          </button>
          <div className={styles.lockNote}>Откроется по подписке, отмена в любой момент</div>
          <Modal open={payOpen} onClose={() => setPayOpen(false)}>
            <Paywall />
          </Modal>
        </>
      )}
    </section>
  )
}
