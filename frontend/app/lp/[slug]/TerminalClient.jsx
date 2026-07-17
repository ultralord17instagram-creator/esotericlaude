'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { saveQuiz, loadQuiz } from '../logic/quizStorage.js'
import { nextPhase, prevPhase, canGoBack, pickCard, buildTeaser, fillTokens } from '../logic/terminalMachine.js'
import styles from '../terminal.module.css'

// Пиксельная колода лендинга (10 арканов), арт по en-слагу карты.
const CARD_SRC = (slug) => `/cards/terminal/${slug}.png`
// Римские номера Старших арканов (0..21) для подписи карты «XV · ДЬЯВОЛ».
const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
// Порядковый номер шага прогресса (1..8) для фаз уровня.
const STEP = { intro: 1, pause: 2, draw: 3, reveal: 4, q1: 5, q2: 6, q3: 7, analyze: 8, reading: 8 }

// Пиксельная «звезда» на рубашке карты (дизайн-система, viewBox 12).
const StarSvg = () => (
  <svg className={styles.deckStar} viewBox="0 0 12 12" aria-hidden="true">
    <g>
      <rect x="5" y="0" width="2" height="12" /><rect x="0" y="5" width="12" height="2" />
      <rect x="2" y="2" width="2" height="2" /><rect x="8" y="2" width="2" height="2" />
      <rect x="2" y="8" width="2" height="2" /><rect x="8" y="8" width="2" height="2" />
    </g>
  </svg>
)

const LockSvg = ({ size = 32 }) => (
  <svg className={styles.lockIcon} width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="var(--lock)" />
    <path d="M8 10.5 V7 a4 4 0 0 1 8 0 V10.5" stroke="var(--lock)" strokeWidth="2" fill="none" />
    <circle cx="12" cy="15" r="1.6" fill="#f7efd8" />
  </svg>
)

// Статичное лицо вытянутой карты для закреплённого показа на вопросах/анализе/выводе.
// (reveal делает собственный flip и этот компонент не использует.)
const CardFace = ({ card, small }) => (
  <div className={`${styles.cardFace} ${small ? styles.cardSmall : ''}`}
    style={card ? { backgroundImage: `url(${CARD_SRC(card.slug)})` } : undefined}>
    {card && <span className={styles.cardTag}>{ROMAN[card.number]} · {card.ru}</span>}
  </div>
)

