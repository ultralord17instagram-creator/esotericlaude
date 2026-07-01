import { NextResponse } from 'next/server'

export async function GET(req) {
  const adminKey = req.headers.get('x-admin-key')
  if (!adminKey || adminKey !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const cookie = req.cookies.get('maintenance_mode')
  return NextResponse.json({ maintenance: cookie?.value === 'true' })
}

export async function POST(req) {
  const adminKey = req.headers.get('x-admin-key')
  if (!adminKey || adminKey !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { enabled } = await req.json()
    const res = NextResponse.json({ maintenance: !!enabled })
    if (enabled) {
      res.cookies.set('maintenance_mode', 'true', { path: '/', httpOnly: true, sameSite: 'lax' })
    } else {
      res.cookies.delete('maintenance_mode')
    }
    return res
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
