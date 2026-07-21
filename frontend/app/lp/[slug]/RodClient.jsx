'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import { loadQuiz, saveQuiz } from '../logic/quizStorage.js'
import { initQuiz, currentStep, setAnswer, advance, isComplete } from '../logic/quizMachine.js'
import { calculateMatrix } from '../../content/matrix.js'
import { buildReveal } from '../../content/landings/rod-copy.js'
import MatrixDiagram from '../components/MatrixDiagram.jsx'
import styles from '../astrixLove.module.css' // старт: реюз классов Astrix Love; Кирилл переоденет (Task 6)

const MONTHS_SELECT = [
  [1, 'Январь'], [2, 'Февраль'], [3, 'Март'], [4, 'Апрель'], [5, 'Май'], [6, 'Июнь'],
  [7, 'Июль'], [8, 'Август'], [9, 'Сентябрь'], [10, 'Октябрь'], [11, 'Ноябрь'], [12, 'Декабрь'],
]

function iso(day, month, year) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function RodClient({ landing }) {
  const { user } = useAuth()
  const { track } = useTracking()
  const router = useRouter()
  const isSubscribed = user?.subscribed ?? false
  const slug = landing.slug
  const steps = landing.quiz.steps

  const [phase, setPhase] = useState('hero') // hero | quiz | loading | result
  const [quiz, setQuiz] = useState(initQuiz)
  const [answers, setAnswers] = useState(null)
  const [progress, setProgress] = useState(0)
  const [unlocked, setUnlocked] = useState(false)

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

  // Театр загрузки: 2.5с -> результат.
  useEffect(() => {
    if (phase !== 'loading' || !answers) return
    let p = 0, to
    const id = setInterval(() => {
      p = Math.min(100, p + 2)
      setProgress(p)
      if (p >= 100) {
        clearInterval(id)
        to = setTimeout(() => {
          track('reveal_view', { slug })
          if (!isSubscribed) track('paywall_view', { slug })
          setPhase('result')
        }, 400)
      }
    }, 50)
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

  const onUnlock = () => {
    track('cta_click', { slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${slug}`) } catch {}
    router.push(user ? '/lk' : '/register')
  }

  // Прогресс-пилюли: hero + шаги + loading + result.
  const total = steps.length + 3
  let idx = 0
  if (phase === 'quiz') idx = 1 + quiz.index
  else if (phase === 'loading') idx = 1 + steps.length
  else if (phase === 'result') idx = 2 + steps.length
  const pills = Array.from({ length: total }, (_, i) => i <= idx)

  return (
    <div className={styles.root}>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <div className={styles.brand}><span className={styles.brandName}>ASTRIX</span></div>
          <div className={styles.pills}>
            {pills.map((on, i) => <span key={i} className={on ? styles.pillOn : styles.pill} />)}
          </div>
        </header>

        <main className={styles.stage}>
          {phase === 'hero' && (
            <section className={styles.screenIntro}>
              <div className={styles.kicker}>{landing.hero.eyebrow}</div>
              <h1 className={styles.h1}>{landing.hero.title}</h1>
              <p className={styles.sub}>{landing.hero.subtitle}</p>
              <button className={styles.btn} onClick={startQuiz}>{landing.hero.cta}</button>
              <p className={styles.sub}>{landing.hero.note}</p>
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
              <h2 className={styles.h2}>{step.question}</h2>
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
              <button className={dobValid() ? styles.btn : styles.btnOff}
                onClick={() => { if (dobValid()) commit(step.id, iso(day, month, year)) }}>Далее</button>
            </section>
          )}

          {phase === 'quiz' && step && step.type === 'text' && (
            <section className={styles.screen} key="name">
              <h2 className={styles.h2}>{step.question}</h2>
              <input className={`${styles.inp} ${styles.textInput}`} value={name} placeholder={step.placeholder || 'Имя'}
                aria-label="Имя" onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && nameValid) commit(step.id, name.trim()) }} />
              <button className={`${nameValid ? styles.btn : styles.btnOff} ${styles.btnName}`}
                onClick={() => { if (nameValid) commit(step.id, name.trim()) }}>Построить матрицу рода</button>
            </section>
          )}

          {phase === 'loading' && (
            <section className={styles.loadingScreen}>
              <div className={styles.loadingMsg}>
                {landing.calculating.lines[progress < 34 ? 0 : progress < 67 ? 1 : 2] || landing.calculating.title}
              </div>
              <div className={styles.loadingSub}>{(answers?.name || '').trim() || 'Ты'}, круг почти виден…</div>
            </section>
          )}

          {phase === 'result' && answers && (() => {
            const matrix = calculateMatrix(answers.birth_date)
            const female2 = matrix.nodes.female2
            const flavor = answers.mirror
            const realName = (answers.name || '').trim()
            const fields = buildReveal(flavor, female2)
            const openFields = fields.filter((f) => !f.locked)
            const lockedFields = fields.filter((f) => f.locked)
            const caption = realName
              ? landing.result.captionWithName.replace('{name}', realName)
              : landing.result.caption
            return (
              <section className={styles.result}>
                <aside className={styles.resultHero}>
                  <div className={styles.heroKicker}>{landing.result.kicker}</div>
                  <div className={styles.heroChip}>
                    <span className={styles.zodText}>{caption} · {landing.result.chipLabel} {female2}</span>
                  </div>
                  <MatrixDiagram nodes={matrix.nodes} highlight={['female1']} />
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
                          <button className={styles.teaserBtn} onClick={onUnlock}>{landing.result.unlockCta}</button>
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
