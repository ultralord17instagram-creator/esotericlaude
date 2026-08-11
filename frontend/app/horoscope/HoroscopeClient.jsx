'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { sign as getSign } from '../content/horoscope/astro'
import {
  getToday,
  loadBirthLocal, saveBirthLocal, fetchBirthFromProfile, saveBirthToProfile, normalizeBirth,
} from '../content/horoscope'
import SignHeader from './components/SignHeader'
import DetailView from './components/DetailView'
import TodayView from './TodayView'
import PortraitView from './PortraitView'
import LunarView from './LunarView'
import { Sparkle } from './components/icons'
import styles from './horoscope.module.css'

export default function HoroscopeClient() {
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false

  const [birth, setBirth] = useState(null)     // 'YYYY-MM-DD' | null
  const [tab, setTab] = useState('today')
  const [detail, setDetail] = useState(null)   // id платной категории дня | null
  const [ready, setReady] = useState(false)    // прочитали ли память
  const [draft, setDraft] = useState('')       // значение поля ввода

  // При входе тянем дату: сперва профиль (если залогинен), затем localStorage.
  useEffect(() => {
    let alive = true
    ;(async () => {
      let d = user ? await fetchBirthFromProfile() : null
      if (!d) d = loadBirthLocal()
      if (alive) { setBirth(d); setReady(true) }
    })()
    return () => { alive = false }
  }, [user])

  const submit = (e) => {
    e.preventDefault()
    const d = normalizeBirth(draft)
    if (!d) return
    if (user) saveBirthToProfile(d); else saveBirthLocal(d)
    setBirth(d)
  }

  const changeDate = () => { setDraft(birth ?? ''); setDetail(null); setBirth(null) }
  const switchTab = (t) => { setDetail(null); setTab(t) }

  // Экран ввода (память пуста или нажали «Ввести другую»).
  // До того как прочитана память, показываем ту же шапку, что и на экране
  // ввода, только без формы. Раньше здесь отдавался пустой div, и это уходило
  // в серверный HTML: краулер видел страницу без h1 и без единого слова текста.
  if (!ready) {
    return (
      <div className={styles.page}>
        <div className={styles.formWrap}>
          <div className={styles.formCard}>
            <h1 className={styles.formTitle}>Гороскоп на сегодня</h1>
            <p className={styles.formSub}>
              Введи дату рождения, определим твой знак и покажем небо на сегодня, портрет знака и лунный календарь.
            </p>
          </div>
        </div>
      </div>
    )
  }
  if (!birth) {
    return (
      <div className={styles.page}>
        <div className={styles.formWrap}>
          <div className={styles.formCard}>
            <h1 className={styles.formTitle}>Гороскоп на сегодня</h1>
            <p className={styles.formSub}>
              Введи дату рождения, определим твой знак и покажем небо на сегодня, портрет знака и лунный календарь.
            </p>
            <form onSubmit={submit}>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Дата рождения</label>
                <input className={styles.input} type="date" value={draft} onChange={e => setDraft(e.target.value)} />
              </div>
              <button className={styles.btnPrimary} type="submit" disabled={!normalizeBirth(draft)}>
                <Sparkle size={14} /> Смотреть небо
              </button>
            </form>
            <p className={styles.formHint}>
              <Sparkle size={12} />
              {user
                ? 'Нужна только дата, знак определим сами.'
                : 'Нужна только дата. Войди, чтобы она сохранилась на всех устройствах.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const sign = getSign(birth)
  const today = new Date()

  // Экран деталей категории дня (drill-down) — заменяет шапку и вкладки.
  if (tab === 'today' && detail) {
    const block = getToday(sign.id, today).blocks.find(b => b.id === detail)
    if (block) {
      return (
        <div className={styles.page}>
          <DetailView block={block} signName={sign.name} isSubscribed={isSubscribed} onBack={() => setDetail(null)} />
        </div>
      )
    }
  }

  return (
    <div className={styles.page}>
      <SignHeader sign={sign} tab={tab} onTab={switchTab} onChange={changeDate} />
      {tab === 'today'    && <TodayView sign={sign} today={today} isSubscribed={isSubscribed} onOpenDetail={setDetail} />}
      {tab === 'portrait' && <PortraitView sign={sign} isSubscribed={isSubscribed} />}
      {tab === 'lunar'    && <LunarView today={today} isSubscribed={isSubscribed} />}
    </div>
  )
}
