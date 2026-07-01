import { CHAKRA_CONTENT, CHAKRA_LABELS } from '../content/matrix-content'
import Paywall from '../components/ui/Paywall'
import styles from './matrix.module.css'

const CHAKRA_ORDER = ['sahasrara', 'ajna', 'vishuddha', 'anahata', 'manipura', 'svadhishthana', 'muladhara', 'general']

export default function ChakraInterpretations({ chakras, isSubscribed }) {
  return (
    <div className={styles.interpretations}>
      <h2 className={styles.sectionTitle}>Расшифровка карты чакр</h2>

      {CHAKRA_ORDER.map(key => {
        const label = key === 'general' ? { ru: 'Общее', color: '#333' } : CHAKRA_LABELS[key]
        const number = chakras[key]?.total || 1
        const text = CHAKRA_CONTENT[key]?.[number] || ''

        return (
          <div key={key} className={styles.interpretBlock}>
            <h3 className={styles.interpretTitle} style={{ color: label.color }}>
              {label.ru}
            </h3>
            {isSubscribed ? (
              <p className={styles.interpretText}>{text}</p>
            ) : (
              <p className={styles.interpretPreview}>{text.slice(0, 60)}…</p>
            )}
          </div>
        )
      })}

      {!isSubscribed && (
        <div className={styles.interpretPaywall}>
          <Paywall />
        </div>
      )}
    </div>
  )
}
