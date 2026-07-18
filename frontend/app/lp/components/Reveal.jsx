'use client'
import styles from '../lp.module.css'
import Paywall from './Paywall'

// fields: [{ id, label, value, locked }]. unlocked=true -> раскрыть всё, без пейвола.
export default function Reveal({ slug, fields, paywall, unlocked }) {
  return (
    <section className={styles.funnel}>
      <div className={styles.quizBody}>
        {fields.map((f) => {
          const show = unlocked || !f.locked
          return (
            <div key={f.id} className={styles.revealRow}>
              <div className={styles.eyebrow}>{f.label}</div>
              {show
                ? <p className={styles.lead}>{f.value}</p>
                : <p className={`${styles.lead} ${styles.locked}`}>🔒</p>}
            </div>
          )
        })}
      </div>
      {!unlocked && <Paywall slug={slug} heading={paywall.heading} payoffs={paywall.payoffs} />}
    </section>
  )
}
