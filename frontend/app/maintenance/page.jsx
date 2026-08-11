import { buildMetadata } from '../seo.config'

// noindex, nofollow — заглушка техработ. Также закрыта в robots.txt.
export const metadata = buildMetadata({
  title: 'Технические работы',
  description: 'Сайт временно недоступен, мы скоро вернёмся.',
  path: '/maintenance',
  noindex: true,
  nofollow: true,
})

export default function MaintenancePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <h1>Технические работы</h1>
      <p>Сайт временно недоступен. Мы скоро вернёмся.</p>
    </main>
  )
}
