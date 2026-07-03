'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import CardFan from '../components/CardFan'
import TarotCard from '../components/TarotCard'
import Paywall from '../../components/ui/Paywall'
import { getSpread } from '../../content/tarot/spreads'
import { assignRandomCards, getText } from '../../content/tarot'
import { consumeUsage } from '../../content/tarot/api'
import styles from '../components/tarot.module.css'

const SPREAD = getSpread('yesno')

export default function YesNoClient() {
  const { user, loading } = useAuth()
  const [step, setStep] = useState('question') // question | pick | answer | limit
  const [question, setQuestion] = useState('')
  const [card, setCard] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submitQuestion = async (e) => {
    e.preventDefault()
    if (!question.trim() || busy) return
    setBusy(true)
    setError('')
    const res = await consumeUsage('yesno')
    setBusy(false)
    if (res.allowed) {
      setStep('pick')
    } else if (res.reason === 'limit') {
      setStep('limit')
    } else if (res.reason === 'auth') {
      setError('Войди, чтобы задать вопрос картам.')
    } else {
      setError('Не удалось проверить лимит. Попробуй ещё раз.')
    }
  }

  const pick = () => {
    setCard(assignRandomCards(1)[0])
    setStep('answer')
  }

  const reset = () => {
    setStep('question')
    setQuestion('')
    setCard(null)
    setError('')
  }

  const Header = () => (
    <>
      <Link href="/tarot" className={styles.backLink}>← Все расклады</Link>
      <h1 className={styles.title}>Да / Нет</h1>
    </>
  )

  if (loading) {
    return <div className={styles.page}><Header /><p className={styles.notice}>Загрузка…</p></div>
  }

  // Сценарий с лимитом — только для залогиненных.
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
          На сегодня бесплатные вопросы закончились. Новые — завтра, или оформи подписку без лимитов.
        </div>
        <Paywall />
      </div>
    )
  }

  if (step === 'answer' && card) {
    const answerYes = card.yesno === 'yes'
    return (
      <div className={styles.page}>
        <Header />
        <p className={styles.questionEcho}>«{question}»</p>
        <div className={styles.center} style={{ marginTop: 12 }}>
          <TarotCard card={card} faceUp big />
        </div>
        <div className={`${styles.answerBig} ${answerYes ? styles.answerYes : styles.answerNo}`}>
          {answerYes ? 'Да' : 'Нет'}
        </div>
        <p className={styles.positionText + ' ' + styles.center}>
          {getText({ scenario: 'yesno', number: card.number })}
        </p>
        <button className={styles.resetBtn} onClick={reset}>Задать другой вопрос</button>
      </div>
    )
  }

  if (step === 'pick') {
    return (
      <div className={styles.page}>
        <Header />
        <p className={styles.subtitle}>Сосредоточься на вопросе и выбери карту</p>
        <CardFan count={SPREAD.tableCards} reveals={card ? { 0: card } : {}} onPick={pick} done={Boolean(card)} />
      </div>
    )
  }

  // step === 'question'
  return (
    <div className={styles.page}>
      <Header />
      <p className={styles.subtitle}>Сформулируй вопрос, на который можно ответить да или нет</p>
      <form onSubmit={submitQuestion} className={styles.field}>
        <label className={styles.label} htmlFor="q">Твой вопрос</label>
        <input
          id="q"
          className={styles.input}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Например: сложится ли задуманное?"
          maxLength={200}
        />
        <button className={styles.resetBtn} type="submit" disabled={busy || !question.trim()}>
          {busy ? 'Проверяем…' : 'Спросить карты'}
        </button>
        {error && <p className={styles.positionText} style={{ color: 'var(--text-primary)' }}>{error}</p>}
      </form>
    </div>
  )
}
