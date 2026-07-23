'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { saveQuiz, loadQuiz } from '../logic/quizStorage.js'
import { normalizeName, scoreTicks, bucketFor, buildReading } from '../logic/diagnosticMachine.js'
import styles from '../diagnostic.module.css'

const CARD_SRC = (n) => `/cards/${n}.png`
const cx = (...c) => c.filter(Boolean).join(' ')
const tpl = (s, map) => Object.keys(map).reduce((a, k) => a.replaceAll(`{${k}}`, map[k]), s || '')

// Тайминги (совпадают с прототипом хэндоффа).
const FLY_MS = 380
const LOAD_TICK = 90
const TYPE_TICK = 16
const TYPE_STEP = 3
const TYPE_DELAY = 950

// Раскладка веера «тасую колоду»: наклон/сдвиг/задержка по каждой карте.
const LOAD_FAN = [
  { r: '-34deg', y: '-8px', d: '0s' },
  { r: '-17deg', y: '-4px', d: '.12s' },
  { r: '0deg', y: '0px', d: '.24s', big: true },
  { r: '17deg', y: '-4px', d: '.36s' },
  { r: '34deg', y: '-8px', d: '.48s' },
]

// Рубашка карты: CSS-полумесяц (два круга) + искра. Размер задаёт родитель.
function CardBack({ bright, className, style, onClick, children }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cx(styles.cardBack, bright && styles.cardBackBright, className)}
      style={style}
    >
      <span className={styles.backMoonL} aria-hidden="true" />
      <span className={styles.backMoonD} aria-hidden="true" />
      <span className={styles.backSpark} aria-hidden="true" />
      {children}
    </Tag>
  )
}

// Разбить толкование на «жирный лид» (первое предложение) и остальное.
function splitLead(text) {
  const m = String(text || '').match(/^(.*?[.!?…])(\s+)([\s\S]*)$/)
  if (!m) return [{ text: String(text || ''), bold: true }]
  return [{ text: m[1], bold: true }, { text: m[2] + m[3], bold: false }]
}

