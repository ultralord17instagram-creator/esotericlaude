'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  sign as getSign,
} from '../content/horoscope/astro'
import {
  loadBirthLocal, saveBirthLocal, fetchBirthFromProfile, saveBirthToProfile, normalizeBirth,
} from '../content/horoscope'
import SignHeader from './components/SignHeader'
import TodayView from './TodayView'
import PortraitView from './PortraitView'
import LunarView from './LunarView'
import { Sparkle } from './components/icons'
import styles from './horoscope.module.css'

export default function HoroscopeClient() {
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false

  const [birth, setBirth] = useState(null)   // 'YYYY-MM-DD' | null
  const [tab, setTab] = useState('today')
  const [ready, setReady] = useState(false)  // прочитали ли память
  const [draft, setDraft] = useState('')     // значение поля ввода

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

  const changeDate = () => { setDraft(birth ?? ''); setBirth(null) }

  // Экран ввода (память пуста или нажали «Ввести другую»).
  if (!ready) return <div className={styles.page} />
  if (!birth) {
    return (
      <div className={styles.page}>
        <form className={styles.form} onSubmit={submit}>
          <h1 className={styles.signName}>Гороскоп на сегодня</h1>
          <div className={styles.field}>
            <label className={styles.label}>Дата рождения</label>
            <input className={styles.input} type="date" value={draft} onChange={e => setDraft(e.target.value)} />
          </div>
          <span className={styles.lockNote}><Sparkle size={12} /> Нужна только дата рождения, знак определим сами</span>
          <button className={styles.btnPrimary} type="submit" disabled={!normalizeBirth(draft)}>Смотреть небо</button>
          {!user && <span className={styles.lockNote}>Войди, чтобы дата сохранилась на всех устройствах</span>}
        </form>
      </div>
    )
  }

  const sign = getSign(birth)
  const today = new Date()

  return (
    <div className={styles.page}>
      <SignHeader sign={sign} tab={tab} onTab={setTab} onChange={changeDate} />
      {tab === 'today'    && <TodayView sign={sign} today={today} isSubscribed={isSubscribed} />}
      {tab === 'portrait' && <PortraitView sign={sign} isSubscribed={isSubscribed} />}
      {tab === 'lunar'    && <LunarView today={today} isSubscribed={isSubscribed} />}
    </div>
  )
}
