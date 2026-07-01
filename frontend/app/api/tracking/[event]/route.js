import { NextResponse } from 'next/server'

const TS_URL = process.env.TS_URL
const TS_API_KEY = process.env.TS_API_KEY
const OFFER_ID = process.env.NEXT_PUBLIC_OFFER_ID

export async function POST(req, { params }) {
  const { event } = params
  try {
    const body = await req.json()
    // Fire-and-forget — не ждём ответа TS
    fetch(`${TS_URL}/tracking/api/v1/tracking/${event}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': TS_API_KEY,
      },
      body: JSON.stringify({ offer_id: OFFER_ID, ...body }),
    }).catch(() => {})
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // всегда 200, клиент не ждёт
  }
}
