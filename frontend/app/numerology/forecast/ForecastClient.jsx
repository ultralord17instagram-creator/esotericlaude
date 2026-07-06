'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import ProductInputForm from '../../components/ProductInputForm'
import { buildForecast, loadProfile, saveProfile } from '../../content/numerology'
import BlockCard from '../components/BlockCard'
import NumberBadge from '../components/NumberBadge'
import styles from '../numerology.module.css'

const HORIZONS = [
  { id: 'day', label: 'День' },
  { id: 'month', label: 'Месяц' },
  { id: 'year', label: 'Год' },
]

// Прогноз считается только от даты рождения (имя не участвует, дизайн §3).
export default function ForecastClient({ product }) {
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false
  const [date, setDate] = useState(null)
  const [tab, setTab] = useState('day')

  useEffect(() => { setDate(loadProfile()?.date ?? null) }, [])

  const handleSubmit = (inputs) => {
    if (!inputs.birth_date) return
    const prev = loadProfile() ?? {}
    saveProfile({ ...prev, date: inputs.birth_date })
    setDate(inputs.birth_date)
  }

  if (!date) {
    const dateOnly = { ...product, inputs: ['birth_date'] } // прогнозу имя не нужно
    return (
      <div className={styles.page}>
        <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
        <div className={styles.head}>
          <h1 className={styles.title}>Прогноз</h1>
          <p className={styles.subtitle}>Введи дату рождения, покажу настрой на день, месяц и год.</p>
        </div>
        <ProductInputForm product={dateOnly} onSubmit={handleSubmit} />
      </div>
    )
  }

  const forecast = buildForecast({ date, horizon: tab })

  return (
    <div className={styles.page}>
      <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
      <div className={styles.tabs}>
        {HORIZONS.map(h => (
          <button key={h.id} className={`${styles.tab} ${tab === h.id ? styles.active : ''}`} onClick={() => setTab(h.id)}>
            {h.label}
          </button>
        ))}
      </div>

      <NumberBadge number={forecast.number} label={tab === 'day' ? 'Персональный день' : tab === 'month' ? 'Персональный месяц' : 'Персональный год'} />

      {tab === 'day' ? (
        <BlockCard title="Твой день" number={forecast.number} text={forecast.text} free isSubscribed={isSubscribed} />
      ) : (
        forecast.blocks.map(b => (
          <BlockCard key={b.id} title={b.name} number={b.number} text={b.text} free={b.free} isSubscribed={isSubscribed} />
        ))
      )}

      <button className={styles.resetBtn} onClick={() => setDate(null)}>Ввести другую дату</button>
    </div>
  )
}
