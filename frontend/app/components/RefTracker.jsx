'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTracking } from '../hooks/useTracking'

const TTL_DAYS = parseInt(process.env.NEXT_PUBLIC_REF_TTL_DAYS || '2', 10)

// Считывает ?ref=CODE из URL, сохраняет в localStorage с TTL,
// отправляет TS click событие. Монтировать в layout.jsx внутри <Suspense>.
export default function RefTracker() {
  const params = useSearchParams()
  const { track } = useTracking()

  useEffect(() => {
    // Чистим просроченный код
    const exp = Number(localStorage.getItem('offer_ref_expires') || 0)
    if (exp && Date.now() > exp) {
      localStorage.removeItem('offer_ref_code')
      localStorage.removeItem('offer_ref_expires')
    }

    const ref = params.get('ref')
    if (!ref) return

    const expires = Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem('offer_ref_code', ref)
    localStorage.setItem('offer_ref_expires', String(expires))

    track('click', { referral_code: ref })
  }, [params, track])

  return null
}
