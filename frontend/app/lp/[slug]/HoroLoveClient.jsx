'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { loadQuiz, saveQuiz } from '../logic/quizStorage.js'
import { resolveBranch, generate, buildReveal } from '../logic/horoLove.js'
import Hero from '../components/Hero'
import Quiz from '../components/Quiz'
import Calculating from '../components/Calculating'
import Fork from '../components/Fork'
import Reveal from '../components/Reveal'

export default function HoroLoveClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const searchParams = useSearchParams()
  const isSubscribed = user?.subscribed ?? false

  const deepLink = resolveBranch(searchParams.get('v'))
  const [branch, setBranch] = useState(deepLink)
  const [phase, setPhase] = useState(deepLink ? 'hero' : 'fork')
  const [answers, setAnswers] = useState(null)
  const [values, setValues] = useState(null)

  useEffect(() => {
    track('lp_view', { slug: landing.slug })
    if (deepLink) track('deeplink_enter', { slug: landing.slug, branch: deepLink })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат после оплаты: подписана + сохранённый квиз -> полный ревил.
  useEffect(() => {
    if (!isSubscribed) return
    const s = loadQuiz(landing.slug)
    if (s?.branch && s.birth_date) {
      setBranch(s.branch)
      setAnswers(s)
      setValues(generate({ branch: s.branch, birthDate: s.birth_date, name: s.name, hisSign: s.his_sign }))
      setPhase('full')
    }
  }, [isSubscribed, landing.slug])

  const b = branch ? landing.branches[branch] : null

  const selectBranch = (br) => {
    track('fork_select', { slug: landing.slug, branch: br })
    setBranch(br)
    setPhase('hero')
  }
  const onStart = () => { track('quiz_start', { slug: landing.slug, branch }); setPhase('quiz') }

  const onComplete = (a) => {
    track('quiz_complete', { slug: landing.slug, branch })
    saveQuiz(landing.slug, { branch, ...a })
    setAnswers(a)
    setPhase('calculating')
  }

  const onCalculated = () => {
    setValues(generate({ branch, birthDate: answers.birth_date, name: answers.name, hisSign: answers.his_sign }))
    track('reveal_view', { slug: landing.slug, branch })
    if (!isSubscribed) track('paywall_view', { slug: landing.slug, branch })
    setPhase('reveal')
  }

  if (phase === 'fork') return <Fork fork={landing.fork} onSelect={selectBranch} />
  if (phase === 'hero') return <Hero hero={b.hero} onStart={onStart} variant="cosmic" />
  if (phase === 'quiz')
    return <Quiz steps={b.quiz} onComplete={onComplete} onBack={() => setPhase(deepLink ? 'hero' : 'fork')} variant="cosmic" />
  if (phase === 'calculating')
    return <Calculating onDone={onCalculated} title={b.calcLines[0]} lines={b.calcLines} variant="cosmic" />

  const fields = buildReveal(branch, values)
  return (
    <Reveal slug={landing.slug} fields={fields} paywall={b.paywall} unlocked={phase === 'full'} />
  )
}
