'use client'
import { useState, useEffect } from 'react'
import { getToday } from '../content/horoscope'
import Modal from '../components/ui/Modal'
import Paywall from '../components/ui/Paywall'
import SkyWidget from './components/SkyWidget'
import CategoryTile from './components/CategoryTile'
import { Sparkle, Lock } from './components/icons'
import { markOpened } from '../lk/dayProgress'
import styles from './horoscope.module.css'

// Порядок экрана (дизайн §6): небо -> настрой -> платные категории -> совет.
// Клик по категории: гость на десктопе -> Paywall, иначе -> экран деталей.
export default function TodayView({ sign, today, isSubscribed, onOpenDetail }) {
  const [payOpen, setPayOpen] = useState(false)
  const data = getToday(sign.id, today)

  const mood = data.blocks.find(b => b.id === 'mood')
  const advice = data.blocks.find(b => b.id === 'advice')
  const categories = data.blocks.filter(b => !b.free)

  // Показан бесплатный блок «настрой дня» -> отметить в дашборде (дизайн §5.5).
  useEffect(() => { markOpened('mood') }, [])

  const moodText = typeof mood?.text === 'string' ? mood.text : mood?.text?.teaser
  const adviceText = typeof advice?.text === 'string' ? advice.text : advice?.text?.teaser

  const openCategory = (id) => {
    const desktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 901px)').matches
    if (!isSubscribed && desktop) setPayOpen(true)
    else onOpenDetail(id)
  }

  return (
    <div className={styles.today}>
      <SkyWidget sky={data.sky} />

      {mood && (
        <div className={styles.moodCard}>
          <div className={styles.moodHead}>
            <Sparkle size={18} />
            <h2 className={styles.moodTitle}>{mood.name}</h2>
          </div>
          <p className={styles.moodText}>{moodText}</p>
        </div>
      )}

      <div className={styles.catGrid}>
        {categories.map(b => <CategoryTile key={b.id} block={b} onOpen={openCategory} />)}
      </div>

      {advice && (
        <div className={styles.adviceCard}>
          <div className={styles.adviceKicker}><Sparkle size={12} /> {advice.name}</div>
          <p className={styles.adviceText}>{adviceText}</p>
        </div>
      )}

      {!isSubscribed && (
        <button type="button" className={styles.fullCta} onClick={() => setPayOpen(true)}>
          <Lock size={14} /> Смотреть полный разбор
        </button>
      )}

      <Modal open={payOpen} onClose={() => setPayOpen(false)}>
        <Paywall />
      </Modal>
    </div>
  )
}
