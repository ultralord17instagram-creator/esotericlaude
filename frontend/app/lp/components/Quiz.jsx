'use client'
import { useState } from 'react'
import { initQuiz, currentStep, setAnswer, canAdvance, advance, isComplete, progress } from '../logic/quizMachine.js'
import QuizStep from './QuizStep'
import styles from '../lp.module.css'

export default function Quiz({ steps, onComplete }) {
  const [state, setState] = useState(initQuiz)

  const step = currentStep(steps, state)

  const handleChange = (val) => setState((s) => setAnswer(s, step.id, val))

  const handleAdvance = () => {
    setState((s) => {
      const next = advance(steps, s)
      if (isComplete(steps, next)) onComplete(next.answers)
      return next
    })
  }

  if (!step) return null

  return (
    <div className={styles.page}>
      <div className={styles.progress}>
        <div className={styles.progressBar} style={{ width: `${progress(steps, state) * 100}%` }} />
      </div>
      <h2 className={styles.title}>{step.question}</h2>
      <QuizStep step={step} value={state.answers[step.id]} onChange={handleChange} onAdvance={handleAdvance} />
      {(step.type === 'date' || step.type === 'text') && (
        <button className={styles.cta} disabled={!canAdvance(steps, state)} onClick={handleAdvance}>
          Далее
        </button>
      )}
    </div>
  )
}
