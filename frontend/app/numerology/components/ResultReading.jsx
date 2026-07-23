'use client'
import { useState } from 'react'
import { Lock } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Paywall from '../../components/ui/Paywall'
import { Sparkle } from './icons'
import styles from '../numerology.module.css'

// Толкование одного выбранного направления. free или подписчик — полный текст;
// платное без подписки — байт-крючок и кнопка, по которой Paywall всплывает оверлеем.
export default function ResultReading({ number, kicker, title, block, isSubscribed, nameTouch, sealNote }) {
  const [payOpen, setPayOpen] = useState(false)
  const unlocked = block.free || isSubscribed
  const isMaster = number === 11 || number === 22

  const full = typeof block.text === 'string' ? block.text : `${block.text.teaser} ${block.text.body}`
  const teaser = typeof block.text === 'string' ? block.text : block.text.teaser
  const bait = block.bait ?? teaser

  return (
    <div className={styles.result}>
      <div className={styles.resultHero}>
        <div className={styles.sealCol}>
          <div className={styles.seal}>{number}</div>
          {sealNote && <span className={styles.sealNote}>{sealNote}</span>}
        </div>
        <div className={styles.sealMeta}>
          {kicker && <div className={styles.sealKicker}>{kicker}</div>}
          <h1 className={styles.sealTitle}>
            {title}
            {isMaster && <span className={styles.masterTag}>мастер-число</span>}
          </h1>
        </div>
      </div>

      <div className={styles.readingCard}>
        {unlocked ? (
          <>
            <p className={styles.readingText}>{full}</p>
            {nameTouch && <p className={styles.nameTouch}><Sparkle size={12} /> {nameTouch}</p>}
          </>
        ) : (
          <div className={styles.locked}>
            <div className={styles.baitReveal}>
              <p className={styles.lockedTeaser}>{bait}</p>
              <p className={styles.baitGhost} aria-hidden>
                Полное толкование показывает, откуда это идёт, к чему ведёт и что с этим
                делать по шагам, опираясь на твои числа, без общих фраз и воды, чтобы ты
                увидел картину целиком и…
              </p>
            </div>
            <button type="button" className={styles.baitCta} onClick={() => setPayOpen(true)}>
              <Lock size={14} /> Смотреть полный разбор <span aria-hidden>→</span>
            </button>
            <span className={styles.lockNote}>Откроется по подписке, отмена в любой момент</span>
          </div>
        )}
      </div>

      {!unlocked && (
        <Modal open={payOpen} onClose={() => setPayOpen(false)}>
          <Paywall />
        </Modal>
      )}
    </div>
  )
}
