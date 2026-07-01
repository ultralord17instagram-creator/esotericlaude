export const metadata = {
  title: 'Технические работы',
  robots: { index: false, follow: false },
}

export default function MaintenancePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <h1>Технические работы</h1>
      <p>Сайт временно недоступен. Мы скоро вернёмся.</p>
    </main>
  )
}
