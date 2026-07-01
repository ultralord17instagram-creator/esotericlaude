import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function HoroscopePaidResult({ result }) {
  return (
    <div className={styles.grid}>
      <Card>
        <h3 className={styles.cardTitle}>Прогноз на месяц</h3>
        <p>{result.monthForecast}</p>
      </Card>
      <Card>
        <h3 className={styles.cardTitle}>Совместимость</h3>
        <p>{result.compatibility}</p>
      </Card>
      <Card>
        <h3 className={styles.cardTitle}>Совет звёзд</h3>
        <p>{result.advice}</p>
      </Card>
    </div>
  )
}
