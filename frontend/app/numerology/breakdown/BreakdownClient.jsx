'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { buildBreakdown, loadProfile, saveProfile, fetchProfileNumerology } from '../../content/numerology'
import { BREAKDOWN_DIRECTIONS } from '../directions'
import { SCENARIO_ICONS, Sparkle, Arrow, Calendar } from '../components/icons'
import ScenarioHeader from '../components/ScenarioHeader'
import DirectionCard from '../components/DirectionCard'
import ResultReading from '../components/ResultReading'
import styles from '../numerology.module.css'

export default function BreakdownClient() {
  const router = useRouter()
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false

  const [step, setStep] = useState('input')      // input | directions | result
  const [form, setForm] = useState({ date: '', name: '' })
  const [dir, setDir] = useState(null)           // выбранный id направления
  const [data, setData] = useState(null)         // buildBreakdown -> все блоки

  // Память данных: залогинен -> профиль (дата+имя), иначе localStorage (дизайн §6.2).
  useEffect(() => {
    let alive = true
    ;(async () => {
      const fromProfile = user ? await fetchProfileNumerology() : null
      const p = (fromProfile?.date && fromProfile?.name) ? fromProfile : loadProfile()
      if (alive && p?.date && p?.name) {
        setForm({ date: p.date, name: p.name })
        setData(buildBreakdown({ date: p.date, name: p.name }))
        setStep('directions')
      }
    })()
    return () => { alive = false }
  }, [user])

  const submitInput = (e) => {
    e.preventDefault()
    if (!form.date || !form.name) return
    saveProfile({ date: form.date, name: form.name })
    setData(buildBreakdown({ date: form.date, name: form.name }))
    setStep('directions')
  }

  const lifePath = data?.blocks.find(b => b.id === 'destiny')?.number
  const back = () => router.push('/numerology')

  // ── Шаг ввода данных ───────────────────────────────────────
  if (step === 'input') {
    return (
      <div className={styles.page}>
        <ScenarioHeader onBack={back} icon={SCENARIO_ICONS.breakdown} title="Разбор" kicker="Число судьбы" step={1} />
        <div className={styles.head}>
          <p className={styles.eyebrow}>Шаг 1 из 2 · Данные</p>
          <h1 className={styles.title}>Кого разбираем?</h1>
          <p className={styles.subtitle}>Дата рождения и имя раскроют шесть сфер твоей натуры.</p>
        </div>

        <form className={styles.form} onSubmit={submitInput}>
          <div className={styles.personCard}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Имя</label>
              <input
                className={styles.input} type="text" placeholder="Имя" value={form.name}
                onChange={e => setForm(s => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Дата рождения</label>
              <input
                className={styles.input} type="date" value={form.date}
                onChange={e => setForm(s => ({ ...s, date: e.target.value }))}
              />
            </div>
          </div>

          <div className={styles.footBar}>
            <span className={styles.hintNote}><Sparkle size={14} /> Данные нужны только для расчёта чисел</span>
            <button className={styles.btnPrimary} type="submit" disabled={!form.date || !form.name}>
              Продолжить <Arrow size={18} />
            </button>
          </div>
        </form>
      </div>
    )
  }

  // ── Шаг выбора направления ─────────────────────────────────
  if (step === 'directions') {
    return (
      <div className={styles.page}>
        <ScenarioHeader onBack={back} icon={SCENARIO_ICONS.breakdown} title="Разбор" kicker={`Число судьбы · ${lifePath}`} step={2} />
        <div className={styles.head}>
          <p className={styles.eyebrow}>Шаг 2 из 2 · Направления</p>
          <h1 className={styles.title}>Что раскрыть в разборе?</h1>
          <p className={styles.subtitle}>Выбери направление разбора, раскроем именно эту тему по твоему числу судьбы.</p>
        </div>

        <div className={styles.dirGrid}>
          {BREAKDOWN_DIRECTIONS.map(d => {
            const block = data.blocks.find(b => b.id === d.id)
            return (
              <DirectionCard
                key={d.id} icon={d.icon} name={d.name} desc={d.desc}
                locked={!block.free && !isSubscribed}
                onClick={() => { setDir(d.id); setStep('result') }}
              />
            )
          })}
        </div>

        <div className={styles.footBar}>
          <span className={styles.hintNote}><Sparkle size={14} /> Одно направление на разбор</span>
          <button className={styles.btnGhost} onClick={() => setStep('input')}>
            <Calendar size={16} /> Выбрать другую дату
          </button>
        </div>
      </div>
    )
  }

  // ── Шаг результата ─────────────────────────────────────────
  const meta = BREAKDOWN_DIRECTIONS.find(d => d.id === dir)
  const block = data.blocks.find(b => b.id === dir)
  return (
    <div className={styles.page}>
      <ScenarioHeader onBack={back} icon={SCENARIO_ICONS.breakdown} title="Разбор" kicker={`Число судьбы · ${lifePath}`} />
      <ResultReading number={block.number} kicker="Разбор" title={meta.name} block={block} isSubscribed={isSubscribed} />

      <div className={styles.footBar}>
        <button className={styles.btnGhost} onClick={() => setStep('directions')}>‹ Другое направление</button>
        <button className={styles.btnPrimary} onClick={() => setStep('input')}>
          <Calendar size={16} /> Выбрать другую дату
        </button>
      </div>
    </div>
  )
}
