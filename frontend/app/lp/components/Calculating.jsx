'use client'
import { useState, useEffect } from 'react'
import styles from '../lp.module.css'

const DEFAULT_LINES = [
  'Раскладываю числа твоей даты…',
  'Строю мужскую и женскую линии…',
  'Нахожу твой повторяющийся сценарий…',
]

export default function Calculating({ onDone, duration = 2600, title = 'Считываю твою матрицу отношений…', lines = DEFAULT_LINES, variant }) {
  const [pct, setPct] = useState(0)
  const cosmic = variant === 'cosmic'

  useEffect(() => {
    let raf
    let done = false
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      setPct(Math.round((1 - Math.pow(1 - t, 2)) * 100)) // ease-out
      if (t < 1) raf = requestAnimationFrame(tick)
      else if (!done) { done = true; setTimeout(onDone, 400) }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [onDone, duration])

  const sub = pct < 40 ? lines[0] : pct < 75 ? lines[1] : lines[2]

  return (
    <section className={styles.loading}>
      {cosmic ? (
        <div className={styles.cosmicRingWrap}>
          <div className={styles.cosmicRing}
            style={{ background: `conic-gradient(#e8d29a ${pct * 3.6}deg, rgba(200,185,138,.12) 0)` }} />
          <div className={styles.cosmicRingInner} />
          <div className={styles.cosmicPct}>{pct}%</div>
        </div>
      ) : (
        <div className={styles.loadingRings}>
          <div className={styles.ring1} />
          <div className={styles.ring2} />
          <div className={styles.ring3} />
          <div className={styles.loadingPct}>{pct}<span>%</span></div>
        </div>
      )}
      <h2 className={`${styles.h2} ${styles.loadingTitle}`}>{title}</h2>
      <p className={styles.loadingSub}>{sub}</p>
    </section>
  )
}
