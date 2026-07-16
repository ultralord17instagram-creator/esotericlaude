'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { saveQuiz, loadQuiz } from '../logic/quizStorage.js'
import { normalizeName, interpolate, buildReading, pickCards } from '../logic/revealMachine.js'
import styles from '../taro.module.css'

const GRID = 9            // карт на сетке выбора
const PICK = 3            // сколько выбирает пользователь
const TYPE_MS = 26        // скорость печати толкования
const CARD_SRC = (n) => `/cards/${n}.png`

// Звёзды фона (фикс. набор из прототипа).
const STARS = [
  { t: '11%', l: '9%', s: 3, d: 0 }, { t: '19%', l: '90%', s: 4, d: 1.2 },
  { t: '33%', l: '4%', s: 2, d: .6 }, { t: '43%', l: '95%', s: 3, d: 2 },
  { t: '62%', l: '7%', s: 4, d: .9 }, { t: '70%', l: '92%', s: 2, d: 1.6 },
  { t: '84%', l: '30%', s: 3, d: .3 }, { t: '14%', l: '52%', s: 2, d: 2.4 },
  { t: '82%', l: '66%', s: 2, d: 1.1 }, { t: '88%', l: '15%', s: 3, d: 1.8 },
  { t: '8%', l: '30%', s: 2, d: .5 }, { t: '26%', l: '74%', s: 2, d: 1.3 },
]
const FAN = [
  'rotate(-30deg) translateX(-150px)', 'rotate(-15deg) translateX(-78px)',
  'none', 'rotate(15deg) translateX(78px)', 'rotate(30deg) translateX(150px)',
]
const SHUFFLE = ['-26deg', '-13deg', '0deg', '13deg', '26deg']

// Мистическая карта «Твой ход» (декор hero на десктопе + экран action).
function MysteryCard({ landing, shake, onClick }) {
  return (
    <div className={`${styles.mystery} ${shake ? styles.mysteryShake : ''}`} onClick={onClick}>
      <div className={styles.mysteryAura} aria-hidden="true" />
      <div className={styles.mysteryBody}>
        <div className={styles.mysteryFrame} aria-hidden="true" />
        <div className={styles.mysteryMoon} />
        <div className={styles.mysteryStar} />
        <div className={styles.mysteryTitle}>{landing.action.cardTitle}</div>
        <div className={styles.mysteryShimmer} aria-hidden="true" />
      </div>
    </div>
  )
}

