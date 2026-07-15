'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { saveQuiz, loadQuiz } from '../logic/quizStorage.js'
import { interpolate, normalizeName } from '../logic/revealMachine.js'
import styles from '../lp.module.css'
import RevealInput from '../components/RevealInput'
import Calculating from '../components/Calculating'
import LiveReveal from '../components/LiveReveal'
import Paywall from '../components/Paywall'

export default function RevealClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const router = useRouter()
  const [phase, setPhase] = useState('input')
  const [data, setData] = useState(null) // { questionId, name }

  const isSubscribed = user?.subscribed ?? false
  const question = data ? landing.questions.find((q) => q.id === data.questionId) : null
  const name = data?.name ?? ''

  useEffect(() => {
    track('lp_view', { slug: landing.slug })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат после оплаты: полный расклад живёт в ЛК.
  useEffect(() => {
    if (isSubscribed && loadQuiz(landing.slug)) router.push('/lk')
  }, [isSubscribed, landing.slug, router])

  const handleSubmit = ({ questionId, name: raw }) => {
    const clean = normalizeName(raw)
    track('name_submit', { slug: landing.slug, question: questionId })
    saveQuiz(landing.slug, { questionId, name: clean })
    setData({ questionId, name: clean })
    setPhase('attuning')
  }

  const handleAttuned = () => setPhase('reveal')

  const handleReachPaywall = () => {
    track('reveal_complete', { slug: landing.slug })
    if (!isSubscribed) track('paywall_view', { slug: landing.slug })
    setPhase('paywall')
  }

  const handleRestart = () => { setData(null); setPhase('input') }

  const attuneLines = landing.attuning.lines.map((l) => interpolate(l, name))

  let view
  if (phase === 'input') view = <RevealInput landing={landing} onSubmit={handleSubmit} />
  else if (phase === 'attuning')
    view = <Calculating onDone={handleAttuned} title={landing.attuning.title} lines={attuneLines} variant="cosmic" />
  else if (phase === 'reveal')
    view = <LiveReveal question={question} name={name} landing={landing} onDone={handleReachPaywall} />
  else
    view = (
      <Paywall slug={landing.slug}
        heading={interpolate(landing.paywall.heading, name)}
        payoffs={landing.paywall.payoffs}
        onRestart={handleRestart} />
    )

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
