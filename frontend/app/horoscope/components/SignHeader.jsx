'use client'
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
      <div className={styles.signRow}>
        <div>
          <div className={styles.signName}>{sign.name}</div>
          <div className={styles.signRange}>{sign.range} · {sign.element} · {sign.planet}</div>
        </div>
        <button type="button" className={styles.changeBtn} onClick={onChange}>Ввести другую</button>
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
