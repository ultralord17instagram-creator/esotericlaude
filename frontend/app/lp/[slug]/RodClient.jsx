'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { loadQuiz, saveQuiz } from '../logic/quizStorage.js'
import { initQuiz, currentStep, setAnswer, advance, back, isComplete } from '../logic/quizMachine.js'
import { calculateMatrix } from '../../content/matrix.js'
import { buildReveal } from '../../content/landings/rod-copy.js'
import RodOctagram from '../components/RodOctagram.jsx'
import styles from '../rod.module.css'

const MONTHS_SELECT = [
  [1, 'Январь'], [2, 'Февраль'], [3, 'Март'], [4, 'Апрель'], [5, 'Май'], [6, 'Июнь'],
  [7, 'Июль'], [8, 'Август'], [9, 'Сентябрь'], [10, 'Октябрь'], [11, 'Ноябрь'], [12, 'Декабрь'],
]
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)
const YEARS = Array.from({ length: 71 }, (_, i) => 2010 - i) // 2010 → 1940

function iso(day, month, year) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// Сегментный прогресс флоу: total сегментов, filled закрашено бордо.
function Segments({ total, filled }) {
  return (
    <div className={styles.segs}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={i < filled ? styles.segOn : styles.seg} />
      ))}
    </div>
  )
}

