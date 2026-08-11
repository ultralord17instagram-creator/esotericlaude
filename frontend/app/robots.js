import { SITE_URL } from './seo.config'

// Отдаётся по /robots.txt (файловая конвенция App Router).
//
// Важно: в Disallow попадает только то, что боту вообще незачем скачивать —
// админка, API и приватные разделы. Страницы вида /login, /register, /subscribe
// здесь НЕ закрыты специально: они помечены noindex в своих metadata, а чтобы
// бот этот noindex увидел, страницу нужно разрешить к обходу. Закрыть в
// robots.txt и одновременно поставить noindex — классическая ошибка: URL
// остаётся в индексе «без описания», потому что тег никто не прочитал.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',      // панель администратора
          '/api/',       // роут-хендлеры Next и прокси к бэкенду
          '/lk',         // личный кабинет
          '/checkout',   // оформление подписки
          '/maintenance',// заглушка техработ
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
