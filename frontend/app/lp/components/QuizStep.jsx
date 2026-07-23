'use client'
import styles from '../lp.module.css'

export default function QuizStep({ step, value, onChange, onAdvance }) {
  // Выбор варианта: подсветить и через паузу перейти дальше (визуальный отклик).
  const pick = (val) => { onChange(val); setTimeout(onAdvance, 240) }

  if (step.type === 'date') {
    return (
      <input className={styles.field} type="date" value={value ?? ''} required
        onChange={(e) => onChange(e.target.value)} />
    )
  }

  if (step.type === 'text') {
    return (
      <input className={styles.field} type="text" placeholder={step.placeholder} value={value ?? ''}
        onChange={(e) => onChange(e.target.value)} />
    )
  }

  if (step.type === 'choice') {
    return (
      <div className={styles.options}>
        {step.options.map((o, i) => (
          <button key={o.value}
            className={`${styles.option} ${value === o.value ? styles.optionActive : ''}`}
            style={{ animationDelay: `${0.05 + i * 0.06}s` }}
            onClick={() => pick(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    )
  }

  if (step.type === 'scale') {
    const nums = []
    for (let n = step.min; n <= step.max; n++) nums.push(n)
    return (
      <div className={styles.options}>
        {nums.map((n) => (
          <button key={n}
            className={`${styles.option} ${value === n ? styles.optionActive : ''}`}
            onClick={() => pick(n)}>
            {n}
          </button>
        ))}
      </div>
    )
  }

  return null
}
