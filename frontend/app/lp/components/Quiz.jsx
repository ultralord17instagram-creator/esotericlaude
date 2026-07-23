'use client'
import { useState } from 'react'
import { initQuiz, currentStep, setAnswer, canAdvance, advance, back as backStep, isComplete, progress } from '../logic/quizMachine.js'
import QuizStep from './QuizStep'
import styles from '../lp.module.css'

export default function Quiz({ steps, onComplete, onBack, variant }) {
  const [state, setState] = useState(initQuiz)
  const cosmic = variant === 'cosmic'

  const step = currentStep(steps, state)

  const handleChange = (val) => setState((s) => setAnswer(s, step.id, val))

  const handleAdvance = () => {
    setState((s) => {
      const next = advance(steps, s)
      if (isComplete(steps, next)) onComplete(next.answers)
      return next
    })
  }

  const handleBack = () => {
    if (state.index === 0) { onBack?.(); return }
    setState((s) => backStep(s))
  }

  if (!step) return null

  const pct = Math.round(progress(steps, state) * 100)
  const isField = step.type === 'date' || step.type === 'text'

  return (
    <section className={styles.funnel}>
      <div className={styles.quizHeader}>
        <button className={styles.backBtn} onClick={handleBack} aria-label="Назад">‹</button>
        <div className={styles.progress}>
          <div className={styles.progressBar} style={{ width: `${pct}%` }} />
        </div>
        <span className={`${styles.wordmark} ${styles.headerMark}`}>Astrix</span>
      </div>

      <div className={styles.quizBody}>
        <div className={styles.quizIntro} key={step.id}>
          <div className={`${styles.eyebrow} ${styles.quizStepLabel}`}>
            {cosmic
              ? `${String(state.index + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}`
              : `Шаг ${state.index + 1} из ${steps.length}`}
          </div>
          <h2 className={`${styles.h2} ${styles.quizQuestion}`}>{step.question}</h2>
          {step.hint && <p className={styles.quizHint}>{step.hint}</p>}
        </div>

        {isField ? (
          <div className={styles.fieldRow}>
            <QuizStep step={step} value={state.answers[step.id]} onChange={handleChange} onAdvance={handleAdvance} />
            <button className={styles.nextBtn} disabled={!canAdvance(steps, state)} onClick={handleAdvance}>
              Далее
            </button>
          </div>
        ) : (
          <QuizStep step={step} value={state.answers[step.id]} onChange={handleChange} onAdvance={handleAdvance} />
        )}
      </div>
    </section>
  )
}
