import { NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL
const PS_URL = process.env.PS_URL
const PS_API_KEY = process.env.PS_API_KEY
const BACK_URL = process.env.NEXT_PUBLIC_PAYMENT_BACK_URL

// Используется только для Variant B (своя форма оплаты).
// 1. Создаёт PENDING подписку в AS через FastAPI → auth_subscription_id
// 2. Регистрирует подписку в PS → ps_sub_id (нужен CloudPayments виджету как invoiceId)
// Возвращает: { ps_sub_id, auth_sub_id }
export async function POST(req) {
  try {
    // Шаг 1: AS подписка через FastAPI (куки пользователя форвардятся)
    const startRes = await fetch(`${BACKEND_URL}/api/v1/subscriptions/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: req.headers.get('cookie') || '',
      },
    })

    const startData = await startRes.json()
    if (!startRes.ok) {
      return NextResponse.json(
        { error: startData.detail || 'Ошибка создания подписки' },
        { status: startRes.status },
      )
    }

    const authSubId = startData.subscription_id

    // Шаг 2: PS подписка (server-side — PS_API_KEY не светится клиенту)
    const psRes = await fetch(`${PS_URL}/api/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PS_API_KEY,
      },
      body: JSON.stringify({
        auth_subscription_id: authSubId,
        back_url: BACK_URL,
      }),
    })

    // 409 = подписка уже создана — получаем существующую
    let psSub
    if (psRes.status === 409) {
      const getRes = await fetch(`${PS_URL}/api/v1/subscriptions/${authSubId}`, {
        headers: { 'x-api-key': PS_API_KEY },
      })
      if (!getRes.ok) {
        return NextResponse.json({ error: 'Не удалось получить подписку' }, { status: 500 })
      }
      psSub = await getRes.json()
    } else if (!psRes.ok) {
      const err = await psRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: err.detail || err.error || 'Ошибка платёжного сервиса' },
        { status: psRes.status },
      )
    } else {
      psSub = await psRes.json()
    }

    return NextResponse.json({
      ps_sub_id: psSub.id,
      auth_sub_id: authSubId,
    })
  } catch {
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
