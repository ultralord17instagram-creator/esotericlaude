'use client'
import { getLunar } from '../content/horoscope'
import BlockCard from './components/BlockCard'
import LunarGrid from './components/LunarGrid'
import styles from './horoscope.module.css'

// Сегодняшний лунный день (бесплатно) + платная секция «благоприятные дни» (дизайн §8).
export default function LunarView({ today, isSubscribed }) {
  const data = getLunar(today)
  const unlocked = isSubscribed

  return (
    <div>
      <div className={styles.block}>
        <div className={styles.blockName}>
          {data.phase.emoji} Лунный день {data.lunarDay}, {data.phase.name}
        </div>
        <p className={styles.blockText}>{data.todayMeaning}</p>
      </div>

      {unlocked ? (
        <div className={styles.block}>
          <div className={styles.blockName}>Благоприятные дни месяца</div>
          <LunarGrid spheres={data.spheres} />
          {data.spheres.map(s => (
            <p key={s.id} className={styles.skyText}>{s.overview}</p>
          ))}
        </div>
      ) : (
        <BlockCard
          block={{ id: 'calendar', name: 'Благоприятные дни месяца', free: false,
            text: { teaser: 'Календарь показывает, какие дни месяца хороши для красоты, денег, любви, дел и здоровья.', body: '' },
            bait: data.bait }}
          isSubscribed={isSubscribed}
        />
      )}
    </div>
  )
}
