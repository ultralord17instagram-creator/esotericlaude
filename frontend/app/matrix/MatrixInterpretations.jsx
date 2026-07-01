import { MATRIX_CONTENT, FREE_ASPECTS, PAID_ASPECTS, ASPECT_LABELS } from '../content/matrix-content'
import Paywall from '../components/ui/Paywall'
import styles from './matrix.module.css'

export default function MatrixInterpretations({ centerNumber, isSubscribed }) {
  const content = MATRIX_CONTENT[centerNumber] || MATRIX_CONTENT[1]

  return (
    <div className={styles.interpretations}>
      <h2 className={styles.sectionTitle}>Расшифровка значений</h2>

      {FREE_ASPECTS.map(aspect => (
        <div key={aspect} className={styles.interpretBlock}>
          <h3 className={styles.interpretTitle}>{ASPECT_LABELS[aspect]}</h3>
          <p className={styles.interpretText}>{content[aspect]}</p>
        </div>
      ))}

      <div className={styles.paidInterpretations}>
        {PAID_ASPECTS.map(aspect => (
          <div key={aspect} className={styles.interpretBlock}>
            <h3 className={styles.interpretTitle}>{ASPECT_LABELS[aspect]}</h3>
            {isSubscribed ? (
              <p className={styles.interpretText}>{content[aspect]}</p>
            ) : (
              <div className={styles.paywallWrap}>
                <p className={styles.interpretPreview}>{content[aspect].slice(0, 60)}…</p>
              </div>
            )}
          </div>
        ))}

        {!isSubscribed && (
          <div className={styles.interpretPaywall}>
            <Paywall />
          </div>
        )}
      </div>
    </div>
  )
}
