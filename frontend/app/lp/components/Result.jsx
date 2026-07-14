'use client'
import { useRouter } from 'next/navigation'
import MatrixSVG from '../../matrix/MatrixSVG'
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
    <div className={styles.page}>
      <p className={styles.subtitle}>
        {name ? `${name}, вот полный разбор` : 'Твой полный разбор'}
      </p>
      <MatrixSVG nodes={matrixData.nodes} highlight={['center', 'female1']} />

      {/* Ответы идут в порядке трёх залоченных вопросов тизера (честностная сцепка) */}
      <section className={styles.block}>
        <h3 className={styles.title}>Рядом с кем твой круг обрывается</h3>
        <p>Твоя точка отношений это {point}. Тебе подходит партнёр с ядром {compat}.</p>
      </section>

      <section className={styles.block}>
        <h3 className={styles.title}>Как узнать его при первой встрече</h3>
        <p>{resolveSigns(compat)}</p>
      </section>

      <section className={styles.block}>
        <h3 className={styles.title}>В какие годы открывается окно</h3>
        <p>{content.yearForecast}</p>
      </section>

      <section className={styles.block}>
        <h3 className={styles.title}>Полный разбор твоего сценария</h3>
        <p>{content.relationships}</p>
      </section>

      <div className={styles.triumph}>
        <h3 className={styles.title}>Готово. Теперь тебе доступны все продукты Astrix</h3>
        <p className={styles.subtitle}>
          Матрица, таро, гороскоп и нумерология. Подписка открыта во всём сервисе.
        </p>
        <button className={styles.cta} onClick={() => router.push('/')}>
          Перейти в Astrix →
        </button>
      </div>
    </div>
  )
}
