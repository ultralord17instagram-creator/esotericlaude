import styles from '../numerology.module.css'

export default function NumberBadge({ number, label }) {
  const isMaster = number === 11 || number === 22
  return (
    <div className={styles.badge}>
      <span className={styles.badgeNum}>{number}</span>
      {isMaster && <span className={styles.badgeMaster}>мастер-число</span>}
      {label && <span className={styles.badgeLabel}>{label}</span>}
    </div>
  )
}
