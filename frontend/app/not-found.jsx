import Link from 'next/link'

export const metadata = {
  title: '404 — Страница не найдена',
  robots: { index: false },
}

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <h1>404 — Страница не найдена</h1>
      <p>Запрашиваемая страница не существует.</p>
      <Link href="/">На главную</Link>
    </main>
  )
}
