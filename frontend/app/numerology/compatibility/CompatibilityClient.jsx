'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { buildCompatibility } from '../../content/numerology'
import { COMPATIBILITY_DIRECTIONS } from '../directions'
import { SCENARIO_ICONS, Sparkle, Arrow } from '../components/icons'
import ScenarioHeader from '../components/ScenarioHeader'
import DirectionCard from '../components/DirectionCard'
import ResultReading from '../components/ResultReading'
import styles from '../numerology.module.css'

export default function CompatibilityClient() {
  const router = useRouter()
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false

  const [step, setStep] = useState('input')     // input | directions | result
  const [v, setV] = useState({ date: '', name: '', date2: '', name2: '' })
  const [dir, setDir] = useState(null)
  const [data, setData] = useState(null)        // buildCompatibility -> все блоки
  const set = (k, val) => setV(s => ({ ...s, [k]: val }))

  const submitInput = (e) => {
    e.preventDefault()
    if (!v.date || !v.date2) return             // имена по желанию, даты обязательны
    setData(buildCompatibility(v))
    setStep('directions')
  }

  const back = () => router.push('/numerology')

  // ── Шаг ввода данных ───────────────────────────────────────
  if (step === 'input') {
    return (
      <div className={styles.page}>
        <ScenarioHeader onBack={back} icon={SCENARIO_ICONS.compatibility} title="Совместимость" kicker="Две даты рождения" step={1} />
        <div className={styles.head}>
          <p className={styles.eyebrow}>Шаг 1 из 2 · Данные</p>
          <h1 className={styles.title}>Кого сравниваем?</h1>
          <p className={styles.subtitle}>Укажи даты рождения обоих. Имена по желанию, так разбор будет теплее и персональнее.</p>
        </div>

        <form className={styles.form} onSubmit={submitInput}>
          <div className={styles.pairGrid}>
            <div className={styles.personCard}>
              <div className={styles.personHead}>
                <div className={`${styles.personNum} ${styles.personNumA}`}>1</div>
                <span className={styles.personName}>Первый человек</span>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Имя</label>
                <input className={styles.input} type="text" placeholder="Имя" value={v.name}
                  onChange={e => set('name', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Дата рождения</label>
                <input className={styles.input} type="date" value={v.date} onChange={e => set('date', e.target.value)} />
              </div>
            </div>

            <div className={styles.personCard}>
              <div className={styles.personHead}>
                <div className={`${styles.personNum} ${styles.personNumB}`}>2</div>
                <span className={styles.personName}>Второй человек</span>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Имя</label>
                <input className={styles.input} type="text" placeholder="Имя партнёра" value={v.name2}
                  onChange={e => set('name2', e.target.value)} />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Дата рождения</label>
                <input className={styles.input} type="date" value={v.date2} onChange={e => set('date2', e.target.value)} />
              </div>
            </div>
          </div>

          <div className={styles.footBar}>
            <span className={styles.hintNote}><Sparkle size={14} /> Данные нужны только для расчёта чисел</span>
            <button className={styles.btnPrimary} type="submit" disabled={!v.date || !v.date2}>
              Продолжить <Arrow size={18} />
            </button>
          </div>
        </form>
      </div>
    )
  }

  const avatars = [data.lp1, data.lp2]

  // ── Шаг выбора направления ─────────────────────────────────
  if (step === 'directions') {
    return (
      <div className={styles.page}>
        <ScenarioHeader onBack={back} avatars={avatars} title="Совместимость" kicker={`Числа ${data.lp1} и ${data.lp2}`} step={2} />
        <div className={styles.head}>
          <p className={styles.eyebrow}>Шаг 2 из 2 · Направления</p>
          <h1 className={styles.title}>Что сравнить в паре?</h1>
          <p className={styles.subtitle}>Выбери направление сравнения, сравним числа {data.lp1} и {data.lp2} именно по этой теме.</p>
        </div>

        <div className={styles.dirGrid}>
          {COMPATIBILITY_DIRECTIONS.map(d => {
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
          <span className={styles.hintNote}><Sparkle size={14} /> Одно направление на сравнение</span>
          <button className={styles.btnGhost} onClick={() => setStep('input')}>Сравнить другую пару</button>
        </div>
      </div>
    )
  }

  // ── Шаг результата ─────────────────────────────────────────
  const meta = COMPATIBILITY_DIRECTIONS.find(d => d.id === dir)
  const block = data.blocks.find(b => b.id === dir)
  const nameTouch = typeof block.nameTouch === 'object' ? block.nameTouch.body : block.nameTouch
  return (
    <div className={styles.page}>
      <ScenarioHeader onBack={back} avatars={avatars} title="Совместимость" kicker={`Числа ${data.lp1} и ${data.lp2}`} />
      <ResultReading number={block.number} kicker="Совместимость" title={meta.name} block={block} isSubscribed={isSubscribed} nameTouch={nameTouch} sealNote="Число пары" />

      <div className={styles.footBar}>
        <button className={styles.btnGhost} onClick={() => setStep('directions')}>‹ Другое направление</button>
        <button className={styles.btnPrimary} onClick={() => setStep('input')}>Сравнить другую пару</button>
      </div>
    </div>
  )
}
