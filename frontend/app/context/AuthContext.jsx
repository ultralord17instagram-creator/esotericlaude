'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

// Хранит только отображаемые данные (не токены).
// Токены — HttpOnly cookies, выставляются FastAPI-бэкендом.
const USER_KEY = 'offer_user_info'

function _saveUserInfo(id, email) {
  try { localStorage.setItem(USER_KEY, JSON.stringify({ id, email })) } catch {}
}

function _loadUserInfo() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

function _clearUserInfo() {
  try { localStorage.removeItem(USER_KEY) } catch {}
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Применяет данные из /api/v1/subscriptions/me, дополняя сохранёнными email/id.
  // status ACTIVE или CANCELLED означает "доступ есть" (CANCELLED — до access_until).
  const _applySubData = useCallback((subData) => {
    const stored = _loadUserInfo()
    setUser({
      id: stored?.id || null,
      email: stored?.email || null,
      subscribed: subData.status === 'ACTIVE' || subData.status === 'CANCELLED',
      subscribed_until: subData.access_until || null,
    })
  }, [])

  const fetchMe = useCallback(async () => {
    try {
      // Куки отправляются браузером автоматически (same-origin через nginx)
      const res = await fetch('/api/v1/subscriptions/me')

      if (res.status === 401) {
        // Пробуем refresh — FastAPI читает refresh_token из cookie
        const refreshRes = await fetch('/api/v1/auth/refresh', { method: 'POST' })
        if (!refreshRes.ok) {
          _clearUserInfo()
          setUser(null)
          setLoading(false)
          return
        }
        // Новые куки выставлены — повторяем
        const retry = await fetch('/api/v1/subscriptions/me')
        if (!retry.ok) {
          _clearUserInfo()
          setUser(null)
          setLoading(false)
          return
        }
        const retryData = await retry.json()
        _applySubData(retryData)
        setLoading(false)
        return
      }

      if (res.status === 403) {
        // Авторизован, но нет активной подписки
        const stored = _loadUserInfo()
        if (stored) {
          setUser({ ...stored, subscribed: false, subscribed_until: null })
        } else {
          setUser(null)
        }
        setLoading(false)
        return
      }

      if (!res.ok) {
        _clearUserInfo()
        setUser(null)
        setLoading(false)
        return
      }

      const data = await res.json()
      _applySubData(data)
    } catch {
      // Сеть недоступна — не сбрасываем сессию
    } finally {
      setLoading(false)
    }
  }, [_applySubData])

  useEffect(() => { fetchMe() }, [fetchMe])

  const register = async ({ email, password, refCode }) => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, referral_code: refCode || null }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Ошибка регистрации')
    // FastAPI выставил HttpOnly cookies; сохраняем только отображаемые данные
    _saveUserInfo(data.user_id, email)
    setUser({ id: data.user_id, email, subscribed: false, subscribed_until: null })
    return data
  }

  const login = async ({ email, password }) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Неверный email или пароль')
    _saveUserInfo(data.user_id, email)
    // Сразу проверяем статус подписки через fetchMe
    await fetchMe()
    return data
  }

  const logout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
    } catch {}
    _clearUserInfo()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, refetchUser: fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
