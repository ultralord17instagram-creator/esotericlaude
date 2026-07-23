'use client'
import { EditIcon } from './icons'
import styles from '../horoscope.module.css'

const TABS = [
  { id: 'today',    name: 'Сегодня' },
  { id: 'portrait', name: 'Портрет знака' },
  { id: 'lunar',    name: 'Лунный календарь' },
]

// sign: результат astro.sign(...). tab/onTab — активная вкладка. onChange — «Ввести другую».
export default function SignHeader({ sign, tab, onTab, onChange }) {
  return (
    <header className={styles.header}>
      <nav className={styles.breadcrumb}>
        Сервисы <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbCurrent}>Гороскоп</span>
      </nav>

      <div className={styles.headRow}>
        <div>
          <h1 className={styles.signName}>{sign.name}</h1>
          <div className={styles.signMeta}>
            <span>{sign.range}</span>
            <span className={styles.metaDot}>·</span>
            <span>{sign.element}</span>
            <span className={styles.metaDot}>·</span>
            <span>{sign.planet}</span>
          </div>
        </div>
        <button type="button" className={styles.changeBtn} onClick={onChange}>
          <EditIcon size={14} /> Ввести другую
        </button>
      </div>

      <nav className={styles.tabs}>
        {TABS.map(t => (
          <button
            key={t.id} type="button"
            className={`${styles.tab} ${tab === t.id ? styles.tabOn : ''}`}
            onClick={() => onTab(t.id)}
          >
            {t.name}
          </button>
        ))}
      </nav>
    </header>
  )
}
