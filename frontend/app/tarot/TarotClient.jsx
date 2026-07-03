'use client'
import Link from 'next/link'
import { Sun, Layers, HelpCircle } from 'lucide-react'
import { SPREADS } from '../content/tarot/spreads'
import styles from './components/tarot.module.css'

const ICONS = { day: Sun, three: Layers, yesno: HelpCircle }
const DESCRIPTIONS = {
  day: 'Одна карта на сегодня — общий настрой дня.',
  three: 'Расклад из трёх карт: прошлое, настоящее, будущее и другие темы.',
  yesno: 'Задай вопрос и получи ответ да или нет.',
}

export default function TarotClient() {
  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Эзотерический хаб</p>
      <h1 className={styles.title}>Расклад Таро</h1>
      <p className={styles.subtitle}>Выбери сценарий гадания</p>

      <div className={styles.scenarioGrid}>
        {SPREADS.map((spread) => {
          const Icon = ICONS[spread.id] ?? Layers
          return (
            <Link key={spread.id} href={`/tarot/${spread.id}`} className={styles.scenarioCard}>
              <Icon className={styles.scenarioIcon} size={28} strokeWidth={1.5} />
              <div className={styles.scenarioName}>{spread.name}</div>
              <div className={styles.scenarioDesc}>{DESCRIPTIONS[spread.id]}</div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
