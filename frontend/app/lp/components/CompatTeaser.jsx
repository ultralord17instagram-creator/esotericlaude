'use client'
import Paywall from './Paywall'
import { LOCKED_QUESTIONS } from '../../content/landings/him-copy.js'
import styles from '../lp.module.css'

export default function CompatTeaser({ landing, score, rivalScore }) {
  return (
    <section className={`${styles.funnel} ${styles.shell}`}>
      <div className={styles.teaser}>
        <div className={styles.teaserHead}>
          <div className={styles.eyebrow}>Твой разбор готов</div>
          <h2 className={styles.h2} style={{ marginTop: 14 }}>
            Четыре ответа, которые уже <span className={styles.accent}>посчитаны</span> по вашим числам
          </h2>
        </div>

        <div className={styles.center} style={{ marginTop: 18 }}>
          <span className={styles.pointChip}>ты <b>{score.herScore}%</b></span>{' '}
          {rivalScore != null
            ? <span className={styles.pointChip}>она <b>{rivalScore}%</b></span>
            : <span className={styles.pointChip}>идеальная <b>{score.idealScore}%</b></span>}
        </div>

        <ul className={`${styles.lockList} ${styles.lockGrid}`}>
          {LOCKED_QUESTIONS.map((q, i) => (
            <li key={q} className={styles.lockRow} style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
              <span>{q}</span>
            </li>
          ))}
        </ul>

        <div className={styles.assurance}>
          Ответы уже рассчитаны по вашим датам. Осталось их открыть.
        </div>

        <Paywall slug={landing.slug} ctaOnly />
      </div>
    </section>
  )
}
