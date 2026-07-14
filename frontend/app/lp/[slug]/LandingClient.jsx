'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { calculateMatrix } from '../../content/matrix'
import { loadQuiz, saveQuiz } from '../logic/quizStorage.js'
import Hero from '../components/Hero'
import Quiz from '../components/Quiz'
import Calculating from '../components/Calculating'
import Verdict from '../components/Verdict'
import Teaser from '../components/Teaser'
import Result from '../components/Result'

export default function LandingClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const [phase, setPhase] = useState('hero')
  const [answers, setAnswers] = useState(null)
  const [matrixData, setMatrixData] = useState(null)

  const isSubscribed = user?.subscribed ?? false

  // Просмотр лендинга — один раз на маунте.
  useEffect(() => {
    track('lp_view', { slug: landing.slug })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат после оплаты: подписан + есть сохранённый квиз -> сразу полный результат.
  useEffect(() => {
    if (!isSubscribed) return
    const saved = loadQuiz(landing.slug)
    if (saved?.birth_date) {
      setAnswers(saved)
      setMatrixData(calculateMatrix(saved.birth_date))
      setPhase('result')
    }
  }, [isSubscribed, landing.slug])

  const handleStart = () => {
    track('quiz_start', { slug: landing.slug })
    setPhase('quiz')
  }

  const handleComplete = (a) => {
    track('quiz_complete', { slug: landing.slug, focus: a.focus })
    saveQuiz(landing.slug, a)
    setAnswers(a)
    setPhase('calculating')
  }

  const handleCalculated = () => {
    setMatrixData(calculateMatrix(answers.birth_date))
    track('verdict_view', { slug: landing.slug })
    setPhase('verdict')
  }

  const handleVerdictNext = () => {
    if (!isSubscribed) track('paywall_view', { slug: landing.slug })
    setPhase('result')
  }

  if (phase === 'hero') return <Hero hero={landing.hero} onStart={handleStart} />
  if (phase === 'quiz') return <Quiz steps={landing.quiz.steps} onComplete={handleComplete} />
  if (phase === 'calculating') return <Calculating onDone={handleCalculated} />
  if (phase === 'verdict')
    return <Verdict answers={answers} matrixData={matrixData} onNext={handleVerdictNext} />
  if (isSubscribed)
    return <Result answers={answers} matrixData={matrixData} />
  return <Teaser landing={landing} matrixData={matrixData} />
}
