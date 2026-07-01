import Card from '../components/ui/Card'
import styles from './results.module.css'

const POSITIONS = [
  { key: 'past', label: 'Прошлое' },
  { key: 'present', label: 'Настоящее' },
  { key: 'future', label: 'Будущее' },
]

export default function TarotPaidResult({ result }) {
  return (
    <div className={styles.spread}>
      {POSITIONS.map(pos => (
        <Card key={pos.key} className={styles.posCard}>
          <p className={styles.position}>{pos.label}</p>
          <p className={styles.cardName}>{result[pos.key].name}</p>
          <p>{result[pos.key].meaning}</p>
        </Card>
      ))}
      <Card className={styles.synthesisCard}>
        <h3 className={styles.synthTitle}>Общий смысл расклада</h3>
        <p>{result.synthesis}</p>
      </Card>
    </div>
  )
}
