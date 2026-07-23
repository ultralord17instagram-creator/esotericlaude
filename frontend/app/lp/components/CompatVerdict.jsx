'use client'
import { resolveVerdict } from '../../content/landings/him-copy.js'
import styles from '../lp.module.css'

export default function CompatVerdict({ score, onNext }) {
  const body = resolveVerdict(score.attraction)

  return (
    <section className={`${styles.funnel} ${styles.shell}`}>
      <div className={styles.verdictGrid}>
        <div>
          <div className={styles.eyebrow}>Ваш разбор готов</div>
          <p className={styles.body} style={{ marginTop: 16 }}>{body}</p>
        </div>

        <div className={styles.scoreCard}>
          <div className={`${styles.scoreRow} ${styles.scoreRowActive}`}>
            <span>ты</span><b>{score.herScore}%</b>
          </div>
          <div className={styles.scoreRow}>
            <span>идеальная для него</span><b>{score.idealScore}%</b>
          </div>
          <div className={styles.scoreDivider}>
            <span>точка притяжения</span><b>{score.attraction}</b>
          </div>
          <button className={`${styles.cta} ${styles.ctaFull}`} onClick={onNext}>
            Показать, кто она →
          </button>
        </div>
      </div>
    </section>
  )
}
