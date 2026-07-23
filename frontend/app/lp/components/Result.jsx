'use client'
import { useRouter } from 'next/navigation'
import MatrixDiagram from './MatrixDiagram'
import { MATRIX_CONTENT } from '../../content/matrix-content'
import { resolveSigns } from '../../content/landings/love-copy.js'
import { compatibleCore, relationshipPoint } from '../logic/compat.js'
import styles from '../lp.module.css'

export default function Result({ answers, matrixData }) {
  const router = useRouter()
  const center = matrixData.nodes.center
  const content = MATRIX_CONTENT[center] || MATRIX_CONTENT[1]
  const point = relationshipPoint(matrixData.nodes)
  const compat = compatibleCore(matrixData.nodes)
  const name = (answers?.name || '').trim()

  return (
    <section className={`${styles.funnel} ${styles.shell}`}>
      <div className={styles.result}>
        <div className={`${styles.eyebrow} ${styles.center}`}>
          {name ? `${name}, вот полный разбор` : 'Твой полный разбор'}
        </div>

        <MatrixDiagram nodes={matrixData.nodes} highlight={['center', 'female1']} />

        {/* Ответы в порядке трёх залоченных вопросов тизера (честностная сцепка) */}
        <div className={styles.resultBlock}>
          <h3>Рядом с кем твой круг обрывается</h3>
          <p>Твоя точка отношений это {point}. Тебе подходит партнёр с ядром {compat}.</p>
        </div>

        <div className={styles.resultBlock}>
          <h3>Как узнать его при первой встрече</h3>
          <p>{resolveSigns(compat)}</p>
        </div>

        <div className={styles.resultBlock}>
          <h3>В какие годы открывается окно</h3>
          <p>{content.yearForecast}</p>
        </div>

        <div className={styles.resultBlock}>
          <h3>Полный разбор твоего сценария</h3>
          <p>{content.relationships}</p>
        </div>

        <div className={styles.triumph}>
          <h3>Готово. Теперь тебе доступны все продукты Astrix</h3>
          <p>Матрица, таро, гороскоп и нумерология. Подписка открыта во всём сервисе.</p>
          <button className={`${styles.cta} ${styles.ctaFull}`} onClick={() => router.push('/')}>
            Перейти в Astrix →
          </button>
        </div>
      </div>
    </section>
  )
}
