'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import CardFan from '../components/CardFan'
import TarotCard from '../components/TarotCard'
import Paywall from '../../components/ui/Paywall'
import { getSpread } from '../../content/tarot/spreads'
import { assignRandomCards, getText } from '../../content/tarot'
import { consumeUsage } from '../../content/tarot/api'
import styles from '../components/tarot.module.css'

const SPREAD = getSpread('three')

export default function ThreeClient() {
  const { user, loading } = useAuth()
  const [step, setStep] = useState('theme') // theme | pick | result | limit
  const [theme, setTheme] = useState(null)
  const [mode, setMode] = useState('full') // full | demo
  const [reveals, setReveals] = useState({}) // index -> card
  const [order, setOrder] = useState([]) // порядок выбранных карт
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const Header = () => (
    <>
      <Link href="/tarot" className={styles.backLink}>← Все расклады</Link>
      <h1 className={styles.title}>Три карты</h1>
    </>
  )

  const selectTheme = async (t) => {
    if (busy) return
    setError('')
    setTheme(t)
    if (t.paid && !user.subscribed) {
      // Демо платной темы без подписки — без учёта на бэкенде.
      setMode('demo')
      setStep('pick')
      return
    }
    // Бесплатная тема или платная у подписчика — проверяем на бэкенде.
    setBusy(true)
    const res = await consumeUsage('three', t.id)
    setBusy(false)
    if (res.allowed) {
      setMode('full')
      setStep('pick')
    } else if (res.reason === 'limit') {
      setStep('limit')
    } else if (res.reason === 'subscription') {
      setMode('demo')
      setStep('pick')
    } else if (res.reason === 'auth') {
      setError('Войди, чтобы сделать расклад.')
      setStep('theme')
    } else {
      setError('Не удалось проверить лимит. Попробуй ещё раз.')
      setStep('theme')
    }
  }

  const pick = (index) => {
    const excluded = order.map((c) => c.number)
    const card = assignRandomCards(1, excluded)[0]
    const nextReveals = { ...reveals, [index]: card }
    const nextOrder = [...order, card]
    setReveals(nextReveals)
    setOrder(nextOrder)
    if (nextOrder.length >= SPREAD.cardCount) setStep('result')
  }

  const reset = () => {
    setStep('theme')
    setTheme(null)
    setReveals({})
    setOrder([])
    setError('')
  }

  if (loading) {
    return <div className={styles.page}><Header /><p className={styles.notice}>Загрузка…</p></div>
  }

  if (!user) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.notice}>
          Этот расклад доступен после входа. <Link href="/register">Создать аккаунт</Link> или{' '}
          <Link href="/login">войти</Link>.
        </div>
      </div>
    )
  }

  if (step === 'limit') {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.notice}>
          Бесплатный расклад «{theme?.name}» на сегодня уже использован. Возвращайся завтра или оформи подписку.
        </div>
        <Paywall />
      </div>
    )
  }

  if (step === 'result') {
    const unlocked = mode === 'demo' ? (SPREAD.demo?.freeCards ?? 1) : SPREAD.cardCount
    return (
      <div className={styles.page}>
        <Header />
        <p className={styles.subtitle}>{theme.name}</p>
        <p className={styles.intro}>{getText({ scenario: 'three', themeId: theme.id, intro: true })}</p>

        <div className={styles.positions}>
          {SPREAD.positions.map((label, i) => {
            const card = order[i]
            const locked = i >= unlocked
            return (
              <div key={label} className={styles.position}>
                <TarotCard card={card} faceUp />
                <div>
                  <div className={styles.positionLabel}>{label}</div>
                  {locked ? (
                    <div className={styles.positionText}>
                      <Lock size={14} style={{ verticalAlign: '-2px', marginRight: 6 }} />
                      Толкование доступно по подписке
                    </div>
                  ) : (
                    <div className={styles.positionText}>
                      {getText({ scenario: 'three', themeId: theme.id, number: card.number })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {mode === 'demo' && <Paywall />}
        <button className={styles.resetBtn} onClick={reset}>Другой расклад</button>
      </div>
    )
  }

  if (step === 'pick') {
    return (
      <div className={styles.page}>
        <Header />
        <p className={styles.subtitle}>
          {theme.name} · выбери {SPREAD.cardCount} карты ({order.length}/{SPREAD.cardCount})
        </p>
        <CardFan
          count={SPREAD.tableCards}
          reveals={reveals}
          onPick={pick}
          done={order.length >= SPREAD.cardCount}
        />
      </div>
    )
  }

  // step === 'theme'
  return (
    <div className={styles.page}>
      <Header />
      <p className={styles.subtitle}>Выбери тему расклада</p>
      <div className={styles.scenarioGrid}>
        {SPREAD.themes.map((t) => (
          <button
            key={t.id}
            type="button"
            className={styles.scenarioCard}
            onClick={() => selectTheme(t)}
            disabled={busy}
          >
            <div className={styles.scenarioName}>
              {t.name} {t.paid && <Lock size={14} style={{ verticalAlign: '-2px' }} />}
            </div>
            <div className={styles.scenarioDesc}>
              {t.paid ? (user.subscribed ? 'Доступно по подписке' : 'Демо + подписка') : 'Бесплатно, 1 раз в день'}
            </div>
          </button>
        ))}
      </div>
      {error && <p className={styles.notice} style={{ marginTop: 20 }}>{error}</p>}
    </div>
  )
}
