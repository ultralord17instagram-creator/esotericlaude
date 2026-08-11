import Link from 'next/link'
import { buildMetadata } from './seo.config'

// noindex, follow: 404 в индексе не нужна, но ссылки на живые разделы боту
// пройти стоит. Next дополнительно подставляет свой <meta name="robots"
// content="noindex"> при реальном ответе 404 — теги не противоречат друг другу,
// а без явного noindex страница унаследовала бы index,follow из root layout.
export const metadata = buildMetadata({
  title: '404: страница не найдена',
  description: 'Такой страницы нет. Вернитесь на главную и выберите сервис: матрица судьбы, нумерология, таро или гороскоп.',
  path: '/404',
  noindex: true,
})

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <h1>404 — Страница не найдена</h1>
      <p>Запрашиваемая страница не существует.</p>
      <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
        <Link href="/">На главную</Link>
        <Link href="/matrix">Матрица судьбы</Link>
        <Link href="/numerology">Нумерология</Link>
        <Link href="/tarot">Таро</Link>
        <Link href="/horoscope">Гороскоп</Link>
      </nav>
    </main>
  )
}
