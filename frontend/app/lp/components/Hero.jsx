'use client'
import styles from '../lp.module.css'

export default function Hero({ hero, onStart }) {
  return (
    <div className={styles.page}>
      <p className={styles.subtitle}>{hero.eyebrow}</p>
      <h1 className={styles.title}>{hero.title}</h1>
      <p className={styles.subtitle}>{hero.subtitle}</p>
      <button className={styles.cta} onClick={onStart}>{hero.cta}</button>
      {hero.proof && <p className={styles.subtitle}>{hero.proof}</p>}
    </div>
  )
}
