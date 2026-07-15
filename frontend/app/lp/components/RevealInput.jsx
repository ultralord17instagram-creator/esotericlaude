'use client'
import { useState } from 'react'
import styles from '../lp.module.css'

// Двухшаговый вход движка live-reveal: сначала выбор вопроса, потом ввод его имени.
// Отдаёт наверх { questionId, name }.
export default function RevealInput({ landing, onSubmit }) {
  const [questionId, setQuestionId] = useState(null)
  const [name, setName] = useState('')

  if (!questionId) {
    return (
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <span className={`${styles.wordmark} ${styles.heroWordmark}`}>Astrix</span>
        </div>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>{landing.hero.eyebrow}</div>
          <h1 className={`${styles.h1} ${styles.heroTitle}`}>{landing.hero.title}</h1>
          <p className={`${styles.lead} ${styles.heroSub}`}>{landing.hero.subtitle}</p>
          <div className={styles.options}>
            {landing.questions.map((q, i) => (
              <button key={q.id} className={styles.option}
                style={{ animationDelay: `${0.05 + i * 0.06}s` }}
                onClick={() => setQuestionId(q.id)}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    )
  }

  const submit = () => {
    const trimmed = name.trim()
    if (trimmed) onSubmit({ questionId, name: trimmed })
  }

  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <button className={styles.linkBtn} onClick={() => setQuestionId(null)}>← {landing.microcopy.back}</button>
        <h1 className={`${styles.h1} ${styles.heroTitle}`}>{landing.input.heading}</h1>
        <p className={`${styles.lead} ${styles.heroSub}`}>{landing.input.subhead}</p>
        <input className={styles.field} type="text" inputMode="text" autoFocus maxLength={24}
          placeholder={landing.input.placeholder} value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
        <div className={styles.heroFoot}>
          <button className={`${styles.cta} ${styles.ctaFull}`} onClick={submit} disabled={!name.trim()}>
            {landing.input.cta}
          </button>
        </div>
      </div>
    </section>
  )
}
