'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

// Оборачивает страницу, доступную только авторизованным пользователям.
// requireSubscription=true — дополнительно проверяет активную подписку.
export default function ProtectedRoute({ children, requireSubscription = false }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    if (requireSubscription && !user.subscribed) { router.replace('/lk') }
  }, [user, loading, requireSubscription, router])

  if (loading || !user) return null
  if (requireSubscription && !user.subscribed) return null

  return children
}
