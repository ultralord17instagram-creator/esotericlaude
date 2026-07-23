'use client'
import Link from 'next/link'
import { SCENARIOS } from './directions'
import { SCENARIO_ICONS, NumerologyMark, Sparkle } from './components/icons'
import styles from './numerology.module.css'

export default function HubClient() {
  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.medallion}><NumerologyMark size={24} /></div>
        <div className={styles.topMeta}>
          <div className={styles.topTitle}>Нумерология</div>
          <div className={styles.topKicker}>Число судьбы</div>
        </div>
      </div>

      <div className={styles.head}>
        <p className={styles.eyebrow}>Выбор сценария</p>
        <h1 className={styles.title}>Выбери сценарий разбора</h1>
        <p className={styles.subtitle}>
          С чего начнём работу по числам? Выбери путь, дальше попросим только те данные, что нужны именно для него.
        </p>
      </div>

      <div className={styles.scenarioGrid}>
        {SCENARIOS.map(s => {
          const Icon = SCENARIO_ICONS[s.id]
          return (
            <Link key={s.id} href={`/numerology/${s.id}`} className={styles.scenarioCard}>
              <div className={styles.scenarioIcon}>{Icon && <Icon size={38} />}</div>
              <div className={styles.scenarioBody}>
                <h3 className={styles.scenarioName}>{s.name}</h3>
                <p className={styles.scenarioDesc}>{s.desc}</p>
                <span className={styles.demoChip}><Sparkle size={12} /> {s.input} · Демо бесплатно</span>
              </div>
            </Link>
          )
        })}
      </div>

      <p className={styles.centerNote}><Sparkle size={14} /> Без регистрации · займёт около минуты</p>
    </div>
  )
}
