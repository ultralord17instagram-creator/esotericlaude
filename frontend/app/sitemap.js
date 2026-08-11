import { LANDINGS } from './content/landings/index.js'
import { absoluteUrl } from './seo.config'

// Отдаётся по /sitemap.xml (файловая конвенция App Router).
//
// Сюда попадают ТОЛЬКО индексируемые страницы. Всё, что помечено noindex
// (/login, /register, /subscribe, /checkout, /lk, /admin, /maintenance, 404),
// в карту не входит: расхождение «в sitemap, но noindex» поисковики трактуют
// как ошибку разметки.
//
// priority — относительный вес внутри сайта, а не обещание позиции.
// changeFrequency — подсказка, а не гарантия; ставим честные значения.

const STATIC_ROUTES = [
  { path: '/',                          priority: 1.0, changeFrequency: 'weekly'  },
  { path: '/matrix',                    priority: 0.9, changeFrequency: 'monthly' },
  { path: '/numerology',                priority: 0.9, changeFrequency: 'monthly' },
  { path: '/numerology/breakdown',      priority: 0.7, changeFrequency: 'monthly' },
  { path: '/numerology/compatibility',  priority: 0.7, changeFrequency: 'monthly' },
  { path: '/numerology/forecast',       priority: 0.7, changeFrequency: 'daily'   },
  { path: '/tarot',                     priority: 0.9, changeFrequency: 'monthly' },
  { path: '/tarot/day',                 priority: 0.8, changeFrequency: 'daily'   },
  { path: '/tarot/three',               priority: 0.7, changeFrequency: 'monthly' },
  { path: '/tarot/yesno',               priority: 0.7, changeFrequency: 'monthly' },
  { path: '/horoscope',                 priority: 0.9, changeFrequency: 'daily'   },
  { path: '/offer',                     priority: 0.3, changeFrequency: 'yearly'  },
  { path: '/terms',                     priority: 0.3, changeFrequency: 'yearly'  },
  { path: '/privacy',                   priority: 0.3, changeFrequency: 'yearly'  },
  { path: '/tariff',                    priority: 0.4, changeFrequency: 'monthly' },
  { path: '/cancel',                    priority: 0.4, changeFrequency: 'yearly'  },
  { path: '/info',                      priority: 0.3, changeFrequency: 'yearly'  },
]

export default function sitemap() {
  // Один и тот же момент сборки для всех записей: разнобой в lastModified
  // без реальных правок контента только сбивает краулер.
  const lastModified = new Date()

  const landingRoutes = Object.keys(LANDINGS).map((slug) => ({
    path: `/lp/${slug}`,
    priority: 0.6,
    changeFrequency: 'monthly',
  }))

  return [...STATIC_ROUTES, ...landingRoutes].map((r) => ({
    url: absoluteUrl(r.path),
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
