'use client'
import { useEffect } from 'react'
import { useTracking } from '../hooks/useTracking'

// Отправляет TS host событие один раз за сессию.
// Монтировать в layout.jsx.
export default function AffiliateTracker() {
  const { track } = useTracking()

  useEffect(() => {
    if (sessionStorage.getItem('host_tracked')) return
    track('host', { url: window.location.href })
    sessionStorage.setItem('host_tracked', '1')
  }, [track])

  return null
}
