'use client'
import { useState, useEffect } from 'react'
import { buildDayBlocks } from '../dayBlocks'
import { getOpened, markOpened } from '../dayProgress'
import DayBlockCard from './DayBlockCard'
import styles from '../lk.module.css'

// birth: 'YYYY-MM-DD' | null (из профиля). name: имя для приветствия | ''.
export default function DayDashboard({ birth, name }) {
  const today = new Date()
  const blocks = buildDayBlocks({ birth, today })
  const [opened, setOpened] = useState({})

  // Читаем localStorage только на клиенте (после гидрации), чтобы SSR совпал.
  useEffect(() => { setOpened(getOpened()) }, [])

  const open = (id) => { markOpened(id); setOpened(getOpened()) }

  const total = blocks.length
  const count = blocks.filter(b => opened[b.id]).length
  const greeting = name ? `Твой день, ${name}` : 'Твой день'
  const dateLabel = today.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' })

  return (
    <section className={styles.section}>
      <div className={styles.dashHeader}>
        <h2 className={styles.dashGreeting}>{greeting}</h2>
        <p className={styles.dashDate}>{dateLabel}</p>
      </div>

      <div className={styles.progressWrap}>
        <span className={styles.progressLabel}>Открыто {count} из {total}</span>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${(count / total) * 100}%` }} />
        </div>
        {count === total && <p className={styles.progressDone}>Ты собрал весь свой день. До завтра.</p>}
      </div>

      <div className={styles.dashGrid}>
        {blocks.map(b => (
          <DayBlockCard key={b.id} block={b} opened={!!opened[b.id]} onOpen={open} />
        ))}
      </div>
    </section>
  )
}
