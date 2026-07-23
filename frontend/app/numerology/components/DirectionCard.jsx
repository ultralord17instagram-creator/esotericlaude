'use client'
import { Lock } from 'lucide-react'
import { DIRECTION_ICONS } from './icons'
import styles from '../numerology.module.css'

// Карточка выбора направления. Один тап открывает толкование (как в других продуктах).
// Платное без подписки помечается небольшим замком.
export default function DirectionCard({ icon, name, desc, locked, onClick }) {
  const Icon = DIRECTION_ICONS[icon]
  return (
    <button type="button" className={styles.dirCard} onClick={onClick}>
      <div className={styles.dirIcon}>{Icon && <Icon size={30} />}</div>
      <div className={styles.dirBody}>
        <h3 className={styles.dirName}>{name}</h3>
        <p className={styles.dirDesc}>{desc}</p>
      </div>
      {locked && <span className={styles.dirLock}><Lock size={13} /></span>}
    </button>
  )
}
