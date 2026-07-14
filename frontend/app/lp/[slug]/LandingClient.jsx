'use client'
import styles from '../lp.module.css'

export default function LandingClient({ landing }) {
  return (
    <div className={styles.page}>
      <p className={styles.subtitle}>{landing.hero.eyebrow}</p>
      <h1 className={styles.title}>{landing.hero.title}</h1>
    </div>
  )
}
