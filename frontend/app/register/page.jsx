'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import { useTracking } from '../hooks/useTracking'
import styles from '../auth.module.css'

export default function RegisterPage() {
  const { register } = useAuth()
  const { track } = useTracking()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const refCode = localStorage.getItem('offer_ref_code') || null
      await register({ email, password, refCode })
      router.push('/lk')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Создать аккаунт</h1>
        <p className={styles.sub}>Попробуй полный доступ за 9 ₽</p>
        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
          </button>
        </form>
        <p className={styles.footer}>
          Уже есть аккаунт? <Link href="/login">Войти</Link>
        </p>
      </div>
    </div>
  )
}
