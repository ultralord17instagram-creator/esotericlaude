'use client'
import MatrixHeader from '../../matrix/MatrixHeader'
import MatrixSVG from '../../matrix/MatrixSVG'
import MatrixInterpretations from '../../matrix/MatrixInterpretations'
import Paywall from '../../components/ui/Paywall'
import { MATRIX_CONTENT, ASPECT_LABELS } from '../../content/matrix-content'
import { resolveFocusAspect } from '../logic/focus.js'
import styles from '../lp.module.css'

export default function Teaser({ landing, answers, matrixData, isSubscribed }) {
  const center = matrixData.nodes.center
  const content = MATRIX_CONTENT[center] || MATRIX_CONTENT[1]
  const focusAspect = resolveFocusAspect(landing, answers.focus)

  return (
    <div className={styles.page}>
      <MatrixHeader
        name={answers.name || ''}
        birthDate={matrixData.birthDate}
        age={matrixData.age}
        personalNumber={center}
      />
      <MatrixSVG nodes={matrixData.nodes} />

      {isSubscribed ? (
        <MatrixInterpretations centerNumber={center} isSubscribed />
      ) : (
        <>
          {/* Бесплатный блок */}
          <div>
            <h3 className={styles.title}>{ASPECT_LABELS.personality}</h3>
            <p>{content.personality}</p>
          </div>
          {/* Заблюренный блок под запрос пользователя */}
          <div>
            <h3 className={styles.title}>{ASPECT_LABELS[focusAspect]}</h3>
            <p className={styles.locked}>{content[focusAspect]}</p>
          </div>
          <Paywall />
        </>
      )}
    </div>
  )
}
