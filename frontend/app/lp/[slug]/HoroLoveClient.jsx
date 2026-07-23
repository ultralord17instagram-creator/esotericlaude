'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { loadQuiz, saveQuiz } from '../logic/quizStorage.js'
import { initQuiz, currentStep, setAnswer, advance, isComplete } from '../logic/quizMachine.js'
import { resolveBranch, generate, buildReveal, seed } from '../logic/horoLove.js'
import { sign } from '../../content/horoscope/astro.js'
import styles from '../astrixLove.module.css'

// Глифы знаков (по id из astro.js). ︎ форсирует моно-презентацию (не эмодзи).
const GLYPH = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍',
  libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
}
// U+FE0E — селектор текстовой (моно) презентации: глифы не превращаются в эмодзи.
const TP = '︎'

const MONTHS_SELECT = [
  [1, 'Январь'], [2, 'Февраль'], [3, 'Март'], [4, 'Апрель'], [5, 'Май'], [6, 'Июнь'],
  [7, 'Июль'], [8, 'Август'], [9, 'Сентябрь'], [10, 'Октябрь'], [11, 'Ноябрь'], [12, 'Декабрь'],
]

// Внешнее кольцо загрузчика: 8 глифов по кругу (позиция задаётся классом).
const RING_GLYPHS = [
  ['♈', 'zTop'], ['♉', 'zTR'], ['♊', 'zR'], ['♋', 'zBR'],
  ['♌', 'zB'], ['♍', 'zBL'], ['♎', 'zL'], ['♏', 'zTL'],
]

// Детерминированный звёздный фон (seeded PRNG, без Math.random -> SSR == клиент).
function makeStars() {
  let r = 137
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 }
  const out = []
  for (let i = 0; i < 16; i += 1) {
    const s = 1 + Math.round(rnd() * 2)
    out.push({
      top: (4 + rnd() * 90).toFixed(2) + '%',
      left: (3 + rnd() * 94).toFixed(2) + '%',
      width: s + 'px',
      height: s + 'px',
      animationDelay: (rnd() * 4).toFixed(2) + 's',
      animationDuration: (3 + rnd() * 2).toFixed(2) + 's',
    })
  }
  return out
}
const STARS = makeStars()

function Sky() {
  return (
    <div className={styles.sky} aria-hidden="true">
      <div className={styles.glowTop} />
      <div className={styles.glowBottom} />
      {STARS.map((s, i) => <span key={i} className={styles.twinkle} style={s} />)}
    </div>
  )
}

