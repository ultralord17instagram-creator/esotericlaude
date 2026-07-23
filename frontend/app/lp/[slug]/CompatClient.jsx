'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { herVsHim, rivalVsHim } from '../logic/compatScore.js'
import { loadQuiz, saveQuiz } from '../logic/quizStorage.js'
import styles from '../lp.module.css'
import Hero from '../components/Hero'
import Quiz from '../components/Quiz'
import Calculating from '../components/Calculating'
import CompatVerdict from '../components/CompatVerdict'
import RivalCheck from '../components/RivalCheck'
import CompatTeaser from '../components/CompatTeaser'
import CompatResult from '../components/CompatResult'

const CALC_LINES = [
  'Сверяю ваши числа…',
  'Строю его точку притяжения…',
  'Ищу зону риска…',
]

export default function CompatClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const [phase, setPhase] = useState('hero')
  const [answers, setAnswers] = useState(null)
  const [score, setScore] = useState(null)
  const [rivalScore, setRivalScore] = useState(null)

  const isSubscribed = user?.subscribed ?? false

  useEffect(() => {
    track('lp_view', { slug: landing.slug })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат после оплаты: подписан + сохранённые даты -> сразу result.
  useEffect(() => {
    if (!isSubscribed) return
    const saved = loadQuiz(landing.slug)
    if (saved?.her_date && saved?.his_date) {
      setAnswers(saved)
      setScore(herVsHim(saved.her_date, saved.his_date))
      setPhase('result')
    }
  }, [isSubscribed, landing.slug])

  const handleStart = () => { track('quiz_start', { slug: landing.slug }); setPhase('quiz') }

  const handleComplete = (a) => {
    track('quiz_complete', { slug: landing.slug })
    saveQuiz(landing.slug, a)
    setAnswers(a)
    setPhase('calculating')
  }

  const handleCalculated = () => {
    setScore(herVsHim(answers.her_date, answers.his_date))
    track('verdict_view', { slug: landing.slug })
    setPhase('verdict')
  }

  const handleRival = (rivalDate) => {
    if (rivalDate) {
      setRivalScore(rivalVsHim(rivalDate, answers.his_date, score.herScore))
      track('rival_check', { slug: landing.slug, entered: true })
    } else {
      track('rival_check', { slug: landing.slug, entered: false })
    }
    if (!isSubscribed) track('paywall_view', { slug: landing.slug })
    setPhase('teaser')
  }

  const handleRestart = () => {
    setAnswers(null); setScore(null); setRivalScore(null); setPhase('hero')
  }

  let view
  if (phase === 'hero') view = <Hero hero={landing.hero} onStart={handleStart} variant="cosmic" />
  else if (phase === 'quiz')
    view = <Quiz steps={landing.quiz.steps} onComplete={handleComplete} onBack={() => setPhase('hero')} variant="cosmic" />
  else if (phase === 'calculating')
    view = <Calculating onDone={handleCalculated} title="Сверяю ваши числа…" lines={CALC_LINES} variant="cosmic" />
  else if (phase === 'verdict')
    view = <CompatVerdict score={score} landing={landing} onNext={() => setPhase('rival')} />
  else if (phase === 'rival')
    view = <RivalCheck score={score} onDone={handleRival} />
  else if (isSubscribed)
    view = <CompatResult score={score} rivalScore={rivalScore} />
  else view = <CompatTeaser landing={landing} score={score} rivalScore={rivalScore} onRestart={handleRestart} />

  // Космический фон Astrix перекрывает тёплый фон общего лейаута /lp.
  return (
    <div className={styles.cosmic}>
      <div className={styles.cosmicBackdrop} aria-hidden="true">
        <div className={styles.cosmicGlow1} />
        <div className={styles.cosmicGlow2} />
        <div className={styles.cosmicStars} />
      </div>
      {view}
    </div>
  )
}
