import Card from '../components/ui/Card'
import styles from './results.module.css'

export default function HoroscopeFreeResult({ result }) {
  return (
    <Card>
      <h2 className={styles.title}>{result.title}</h2>
      <div className={styles.badges}>
        <span className={styles.badge}>{result.element}</span>
        <span className={styles.badge}>{result.planet}</span>
      </div>
      <p className={styles.preview}>{result.preview}</p>
      <p className={styles.teaser}>{result.teaser}</p>
    </Card>
  )
}