function iso(day, month, year) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function HoroLoveClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isSubscribed = user?.subscribed ?? false
  const slug = landing.slug

  const deepLink = resolveBranch(searchParams.get('v'))
  const [branch, setBranch] = useState(deepLink)
  const [phase, setPhase] = useState(deepLink ? 'quiz' : 'intro') // intro | quiz | loading | result
  const [quiz, setQuiz] = useState(initQuiz)
  const [answers, setAnswers] = useState(null)
  const [values, setValues] = useState(null)
  const [progress, setProgress] = useState(0)
  const [unlocked, setUnlocked] = useState(false)

  // Локальные поля ритуальных экранов даты/имени.
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [name, setName] = useState('')

  const b = branch ? landing.branches[branch] : null
  const steps = b ? b.quiz : []
  const step = phase === 'quiz' ? currentStep(steps, quiz) : null

  useEffect(() => {
    track('lp_view', { slug })
    if (deepLink) {
      track('deeplink_enter', { slug, branch: deepLink })
      track('quiz_start', { slug, branch: deepLink })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Возврат после оплаты: подписана + сохранённый квиз -> полный ревил без пейвола.
  useEffect(() => {
    if (!isSubscribed) return
    const s = loadQuiz(slug)
    if (s?.branch && s.birth_date) {
      setBranch(s.branch)
      setAnswers(s)
      setValues(generate({ branch: s.branch, birthDate: s.birth_date, name: s.name }))
      setUnlocked(true)
      setPhase('result')
    }
  }, [isSubscribed, slug])

  // Загрузка: +2 / 55мс до 100%, затем через 400мс -> результат.
  useEffect(() => {
    if (phase !== 'loading' || !answers) return
    let p = 0
    let to
    const finishToResult = () => {
      setValues(generate({ branch, birthDate: answers.birth_date, name: answers.name }))
      track('reveal_view', { slug, branch })
      if (!isSubscribed) track('paywall_view', { slug, branch })
      setPhase('result')
    }
    const id = setInterval(() => {
      p = Math.min(100, p + 2)
      setProgress(p)
      if (p >= 100) { clearInterval(id); to = setTimeout(finishToResult, 400) }
    }, 55)
    return () => { clearInterval(id); if (to) clearTimeout(to) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, answers])

  const enterQuiz = (br) => {
    setBranch(br)
    setQuiz(initQuiz())
    setDay(''); setMonth(''); setYear(''); setName('')
    setPhase('quiz')
    track('quiz_start', { slug, branch: br })
  }
  const selectBranch = (br) => { track('fork_select', { slug, branch: br }); enterQuiz(br) }

  const finishQuiz = (a) => {
    track('quiz_complete', { slug, branch })
    saveQuiz(slug, { branch, ...a })
    setAnswers(a)
    setProgress(0)
    setPhase('loading')
  }

  const commit = (id, value) => {
    const next = advance(steps, setAnswer(quiz, id, value))
    if (isComplete(steps, next)) finishQuiz(next.answers)
    else setQuiz(next)
  }

  const dobValid = () => {
    const d = +day, m = +month, y = +year
    return d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2025
  }
  const nameValid = name.trim().length > 0

  const restart = () => {
    setBranch(deepLink)
    setPhase(deepLink ? 'quiz' : 'intro')
    setQuiz(initQuiz())
    setDay(''); setMonth(''); setYear(''); setName('')
    setAnswers(null); setValues(null); setProgress(0); setUnlocked(false)
  }

  const onUnlock = () => {
    track('cta_click', { slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${slug}`) } catch {}
    router.push(user ? '/lk' : '/register')
  }

  // ── Прогресс-пилюли по всему пути: intro + шаги квиза + loading + result ──
  const total = (steps.length || 5) + 3
  let idx = 0
  if (phase === 'quiz') idx = 1 + quiz.index
  else if (phase === 'loading') idx = 1 + steps.length
  else if (phase === 'result') idx = 2 + steps.length
  const pills = Array.from({ length: total }, (_, i) => i <= idx)

  // ── Живой чип знака на экране даты ──
  const liveSign = day && month ? sign(iso(day || 1, month, year || 2000)) : null

  return (
    <div className={styles.root}>
      <Sky />
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <span className={styles.brandStar}>✦{TP}</span>
            <span className={styles.brandName}>ASTRIX</span>
          </div>
          <div className={styles.pills}>
            {pills.map((on, i) => <span key={i} className={on ? styles.pillOn : styles.pill} />)}
          </div>
        </header>

        <main className={styles.stage}>
          {phase === 'intro' && (
            <section className={styles.screenIntro}>
              <div className={styles.orb}>♡{TP}</div>
              <div className={styles.kicker}>ASTRIX · ЛЮБОВЬ</div>
              <h1 className={styles.h1}>{landing.fork.title}</h1>
              <p className={styles.sub}>Выбери, что ближе всего — звёзды подберут расклад именно для тебя</p>
              <div className={`${styles.options} ${styles.optionsIntro}`}>
                {landing.fork.options.map((o) => (
                  <button key={o.branch} className={styles.optionCard} onClick={() => selectBranch(o.branch)}>
                    <span className={styles.radio} />
                    <span className={styles.optText}>
                      <span className={styles.optTitle}>{o.label}</span>
                      <span className={styles.optSub}>{o.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {phase === 'quiz' && step && step.type === 'choice' && (
            <section className={styles.screen} key={`q${quiz.index}`}>
              <div className={styles.kicker}>{`Шаг ${quiz.index + 1} / ${steps.length}`}</div>
              <h2 className={styles.h2}>{step.question}</h2>
              <div className={styles.options}>
                {step.options.map((o) => (
                  <button key={o.value} className={styles.optionCard} onClick={() => commit(step.id, o.value)}>
                    <span className={styles.radio} />
                    <span className={styles.optText}><span className={styles.optTitle}>{o.label}</span></span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {phase === 'quiz' && step && step.type === 'date' && (
            <section className={styles.screen} key="dob">
              <div className={styles.ring}>☾{TP}</div>
              <h2 className={styles.h2}>Когда ты родилась?</h2>
              <p className={styles.sub}>Дата рождения раскроет твой знак</p>
              <div className={styles.dobRow}>
                <input className={`${styles.inp} ${styles.inpDay}`} value={day} inputMode="numeric" placeholder="ДД"
                  aria-label="День" onChange={(e) => setDay(e.target.value.replace(/\D/g, '').slice(0, 2))} />
                <select className={`${styles.inp} ${styles.inpMonth}`} value={month}
                  aria-label="Месяц" onChange={(e) => setMonth(e.target.value)}>
                  <option value="">Месяц</option>
                  {MONTHS_SELECT.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
                <input className={`${styles.inp} ${styles.inpYear}`} value={year} inputMode="numeric" placeholder="ГГГГ"
                  aria-label="Год" onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} />
              </div>
              <div className={styles.chipSlot}>
                {liveSign && (
                  <div className={styles.zodChip}>
                    <span className={styles.zodGlyph}>{GLYPH[liveSign.id]}{TP}</span>
                    <span className={styles.zodText}>Твой знак — {liveSign.name}</span>
                  </div>
                )}
              </div>
              <button className={dobValid() ? styles.btn : styles.btnOff}
                onClick={() => { if (dobValid()) commit(step.id, iso(day, month, year)) }}>
                {quiz.index === steps.length - 1 ? 'Составить прогноз' : 'Далее'}
              </button>
            </section>
          )}

          {phase === 'quiz' && step && step.type === 'text' && (
            <section className={styles.screen} key="name">
              <div className={styles.ring}>✧{TP}</div>
              <h2 className={styles.h2}>Как тебя зовут?</h2>
              <p className={styles.sub}>Звёзды обращаются к тебе по имени</p>
              <input className={`${styles.inp} ${styles.textInput}`} value={name} placeholder="Твоё имя" aria-label="Имя"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && nameValid) commit(step.id, name.trim()) }} />
              <button className={`${nameValid ? styles.btn : styles.btnOff} ${styles.btnName}`}
                onClick={() => { if (nameValid) commit(step.id, name.trim()) }}>
                Составить прогноз
              </button>
            </section>
          )}

          {phase === 'loading' && (
            <section className={styles.loadingScreen}>
              <div className={styles.loader}>
                <div className={styles.aura} />
                <div className={styles.zodiacRing}>
                  {RING_GLYPHS.map(([g, pos]) => (
                    <span key={pos} className={`${styles.zSign} ${styles[pos]}`}>{g}{TP}</span>
                  ))}
                </div>
                <div className={styles.dashRing} />
                <div className={styles.orbit7}><span className={styles.planet1} /></div>
                <div className={styles.orbit45}><span className={styles.planet2} /></div>
                <div className={styles.core}>
                  <span className={styles.corePct}>{progress}<i>%</i></span>
                </div>
              </div>
              <div className={styles.loadingMsg}>
                {(b?.calcLines?.[progress < 34 ? 0 : progress < 67 ? 1 : 2]) || 'Составляем любовный прогноз…'}
              </div>
              <div className={styles.loadingSub}>{(answers?.name || '').trim() || 'Ты'}, звёзды почти сошлись…</div>
            </section>
          )}

          {phase === 'result' && (() => {
            const her = answers?.birth_date ? sign(answers.birth_date) : null
            const herName = her?.name ?? ''
            const realName = (answers?.name || '').trim()
            const scoreVal = answers ? 70 + (seed(`${realName}|${answers.birth_date}`) % 28) : 0
            const arc = `conic-gradient(from -90deg, #c4b7ff 0deg, #8b7cf0 ${scoreVal * 3.6}deg, rgba(255,255,255,.04) ${scoreVal * 3.6}deg 360deg)`
            const fields = branch && values ? buildReveal(branch, values) : []
            const openFields = fields.filter((f) => !f.locked)
            const lockedFields = fields.filter((f) => f.locked)
            // Ветка return не собирает имя -> показываем только знак (без дубля «Знак · Знак»).
            const chipLabel = realName ? `${realName} · ${herName}` : (herName || 'Друг')
            return (
              <section className={styles.result}>
                <aside className={styles.resultHero}>
                  <div className={styles.heroKicker}>ТВОЙ ЛЮБОВНЫЙ ПРОГНОЗ</div>
                  <div className={styles.heroChip}>
                    {her && <span className={styles.zodGlyph}>{GLYPH[her.id]}{TP}</span>}
                    <span className={styles.zodText}>{chipLabel}</span>
                  </div>
                  <div className={styles.scoreRing}>
                    <div className={styles.scoreTrack} />
                    <div className={styles.scoreArc} style={{ background: arc }} />
                    <div className={styles.scoreHole}>
                      <span className={styles.heart}>♥{TP}</span>
                      <span className={styles.scoreNum}>{scoreVal}<i>%</i></span>
                      <span className={styles.scoreCap}>энергия любви</span>
                    </div>
                  </div>
                  <button className={styles.restartBtn} onClick={restart}>Пройти ещё раз</button>
                </aside>

                <div className={styles.resultBody}>
                  {openFields.map((f) => (
                    <div key={f.id} className={styles.readingBlock}>
                      <div className={styles.sectionLabel}>{f.label}</div>
                      <p className={styles.readingText}>{f.value}</p>
                    </div>
                  ))}

                  {unlocked ? (
                    lockedFields.map((f) => (
                      <div key={f.id} className={styles.readingBlock}>
                        <div className={styles.sectionLabel}>{f.label}</div>
                        <p className={styles.readingText}>{f.value}</p>
                      </div>
                    ))
                  ) : (
                    <div className={styles.teasers}>
                      {lockedFields.map((f) => (
                        <div key={f.id}>
                          <div className={styles.teaserLabel}>{f.label}</div>
                          <button className={styles.teaserBtn} onClick={onUnlock}>Узнать</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )
          })()}
        </main>
      </div>
    </div>
  )
}
