import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function NumerologyFreeResult({ result }) {
  return (
    <Card>
      <h2 className={styles.title}>{result.title}</h2>
      <div className={styles.bigNumber}>{result.number}</div>
      <p className={styles.preview}>{result.preview}</p>
      <p className={styles.teaser}>{result.teaser}</p>
    </Card>
  )
}