export default function RodClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const router = useRouter()
  const isSubscribed = user?.subscribed ?? false
  const slug = landing.slug
  const steps = landing.quiz.steps
  const total = steps.length

  const [phase, setPhase] = useState('hero') // hero | quiz | loading | result
  const [quiz, setQuiz] = useState(initQuiz)
  const [answers, setAnswers] = useState(null)
  const [unlocked, setUnlocked] = useState(false)
  const [loadStep, setLoadStep] = useState(0)

  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [name, setName] = useState('')

  const step = phase === 'quiz' ? currentStep(steps, quiz) : null

  useEffect(() => { track('lp_view', { slug }) /* eslint-disable-next-line */ }, [])

  // Возврат после оплаты: подписана + сохранённый квиз -> открываем залоченные блоки без ввода.
  useEffect(() => {
    if (!isSubscribed) return
    const s = loadQuiz(slug)
    if (s?.mirror && s.birth_date) {
      setAnswers(s)
      setUnlocked(true)
      setPhase('result')
    }
  }, [isSubscribed, slug])

  // Оракул: 4 сообщения сменяются каждые 1.5с, после последнего пауза -> результат.
  useEffect(() => {
    if (phase !== 'loading' || !answers) return
    const msgs = landing.calculating.steps
    setLoadStep(0)
    let to
    let i = 0
    const id = setInterval(() => {
      i += 1
      if (i >= msgs.length) {
        clearInterval(id)
        setLoadStep(msgs.length - 1)
        to = setTimeout(() => {
          track('reveal_view', { slug })
          if (!isSubscribed) track('paywall_view', { slug })
          setPhase('result')
        }, 1200)
      } else {
        setLoadStep(i)
      }
    }, 1500)
    return () => { clearInterval(id); if (to) clearTimeout(to) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, answers])

  const startQuiz = () => {
    setQuiz(initQuiz())
    setDay(''); setMonth(''); setYear(''); setName('')
    setPhase('quiz')
    track('quiz_start', { slug })
  }

  const finishQuiz = (a) => {
    track('quiz_complete', { slug, flavor: a.mirror })
    saveQuiz(slug, a)
    setAnswers(a)
    setPhase('loading')
  }

  // choice: выбор подсвечивает вариант (без перехода), «Далее» двигает шаг.
  const pick = (id, value) => setQuiz(setAnswer(quiz, id, value))
  const next = () => {
    const n = advance(steps, quiz)
    if (isComplete(steps, n)) finishQuiz(n.answers)
    else setQuiz(n)
  }
  // date/name: собрать ответ и перейти одним действием.
  const commit = (id, value) => {
    const n = advance(steps, setAnswer(quiz, id, value))
    if (isComplete(steps, n)) finishQuiz(n.answers)
    else setQuiz(n)
  }
  const goBack = () => {
    if (quiz.index === 0) setPhase('hero')
    else setQuiz(back(quiz))
  }

  const dobValid = () => {
    const d = +day, m = +month, y = +year
    return d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2025
  }
  const nameValid = name.trim().length > 0
  const chosen = step ? quiz.answers[step.id] : undefined

  const onUnlock = () => {
    track('cta_click', { slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${slug}`) } catch {}
    router.push(user ? '/lk' : '/register')
  }

  const L = landing.landing

  return (
    <div className={styles.root}>
      <div className={styles.paper} />
      <div className={styles.shell}>

        {/* ===== ЛЕНДИНГ ===== */}
        {phase === 'hero' && (
          <>
            <header className={styles.topbar}>
              <div className={styles.brandBox}>
                <span className={styles.brandMark}>{landing.brand?.[0] || 'Р'}</span>
                <span className={styles.brandName}>{landing.brand}</span>
              </div>
              <nav className={styles.navRight}>
                <span className={styles.navLink}>{L.howItWorks.eyebrow}</span>
                <span className={styles.navLink}>{L.whatShows.title}</span>
                <button className={styles.navBtn} onClick={startQuiz}>Начать</button>
              </nav>
            </header>

            {/* Hero */}
            <section className={styles.hero}>
              <div className={styles.heroDots}>
                <span className={styles.heroDotOn} />
                <span className={styles.heroDot} /><span className={styles.heroDot} />
                <span className={styles.heroDot} /><span className={styles.heroDot} />
                <span className={styles.heroDot} />
              </div>
              <div className={styles.heroCol}>
                <div className={`${styles.eyebrow} ${styles.heroEyebrow}`}>{landing.hero.eyebrow}</div>
                <h1 className={`${styles.h1} ${styles.heroTitle}`}>{landing.hero.title}</h1>
                <p className={styles.heroSub}>{landing.hero.subtitle}</p>
                <div className={styles.heroCtaRow}>
                  <button className={styles.cta} onClick={startQuiz}>{landing.hero.cta}</button>
                  <div className={styles.heroNote}>{landing.hero.note}</div>
                </div>
                <div className={styles.trustRow}>
                  {landing.hero.trust.map((t, i) => (
                    <span key={t} style={{ display: 'contents' }}>
                      {i > 0 && <span className={styles.trustSep}>·</span>}
                      <span>{t}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Тизер-октаграмма (десктоп) */}
              <div className={styles.heroTeaser}>
                <div className={styles.teaserCard}>
                  <div className={styles.teaserLabel}>{landing.result.caption}</div>
                  <RodOctagram nodes={calculateMatrix('1990-01-01').nodes} />
                </div>
              </div>
            </section>

            {/* Как это работает */}
            <section className={styles.section}>
              <div className={styles.sectionLabel}>{L.howItWorks.eyebrow}</div>
              <h2 className={`${styles.h2} ${styles.sectionHead}`}>{L.howItWorks.title}</h2>
              <div className={styles.steps}>
                {L.howItWorks.steps.map((s) => (
                  <div key={s.n} className={styles.step}>
                    <div className={styles.stepNum}>{s.n}</div>
                    <div>
                      <div className={styles.stepTitle}>{s.title}</div>
                      <div className={styles.stepText}>{s.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Что покажет матрица */}
            <section className={`${styles.section} ${styles.showsSection}`}>
              <div>
                <h2 className={`${styles.h2} ${styles.showsTitle}`}>{L.whatShows.title}</h2>
                <div className={styles.bullets}>
                  {L.whatShows.bullets.map((b) => (
                    <div key={b} className={styles.bullet}>
                      <span className={styles.bulletDot} />
                      <span className={styles.bulletText}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.quoteCard}>
                <div className={styles.quote}>{L.whatShows.quote.text}</div>
                <div className={styles.quoteAuthor}>{L.whatShows.quote.author}</div>
              </div>
            </section>

            {/* Финальный CTA */}
            <section className={styles.finalCta}>
              <h2 className={`${styles.h2} ${styles.finalTitle}`}>{L.finalCta.title}</h2>
              <button className={`${styles.cta} ${styles.finalBtn}`} onClick={startQuiz}>{L.finalCta.cta}</button>
              <div className={styles.finalNote}>{L.finalCta.note}</div>
              <div className={styles.finalDisclaimer}>{L.finalCta.disclaimer}</div>
            </section>
          </>
        )}

        {/* ===== ВОПРОС (choice) ===== */}
        {phase === 'quiz' && step && step.type === 'choice' && (
          <section className={styles.flow} key={`q${quiz.index}`}>
            <div className={styles.flowInner}>
              <div className={styles.flowHead}>
                <button className={styles.back} onClick={goBack} aria-label="Назад">‹</button>
                <Segments total={total} filled={quiz.index + 1} />
              </div>
              <div className={styles.stepLabel}>{`Шаг ${quiz.index + 1} / ${total}`}</div>
              <h1 className={`${styles.h1} ${styles.flowTitle}`}>{step.question}</h1>
              <div className={styles.options}>
                {step.options.map((o) => (
                  <button key={o.value}
                    className={`${styles.option} ${chosen === o.value ? styles.optionOn : ''}`}
                    onClick={() => pick(step.id, o.value)}>
                    <span className={styles.optDot} />
                    <span className={styles.optText}>{o.label}</span>
                  </button>
                ))}
              </div>
              <div className={styles.spacer} />
              <div className={styles.flowNextWrap}>
                <button className={`${styles.ctaBlock} ${chosen ? styles.cta : styles.ctaOff} ${styles.flowNext}`}
                  onClick={() => { if (chosen) next() }}>Далее</button>
              </div>
            </div>
          </section>
        )}

        {/* ===== ДАТА ===== */}
        {phase === 'quiz' && step && step.type === 'date' && (
          <section className={styles.flow} key="dob">
            <div className={styles.flowInner}>
              <div className={styles.flowHead}>
                <button className={styles.back} onClick={goBack} aria-label="Назад">‹</button>
                <Segments total={total} filled={quiz.index + 1} />
              </div>
              <h1 className={`${styles.h1} ${styles.flowTitle}`}>{step.question}</h1>
              <div className={styles.dobRow}>
                <select className={`${styles.field} ${styles.fieldDay}`} value={day}
                  aria-label="День" onChange={(e) => setDay(e.target.value)}>
                  <option value="" disabled>День</option>
                  {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className={`${styles.field} ${styles.fieldMonth}`} value={month}
                  aria-label="Месяц" onChange={(e) => setMonth(e.target.value)}>
                  <option value="" disabled>Месяц</option>
                  {MONTHS_SELECT.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                </select>
                <select className={`${styles.field} ${styles.fieldYear}`} value={year}
                  aria-label="Год" onChange={(e) => setYear(e.target.value)}>
                  <option value="" disabled>Год</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button className={`${styles.ctaBlock} ${dobValid() ? styles.cta : styles.ctaOff} ${styles.flowCta}`}
                onClick={() => { if (dobValid()) commit(step.id, iso(day, month, year)) }}>Далее</button>
              <div className={styles.spacer} />
            </div>
          </section>
        )}

        {/* ===== ИМЯ ===== */}
        {phase === 'quiz' && step && step.type === 'text' && (
          <section className={styles.flow} key="name">
            <div className={styles.flowInner}>
              <div className={styles.flowHead}>
                <button className={styles.back} onClick={goBack} aria-label="Назад">‹</button>
                <Segments total={total} filled={quiz.index + 1} />
              </div>
              <h1 className={`${styles.h1} ${styles.flowTitle}`}>{step.question}</h1>
              <input className={`${styles.field} ${styles.fieldName}`} value={name}
                placeholder={step.placeholder || 'Имя'} aria-label="Имя"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && nameValid) commit(step.id, name.trim()) }} />
              <button className={`${styles.ctaBlock} ${nameValid ? styles.cta : styles.ctaOff} ${styles.flowCta}`}
                onClick={() => { if (nameValid) commit(step.id, name.trim()) }}>Построить матрицу рода</button>
              <div className={styles.spacer} />
            </div>
          </section>
        )}

        {/* ===== ОРАКУЛ ===== */}
        {phase === 'loading' && (() => {
          const msgs = landing.calculating.steps
          const msg = msgs[loadStep] || msgs[0]
          const nm = (answers?.name || '').trim() || 'Ты'
          return (
            <section className={styles.loading}>
              <div className={styles.loadCore}>
                <div className={styles.oracle}>
                  <div className={styles.oracleRing} />
                  <div className={styles.oracleGlow} />
                  <div className={styles.oracleDot} />
                </div>
                <div className={styles.loadMsg} key={loadStep}>
                  <div className={styles.loadTitle}>{msg.title}</div>
                  <div className={styles.loadSub}>{msg.sub.replace('{name}', nm)}</div>
                </div>
              </div>
            </section>
          )
        })()}

        {/* ===== РЕЗУЛЬТАТ ===== */}
        {phase === 'result' && answers && (() => {
          const matrix = calculateMatrix(answers.birth_date)
          const female2 = matrix.nodes.female2
          const flavor = answers.mirror
          const realName = (answers.name || '').trim()
          const fields = buildReveal(flavor, female2)
          const openFields = fields.filter((f) => !f.locked)
          const lockedFields = fields.filter((f) => f.locked)
          const eyebrow = (landing.result.readingEyebrow || '').replace('{name}', realName || 'тебя')
          return (
            <section className={styles.result}>
              <div className={styles.resultInner}>
                <div className={styles.resultProgress}>
                  {Array.from({ length: total }, (_, i) => <span key={i} className={styles.segOn} />)}
                </div>

                <div className={styles.resultGrid}>
                  {/* Октаграмма */}
                  <aside className={styles.matrixCard}>
                    <div className={styles.matrixLabel}>{landing.result.kicker}</div>
                    <RodOctagram nodes={matrix.nodes} />
                  </aside>

                  {/* Разбор */}
                  <div className={styles.reading}>
                    <div className={styles.readingEyebrow}>{eyebrow}</div>
                    <div className={styles.readingTitle}>{landing.result.readingTitle}</div>

                    {openFields.map((f) => (
                      <div key={f.id}>
                        <div className={styles.blockLabel}>{f.label}</div>
                        <p className={styles.blockText}>{f.value}</p>
                      </div>
                    ))}

                    {unlocked ? (
                      lockedFields.map((f) => (
                        <div key={f.id}>
                          <div className={styles.blockLabel}>{f.label}</div>
                          <p className={styles.blockText}>{f.value}</p>
                        </div>
                      ))
                    ) : (
                      <div className={styles.followups}>
                        {lockedFields.map((f, i) => (
                          <div key={f.id}
                            className={`${styles.followup} ${i === lockedFields.length - 1 ? styles.followWide : ''}`}>
                            <div className={styles.followLabel}>{f.label}</div>
                            <button className={styles.followBtn} onClick={onUnlock}>{landing.result.unlockCta}</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button className={styles.restart} onClick={() => setPhase('hero')}>← В начало</button>
                  </div>
                </div>
              </div>
            </section>
          )
        })()}

      </div>
    </div>
  )
}
