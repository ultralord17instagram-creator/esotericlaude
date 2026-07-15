'use client'
import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import styles from '../lp.module.css'
import TarotCard from '../../tarot/components/TarotCard'
import { buildReveal } from '../logic/revealMachine.js'

const OPEN_DELAY = 1100 // мс между открытием карт

function prefersReduced() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Карты открываются по очереди, затем показывается закрытая карта (выбранный вопрос)
// с обрывом текста и кнопкой на пейвол.
export default function LiveReveal({ question, name, landing, onDone }) {
  const [reveal] = useState(() => buildReveal(question, name))
  const openCards = reveal.cards.filter((c) => !c.locked)
  const lock = reveal.cards.find((c) => c.locked)
  const reduced = prefersReduced()
  const [shown, setShown] = useState(reduced ? openCards.length : 0)
  const [atLock, setAtLock] = useState(reduced)

  useEffect(() => {
    if (reduced || atLock) return
    if (shown < openCards.length) {
      const t = setTimeout(() => setShown((n) => n + 1), OPEN_DELAY)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setAtLock(true), OPEN_DELAY)
    return () => clearTimeout(t)
  }, [shown, atLock, reduced, openCards.length])

  return (
    <section className={styles.reveal}>
      <p className={styles.revealIntro}>{landing.revealIntro}</p>
      <div className={styles.revealRow}>
        {openCards.map((c, i) => (
          <div key={i} className={`${styles.revealSlot} ${i < shown ? styles.revealSlotOpen : ''}`}>
            <TarotCard card={c.card} faceUp={i < shown} />
            <div className={styles.revealPos}>{c.position}</div>
          </div>
        ))}
      </div>

      {openCards.slice(0, shown).map((c, i) => (
        <p key={i} className={styles.revealText}>{c.text}</p>
      ))}

      {atLock && (
        <div className={styles.lock}>
          <div className={styles.lockTitle}>{lock.position}</div>
          <div className={styles.lockCard}>
            <TarotCard card={lock.card} faceUp={false} />
            <span className={styles.lockIcon}><Lock size={28} /></span>
          </div>
          <p className={styles.revealText}>
            {lock.text} <span className={styles.lockBlur}>▨▨▨▨ ▨▨▨▨▨▨ ▨▨▨</span>
          </p>
          <p className={styles.lockUrgency}>{landing.paywall.urgency}</p>
          <button className={`${styles.cta} ${styles.ctaFull}`} onClick={onDone}>
            {landing.microcopy.toLock}
          </button>
        </div>
      )}
    </section>
  )
}
