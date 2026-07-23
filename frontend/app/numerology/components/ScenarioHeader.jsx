'use client'
import { BackChevron } from './icons'
import styles from '../numerology.module.css'

// Шапка экрана: кнопка назад, медальон (иконка ИЛИ пара чисел), заголовок,
// кикер и опциональный степпер (две пронумерованные точки, десктоп).
export default function ScenarioHeader({ onBack, icon: Icon, avatars, title, kicker, step }) {
  return (
    <div className={styles.topbar}>
      {onBack && (
        <button type="button" className={styles.back} onClick={onBack} aria-label="Назад">
          <BackChevron size={20} />
        </button>
      )}

      {avatars ? (
        <div className={styles.avatars}>
          <div className={`${styles.avatar} ${styles.avatarA}`}>{avatars[0]}</div>
          <div className={`${styles.avatar} ${styles.avatarB}`}>{avatars[1]}</div>
        </div>
      ) : (
        Icon && <div className={styles.medallion}><Icon size={24} /></div>
      )}

      <div className={styles.topMeta}>
        <div className={styles.topTitle}>{title}</div>
        {kicker && <div className={styles.topKicker}>{kicker}</div>}
      </div>

      {step && (
        <div className={styles.stepper}>
          <div className={`${styles.stepNum} ${styles.stepNumOn}`}>1</div>
          <div className={`${styles.stepLine} ${step >= 2 ? styles.stepLineOn : ''}`} />
          <div className={`${styles.stepNum} ${step >= 2 ? styles.stepNumOn : ''}`}>2</div>
        </div>
      )}
    </div>
  )
}
