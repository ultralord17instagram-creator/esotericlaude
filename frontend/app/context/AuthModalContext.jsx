'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import AuthModal from '../components/auth/AuthModal'

// Глобальная модалка входа/регистрации. openAuth('login'|'register') открывает
// её из любого места (шапка). Роуты /login и /register остаются как страницы.
const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [state, setState] = useState({ open: false, mode: 'login' })

  const openAuth = useCallback((mode = 'login') => setState({ open: true, mode }), [])
  const closeAuth = useCallback(() => setState((s) => ({ ...s, open: false })), [])

  return (
    <AuthModalContext.Provider value={{ openAuth, closeAuth }}>
      {children}
      {state.open && <AuthModal initialMode={state.mode} onClose={closeAuth} />}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext)
  if (!ctx) throw new Error('useAuthModal must be used within AuthModalProvider')
  return ctx
}
