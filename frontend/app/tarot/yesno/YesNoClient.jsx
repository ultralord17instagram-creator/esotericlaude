'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import TarotCard from '../components/TarotCard'
import Paywall from '../../components/ui/Paywall'
import { StarMark } from '../components/icons'
import { assignRandomCards, getText } from '../../content/tarot'
import { requestUsage } from '../../content/tarot/api'
import { getSpread } from '../../content/tarot/spreads'
import styles from '../components/tarot.module.css'

const HINTS = ['Что меня ждёт?', 'На что обратить внимание?', 'Как лучше поступить?', 'Чего избегать?']
const MAX = 200
const YESNO_LIMIT = getSpread('yesno').freeLimit

export default function YesNoClient() {
  const { user, loading } = useAuth()
  const [step, setStep] = useState('question') // question | draw | answer | limit
  const [question, setQuestion] = useState('')
  const [card, setCard] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submitQuestion = async (e) => {
    e.preventDefault()
    if (!question.trim() || busy) return
    setBusy(true)
    setError('')
    const res = await requestUsage({ user, spreadId: 'yesno', limit: YESNO_LIMIT })
    setBusy(false)
    if (res.allowed) setStep('draw')
    else if (res.reason === 'limit') setStep('limit')
    else setError('Не удалось проверить лимит. Попробуй ещё раз.')
  }

  const reveal = () => {
    setCard(assignRandomCards(1)[0])
    setStep('answer')
  }

  const reset = () => {
    setStep('question'); setQuestion(''); setCard(null); setError('')
  }

  const Back = () => <Link href="/tarot" className={styles.backLink}>‹ Все расклады</Link>

  if (loading) {
    return <div className={styles.page}><Back /><p className={styles.notice}>Загрузка…</p></div>
  }

  if (step === 'limit') {
    return (
      <div className={styles.page}>
        <Back />
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
        <Back />
        <div className={styles.stage}>
          <div className={styles.eyebrowCenter}>Ваш вопрос</div>
          <p className={styles.questionEcho}>«{question}»</p>
          <TarotCard card={card} faceUp big />
          <div className={`${styles.answerBig} ${answerYes ? styles.answerYes : styles.answerNo}`}>
            {answerYes ? 'Да' : 'Нет'}
          </div>
          <p className={styles.positionText} style={{ maxWidth: '44ch' }}>
            {getText({ scenario: 'yesno', number: card.number })}
          </p>
          <div className={styles.actions}>
            <button className={styles.btnGhost} onClick={reset}>Задать другой вопрос</button>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'draw') {
    return (
      <div className={styles.page}>
        <button type="button" className={styles.backLink} onClick={() => setStep('question')}>‹ Изменить вопрос</button>
        <div className={styles.stage}>
          <div className={styles.eyebrowCenter}>Ваш вопрос</div>
          <p className={styles.questionEcho}>«{question}»</p>
          <div className={styles.drawGlow}>
            <TarotCard hero />
          </div>
          <p className={styles.hint}>Сделайте вдох, сосредоточьтесь на вопросе и откройте карту.</p>
          <button className={styles.btnPrimary} onClick={reveal}>
            <StarMark size={19} /> Открыть карту
          </button>
        </div>
      </div>
    )
  }

  // step === 'question'
  return (
    <div className={styles.page}>
      <Back />
      <div className={styles.head}>
        <h1 className={styles.title}>Сформулируйте вопрос</h1>
        <p className={styles.subtitle}>Чёткий вопрос — точный ответ. Спросите о том, что действительно волнует.</p>
      </div>

      <form onSubmit={submitQuestion} className={styles.questionWrap}>
        <div className={styles.questionBox}>
          <textarea
            className={styles.questionInput}
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, MAX))}
            placeholder="Например: стоит ли мне сейчас менять работу?"
            rows={3}
          />
          <div className={styles.counter}>{question.length} / {MAX}</div>
        </div>

        <div className={styles.hints}>
          <span className={styles.hintsLabel}>Подсказки</span>
          {HINTS.map((h) => (
            <button key={h} type="button" className={styles.chip} onClick={() => setQuestion(h)}>{h}</button>
          ))}
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} type="submit" disabled={busy || !question.trim()}>
            {busy ? 'Проверяем…' : <>Разложить карты <StarMark size={16} /></>}
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    </div>
  )
}
