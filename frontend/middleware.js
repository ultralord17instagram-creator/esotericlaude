import { NextResponse } from 'next/server'

export function middleware(req) {
  const { pathname } = req.nextUrl

  // Режим техработ: кука выставляется через /api/admin/maintenance
  const maintenance = req.cookies.get('maintenance_mode')?.value === 'true'
  if (
    maintenance &&
    !pathname.startsWith('/maintenance') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next')
  ) {
    return NextResponse.redirect(new URL('/maintenance', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
