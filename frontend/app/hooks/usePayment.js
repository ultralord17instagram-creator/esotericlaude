'use client'

// Variant A — редирект на платёжную форму LeadPeak.
// Вызвать startPayment() при нажатии кнопки «Оформить подписку».
// Для Variant B (CloudPayments виджет) использовать CheckoutClient.jsx.
export function usePayment() {
  const startPayment = async () => {
    // Куки (access_token) отправляются браузером автоматически
    const res = await fetch('/api/v1/subscriptions/start', { method: 'POST' })

    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Ошибка создания платежа')

    window.location.href = data.redirect_url
  }

  return { startPayment }
}
