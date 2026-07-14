'use client'
import MatrixSVG from '../../matrix/MatrixSVG'
import { resolveCopy } from '../../content/landings/love-copy.js'
import styles from '../lp.module.css'

export default function Verdict({ answers, matrixData, onNext }) {
  const center = matrixData.nodes.center
  const copy = resolveCopy(center)
  const name = (answers?.name || '').trim()

  return (
    <div className={styles.page}>
      <p className={styles.subtitle}>
        {name ? `${name}, твоя матрица отношений` : 'Твоя матрица отношений'}
      </p>
      <MatrixSVG nodes={matrixData.nodes} highlight={['center', 'female1']} />
      <div className={styles.verdict}>
        <p>{copy.verdict}</p>
      </div>
      <button className={styles.cta} onClick={onNext}>
        Показать, почему ты выбираешь именно таких →
      </button>
    </div>
  )
}
