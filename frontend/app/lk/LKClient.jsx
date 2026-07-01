'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { usePayment } from '../hooks/usePayment'
import ProtectedRoute from '../components/ProtectedRoute'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Card from '../components/ui/Card'
import Link from 'next/link'
import { PRODUCTS } from '../products.config'
import styles from './lk.module.css'

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
      setProfileSaved(true)
    } catch (err) { setError(err.message) }
    finally { setProfileLoading(false) }
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Личный кабинет</h1>

        {/* Подписка */}
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Подписка</h2>
          <p className={styles.email}>{user?.email}</p>
          <p className={user?.subscribed ? styles.statusActive : styles.statusInactive}>
            {user?.subscribed
              ? `Активна до ${new Date(user.subscribed_until).toLocaleDateString('ru-RU')}`
              : 'Не активна'}
          </p>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            {!user?.subscribed && (
              <Button onClick={handlePayment} disabled={payLoading}>
                {payLoading ? 'Переходим...' : 'Оформить за 9 ₽'}
              </Button>
            )}
            {user?.subscribed && (
              <Button variant="ghost" onClick={handleCancel} disabled={cancelLoading}>
                {cancelLoading ? 'Отменяем...' : 'Отменить подписку'}
              </Button>
            )}
            <Button variant="ghost" onClick={logout}>Выйти</Button>
          </div>
        </Card>

        {/* Продукты */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Продукты</h2>
          <div className={styles.productsGrid}>
            {PRODUCTS.map(p => (
              <Link key={p.id} href={`/${p.slug}`} className={styles.productCard}>
                <span className={styles.productIcon}>{p.icon}</span>
                <span className={styles.productName}>{p.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Профиль */}
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Профиль</h2>
          <form onSubmit={handleProfileSave} className={styles.profileForm}>
            <Input
              label="Имя"
              id="name"
              type="text"
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            />
            <Input
              label="Дата рождения"
              id="birth_date"
              type="date"
              value={profile.birth_date}
              onChange={e => setProfile(p => ({ ...p, birth_date: e.target.value }))}
            />
            <div>
              <label className={styles.label}>Пол</label>
              <select
                value={profile.gender}
                onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}
                className={styles.select}
              >
                <option value="">Не указан</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>
            <Button type="submit" variant="secondary" disabled={profileLoading}>
              {profileLoading ? 'Сохраняем...' : profileSaved ? 'Сохранено ✓' : 'Сохранить'}
            </Button>
          </form>
        </Card>
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
