'use client'
import styles from '../lp.module.css'

export default function QuizStep({ step, value, onChange, onAdvance }) {
  if (step.type === 'date') {
    return (
      <input type="date" value={value ?? ''} required
        onChange={(e) => onChange(e.target.value)} />
    )
  }
  if (step.type === 'text') {
    return (
      <input type="text" placeholder={step.placeholder} value={value ?? ''}
        onChange={(e) => onChange(e.target.value)} />
    )
  }
  if (step.type === 'choice') {
    return (
      <div>
        {step.options.map((o) => (
          <button key={o.value} className={styles.option}
            onClick={() => { onChange(o.value); onAdvance() }}>
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
      <div>
        {nums.map((n) => (
          <button key={n} className={styles.option}
            onClick={() => { onChange(n); onAdvance() }}>
            {n}
          </button>
        ))}
      </div>
    )
  }
  return null
}
