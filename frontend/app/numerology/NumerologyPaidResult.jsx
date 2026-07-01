import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function NumerologyPaidResult({ result }) {
  return (
    <div className={styles.grid}>
      <Card>
        <h3 className={styles.cardTitle}>Число жизненного пути: {result.lifePath.number}</h3>
        <p>{result.lifePath.meaning}</p>
      </Card>
      <Card>
        <h3 className={styles.cardTitle}>Число имени: {result.nameNumber.number}</h3>
        <p>{result.nameNumber.meaning}</p>
      </Card>
      <Card>
        <h3 className={styles.cardTitle}>Синтез</h3>
        <p>{result.compatibility}</p>
      </Card>
      <Card>
        <h3 className={styles.cardTitle}>Прогноз</h3>
        <p>{result.forecast}</p>
      </Card>
    </div>
  )
}