export default function RevealClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const router = useRouter()

  const [phase, setPhase] = useState('name')
  const [name, setName] = useState('')
  const [questionId, setQuestionId] = useState(null)
  const [selecting, setSelecting] = useState(null)
  const [picked, setPicked] = useState([])
  const [tuneStep, setTuneStep] = useState(0)
  const [dealt, setDealt] = useState(false)
  const [flips, setFlips] = useState([false, false, false])
  const [typed, setTyped] = useState(['', '', ''])
  const [activeCard, setActiveCard] = useState(-1)
  const [showPay, setShowPay] = useState(false)
  const [buying, setBuying] = useState(false)
  const [cardShake, setCardShake] = useState(false)

  const T = useRef({ tune: [], read: [], tw: null, q: null })
  const scEl = useRef(null)
  const interpEls = useRef([])
  const interpsRef = useRef(['', '', ''])

  const isSubscribed = user?.subscribed ?? false
  const question = questionId ? landing.questions.find((q) => q.id === questionId) : null
  const effName = normalizeName(name) || 'Он'
  const reading = question ? buildReading(question, effName) : null
  const faces = pickCards(effName, GRID)
  const positions = landing.reading.positions

  // --- таймеры ---
  const clearTune = () => { T.current.tune.forEach(clearTimeout); T.current.tune = [] }
  const clearReading = () => { T.current.read.forEach(clearTimeout); T.current.read = []; clearInterval(T.current.tw); T.current.tw = null }

  useEffect(() => {
    track('lp_view', { slug: landing.slug })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат после оплаты: полный расклад живёт в ЛК.
  useEffect(() => {
    if (isSubscribed && loadQuiz(landing.slug)) router.push('/lk')
  }, [isSubscribed, landing.slug, router])

  useEffect(() => () => { clearTimeout(T.current.q); clearTune(); clearReading() }, [])

  // --- переходы ---
  const goName = () => { clearTune(); clearReading(); setPhase('name') }

  const onNext1 = () => {
    track('name_submit', { slug: landing.slug })
    setPhase('question')
  }

  const runTune = () => {
    clearTune()
    T.current.tune = [
      setTimeout(() => setTuneStep(1), 1800),
      setTimeout(() => setTuneStep(2), 3600),
      setTimeout(() => setPhase('pick'), 5400),
    ]
  }

  const onPickQ = (id) => {
    setSelecting(id)
    clearTimeout(T.current.q)
    T.current.q = setTimeout(() => {
      track('question_select', { slug: landing.slug, question: id })
      setQuestionId(id)
      setSelecting(null)
      setTuneStep(0)
      setPhase('tuning')
      runTune()
    }, 500)
  }

  const onCardTap = (id) => {
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id)
      return p.length < PICK ? [...p, id] : p
    })
  }

  const startReading = (interps) => {
    clearReading()
    interpsRef.current = interps
    T.current.read.push(setTimeout(() => setDealt(true), 260))
    T.current.read.push(setTimeout(() => revealCard(0), 1300))
  }

  const revealCard = (i) => {
    setActiveCard(i)
    setFlips((f) => f.map((v, idx) => (idx === i ? true : v)))
    T.current.read.push(setTimeout(() => scrollToInterp(i), 300))
    T.current.read.push(setTimeout(() => typeCard(i), 780))
  }

  const typeCard = (i) => {
    const full = interpsRef.current[i] || ''
    let n = 0
    clearInterval(T.current.tw)
    T.current.tw = setInterval(() => {
      n += 1
      setTyped((t) => { const c = t.slice(); c[i] = full.slice(0, n); return c })
      if (n % 10 === 0) scrollToInterp(i)
      if (n >= full.length) {
        clearInterval(T.current.tw)
        T.current.read.push(setTimeout(() => { if (i < PICK - 1) revealCard(i + 1); else finishReading() }, 720))
      }
    }, TYPE_MS)
  }

  const finishReading = () => {
    track('reveal_complete', { slug: landing.slug })
    setShowPay(true)
    T.current.read.push(setTimeout(scrollBottom, 260))
  }

  const onContinue = () => {
    if (picked.length < PICK) return
    saveQuiz(landing.slug, { questionId, name: normalizeName(name), picked })
    clearReading()
    setDealt(false); setFlips([false, false, false]); setTyped(['', '', '']); setActiveCard(-1); setShowPay(false); setBuying(false)
    setPhase('reading')
    startReading(reading.interps)
  }

  // Экран 5: «Узнай что делать» -> спиннер -> экран 6.
  const onReveal2 = () => {
    setBuying(true)
    if (!isSubscribed) track('paywall_view', { slug: landing.slug })
    T.current.read.push(setTimeout(() => {
      setBuying(false)
      setPhase('action')
      if (scEl.current) scEl.current.scrollTo({ top: 0 })
    }, 2000))
  }

  // Экран 6: «Перевернуть карту» = реальная покупка -> регистрация/ЛК.
  const onPurchase = () => {
    track('cta_click', { slug: landing.slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${landing.slug}`) } catch {}
    setCardShake(true)
    setTimeout(() => {
      setCardShake(false)
      router.push(user ? '/lk' : '/register')
    }, 380)
  }

  const onRestart = () => {
    clearTune(); clearReading()
    setPhase('name'); setName(''); setQuestionId(null); setSelecting(null); setPicked([])
    setTuneStep(0); setDealt(false); setFlips([false, false, false]); setTyped(['', '', '']); setActiveCard(-1); setShowPay(false); setBuying(false)
  }

  const scrollToInterp = (i) => {
    const el = interpEls.current[i]
    if (el && scEl.current) scEl.current.scrollTo({ top: Math.max(0, el.offsetTop - 140), behavior: 'smooth' })
  }
  const scrollBottom = () => { if (scEl.current) scEl.current.scrollTo({ top: scEl.current.scrollHeight, behavior: 'smooth' }) }

  // --- вспомогательные под-рендеры ---
  const StepDots = ({ active }) => (
    <div className={styles.steps}>
      {[0, 1, 2].map((i) => <div key={i} className={`${styles.step} ${i === active ? styles.stepOn : ''}`} />)}
    </div>
  )

  const readingFaces = picked.map((id) => faces[id])

  let view
  if (phase === 'name') {
    view = (
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.heroLogo} aria-hidden="true" />
          <div className={styles.eyebrow}>{landing.hero.eyebrow}</div>
          <h1 className={`${styles.h1} ${styles.heroTitle}`}>{landing.hero.title}</h1>
          <p className={`${styles.lead} ${styles.heroSub}`}>{landing.hero.subtitle}</p>
          <div className={styles.heroForm}>
            <input className={styles.field} type="text" inputMode="text" maxLength={24} autoFocus
              placeholder={landing.hero.placeholder} value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onNext1() }} />
            <button className={styles.cta} onClick={onNext1}>{landing.hero.cta}</button>
          </div>
          <p className={styles.heroHint}>{landing.hero.hint}</p>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <MysteryCard landing={landing} shake={false} onClick={undefined} />
        </div>
      </section>
    )
  } else if (phase === 'question') {
    view = (
      <div className={`${styles.screen}`}>
        <div className={`${styles.scroll} ${styles.pad}`}>
          <button className={styles.backBtn} onClick={goName} aria-label={landing.microcopy.back}>←</button>
          <div className={styles.colWrap}>
            <div className={styles.topLogoWrap}>
              <div className={styles.miniLogo} aria-hidden="true" />
              <StepDots active={0} />
            </div>
            <div className={styles.center} style={{ marginTop: 24 }}>
              <div className={styles.eyebrow}>{landing.question.eyebrow}</div>
              <h1 className={styles.h1} style={{ marginTop: 14 }}>{landing.question.title}</h1>
              <p className={styles.lead} style={{ marginTop: 14 }}>{landing.question.subtitle}</p>
            </div>
            <div className={styles.options}>
              {landing.questions.map((q, i) => (
                <button key={q.id}
                  className={`${styles.option} ${selecting === q.id ? styles.optionSel : ''}`}
                  style={{ animationDelay: `${0.15 + i * 0.1}s` }}
                  onClick={() => onPickQ(q.id)}>
                  <span className={styles.optionLabel}>{q.label}</span>
                  <span className={styles.optionArrow}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  } else if (phase === 'tuning') {
    view = (
      <div className={styles.screen}>
        <div className={styles.tune}>
          <div className={styles.tuneDeck} aria-hidden="true">
            <div className={styles.tuneGlow} />
            {SHUFFLE.map((a, i) => (
              <div key={i} className={styles.tuneCard} style={{ '--a': a, animationDelay: `${i * 0.08}s` }} />
            ))}
          </div>
          <h1 className={styles.tuneTitle}>{landing.tuning.title}</h1>
          <div className={styles.tuneLines}>
            {landing.tuning.lines.map((l, i) => (
              <div key={i} className={`${styles.tuneLine} ${tuneStep === i ? styles.tuneLineOn : ''}`}>
                {interpolate(l, effName)}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  } else if (phase === 'pick') {
    view = (
      <div className={styles.screen}>
        <div className={`${styles.scroll} ${styles.pad}`}>
          <button className={styles.backBtn} onClick={() => setPhase('question')} aria-label={landing.microcopy.back}>←</button>
          <div className={styles.colWrap}>
            <div className={styles.topLogoWrap}>
              <div className={styles.miniLogo} aria-hidden="true" />
              <StepDots active={1} />
            </div>
            <div className={styles.center} style={{ marginTop: 22 }}>
              <div className={styles.eyebrow}>{landing.pick.eyebrow}</div>
              <h1 className={styles.h1} style={{ marginTop: 12 }}>«{question?.label}»</h1>
              <p className={styles.lead} style={{ marginTop: 16 }}>
                {landing.pick.subtitleLead} <b style={{ color: 'var(--ink)', fontWeight: 600 }}>{landing.pick.subtitleBold}</b>{landing.pick.subtitleTail}
              </p>
            </div>
            <div className={styles.pickGrid}>
              {Array.from({ length: GRID }).map((_, id) => {
                const sel = picked.includes(id)
                return (
                  <div key={id} className={`${styles.pickCard} ${sel ? styles.pickCardSel : ''}`} onClick={() => onCardTap(id)}>
                    <div className={styles.cardBack} />
                    {sel && <div className={styles.pickBadge}>{picked.indexOf(id) + 1}</div>}
                  </div>
                )
              })}
            </div>
            <div className={styles.pickCounter}>{landing.pick.counter.replace('{n}', picked.length)}</div>
            {picked.length === PICK && (
              <div className={styles.pickCta}>
                <button className={`${styles.cta} ${styles.ctaPulse}`} onClick={onContinue}>{landing.pick.cta}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  } else if (phase === 'reading') {
    view = (
      <div className={styles.screen}>
        <div className={`${styles.scroll} ${styles.pad}`} ref={scEl}>
          <button className={styles.backBtn} onClick={() => setPhase('pick')} aria-label={landing.microcopy.back}>←</button>
          <div className={styles.readHead}>
            <div className={styles.eyebrow}>{landing.reading.eyebrow}</div>
            <h1 className={styles.h1} style={{ marginTop: 12 }}>{landing.reading.title}</h1>
          </div>

          <div className={styles.readRow}>
            {[0, 1, 2].map((i) => {
              const active = activeCard === i
              const face = readingFaces[i]
              return (
                <div key={i} className={styles.readSlot}>
                  <div className={`${styles.flipPersp} ${active ? styles.flipPerspActive : ''}`}
                    style={{ opacity: dealt ? 1 : 0, transform: dealt ? 'translateY(0) scale(1)' : 'translateY(-26px) scale(.9)', transitionDelay: `${i * 0.14}s` }}>
                    <div className={styles.flipInner} style={{ transform: flips[i] ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                      <div className={`${styles.flipFace} ${styles.flipBack}`} />
                      <div className={`${styles.flipFace} ${styles.flipFront} ${active ? styles.flipFrontActive : ''}`}
                        style={face ? { backgroundImage: `url(${CARD_SRC(face.number)})` } : undefined}>
                        {flips[i] && <div className={styles.glare} />}
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.readLabel} ${flips[i] ? styles.readLabelOn : ''} ${active ? styles.readLabelActive : ''}`}>{positions[i]}</div>
                </div>
              )
            })}
          </div>

          <div className={styles.interps}>
            {[0, 1, 2].map((i) => {
              const full = reading.interps[i]
              const txt = typed[i] || ''
              const typing = activeCard === i && txt.length < full.length
              return (
                <div key={i} ref={(el) => { interpEls.current[i] = el }}
                  className={`${styles.interp} ${i === 0 ? styles.interpFirst : ''} ${flips[i] ? '' : styles.interpHidden}`}>
                  <div className={styles.interpHead}>
                    <span className={styles.interpTag}>{positions[i]}</span>
                    <span className={styles.interpRule} />
                  </div>
                  <p className={styles.interpText}>{txt}{typing && <span className={styles.caret} />}</p>
                </div>
              )
            })}
          </div>

          {showPay && (
            <div className={styles.payBlock}>
              {!buying ? (
                <button className={`${styles.cta} ${styles.ctaPulse}`} onClick={onReveal2}>{landing.reading.cta}</button>
              ) : (
                <div className={styles.spinnerWrap}>
                  <div className={styles.spinner} />
                  <div className={styles.spinnerText}>{landing.reading.loading}</div>
                </div>
              )}
              <div className={styles.restart}><button className={styles.linkBtn} onClick={onRestart}>{landing.reading.restart}</button></div>
            </div>
          )}
        </div>
      </div>
    )
  } else {
    view = (
      <div className={styles.screen}>
        <div className={`${styles.scroll}`} ref={scEl}>
          <div className={styles.action}>
            <button className={styles.backBtn} onClick={() => setPhase('reading')} aria-label={landing.microcopy.back}>←</button>
            <p className={styles.actionLead}>
              Три карты сказали, что происходит.<br /><b>Эта говорит, что с этим делать.</b>
            </p>
            <MysteryCard landing={landing} shake={cardShake} onClick={onPurchase} />
            <div className={styles.actionCol}>
              <div className={styles.actionHead}>
                <div className={styles.eyebrow}>{landing.action.eyebrow}</div>
                <h2 className={styles.h2} style={{ marginTop: 14 }}>{landing.action.title}</h2>
              </div>
              <p className={styles.actionBait}>{reading?.actionBait}</p>
              <div className={styles.actionFoot}>
                <button className={`${styles.cta} ${styles.ctaPulse}`} onClick={onPurchase}>{landing.action.cta}</button>
                <div className={styles.restart}><button className={styles.linkBtn} onClick={onRestart}>{landing.action.restart}</button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.glowBlob} />
        <div className={styles.fan}>
          {FAN.map((tr, i) => <div key={i} className={styles.fanCard} style={{ transform: tr }} />)}
        </div>
        {STARS.map((s, i) => (
          <div key={i} className={styles.star}
            style={{ top: s.t, left: s.l, width: s.s * 2, height: s.s * 2, animationDelay: `${s.d}s` }} />
        ))}
      </div>
      <div className={styles.topbar}>
        <div className={styles.brandMark} aria-hidden="true" />
        <span className={styles.brandName}>Таро на него</span>
      </div>
      {view}
    </div>
  )
}
