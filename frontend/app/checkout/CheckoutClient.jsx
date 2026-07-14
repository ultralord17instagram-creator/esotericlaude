'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { safeReturnPath } from '../lp/logic/returnPath.js'

const CP_PUBLIC_ID = process.env.NEXT_PUBLIC_CP_PUBLIC_ID
const OFFER_ID = process.env.NEXT_PUBLIC_OFFER_ID

// Загружает CloudPayments виджет один раз и резолвит промис когда готов
function loadCpWidget() {
  return new Promise((resolve) => {
    if (window.cp) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js'
    s.onload = resolve
    document.head.appendChild(s)
  })
}

export default function CheckoutClient() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [tariff, setTariff] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | paying | success | error
  const [errorMsg, setErrorMsg] = useState('')

  // Редирект на логин если не авторизован
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  // Загружаем тариф (цену) при монтировании
  useEffect(() => {
    if (authLoading || !user) return
    fetch('/api/v1/subscriptions/tariff')
      .then(r => r.json())
      .then(data => {
        if (data.detail) throw new Error(data.detail)
        setTariff(data)
        setStatus('ready')
      })
      .catch(e => {
        setErrorMsg(e.message)
        setStatus('error')
      })
  }, [authLoading, user])

  const handlePay = useCallback(async () => {
    setStatus('paying')
    setErrorMsg('')

    try {
      // 1. Создаём AS + PS подписку на сервере
      const res = await fetch('/api/payment/checkout-start', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ошибка инициализации платежа')

      // 2. Подгружаем CP виджет если ещё не загружен
      await loadCpWidget()

      const amount = tariff.first_amount ?? tariff.amount

      // 3. Открываем CP виджет
      const widget = new window.cp.CloudPayments()
      widget.charge(
        {
          publicId: CP_PUBLIC_ID,
          description: tariff.name || 'Подписка',
          amount,
          currency: 'RUB',
          accountId: user.id,
          invoiceId: data.ps_sub_id,
          email: user.email || undefined,
          data: { offer_id: OFFER_ID },
        },
        () => {
          // Успех
          setStatus('success')
          let dest = '/lk'
          try {
            const safe = safeReturnPath(localStorage.getItem('post_checkout_return'))
            if (safe) { dest = safe; localStorage.removeItem('post_checkout_return') }
          } catch {}
          setTimeout(() => router.push(dest), 1500)
        },
        (reason) => {
          // Ошибка / отмена
          setErrorMsg(reason || 'Платёж не завершён')
          setStatus('ready')
        },
      )
    } catch (e) {
      setErrorMsg(e.message)
      setStatus('ready')
    }
  }, [tariff, user, router])

  // ──── Рендер ────────────────────────────────────────────────────

  if (authLoading || (!user && status === 'loading')) {
    return <CheckoutLayout><Spinner text="Загрузка..." /></CheckoutLayout>
  }

  if (status === 'loading') {
    return <CheckoutLayout><Spinner text="Получаем тариф..." /></CheckoutLayout>
  }

  if (status === 'success') {
    return (
      <CheckoutLayout>
        <p style={{ color: '#16A34A', textAlign: 'center' }}>✓ Оплата прошла! Переадресация...</p>
      </CheckoutLayout>
    )
  }

  const displayAmount = tariff ? (tariff.first_amount ?? tariff.amount) : null

  return (
    <CheckoutLayout>
      {displayAmount !== null && (
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 800 }}>
            {Number(displayAmount).toLocaleString('ru-RU')} ₽
          </span>
          {tariff?.first_days && (
            <p style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              за первые {tariff.first_days} дней, затем {Number(tariff.amount).toLocaleString('ru-RU')} ₽ / {tariff.days} дней
            </p>
          )}
        </div>
      )}

      {errorMsg && (
        <p role="alert" style={{ color: '#DC2626', fontSize: 13, marginBottom: 12 }}>
          {errorMsg}
        </p>
      )}

      <button
        onClick={handlePay}
        disabled={status === 'paying' || !tariff}
        style={{ width: '100%', padding: '14px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
      >
        {status === 'paying' ? 'Открываем форму оплаты...' : 'Оплатить'}
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16, fontSize: 11, color: '#9CA3AF' }}>
        <span>SSL</span>
        <span>PCI DSS</span>
        <span>3D Secure</span>
      </div>

      <p style={{ textAlign: 'center', fontSize: 10, color: '#D1D5DB', marginTop: 12 }}>
        Платежи обрабатываются через CloudPayments
      </p>
    </CheckoutLayout>
  )
}

function CheckoutLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: 24, fontSize: 18, fontWeight: 700 }}>
          Оформление подписки
        </h1>
        {children}
      </div>
    </div>
  )
}

function Spinner({ text }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{
        width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#6B7280',
        borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 10px',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ fontSize: 13, color: '#9CA3AF' }}>{text}</p>
    </div>
  )
}
