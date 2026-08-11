// ═══════════════════════════════════════════════════════════════════════════════
// seo.config.js — единая точка правды по SEO.
//
// Здесь живут канонический домен, дефолтные тексты, OG-картинка и хелперы,
// которыми пользуются все page.jsx, layout.jsx, sitemap.js и robots.js.
// Правило: ни одна страница не собирает объект metadata руками — только через
// buildMetadata(), иначе неизбежно разъедутся canonical и og:url.
//
// ДОМЕН. Берётся из NEXT_PUBLIC_SITE_URL. Переменная NEXT_PUBLIC_*, поэтому
// вшивается в бандл на этапе сборки: в Docker её нужно передать build-аргументом
// (см. frontend/Dockerfile и docker-compose.prod.yml), задать её только в runtime
// недостаточно. Дефолт ниже — заглушка на время, пока домен не куплен.
// ═══════════════════════════════════════════════════════════════════════════════

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://astrix.ru').replace(/\/+$/, '')
export const SITE_NAME = 'Astrix'
export const LOCALE = 'ru_RU'

export const DEFAULT_TITLE = 'Astrix — матрица судьбы, нумерология, таро и гороскоп'
// Шаблон для дочерних страниц: title страницы + бренд.
export const TITLE_TEMPLATE = '%s · Astrix'
export const DEFAULT_DESCRIPTION =
  'Матрица судьбы, нумерология, расклады Таро и гороскоп в одном месте. Попробуйте любой сервис бесплатно, полный разбор открывается по подписке.'

// Статичная OG-картинка. Файл кладётся в frontend/public/og.png (1200x630).
// Пока файла нет, соцсети просто покажут превью без изображения: битой ссылки
// не будет, потому что тег отдаётся вместе с размерами и легко заменяется.
export const OG_IMAGE = {
  url: '/og.png',
  width: 1200,
  height: 630,
  alt: 'Astrix: матрица судьбы, нумерология, таро и гороскоп',
}

// Коды подтверждения прав в вебмастерах. Пусто — тег просто не выводится.
export const VERIFICATION = {
  yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
  google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
}

/** Абсолютный URL из внутреннего пути: absoluteUrl('/tarot') -> https://site/tarot */
export function absoluteUrl(path = '/') {
  if (!path || path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Собирает объект metadata для страницы.
 *
 * @param {string}  [title]        title страницы без бренда (шаблон добавит «· Astrix»)
 * @param {boolean} [absoluteTitle] не применять шаблон бренда к title
 * @param {string}  [description]  meta description, он же og:description
 * @param {string}  path           внутренний путь страницы, например '/tarot/day'
 * @param {boolean} [noindex]      true -> noindex,nofollow и без canonical
 * @param {boolean} [nofollow]     явное управление follow при noindex=false
 * @param {string}  [ogType]       'website' (по умолчанию) | 'article' | 'profile'
 * @param {object}  [image]        переопределение OG-картинки
 */
export function buildMetadata({
  title,
  absoluteTitle = false,
  description = DEFAULT_DESCRIPTION,
  path = '/',
  noindex = false,
  nofollow = false,
  ogType = 'website',
  image = OG_IMAGE,
} = {}) {
  const url = absoluteUrl(path)
  // Полный title (с брендом) нужен для og:title и twitter:title: шаблон из
  // layout применяется только к <title>, метатеги соцсетей его не получают.
  const fullTitle = !title
    ? DEFAULT_TITLE
    : absoluteTitle ? title : TITLE_TEMPLATE.replace('%s', title)

  const meta = {
    description,
    openGraph: {
      type: ogType,
      siteName: SITE_NAME,
      locale: LOCALE,
      url,
      title: fullTitle,
      description,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image.url],
    },
  }

  // { absolute } отключает шаблон бренда из root layout для этой страницы.
  if (title) meta.title = absoluteTitle ? { absolute: title } : title

  if (noindex) {
    // Canonical на noindex-странице шлёт поисковику противоречивый сигнал,
    // поэтому здесь его не выводим (рекомендация Google).
    meta.robots = { index: false, follow: !nofollow, googleBot: { index: false, follow: !nofollow } }
  } else {
    meta.alternates = { canonical: url }
    meta.robots = {
      index: true,
      follow: !nofollow,
      googleBot: {
        index: true,
        follow: !nofollow,
        // Разрешаем максимальные сниппеты и превью: без этого Google
        // консервативно режет длину описания и размер картинки.
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    }
  }

  return meta
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────
// Разметка Schema.org. Отдаётся в <script type="application/ld+json"> через
// компонент components/JsonLd.jsx.

/** Организация-издатель. Выводится один раз в root layout. */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/icon.svg'),
    },
    description: DEFAULT_DESCRIPTION,
  }
}

/** Сайт целиком. Связан с организацией через publisher/@id. */
export function webSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'ru-RU',
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

/**
 * Хлебные крошки.
 * @param {Array<{name: string, path: string}>} items — от корня к текущей странице
 */
export function breadcrumbSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  }
}

/**
 * Сервис (матрица, нумерология, таро, гороскоп).
 * @param {string} name
 * @param {string} description
 * @param {string} path
 */
export function serviceSchema({ name, description, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    url: absoluteUrl(path),
    serviceType: 'Эзотерический разбор',
    provider: { '@id': `${SITE_URL}/#organization` },
    areaServed: 'RU',
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: absoluteUrl(path),
      availableLanguage: { '@type': 'Language', name: 'Russian', alternateName: 'ru' },
    },
  }
}
