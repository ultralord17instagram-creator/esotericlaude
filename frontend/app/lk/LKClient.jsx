'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePayment } from '../hooks/usePayment'
import ProtectedRoute from '../components/ProtectedRoute'
import DayDashboard from './components/DayDashboard'
import { saveBirthLocal } from '../content/horoscope'
import { saveProfile } from '../content/numerology'
import styles from './lk.module.css'

function SelectChevron() {
  return (
    <svg className={styles.chevron} width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M3 5 L7 9 L11 5" fill="none" stroke="#8C8069" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function LKContent() {
  const { user, logout, refetchUser } = useAuth()
  const { startPayment } = usePayment()
  const [payLoading, setPayLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState('')

  const [profile, setProfile] = useState({ name: '', birth_date: '', gender: '' })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    fetch('/api/v1/profile/me')
      .then(r => r.json())
      .then(d => setProfile({ name: d.name ?? '', birth_date: d.birth_date ?? '', gender: d.gender ?? '' }))
      .catch(() => {})
  }, [])

  const handlePayment = async () => {
    setError('')
    setPayLoading(true)
    try { await startPayment() }
    catch (err) { setError(err.message); setPayLoading(false) }
  }

  const handleCancel = async () => {
    if (!confirm('Отменить подписку?')) return
    setError('')
    setCancelLoading(true)
    try {
      const res = await fetch('/api/v1/subscriptions/me/cancel', { method: 'POST' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Ошибка отмены') }
      await refetchUser()
    } catch (err) { setError(err.message) }
    finally { setCancelLoading(false) }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileSaved(false)
    try {
      const res = await fetch('/api/v1/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name || null,
          birth_date: profile.birth_date || null,
          gender: profile.gender || null,
        }),
      })
      if (!res.ok) throw new Error('Ошибка сохранения')
      // Единый источник правды: синхронизируем кэши продуктов от профиля (дизайн §6.3),
      // чтобы гороскоп и нумерология сразу считали по новой дате.
      if (profile.birth_date) {
        saveBirthLocal(profile.birth_date)
        saveProfile({ date: profile.birth_date, name: profile.name })
      }
      setProfileSaved(true)
    } catch (err) { setError(err.message) }
    finally { setProfileLoading(false) }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.pageHeader}>
          <div className={styles.eyebrow}>С возвращением{profile.name ? `, ${profile.name}` : ''}</div>
          <h1 className={styles.title}>Личный кабинет</h1>
        </div>

        <div className={styles.layout}>
          {/* Дашборд дня */}
          <DayDashboard birth={profile.birth_date || null} />

          {/* Сайдбар */}
          <div className={styles.sidebar}>
            {/* Профиль */}
            <section className={styles.card}>
              <h2 id="profile" className={styles.cardTitle}>Профиль</h2>
              <form onSubmit={handleProfileSave} className={styles.profileForm}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="name">Имя</label>
                  <input
                    id="name"
                    type="text"
                    className={styles.input}
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="birth_date">Дата рождения</label>
                  <input
                    id="birth_date"
                    type="date"
                    className={styles.input}
                    value={profile.birth_date}
                    onChange={e => setProfile(p => ({ ...p, birth_date: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="gender">Пол</label>
                  <div className={styles.selectWrap}>
                    <select
                      id="gender"
                      className={styles.select}
                      value={profile.gender}
                      onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                    >
                      <option value="">Не указан</option>
                      <option value="female">Женский</option>
                      <option value="male">Мужской</option>
                    </select>
                    <SelectChevron />
                  </div>
                </div>
                <button type="submit" className={styles.saveBtn} disabled={profileLoading}>
                  {profileLoading ? 'Сохраняем...' : profileSaved ? 'Сохранено ✓' : 'Сохранить'}
                </button>
              </form>
            </section>

            {/* Подписка (логику не меняем) */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Подписка</h2>
              {user?.subscribed ? (
                <div className={styles.subStatus}>
                  <span className={styles.subDot} />
                  Активна до {new Date(user.subscribed_until).toLocaleDateString('ru-RU')}
                </div>
              ) : (
                <p className={styles.subInactive}>Не активна</p>
              )}
              {error && <p className={styles.error}>{error}</p>}
              {!user?.subscribed ? (
                <button className={styles.unlockBtn} onClick={handlePayment} disabled={payLoading}>
                  {payLoading ? 'Переходим...' : 'Оформить за 9 ₽'}
                </button>
              ) : (
                <button className={styles.outlineBtn} onClick={handleCancel} disabled={cancelLoading}>
                  {cancelLoading ? 'Отменяем...' : 'Отменить подписку'}
                </button>
              )}
            </section>

            {/* Аккаунт */}
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Аккаунт</h2>
              <p className={styles.accEmail}>{user?.email}</p>
              <button className={styles.outlineBtn} onClick={logout}>Выйти</button>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LKClient() {
  return (
    <ProtectedRoute>
      <LKContent />
    </ProtectedRoute>
  )
}
