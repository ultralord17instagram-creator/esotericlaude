'use client'
import { getToday } from '../content/horoscope'
import SkyWidget from './components/SkyWidget'
import BlockCard from './components/BlockCard'
import styles from './horoscope.module.css'

// Порядок экрана (дизайн §6): небо -> настрой -> 4 платные сферы -> совет.
export default function TodayView({ sign, today, isSubscribed }) {
  const data = getToday(sign.id, today)
  const advice = data.blocks.find(b => b.id === 'advice')
  const body = data.blocks.filter(b => b.id !== 'advice')

  return (
    <div>
      <SkyWidget sky={data.sky} />
      {body.map(b => <BlockCard key={b.id} block={b} isSubscribed={isSubscribed} />)}
      {advice && <div className={styles.advice}>{typeof advice.text === 'string' ? advice.text : advice.text.teaser}</div>}
    </div>
  )
}
