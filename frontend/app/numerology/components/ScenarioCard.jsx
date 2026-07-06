import Link from 'next/link'
import styles from '../numerology.module.css'

export default function ScenarioCard({ href, name, desc, meta }) {
  return (
    <Link href={href} className={styles.scenarioCard}>
      <div className={styles.scenarioName}>{name}</div>
      <div className={styles.scenarioDesc}>{desc}</div>
      <div className={styles.scenarioMeta}>{meta}</div>
    </Link>
  )
}
