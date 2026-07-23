'use client'
import { useState, useEffect } from 'react'
import { buildDayBlocks } from '../dayBlocks'
import { getOpened, markOpened } from '../dayProgress'
import DayBlockCard from './DayBlockCard'
import styles from '../lk.module.css'

// Геометрия кольца прогресса (десктоп). r=52 -> длина окружности.
const RING_R = 52
const RING_C = 2 * Math.PI * RING_R

// Декоративное звёздное небо тёмного героя (как в макете cabinet-reference).
function HeroSky() {
  return (
    <svg className={styles.heroSky} viewBox="0 0 760 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <circle cx="80" cy="50" r="1.4" fill="#F3ECDB" opacity=".7" />
      <circle cx="220" cy="34" r="1.8" fill="#F3ECDB" opacity=".9" />
      <circle cx="520" cy="46" r="1.5" fill="#F3ECDB" opacity=".6" />
      <circle cx="660" cy="120" r="1.7" fill="#F3ECDB" opacity=".8" />
      <circle cx="120" cy="150" r="1.4" fill="#F3ECDB" opacity=".6" />
      <circle cx="600" cy="180" r="1.4" fill="#F3ECDB" opacity=".5" />
      <path d="M220 34 L320 90 L430 72 L520 46" fill="none" stroke="#B9954F" strokeWidth=".9" opacity=".5" />
      <circle cx="320" cy="90" r="2.6" fill="#B9954F" />
      <circle cx="430" cy="72" r="2.2" fill="#B9954F" />
      <path d="M560 90 l1.3 5.4 5.4 1.3 -5.4 1.3 -1.3 5.4 -1.3 -5.4 -5.4 -1.3 5.4 -1.3 z" fill="#F3ECDB" opacity=".85" />
    </svg>
  )
}

// birth: 'YYYY-MM-DD' | null (из профиля).
export default function DayDashboard({ birth }) {
  const today = new Date()
  const blocks = buildDayBlocks({ birth, today })
  const [opened, setOpened] = useState({})

  // Читаем localStorage только на клиенте (после гидрации), чтобы SSR совпал.
  useEffect(() => { setOpened(getOpened()) }, [])

  const open = (id) => { markOpened(id); setOpened(getOpened()) }

  const total = blocks.length
  const count = blocks.filter(b => opened[b.id]).length
  const fraction = total ? count / total : 0

  const dateRaw = today.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
  const dateLabel = dateRaw.charAt(0).toUpperCase() + dateRaw.slice(1)

  return (
    <div>
      <div className={styles.hero}>
        <HeroSky />
        <div className={styles.heroBody}>
          <div className={styles.heroEyebrow}>Твой день</div>
          <h2 className={styles.heroDate}>{dateLabel}</h2>
          <p className={styles.heroSubtitle}>Небо уже сверило твой маршрут.</p>

          {/* Линейная шкала — мобайл/планшет */}
          <div className={styles.heroProgress}>
            <div className={styles.progressTop}>
              <span>Открыто</span>
              <span className={styles.progressCount}>{count} из {total}</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${fraction * 100}%` }} />
            </div>
            {count === total && <p className={styles.progressDone}>Ты собрал весь свой день. До завтра.</p>}
          </div>
        </div>

        {/* Кольцо — десктоп */}
        <div className={styles.heroRing}>
          <svg width="132" height="132" viewBox="0 0 132 132">
            <circle className={styles.heroRingTrack} cx="66" cy="66" r={RING_R} />
            <circle
              className={styles.heroRingFill}
              cx="66" cy="66" r={RING_R}
              strokeDasharray={`${fraction * RING_C} ${RING_C}`}
              transform="rotate(-90 66 66)"
            />
          </svg>
          <div className={styles.heroRingCenter}>
            <span className={styles.heroRingValue}>{count}/{total}</span>
            <span className={styles.heroRingLabel}>открыто</span>
          </div>
        </div>
      </div>

      <div className={styles.dashGrid}>
        {blocks.map(b => (
          <DayBlockCard key={b.id} block={b} opened={!!opened[b.id]} onOpen={open} />
        ))}
      </div>
    </div>
  )
}
