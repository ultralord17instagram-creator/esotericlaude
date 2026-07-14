'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { calculateMatrix } from '../../content/matrix'
import { loadQuiz, saveQuiz } from '../logic/quizStorage.js'
import Hero from '../components/Hero'
import Quiz from '../components/Quiz'
import Calculating from '../components/Calculating'
import Teaser from '../components/Teaser'

export default function LandingClient({ landing }) {
  const { user } = useAuth()
  const [phase, setPhase] = useState('hero')
  const [answers, setAnswers] = useState(null)
  const [matrixData, setMatrixData] = useState(null)

  const isSubscribed = user?.subscribed ?? false

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

  const handleComplete = (a) => {
    saveQuiz(landing.slug, a)
    setAnswers(a)
    setPhase('calculating')
  }

  const handleCalculated = () => {
    setMatrixData(calculateMatrix(answers.birth_date))
    setPhase('result')
  }

  if (phase === 'hero') return <Hero hero={landing.hero} onStart={() => setPhase('quiz')} />
  if (phase === 'quiz') return <Quiz steps={landing.quiz.steps} onComplete={handleComplete} />
  if (phase === 'calculating') return <Calculating onDone={handleCalculated} />
  return <Teaser landing={landing} answers={answers} matrixData={matrixData} isSubscribed={isSubscribed} />
}
