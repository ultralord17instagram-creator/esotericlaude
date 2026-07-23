'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import TarotCard from '../components/TarotCard'
import ReadingCard from '../components/ReadingCard'
import Paywall from '../../components/ui/Paywall'
import { StarMark, VerdictYes, VerdictNo } from '../components/icons'
import { assignRandomCards, getText, yesNoConfidence } from '../../content/tarot'
import { requestUsage } from '../../content/tarot/api'
import { getSpread } from '../../content/tarot/spreads'
import styles from '../components/tarot.module.css'

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
    const pct = yesNoConfidence(card)
    return (
      <div className={styles.page}>
        <Back />
        <div className={styles.reading}>
          <div className={styles.verdictGrid}>
            {/* вердикт + шкала */}
            <div>
              <div className={`${styles.verdict} ${answerYes ? styles.verdictYes : styles.verdictNo}`}>
                <div className={styles.verdictIcon}>
                  {answerYes ? <VerdictYes size={38} /> : <VerdictNo size={38} />}
                </div>
                <div className={styles.verdictBig}>{answerYes ? 'Да' : 'Нет'}</div>
                <div className={styles.verdictSub}>
                  {answerYes ? 'Карты на вашей стороне' : 'Картам сейчас ближе осторожность'}
                </div>
              </div>
              <div className={styles.confScale}>
                <div className={styles.confLabels}>
                  <span>Скорее нет</span><span>Уверенность {pct}%</span><span>Скорее да</span>
                </div>
                <div className={styles.confTrack}>
                  <div className={styles.confFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>

            {/* карта + пояснение */}
            <div>
              <div className={styles.cardRow}>
                <ReadingCard card={card} variant="mini" />
                <div>
                  <div className={styles.cardRowName}>{card.ru}</div>
                  <div className={styles.cardRowKicker}>{card.en} · прямое</div>
                  {card.keywords?.length > 0 && (
                    <div className={styles.cardRowChips}>
                      {card.keywords.slice(0, 2).map((k) => <span key={k} className={styles.kwMini}>{k}</span>)}
                    </div>
                  )}
                </div>
              </div>
              <p className={styles.sectionText} style={{ marginBottom: 30 }}>
                {getText({ scenario: 'yesno', number: card.number })}
              </p>
              <div className={styles.readingActions}>
                <button className={styles.btnPrimary} onClick={reset}>Задать ещё вопрос <StarMark size={16} /></button>
              </div>
            </div>
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
      <div className={styles.questionCenter}>
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

          <div className={styles.actions}>
            <button className={styles.btnPrimary} type="submit" disabled={busy || !question.trim()}>
              {busy ? 'Проверяем…' : <>Разложить карты <StarMark size={16} /></>}
            </button>
          </div>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  )
}
