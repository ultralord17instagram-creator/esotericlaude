'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { buildForecast, loadProfile, saveProfile, fetchProfileNumerology } from '../../content/numerology'
import { FORECAST_HORIZONS, FORECAST_DIRECTIONS } from '../directions'
import { SCENARIO_ICONS, DIRECTION_ICONS, Sparkle, Arrow, Calendar } from '../components/icons'
import ScenarioHeader from '../components/ScenarioHeader'
import DirectionCard from '../components/DirectionCard'
import ResultReading from '../components/ResultReading'
import styles from '../numerology.module.css'

const HZ_LABEL = { month: 'Личный месяц', year: 'Личный год' }

export default function ForecastClient() {
  const router = useRouter()
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false

  const [step, setStep] = useState('input')     // input | select | result
  const [date, setDate] = useState('')
  const [horizon, setHorizon] = useState('day')
  const [dir, setDir] = useState(null)

  // Память даты: залогинен -> профиль, иначе localStorage (дизайн §6.2).
  useEffect(() => {
    let alive = true
    ;(async () => {
      const fromProfile = user ? await fetchProfileNumerology() : null
      const d = fromProfile?.date ?? loadProfile()?.date
      if (alive && d) { setDate(d); setStep('select') }
    })()
    return () => { alive = false }
  }, [user])

  const submitInput = (e) => {
    e.preventDefault()
    if (!date) return
    const prev = loadProfile() ?? {}
    saveProfile({ ...prev, date })
    setStep('select')
  }

  const pickHorizon = (h) => { setHorizon(h); setDir(null) }
  const back = () => router.push('/numerology')

  // ── Шаг ввода даты ─────────────────────────────────────────
  if (step === 'input') {
    return (
      <div className={styles.page}>
        <ScenarioHeader onBack={back} icon={SCENARIO_ICONS.forecast} title="Прогноз" kicker="Личный прогноз" step={1} />
        <div className={styles.head}>
          <p className={styles.eyebrow}>Шаг 1 из 2 · Данные</p>
          <h1 className={styles.title}>На какую дату прогноз?</h1>
          <p className={styles.subtitle}>Введи дату рождения, покажу настрой на день, месяц и год.</p>
        </div>

        <form className={styles.form} onSubmit={submitInput}>
          <div className={styles.personCard}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Дата рождения</label>
              <input className={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className={styles.footBar}>
            <span className={styles.hintNote}><Sparkle size={14} /> Прогнозу нужна только дата рождения</span>
            <button className={styles.btnPrimary} type="submit" disabled={!date}>
              Продолжить <Arrow size={18} />
            </button>
          </div>
        </form>
      </div>
    )
  }

  const isDay = horizon === 'day'
  const day = isDay ? buildForecast({ date, horizon: 'day' }) : null
  const cycle = isDay ? null : buildForecast({ date, horizon })
  const number = isDay ? day.number : cycle.number
  const kicker = isDay ? 'Личный прогноз' : `${HZ_LABEL[horizon]} · ${number}`

  const segment = (
    <div className={styles.segmented}>
      {FORECAST_HORIZONS.map(h => (
        <button
          key={h.id} type="button"
          className={`${styles.segment} ${horizon === h.id ? styles.segmentOn : ''}`}
          onClick={() => pickHorizon(h.id)}
        >
          {h.name}
        </button>
      ))}
    </div>
  )

  // ── Шаг результата (месяц/год) ─────────────────────────────
  if (step === 'result' && !isDay) {
    const meta = FORECAST_DIRECTIONS[horizon].find(d => d.id === dir)
    const block = cycle.blocks.find(b => b.id === dir)
    return (
      <div className={styles.page}>
        <ScenarioHeader onBack={back} icon={SCENARIO_ICONS.forecast} title="Прогноз" kicker={kicker} />
        <ResultReading number={block.number} kicker={HZ_LABEL[horizon]} title={meta.name} block={block} isSubscribed={isSubscribed} />
        <div className={styles.footBar}>
          <button className={styles.btnGhost} onClick={() => setStep('select')}>‹ Другое направление</button>
          <button className={styles.btnPrimary} onClick={() => setStep('input')}>
            <Calendar size={16} /> Выбрать другую дату
          </button>
        </div>
      </div>
    )
  }

  // ── Шаг выбора горизонта/направления ───────────────────────
  const DayIcon = DIRECTION_ICONS.fate
  return (
    <div className={styles.page}>
      <ScenarioHeader onBack={back} icon={SCENARIO_ICONS.forecast} title="Прогноз" kicker={kicker} step={2} />
      <div className={styles.head}>
        <p className={styles.eyebrow}>Шаг 2 из 2 · Прогноз</p>
        <h1 className={styles.title}>На какой срок прогноз?</h1>
        <p className={styles.subtitle}>
          {isDay ? 'Прогноз на сегодня по вашему числу.' : 'Выбери направление прогноза, раскроем именно его.'}
        </p>
      </div>

      {segment}

      {isDay ? (
        <div className={styles.dayCard}>
          <div className={styles.dayHead}>
            <div className={styles.dayIcon}><DayIcon size={26} /></div>
            <div>
              <div className={styles.dayKicker}>Прогноз на день · Число {number}</div>
              <h3 className={styles.dayTitle}>Общее</h3>
            </div>
          </div>
          <p className={styles.dayText}>{day.text}</p>
        </div>
      ) : (
        <div className={styles.dirGrid}>
          {FORECAST_DIRECTIONS[horizon].map(d => {
            const block = cycle.blocks.find(b => b.id === d.id)
            return (
              <DirectionCard
                key={d.id} icon={d.icon} name={d.name} desc={d.desc}
                locked={!block.free && !isSubscribed}
                onClick={() => { setDir(d.id); setStep('result') }}
              />
            )
          })}
        </div>
      )}

      <div className={styles.footBar}>
        <span className={styles.hintNote}><Sparkle size={14} /> {isDay ? 'Прогноз на день открыт целиком' : 'Одно направление на прогноз'}</span>
        <button className={styles.btnGhost} onClick={() => setStep('input')}>
          <Calendar size={16} /> Выбрать другую дату
        </button>
      </div>
    </div>
  )
}