export default function DiagnosticClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const router = useRouter()

  const [screen, setScreen] = useState('hero')
  const [qIndex, setQIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [flying, setFlying] = useState(null) // 'left' | 'right' | null
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [loadPct, setLoadPct] = useState(0)
  const [picked, setPicked] = useState([])
  const [typed, setTyped] = useState(0)

  const timers = useRef([])
  const loadRef = useRef(null)
  const typeRef = useRef(null)

  const symptoms = landing.scan.symptoms
  const total = symptoms.length
  const isSubscribed = user?.subscribed ?? false

  const clearAll = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (loadRef.current) { clearInterval(loadRef.current); loadRef.current = null }
    if (typeRef.current) { clearInterval(typeRef.current); typeRef.current = null }
  }
  const after = (ms, fn) => { const t = setTimeout(fn, ms); timers.current.push(t); return t }

  // Ответы «да» -> ключи симптомов -> расклад движка (детерминированный).
  const ticks = useMemo(
    () => symptoms.filter((s, i) => answers[i]).map((s) => s.key),
    [answers, symptoms]
  )
  const ticksKey = ticks.join(',')
  const reading = useMemo(
    () => buildReading(landing, { name, ticks }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, ticksKey, landing]
  )

  const yesCount = answers.filter(Boolean).length
  const percent = Math.round((yesCount / total) * 100)

  const paras = useMemo(() => reading.slots.map(splitLead), [reading])
  const totalChars = useMemo(() => reading.slots.reduce((a, s) => a + s.length, 0), [reading])

  useEffect(() => {
    track('lp_view', { slug: landing.slug })
    return () => clearAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат оплатившего: полный разбор живёт в ЛК.
  useEffect(() => {
    if (isSubscribed && loadQuiz(landing.slug)) router.push('/lk')
  }, [isSubscribed, landing.slug, router])

  // Загрузка «тасую колоду»: прогресс 0->100, затем автопереход на выбор карт.
  useEffect(() => {
    if (screen !== 'loading') return undefined
    setLoadPct(0)
    loadRef.current = setInterval(() => {
      setLoadPct((p) => {
        const next = p + (p > 82 ? 2 : 4)
        if (next >= 100) {
          clearInterval(loadRef.current); loadRef.current = null
          after(550, () => setScreen('pick'))
          return 100
        }
        return next
      })
    }, LOAD_TICK)
    return () => { if (loadRef.current) { clearInterval(loadRef.current); loadRef.current = null } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // Результат: печать толкований посимвольно (после флипа карт).
  useEffect(() => {
    if (screen !== 'result') return undefined
    track('reveal_view', { slug: landing.slug, bucket: reading.bucket })
    setTyped(0)
    const reduce = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { setTyped(totalChars); return undefined }
    const start = after(TYPE_DELAY, () => {
      typeRef.current = setInterval(() => {
        setTyped((n) => {
          const next = n + TYPE_STEP
          if (next >= totalChars) { clearInterval(typeRef.current); typeRef.current = null; return totalChars }
          return next
        })
      }, TYPE_TICK)
    })
    return () => {
      clearTimeout(start)
      if (typeRef.current) { clearInterval(typeRef.current); typeRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // --- Переходы ---
  const goQuiz = () => {
    track('scan_start', { slug: landing.slug })
    setQIndex(0); setAnswers([]); setFlying(null); setScreen('quiz')
  }
  const goHero = () => { setFlying(null); setScreen('hero') }

  const fly = (v) => {
    if (flying) return
    setFlying(v ? 'right' : 'left')
    after(FLY_MS, () => {
      setFlying(null)
      const nextAnswers = answers.slice()
      nextAnswers[qIndex] = v
      setAnswers(nextAnswers)
      const nextI = qIndex + 1
      setQIndex(nextI)
      if (nextI >= total) {
        const finalTicks = symptoms.filter((s, i) => nextAnswers[i]).map((s) => s.key)
        const sc = scoreTicks(finalTicks, symptoms)
        track('scan_complete', { slug: landing.slug, score: sc, bucket: bucketFor(sc, landing.scan.threshold) })
        setScreen('name')
      }
    })
  }

  const nameOk = name.trim().length > 0
  const goLoading = () => {
    if (!nameOk) return
    saveQuiz(landing.slug, { name: normalizeName(name), dob, ticks })
    setScreen('loading')
  }

  const onPick = (i) => setPicked((p) => {
    const idx = p.indexOf(i)
    if (idx >= 0) return p.filter((x) => x !== i)
    if (p.length >= 3) return p
    return [...p, i]
  })
  const canReveal = picked.length === 3
  const goResult = () => { if (canReveal) setScreen('result') }

  const goSummary = () => { track('final_view', { slug: landing.slug }); setScreen('summary') }
  const onCta = () => {
    track('cta_click', { slug: landing.slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${landing.slug}`) } catch {}
    router.push(user ? '/lk' : '/register')
  }
  const restart = () => {
    clearAll()
    setQIndex(0); setAnswers([]); setFlying(null); setName(''); setDob('')
    setLoadPct(0); setPicked([]); setTyped(0); setScreen('hero')
  }

  // --- Экраны ---
  let view = null

  if (screen === 'hero') {
    view = (
      <section className={styles.screen}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.hero}>
          <div className={styles.heroText}>
            <div className={styles.eyebrow}>{landing.intro.eyebrow}</div>
            <h1 className={styles.title}>
              {landing.intro.title}
              <br />
              <span className={styles.titleAccent}>{landing.intro.titleAccent}</span>
            </h1>
            <p className={styles.lead}>{landing.intro.subtitle}</p>
            <div className={styles.heroCtaWrap}>
              <button className={cx(styles.cta, styles.ctaLg)} onClick={goQuiz}>{landing.intro.cta}</button>
            </div>
            <p className={styles.note}>{landing.intro.note}</p>
          </div>
          <div className={styles.heroFan} aria-hidden="true">
            <CardBack className={cx(styles.heroCard, styles.heroCardL)} />
            <CardBack bright className={cx(styles.heroCard, styles.heroCardC)} />
            <CardBack className={cx(styles.heroCard, styles.heroCardR)} />
          </div>
        </div>
      </section>
    )
  } else if (screen === 'quiz') {
    const current = symptoms[Math.min(qIndex, total - 1)].label
    const cardTransform = flying === 'right' ? 'translateX(150%) rotate(16deg)'
      : flying === 'left' ? 'translateX(-150%) rotate(-16deg)'
        : 'translateX(0) rotate(0deg)'
    view = (
      <section className={styles.screen}>
        <div className={styles.glow} aria-hidden="true" />
        <button className={styles.back} onClick={goHero} aria-label={landing.microcopy.back}>←</button>
        <div className={styles.quiz}>
          <div className={styles.meterHead}>
            <span className={styles.meterLabel}>{landing.scan.meterLabel}</span>
            <span className={styles.meterPct}>{percent}%</span>
          </div>
          <div className={styles.meterTrack}>
            <div className={styles.meterFill} style={{ width: `${percent}%` }} />
          </div>

          <div className={styles.sign}>{tpl(landing.scan.signTemplate, { n: Math.min(qIndex + 1, total), total })}</div>
          <h2 className={styles.question}>{landing.scan.question}</h2>

          <div className={styles.deckStack}>
            <div className={cx(styles.stackCard, styles.stackA)} aria-hidden="true" />
            <div className={cx(styles.stackCard, styles.stackB)} aria-hidden="true" />
            <div className={styles.quizCard} style={{ transform: cardTransform, opacity: flying ? 0 : 1 }}>
              <span className={cx(styles.corner, styles.cTL)} aria-hidden="true" />
              <span className={cx(styles.corner, styles.cTR)} aria-hidden="true" />
              <span className={cx(styles.corner, styles.cBL)} aria-hidden="true" />
              <span className={cx(styles.corner, styles.cBR)} aria-hidden="true" />
              <div className={styles.divider} aria-hidden="true">
                <span className={cx(styles.divLine, styles.divLineL)} />
                <span className={styles.divSpark} />
                <span className={cx(styles.divLine, styles.divLineR)} />
              </div>
              <span className={styles.quote} aria-hidden="true">“</span>
              <p className={styles.statement}>{current}</p>
              <div className={styles.dots} aria-hidden="true">
                <span className={styles.dot} />
                <span className={cx(styles.dot, styles.dotFull)} />
                <span className={styles.dot} />
              </div>
            </div>
          </div>

          <div className={styles.quizBtns}>
            <button className={styles.btnGhost} onClick={() => fly(false)}>{landing.scan.no}</button>
            <button className={styles.btnYes} onClick={() => fly(true)}>{landing.scan.yes}</button>
          </div>

          <div className={styles.ticks} aria-hidden="true">
            {symptoms.map((_, i) => {
              const cls = i < qIndex ? (answers[i] ? styles.tickYes : styles.tickNo) : ''
              return <span key={i} className={cx(styles.tick, cls)} />
            })}
          </div>
        </div>
      </section>
    )
  } else if (screen === 'name') {
    view = (
      <section className={styles.screen}>
        <div className={styles.glow} aria-hidden="true" />
        <button className={styles.back} onClick={() => setScreen('quiz')} aria-label={landing.microcopy.back}>←</button>
        <div className={styles.form}>
          <h2 className={styles.formTitle}>{landing.name.title}</h2>
          <p className={styles.formSub}>{landing.name.subtitle}</p>
          <div className={styles.fields}>
            <input
              className={styles.field} type="text" inputMode="text" maxLength={24} autoFocus
              placeholder={landing.name.placeholder} value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') goLoading() }}
            />
            <input
              className={cx(styles.field, styles.fieldDate)} type="date" value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
          <p className={styles.hint}>{landing.name.hint}</p>
          <div className={styles.formCta}>
            <button className={cx(styles.cta, styles.ctaLg, !nameOk && styles.ctaDisabled)}
              onClick={goLoading} disabled={!nameOk}>{landing.name.cta}</button>
          </div>
        </div>
      </section>
    )
  } else if (screen === 'loading') {
    view = (
      <section className={styles.screen}>
        <div className={styles.loadStage} aria-hidden="true">
          <div className={styles.loadGlow} />
          {LOAD_FAN.map((c, i) => (
            <CardBack
              key={i}
              bright={c.big}
              className={cx(styles.loadCard, c.big && styles.loadCardC)}
              style={{ '--r': c.r, '--y': c.y, animationDelay: c.d }}
            />
          ))}
        </div>
        <h2 className={styles.loadTitle}>{landing.calculating.title}</h2>
        <p className={styles.loadSub}>{landing.calculating.sub}</p>
        <div className={styles.loadBar}>
          <div className={styles.loadBarFill} style={{ width: `${loadPct}%` }} />
        </div>
      </section>
    )
  } else if (screen === 'pick') {
    view = (
      <section className={styles.screen}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.pick}>
          <h2 className={styles.pickTitle}>{landing.pick.title}</h2>
          <p className={styles.pickSub}>{landing.pick.subtitle}</p>
          <div className={styles.pickGrid}>
            {Array.from({ length: 6 }).map((_, i) => {
              const order = picked.indexOf(i)
              const active = order >= 0
              return (
                <CardBack
                  key={i}
                  bright={active}
                  onClick={() => onPick(i)}
                  className={cx(styles.pickCard, active && styles.pickActive)}
                >
                  {active && <span className={styles.pickBadge}>{order + 1}</span>}
                </CardBack>
              )
            })}
          </div>
          <div className={styles.pickCounter}>{tpl(landing.pick.counter, { n: picked.length })}</div>
          <div className={styles.pickCta}>
            <button className={cx(styles.cta, styles.ctaLg, !canReveal && styles.ctaDisabled)}
              onClick={goResult} disabled={!canReveal}>{landing.pick.cta}</button>
          </div>
        </div>
      </section>
    )
  } else if (screen === 'result') {
    let consumed = 0
    view = (
      <section className={cx(styles.screen, styles.screenScroll)}>
        <div className={styles.result}>
          <h2 className={styles.resultTitle}>{landing.reveal.title}</h2>
          <div className={styles.resultCards}>
            {[0, 1, 2].map((i) => {
              const card = reading.cards[i]
              return (
                <div key={i} className={styles.resultCard}>
                  <div className={styles.resultCardImg}>
                    <img src={CARD_SRC(card.number)} alt={card.ru || ''} />
                  </div>
                  <span className={styles.resultPos}>{landing.reveal.positions[i]}</span>
                </div>
              )
            })}
          </div>
          <div className={styles.resultText}>
            {paras.map((segs, pi) => {
              const paraStart = consumed
              const parts = segs.map((seg, si) => {
                const start = consumed
                consumed += seg.text.length
                const vis = Math.max(0, Math.min(seg.text.length, typed - start))
                return { key: si, bold: seg.bold, shown: seg.text.slice(0, vis) }
              })
              const caret = typed > paraStart && typed < consumed
              return (
                <p key={pi} className={styles.para}>
                  {parts.map((seg) => (
                    <span key={seg.key} className={seg.bold ? styles.strong : undefined}>{seg.shown}</span>
                  ))}
                  {caret && <span className={styles.caret}>▍</span>}
                </p>
              )
            })}
          </div>
          <div className={styles.resultFoot}>
            <button className={cx(styles.cta, styles.ctaLg)} onClick={goSummary}>{landing.reveal.cta}</button>
            <div><button className={styles.linkUnder} onClick={restart}>{landing.reveal.restart}</button></div>
          </div>
        </div>
      </section>
    )
  } else {
    // summary
    view = (
      <section className={cx(styles.screen, styles.screenScroll)}>
        <div className={styles.summary}>
          <div className={styles.sumEyebrow}>{landing.final.eyebrow}</div>
          <p className={styles.sumHeading}>{reading.final.heading}</p>
          <p className={styles.sumIntro}>{landing.final.listIntro}</p>
          <ul className={styles.sumList}>
            {landing.final.promises.map((p, i) => (
              <li key={i} className={styles.sumItem}>
                <span className={styles.sumMark} aria-hidden="true" />
                <span className={styles.sumText}>{p}</span>
              </li>
            ))}
          </ul>
          <div className={styles.sumFoot}>
            <button className={cx(styles.cta, styles.ctaLg)} onClick={onCta}>{landing.final.cta}</button>
            <div><button className={styles.linkUnder} onClick={restart}>{landing.final.restart}</button></div>
          </div>
        </div>
      </section>
    )
  }

  return <div className={styles.root}>{view}</div>
}
