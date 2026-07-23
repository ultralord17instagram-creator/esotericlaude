'use client'
import MatrixDiagram from './MatrixDiagram'
import { resolveCopy } from '../../content/landings/love-copy.js'
import styles from '../lp.module.css'

function Legend() {
  return (
    <div className={styles.legend}>
      <div className={styles.legendItem}>
        <span className={styles.legendBar} style={{ background: '#3f6d74' }} />
        <span><b>Мужская линия</b> · как ты выбираешь</span>
      </div>
      <div className={styles.legendItem}>
        <span className={styles.legendBar} style={{ background: '#c07a4e' }} />
        <span><b>Женская линия</b> · как удерживаешь</span>
      </div>
      <div className={styles.legendItem}>
        <span className={styles.legendDot} style={{ background: '#160c0f', border: '1.5px solid #e0a578' }} />
        <span><b>Портреты</b> · день, месяц, год, задача</span>
      </div>
      <div className={styles.legendItem}>
        <span className={styles.legendDot} style={{ background: '#160c0f', border: '2px solid #e7cf94' }} />
        <span><b>Центр</b> · число личности, зона комфорта</span>
      </div>
    </div>
  )
}

export default function Verdict({ answers, matrixData, onNext }) {
  const center = matrixData.nodes.center
  const copy = resolveCopy(center)
  const name = (answers?.name || '').trim()

  return (
    <section className={`${styles.funnel} ${styles.shell}`}>
      <div className={styles.matrix}>
        <div className={styles.matrixArt}>
          <div className={`${styles.eyebrow} ${styles.matrixIntro}`}>
            {name ? `${name}, твоя матрица отношений` : 'Твоя матрица отношений'}
          </div>
          <MatrixDiagram nodes={matrixData.nodes} highlight={['center', 'female1']} />
          <Legend />
        </div>
        <div className={styles.matrixCopy}>
          <div className={styles.verdictText}>
            <p className={styles.body}>{copy.verdict}</p>
          </div>
          <button className={`${styles.cta} ${styles.ctaFull}`} onClick={onNext}>
            Показать, почему ты выбираешь именно таких →
          </button>
        </div>
      </div>
    </section>
  )
}