export default function TerminalClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const router = useRouter()

  const [phase, setPhase] = useState('boot')
  const [stateId, setStateId] = useState(null)
  const [card, setCard] = useState(null)
  const [a1Tag, setA1Tag] = useState(null)
  const [a1Text, setA1Text] = useState('')
  const [a2Tag, setA2Tag] = useState(null)
  const [a2Text, setA2Text] = useState('')
  const [a3, setA3] = useState(null)
  const [drawing, setDrawing] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [secs, setSecs] = useState(0)
  const [typed, setTyped] = useState('')
  const [reduced, setReduced] = useState(false)
  const [analyzeLines, setAnalyzeLines] = useState([])
  const [analyzePct, setAnalyzePct] = useState(0)

  const timers = useRef([])
  const isSubscribed = user?.subscribed ?? false
  const state = stateId ? landing.states.find((s) => s.id === stateId) : null
  const teaser = state && card
    ? buildTeaser(state, card, { tag: a1Tag, text: a1Text }, { tag: a2Tag, text: a2Text }, landing.microcopy.own)
    : null
  const wide = phase === 'reveal' || phase === 'reading'

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const after = (ms, fn) => { const t = setTimeout(fn, ms); timers.current.push(t); return t }

  useEffect(() => {
    track('lp_view', { slug: landing.slug })
    try { setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches) } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат после оплаты: полный разбор живёт в ЛК.
  useEffect(() => {
    if (isSubscribed && loadQuiz(landing.slug)) router.push('/lk')
  }, [isSubscribed, landing.slug, router])

  useEffect(() => () => clearTimers(), [])

  // reading: событие воронки.
  useEffect(() => {
    if (phase === 'reading') track('reading_view', { slug: landing.slug })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // reveal: переворот + мягкий обратный отсчёт (переход не форсирует).
  useEffect(() => {
    if (phase !== 'reveal') return undefined
    setFlipped(false)
    after(80, () => setFlipped(true))
    let left = landing.reveal.seconds
    setSecs(left)
    const id = setInterval(() => {
      left -= 1
      setSecs(left)
      if (left <= 0) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // analyze: печать строк лога + прогресс, затем авто-переход на reading.
  useEffect(() => {
    if (phase !== 'analyze') return undefined
    const lines = landing.analyze.lines.map((l) => fillTokens(l, { cardRu: card?.ru ?? '' }))
    if (reduced) {
      setAnalyzeLines(lines); setAnalyzePct(100)
      after(500, () => go('reading'))
      return () => clearTimers()
    }
    setAnalyzeLines([]); setAnalyzePct(0)
    let i = 0
    const id = setInterval(() => {
      i += 1
      setAnalyzeLines(lines.slice(0, i))
      setAnalyzePct(Math.round((i / lines.length) * 100))
      if (i >= lines.length) { clearInterval(id); after(700, () => go('reading')) }
    }, 600)
    return () => { clearInterval(id); clearTimers() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // reading: печать тизера по символам (или мгновенно при reduced-motion).
  useEffect(() => {
    if (phase !== 'reading' || !teaser) return undefined
    const full = teaser.open.join('\n')
    if (reduced) { setTyped(full); return undefined }
    setTyped('')
    let i = 0
    const id = setInterval(() => {
      i += 1
      setTyped(full.slice(0, i))
      if (i >= full.length) clearInterval(id)
    }, 28)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, reduced])

  const go = (p) => { clearTimers(); setPhase(p) }
  const goNext = () => go(nextPhase(phase))
  const goBack = () => go(prevPhase(phase))

  const onStart = () => { track('game_start', { slug: landing.slug }); go('select') }

  const onSelectState = (id) => {
    track('state_select', { slug: landing.slug, stateId: id })
    setStateId(id)
    saveQuiz(landing.slug, { stateId: id })
    go('intro')
  }

  const onDraw = () => {
    if (drawing) return
    setDrawing(true)
    after(800, () => {
      const cc = pickCard(state.cardPool)
      setCard(cc)
      track('card_drawn', { slug: landing.slug, card: cc.number })
      saveQuiz(landing.slug, { stateId, card: cc.number })
      setDrawing(false)
      go('reveal')
    })
  }

  const onOpenFull = () => {
    track('cta_click', { slug: landing.slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${landing.slug}`) } catch {}
    router.push(user ? '/lk' : '/register')
  }

  const onRestart = () => {
    clearTimers()
    setStateId(null); setCard(null)
    setA1Tag(null); setA1Text(''); setA2Tag(null); setA2Text(''); setA3(null)
    setDrawing(false); setFlipped(false); setSecs(0); setTyped('')
    setAnalyzeLines([]); setAnalyzePct(0)
    setPhase('boot')
  }

  // --- Хром-хелперы ---
  const StatusBar = ({ left, right, back }) => (
    <div className={`${styles.statusBar} ${back ? styles.statusBarBack : ''}`}>
      <span>{left}</span><span>{right}</span>
    </div>
  )
  const Progress = ({ step }) => (
    <div className={styles.progress} aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span key={i} className={`${styles.seg} ${i < step ? styles.segOn : ''}`} />
      ))}
    </div>
  )
  const BackBtn = () => (canGoBack(phase)
    ? <button className={styles.backBtn} onClick={goBack} aria-label={landing.microcopy.back}>‹</button>
    : null)

  const c = landing.chrome[phase] // конфиг статус-строки текущей фазы уровня

  let view
  if (phase === 'boot') {
    const titleLines = landing.boot.title.split(' ')
    view = (
      <div className={styles.pad}>
        <div className={styles.bootStatus}>{landing.boot.status}</div>
        <div className={styles.center}>
          <h1 className={styles.bootTitle}>
            {titleLines.map((w, i) => <span key={i}>{w}{i < titleLines.length - 1 && <br />}</span>)}
          </h1>
          <p className={styles.bootSub}>{landing.boot.subtitle}<span className={styles.caret}>▊</span></p>
        </div>
        <button className={styles.cta} onClick={onStart}>{landing.boot.cta}</button>
        <div className={styles.footer}>{landing.boot.footer}</div>
      </div>
    )
  } else if (phase === 'select') {
    view = (
      <div className={styles.pad}>
        <StatusBar left={landing.select.mode} right={landing.select.status} />
        <h1 className={styles.selTitle}>{landing.select.title}</h1>
        <p className={styles.selSub}>{landing.select.subtitle}</p>
        <div className={styles.menu}>
          {landing.states.map((s) => (
            <button key={s.id} className={styles.menuItem} onClick={() => onSelectState(s.id)}>
              <span>{s.menuLabel}</span><span className={styles.menuArrow}>›</span>
            </button>
          ))}
        </div>
        <div className={styles.footer}>{`CHOOSE 1 OF ${landing.states.length} · STEP 00-08`}</div>
      </div>
    )
  } else if (phase === 'intro') {
    view = (
      <div className={styles.pad}>
        <BackBtn />
        <StatusBar left={c.mode} right={c.status} back />
        <Progress step={STEP.intro} />
        <div className={styles.stack}>
          <div className={styles.eyebrow}>{c.eyebrow}</div>
          <h1 className={styles.display}>{state.menuLabel}</h1>
          <p className={styles.lead}>{state.intro}</p>
        </div>
        <button className={styles.cta} onClick={goNext}>{landing.microcopy.next} ▶</button>
        <div className={styles.footer}>{c.step}</div>
      </div>
    )
  } else if (phase === 'pause') {
    view = (
      <div className={styles.pad}>
        <BackBtn />
        <StatusBar left={c.mode} right={c.status} back />
        <Progress step={STEP.pause} />
        <div className={styles.center}>
          <div className={styles.pauseIcon} aria-hidden="true"><span /><span /></div>
          <h2 className={styles.display}>{c.title}</h2>
          <p className={styles.lead} style={{ textAlign: 'center' }}>{state.pause}</p>
        </div>
        <button className={styles.cta} onClick={goNext}>{landing.microcopy.next} ▶</button>
        <div className={styles.footer}>{c.step}</div>
      </div>
    )
  } else if (phase === 'draw') {
    view = (
      <div className={styles.pad}>
        <BackBtn />
        <StatusBar left={c.mode} right={c.status} back />
        <div className={styles.center}>
          <div className={styles.deck} aria-hidden="true">
            <div className={styles.deckCard} />
            <div className={styles.deckCard} />
            <div className={styles.deckCard}><StarSvg /></div>
            <div className={styles.deckCard}><StarSvg /></div>
            <div className={styles.deckCard}><StarSvg /></div>
            <div className={styles.deckCard}><StarSvg /></div>
          </div>
          <p className={styles.drawLine}>{landing.draw.line}<br />{landing.draw.hint}</p>
        </div>
        <button className={styles.cta} onClick={onDraw} disabled={drawing}>{landing.draw.cta} ▶</button>
        <div className={styles.footer}>{c.step}</div>
      </div>
    )
  } else if (phase === 'reveal') {
    const timerRight = secs > 0 ? `◷ ${secs}s` : c.status
    view = (
      <div className={styles.pad}>
        <BackBtn />
        <StatusBar left={c.mode} right={timerRight} back />
        <div className={`${styles.split} ${styles.splitCenter}`}>
          <div className={styles.colCard}>
            <div className={`${styles.card} ${flipped ? styles.flipOn : ''}`}>
              <div className={styles.flipInner}>
                <div className={`${styles.flipFace} ${styles.flipBack}`}><StarSvg /></div>
                <div className={`${styles.flipFace} ${styles.flipFront}`}
                  style={card ? { backgroundImage: `url(${CARD_SRC(card.slug)})` } : undefined} />
              </div>
            </div>
          </div>
          <div className={styles.colBody}>
            {card && <div className={styles.cardTitle}>{ROMAN[card.number]} · {card.ru}</div>}
            <p className={styles.revealDesc}>{landing.reveal.line}</p>
            <div className={styles.skipRow}>
              <span className={styles.skipRule} />
              <button className={styles.skipLink} onClick={goNext}>{landing.reveal.skip} ⏭</button>
            </div>
            <button className={styles.cta} onClick={goNext}>{landing.reveal.cta} ▶</button>
            <div className={styles.footer}>{c.step}</div>
          </div>
        </div>
      </div>
    )
  } else if (phase === 'q1' || phase === 'q2') {
    const isQ1 = phase === 'q1'
    const q = isQ1 ? state.q1 : state.q2
    const tag = isQ1 ? a1Tag : a2Tag
    const setTag = isQ1 ? setA1Tag : setA2Tag
    const text = isQ1 ? a1Text : a2Text
    const setText = isQ1 ? setA1Text : setA2Text
    view = (
      <div className={styles.pad}>
        <BackBtn />
        <StatusBar left={c.mode} right={c.step} back />
        <div className={styles.qEyebrow}>{c.eyebrow}</div>
        <div className={styles.qLayout}>
          <CardFace card={card} small />
          <div className={styles.qBody}>
            <p className={styles.qPrompt}>{q.prompt}</p>
            <div className={styles.blocks}>
              {q.blocks.map((b) => (
                <button key={b} type="button" aria-pressed={tag === b}
                  className={`${styles.block} ${tag === b ? styles.blockOn : ''}`}
                  onClick={() => setTag(b)}>{b}</button>
              ))}
            </div>
            <input className={styles.ownInput} type="text" value={text} maxLength={60}
              placeholder={q.placeholder} onChange={(e) => setText(e.target.value)} />
          </div>
        </div>
        <button className={styles.cta} disabled={!tag} onClick={() => {
          track(isQ1 ? 'q1_answer' : 'q2_answer', { slug: landing.slug, tag })
          goNext()
        }}>{landing.microcopy.next} ▶</button>
      </div>
    )
  } else if (phase === 'q3') {
    view = (
      <div className={styles.pad}>
        <BackBtn />
        <StatusBar left={c.mode} right={c.step} back />
        <div className={styles.qEyebrow}>{c.eyebrow}</div>
        <div className={styles.qLayout}>
          <CardFace card={card} small />
          <div className={styles.qBody}>
            <p className={styles.qPrompt}>{state.q3.prompt}</p>
            <div className={styles.options}>
              {state.q3.options.map((o) => (
                <button key={o} type="button" aria-pressed={a3 === o}
                  className={`${styles.option} ${a3 === o ? styles.optionOn : ''}`}
                  onClick={() => setA3(o)}>
                  <span className={styles.optBox}>✓</span>{o}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button className={styles.cta} disabled={!a3} onClick={() => {
          track('q3_answer', { slug: landing.slug, value: a3 })
          goNext()
        }}>Узнать вывод ▶</button>
      </div>
    )
  } else if (phase === 'analyze') {
    view = (
      <div className={styles.pad}>
        <StatusBar left={c.mode} right={c.status} />
        <div className={styles.center}>
          <CardFace card={card} small />
          <div className={styles.analyzeLog}>
            {analyzeLines.map((l, i) => <p key={i}>{l}</p>)}
          </div>
          <div className={styles.analyzeBar} aria-hidden="true"><span style={{ width: `${analyzePct}%` }} /></div>
        </div>
      </div>
    )
  } else {
    // reading (финальная фаза): вывод + замок + что откроется + переход на регистрацию.
    const lines = typed.split('\n')
    view = (
      <div className={styles.pad}>
        <StatusBar left={c.mode} right={c.status} />
        <Progress step={STEP.reading} />
        <div className={styles.split}>
          <div className={styles.colCard}><CardFace card={card} /></div>
          <div className={styles.colBody}>
            <h1 className={styles.readTitle}>{landing.reading.title}</h1>
            <div className={styles.readText}>
              {lines.map((line, i) => (
                <p key={i}>{line}{i === lines.length - 1 && <span className={styles.caret}>▊</span>}</p>
              ))}
            </div>
          </div>
        </div>
        <div className={styles.lockBlock}>
          <div className={styles.lockBlur}>{teaser?.lock}</div>
          <div className={styles.lockOverlay}>
            <LockSvg size={32} />
            <div className={styles.lockLabel}>РАЗБОР ЗАКРЫТ</div>
          </div>
        </div>
        <div className={styles.unlock}>
          <div className={styles.unlockTitle}>{landing.reading.unlockTitle}</div>
          <ul className={styles.payoffs}>
            {landing.reading.payoffs.map((row) => (
              <li key={row} className={styles.payoffRow}><span className={styles.payoffMark}>✦</span><span>{row}</span></li>
            ))}
          </ul>
        </div>
        <button className={`${styles.cta} ${styles.ctaLock}`} onClick={onOpenFull}>{landing.reading.cta}</button>
        <div className={styles.restart}>
          <button className={styles.linkBtn} onClick={onRestart}>{landing.microcopy.restart}</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={`${styles.bezel} ${wide ? styles.bezelWide : ''}`}>
        <div className={styles.screen}>{view}</div>
      </div>
    </div>
  )
}
