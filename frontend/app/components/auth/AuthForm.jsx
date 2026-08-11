'use client'
import { useState, useId } from 'react'
import { useAuth } from '../../context/AuthContext'
import styles from './auth.module.css'

// Общая форма входа и регистрации. Используется и на страницах (AuthPage),
// и в модалке (AuthModal). Заголовок/герой рендерит контейнер — здесь только
// поля, согласие, ошибка, кнопка и нижняя ссылка-переключатель.
//
// props:
//   mode         — 'login' | 'register'
//   onSuccess    — вызывается после успешной авторизации (навигация/закрытие)
//   onSwitch     — (nextMode) => переключить режим (модалка) или перейти (страница)
//   switchDisplay— 'always' (модалка) | 'mobileOnly' (страница: на десктопе ссылка сверху)
export default function AuthForm({ mode, onSuccess, onSwitch, switchDisplay = 'mobileOnly' }) {
  const { login, register } = useAuth()
  const uid = useId()
  const isLogin = mode === 'login'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [accepted, setAccepted] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
        await login({ email, password })
      } else {
        let refCode = null
        try { refCode = localStorage.getItem('offer_ref_code') || null } catch {}
        await register({ email, password, refCode })
      }
      onSuccess?.()
    } catch (err) {
      setError(err?.message || 'Что-то пошло не так, попробуйте ещё раз')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={submit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor={`${uid}-email`} className={styles.label}>Email</label>
          <input
            id={`${uid}-email`}
            type="email"
            className={styles.input}
            placeholder="astra@почта.ру"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            // Менеджеры паролей/автозаполнение впрыскивают в поля свои атрибуты
            // и узлы, ломая гидрацию SSR-формы. Гасим рассинхрон, чтобы React
            // не уходил в аварийный ре-рендер (он падает в hasValidRef).
            suppressHydrationWarning
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor={`${uid}-pw`} className={styles.label}>Пароль</label>
            {/* Восстановление пароля пока не реализовано — визуальный элемент из макета */}
            {isLogin && <span className={styles.forgot}>Забыли?</span>}
          </div>
          <div className={styles.inputWrap}>
            <input
              id={`${uid}-pw`}
              type={showPw ? 'text' : 'password'}
              className={styles.input}
              placeholder={isLogin ? '' : 'Минимум 8 символов'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              // См. поле email выше: менеджеры паролей особенно активно трогают
              // поле с паролем — гасим рассинхрон гидрации.
              suppressHydrationWarning
            />
            <button
              type="button"
              className={styles.eye}
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? 'Скрыть пароль' : 'Показать пароль'}
            >
              <EyeIcon open={showPw} />
            </button>
          </div>
        </div>

        {!isLogin && (
          // Контейнер намеренно div, а не label: внутри текста живёт ссылка на
          // /terms, а клик по ссылке внутри label браузер переадресует чекбоксу.
          // Роль label играет сам квадратик, доступное имя даёт aria-label инпута.
          <div className={styles.consent}>
            <input
              id={`${uid}-consent`}
              type="checkbox"
              className={styles.consentInput}
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              aria-label="Принимаю условия пользовательского соглашения и политику конфиденциальности"
            />
            <label htmlFor={`${uid}-consent`} className={styles.consentBox} aria-hidden="true">
              <svg width="11" height="11" viewBox="0 0 12 12">
                <path d="M2 6.5 L5 9 L10 3" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </label>
            <span className={styles.consentText}>
              Принимаю{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer">условия</a>
              {' '}и{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer">политику конфиденциальности</a>
            </span>
          </div>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button
          type="submit"
          className={styles.submit}
          disabled={loading || (!isLogin && !accepted)}
        >
          {loading
            ? (isLogin ? 'Входим…' : 'Создаём аккаунт…')
            : (isLogin ? 'Войти' : 'Создать аккаунт')}
        </button>
      </form>

      <p className={switchDisplay === 'always' ? styles.switch : styles.switchMobile}>
        {isLogin ? 'Нет аккаунта? ' : 'Уже с нами? '}
        <button
          type="button"
          className={styles.switchLink}
          onClick={() => onSwitch?.(isLogin ? 'register' : 'login')}
        >
          {isLogin ? 'Создать' : 'Войти'}
        </button>
      </p>
    </>
  )
}

// Глаз: перечёркнут, когда пароль скрыт (open=false).
function EyeIcon({ open }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M2 10 s3-5 8-5 8 5 8 5 -3 5 -8 5 -8-5 -8-5 z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="10" cy="10" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.3" />
      {!open && <path d="M3 3 L17 17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />}
    </svg>
  )
}
