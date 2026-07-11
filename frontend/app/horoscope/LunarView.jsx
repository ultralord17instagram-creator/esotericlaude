'use client'
import { useEffect } from 'react'
import { getLunar } from '../content/horoscope'
import PaidReveal from './components/PaidReveal'
import LunarGrid from './components/LunarGrid'
import { PhaseIcon, CalendarIcon } from './components/icons'
import { markOpened } from '../lk/dayProgress'
import styles from './horoscope.module.css'

const SPHERE_LABEL = {
  beauty: 'Красота', money: 'Деньги', love: 'Любовь',
  affairs: 'Дела', health: 'Здоровье',
}

// Сегодняшний лунный день (бесплатно) + платная секция «благоприятные дни» (дизайн §8).
// Подписчику после разблокировки — сетка благоприятности по 30 дням.
export default function LunarView({ today, isSubscribed }) {
  const data = getLunar(today)

  // Показан лунный день -> отметить в дашборде (дизайн §5.5).
  useEffect(() => { markOpened('lunar') }, [])

  return (
    <div className={styles.lunarStack}>
      <div className={styles.lunarCard}>
        <div className={styles.lunarHead}>
          <div className={styles.lunarMoon}><PhaseIcon size={26} /></div>
          <h2 className={styles.lunarTitle}>Лунный день {data.lunarDay} · {data.phase.name}</h2>
        </div>
        <p className={styles.lunarText}>{data.todayMeaning}</p>
      </div>

      <div className={styles.lunarCard}>
        <div className={styles.lunarHead}>
          <CalendarIcon size={20} />
          <h2 className={styles.lunarTitle}>Благоприятные дни месяца</h2>
        </div>
        <p className={styles.lunarIntro}>
          Календарь показывает, какие дни месяца хороши для красоты, денег, любви, дел и здоровья.
        </p>

        {isSubscribed ? (
          <>
            <LunarGrid spheres={data.spheres} />
            <div className={styles.sphereOverview}>
              {data.spheres.map(s => (
                <p key={s.id}><b>{SPHERE_LABEL[s.id] ?? s.id}.</b> {s.overview}</p>
              ))}
            </div>
          </>
        ) : (
          <PaidReveal
            bait={data.bait}
            ghost="В этом месяце есть окна, когда удача открыта именно для твоих дел, и они быстро закрываются. Большинство узнаёт о лучшем дне уже задним числом, когда момент упущен."
          />
        )}
      </div>
    </div>
  )
}
