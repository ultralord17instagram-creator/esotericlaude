'use client'
import MatrixSVG from '../../matrix/MatrixSVG'
import LovePaywall from './LovePaywall'
import { resolveCopy, LOCKED_QUESTIONS_TAIL } from '../../content/landings/love-copy.js'
import { relationshipPoint } from '../logic/compat.js'
import styles from '../lp.module.css'

export default function Teaser({ landing, matrixData }) {
  const center = matrixData.nodes.center
  const copy = resolveCopy(center)
  const point = relationshipPoint(matrixData.nodes)
  const questions = [copy.hookQuestion, ...LOCKED_QUESTIONS_TAIL]

  return (
    <div className={styles.page}>
      {/* Диаграмма как пруф + залоченное «замочное место» */}
      <div className={styles.diagramWrap}>
        <MatrixSVG nodes={matrixData.nodes} highlight={['female1']} />
        <span className={styles.compatLock} aria-label="Число совместимости заблокировано">🔒</span>
      </div>

      {/* Точка отношений реальна и показана бесплатно (пруф расчёта) */}
      <div className={styles.pointChip}>точка отношений <b>{point}</b></div>

      <p className={styles.subtitle}>
        Три вопроса, ответы на которые уже посчитаны в твоей матрице:
      </p>

      <ul className={styles.lockList}>
        {questions.map((q) => (
          <li key={q} className={styles.lockRow}>
            <span className={styles.lockRowIcon} aria-hidden>🔒</span>
            <span>{q}</span>
          </li>
        ))}
      </ul>

      <LovePaywall slug={landing.slug} />
    </div>
  )
}
