import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function TarotFreeResult({ result }) {
  return (
    <Card>
      <h2 className={styles.title}>{result.title}</h2>
      <div className={styles.cardName}>{result.card.name}</div>
      <p className={styles.preview}>{result.card.meaning}</p>
      <p className={styles.teaser}>{result.teaser}</p>
    </Card>
  )
}
