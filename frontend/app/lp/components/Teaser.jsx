'use client'
import Paywall from './Paywall'
import { resolveCopy, LOCKED_QUESTIONS_TAIL } from '../../content/landings/love-copy.js'
import { relationshipPoint } from '../logic/compat.js'
import styles from '../lp.module.css'

export default function Teaser({ landing, matrixData }) {
  const center = matrixData.nodes.center
  const copy = resolveCopy(center)
  const point = relationshipPoint(matrixData.nodes)
  const questions = [copy.hookQuestion, ...LOCKED_QUESTIONS_TAIL]

  return (
    <section className={`${styles.funnel} ${styles.shell}`}>
      <div className={styles.teaser}>
        <div className={styles.teaserHead}>
          <div className={styles.eyebrow}>Твой разбор готов</div>
          <h2 className={styles.h2} style={{ marginTop: 14 }}>
            Три вопроса, ответы на которые уже посчитаны в твоей матрице
          </h2>
        </div>

        {/* Реальная «точка отношений» показана бесплатно как пруф расчёта */}
        <div className={styles.center} style={{ marginTop: 18 }}>
          <span className={styles.pointChip}>точка отношений <b>{point}</b></span>
        </div>

        <ul className={styles.lockList}>
          {questions.map((q, i) => (
            <li key={q} className={styles.lockRow} style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
              <span className={styles.lockRowIcon} aria-hidden>🔒</span>
              <span>{q}</span>
            </li>
          ))}
        </ul>

        <div className={styles.assurance}>
          Ответы уже рассчитаны по твоей дате. Осталось их открыть.
        </div>

        <Paywall slug={landing.slug} ctaOnly />
      </div>
    </section>
  )
}
