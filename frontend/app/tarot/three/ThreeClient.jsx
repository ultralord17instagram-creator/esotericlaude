'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import CardFan from '../components/CardFan'
import TarotCard from '../components/TarotCard'
import Paywall from '../../components/ui/Paywall'
import { Check, Arrow, THEME_ICONS } from '../components/icons'
import { getSpread } from '../../content/tarot/spreads'
import { assignRandomCards, getText } from '../../content/tarot'
import { requestUsage } from '../../content/tarot/api'
import styles from '../components/tarot.module.css'

const SPREAD = getSpread('three')

// Подписи/цитаты тем (макет 2a). Ключ — id темы из SPREADS.three.themes.
const THEME_META = {
  ppf:       { sub: 'Картина в целом — если не знаете, с чего начать', quote: null },
  shadow:    { sub: 'скрытое в себе',      quote: '«Что я подавляю?»' },
  purpose:   { sub: 'таланты и путь',      quote: '«В чём мой путь?»' },
  partner:   { sub: 'образ и встреча',     quote: '«Кто мне подходит?»' },
  ancestral: { sub: 'родовые программы',   quote: '«Что тянется по роду?»' },
}

// «ещё 1 карту» / «ещё 2 карты»
const remainLabel = (n) => `Выберите ещё ${n} ${n === 1 ? 'карту' : 'карты'}`

export default function ThreeClient() {
  const { user, loading } = useAuth()
  const [step, setStep] = useState('theme') // theme | pick | result | limit
  const [theme, setTheme] = useState(null)
  const [mode, setMode] = useState('full') // full | demo
  const [pickedIdx, setPickedIdx] = useState([]) // индексы выбранных слотов веера
  const [order, setOrder] = useState([])          // карты в порядке выбора
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const selectTheme = async (t) => {
    if (busy) return
    setError('')
    setTheme(t)
    // Платная тема без подписки (гость или залогиненный без подписки) → демо + пейвол.
    if (t.paid && !user?.subscribed) {
      setMode('demo'); setStep('pick'); return
    }
    setBusy(true)
    const res = await requestUsage({ user, spreadId: 'three', themeId: t.id, limit: t.freeLimit })
    setBusy(false)
    if (res.allowed) { setMode('full'); setStep('pick') }
    else if (res.reason === 'limit') setStep('limit')
    else if (res.reason === 'subscription') { setMode('demo'); setStep('pick') }
    else { setError('Не удалось проверить лимит. Попробуй ещё раз.'); setStep('theme') }
  }

  const pick = (index) => {
    const excluded = order.map((c) => c.number)
    const card = assignRandomCards(1, excluded)[0]
    const nextOrder = [...order, card]
    setPickedIdx([...pickedIdx, index])
    setOrder(nextOrder)
    if (nextOrder.length >= SPREAD.cardCount) setStep('result')
  }

  const reset = () => {
    setStep('theme'); setTheme(null); setPickedIdx([]); setOrder([]); setError('')
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
        <Back />
        <div className={styles.head}>
          <p className={styles.eyebrow}>{theme.name}</p>
          <h1 className={styles.title}>Ваш расклад</h1>
        </div>
        <p className={styles.intro}>{getText({ scenario: 'three', themeId: theme.id, intro: true })}</p>

        <div className={styles.positions}>
          {SPREAD.positions.map((label, i) => {
            const card = order[i]
            const locked = i >= unlocked
            return (
              <div key={label} className={styles.position}>
                <div className={styles.positionCard}><TarotCard card={card} faceUp /></div>
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

        {mode === 'demo' && <div style={{ marginTop: 32 }}><Paywall /></div>}
        <div className={styles.actions}>
          <button className={styles.btnGhost} onClick={reset}>Другой расклад</button>
        </div>
      </div>
    )
  }

  if (step === 'pick') {
    const remaining = SPREAD.cardCount - order.length
    const done = remaining <= 0
    return (
      <div className={styles.page}>
        <button type="button" className={styles.backLink} onClick={() => setStep('theme')}>‹ Назад</button>
        <div className={styles.stage}>
          <p className={styles.eyebrow}>{theme.name}</p>
          <h1 className={styles.title}>Выберите три карты</h1>
          <p className={styles.subtitle}>Доверьтесь интуиции — тяните те, что откликаются.</p>

          <CardFan count={SPREAD.tableCards} picked={pickedIdx} onPick={pick} done={done} />

          <div className={styles.progress}>
            {Array.from({ length: SPREAD.cardCount }, (_, i) => (
              <span key={i} className={`${styles.progressDot} ${i < order.length ? styles.progressDotOn : ''}`} />
            ))}
            <span className={styles.progressText}>Выбрано {order.length} из {SPREAD.cardCount}</span>
          </div>

          <div className={styles.actions}>
            <button className={styles.btnPrimary} disabled>{remainLabel(remaining)}</button>
          </div>
        </div>
      </div>
    )
  }

  // step === 'theme'
  const hero = SPREAD.themes.find((t) => t.id === 'ppf')
  const rest = SPREAD.themes.filter((t) => t.id !== 'ppf')
  const HeroIcon = hero ? THEME_ICONS[hero.id] : null
  return (
    <div className={styles.page}>
      <Back />
      <div className={styles.head}>
        <h1 className={styles.title}>На что гадаем?</h1>
        <p className={styles.subtitle}>Выберите сферу — под неё подберём вопрос и колоду.</p>
      </div>

      {hero && (
        <button type="button" className={styles.themeHero} onClick={() => selectTheme(hero)} disabled={busy}>
          <div className={styles.themeHeroIcon}>{HeroIcon && <HeroIcon size={30} />}</div>
          <div style={{ flex: 1 }}>
            <div className={styles.themeHeroName}>Общая</div>
            <div className={styles.themeHeroDesc}>{THEME_META[hero.id].sub}</div>
          </div>
          <div className={styles.check}><Check size={14} /></div>
        </button>
      )}

      <div className={styles.themeGrid}>
        {rest.map((t) => {
          const I = THEME_ICONS[t.id]
          const m = THEME_META[t.id] ?? {}
          return (
            <button key={t.id} type="button" className={styles.themeCard} onClick={() => selectTheme(t)} disabled={busy}>
              <div className={styles.themeIcon}>{I && <I size={28} />}</div>
              <div className={styles.themeName}>{t.name}</div>
              <div className={styles.themeSub}>{m.sub}</div>
              {t.paid && !user?.subscribed && (
                <div className={styles.themeLock}><Lock size={13} /> Демо + подписка</div>
              )}
              {m.quote && <div className={styles.themeQuote}>{m.quote}</div>}
            </button>
          )
        })}
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actions}>
        <span className={styles.subtitle} style={{ fontSize: 13 }}>Выберите сферу выше, чтобы продолжить</span>
      </div>
    </div>
  )
}
