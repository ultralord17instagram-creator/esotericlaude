'use client'
import ScenarioCard from './components/ScenarioCard'
import styles from './numerology.module.css'

const SCENARIOS = [
  { id: 'breakdown',     name: 'Разбор',        desc: 'Портрет по дате и имени, 6 сфер',      meta: 'дата + имя' },
  { id: 'compatibility', name: 'Совместимость', desc: 'Анализ пары, 7 граней связи',          meta: '2 даты + 2 имени' },
  { id: 'forecast',      name: 'Прогноз',       desc: 'День, месяц и год по твоим числам',    meta: 'по дате рождения' },
]

export default function HubClient() {
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>Эзотерический хаб</p>
        <h1 className={styles.title}>Нумерология</h1>
        <p className={styles.subtitle}>Выбери, что посчитать: себя, пару или ближайшее время.</p>
      </div>
      <div className={styles.scenarioGrid}>
        {SCENARIOS.map(s => (
          <ScenarioCard key={s.id} href={`/numerology/${s.id}`} {...s} />
        ))}
      </div>
    </div>
  )
}
