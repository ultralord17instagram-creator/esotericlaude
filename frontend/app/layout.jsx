import { Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import { AuthModalProvider } from './context/AuthModalContext'
import './styles/theme.css'
import localFont from 'next/font/local'

// Self-hosted variable fonts (full Unicode incl. Cyrillic) — no build-time
// Google Fonts fetch, so compilation works without external connectivity.
const serif = localFont({
  src: [
    { path: './fonts/SourceSerif4.ttf', weight: '200 900', style: 'normal' },
    { path: './fonts/SourceSerif4-Italic.ttf', weight: '200 900', style: 'italic' },
  ],
  variable: '--font-serif',
  display: 'swap',
})
const sans = localFont({
  src: [
    { path: './fonts/GolosText.ttf', weight: '400 900', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
})
// IBM Plex Mono (self-hosted, полная кириллица) — моно-лейблы лендинга him,
// один в один с прототипом. Instrument Serif / Hanken Grotesk кириллицу не
// покрывают, поэтому их не тянем.
const mono = localFont({
  src: [
    { path: './fonts/IBMPlexMono-Regular.ttf', weight: '400', style: 'normal' },
    { path: './fonts/IBMPlexMono-Medium.ttf', weight: '500', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
})
// Шрифты космо-темы лендинга him (аналоги макета с полной кириллицей):
// Playfair Display вместо Instrument Serif, Manrope вместо Hanken Grotesk.
// Переменные подключены глобально, но применяются только внутри .cosmic.
const cosmicSerif = localFont({
  src: [
    { path: './fonts/PlayfairDisplay.ttf', weight: '400 900', style: 'normal' },
    { path: './fonts/PlayfairDisplay-Italic.ttf', weight: '400 900', style: 'italic' },
  ],
  variable: '--font-cosmic-serif',
  display: 'swap',
})
const cosmicSans = localFont({
  src: [
    { path: './fonts/Manrope.ttf', weight: '200 800', style: 'normal' },
  ],
  variable: '--font-cosmic-sans',
  display: 'swap',
})
// Шрифты лендинга «Таро Терминал» (тема terminal, тёплый CRT). Self-hosted
// вариативные TTF с полной кириллицей (проверено по cmap). Handjet — пиксельный
// дисплейный заголовок, JetBrains Mono — статус-строки. Переменные подключены
// глобально, применяются только внутри .root терминала.
const handjet = localFont({
  src: [{ path: './fonts/Handjet.ttf', weight: '100 900', style: 'normal' }],
  variable: '--font-handjet',
  display: 'swap',
})
const jetMono = localFont({
  src: [{ path: './fonts/JetBrainsMono.ttf', weight: '100 800', style: 'normal' }],
  variable: '--font-jetmono',
  display: 'swap',
})
// Шрифт лендинга «Astrix Love» (движок horo-love, тема astrix). Self-hosted
// вариативный TTF с полной кириллицей (проверено по cmap: 98 кодпоинтов U+04xx).
// Unbounded — дисплейные заголовки, кикеры и кнопки. Переменная подключена
// глобально, применяется только внутри .root лендинга.
const unbounded = localFont({
  src: [{ path: './fonts/Unbounded.ttf', weight: '200 900', style: 'normal' }],
  variable: '--font-unbounded',
  display: 'swap',
})
// Шрифт лендинга «Проверка на порчу» (движок diagnostic, тема porcha). Oswald —
// узкий дисплейный гротеск для кнопок/лейблов/процентов (uppercase). Self-hosted
// вариативный TTF с полной кириллицей (проверено по cmap: 222 глифа U+04xx).
// Роль Cormorant Garamond из макета (курсивные акценты) закрывает Playfair Italic
// (--font-cosmic-serif), т.к. Cormorant кириллицу не покрывает.
const oswald = localFont({
  src: [{ path: './fonts/Oswald.ttf', weight: '200 700', style: 'normal' }],
  variable: '--font-oswald',
  display: 'swap',
})
import RefTracker from './components/RefTracker'
import AffiliateTracker from './components/AffiliateTracker'
import Nav from './components/Nav'
import Footer from './components/Footer'
import JsonLd from './components/JsonLd'
import {
  SITE_URL, SITE_NAME, LOCALE, DEFAULT_TITLE, TITLE_TEMPLATE, DEFAULT_DESCRIPTION,
  OG_IMAGE, VERIFICATION, organizationSchema, webSiteSchema,
} from './seo.config'

// Дефолты для всего сайта. Страницы переопределяют их через buildMetadata():
// title подставляется в шаблон, description/openGraph/twitter перезаписываются
// целиком, а всё, что страница не тронула (icons, verification, metadataBase),
// наследуется отсюда.
export const metadata = {
  // Базовый URL, относительно которого Next разворачивает canonical и og:image
  // в абсолютные ссылки. Без него Next кидает предупреждение и подставляет
  // localhost, что ломает превью в соцсетях.
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: TITLE_TEMPLATE,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  referrer: 'origin-when-cross-origin',
  // Отключаем автолинковку телефонов/адресов в Safari: она портит вёрстку
  // и подсовывает в разметку служебные <a>.
  formatDetection: { telephone: false, address: false, email: false },
  // alternates.canonical здесь НЕ задаём. Метаданные в App Router наследуются,
  // и canonical '/' протёк бы на каждую страницу, которая не переопределила
  // его явно (например на noindex-страницы вроде /login), объявляя их копией
  // главной. Canonical выдаёт buildMetadata() индивидуально для каждой страницы.
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: LOCALE,
    url: `${SITE_URL}/`,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    // SVG — основная иконка (масштабируется без потерь), PNG 180x180 нужен
    // отдельно: iOS не умеет SVG в apple-touch-icon.
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: ['/icon.svg'],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/manifest.webmanifest',
  verification: VERIFICATION,
}

// В Next 14 themeColor и viewport вынесены из metadata в отдельный экспорт:
// в metadata они игнорируются и роняют предупреждение при сборке.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EAE0CE' },
    { media: '(prefers-color-scheme: dark)', color: '#1B1A30' },
  ],
  colorScheme: 'light',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${serif.variable} ${sans.variable} ${mono.variable} ${cosmicSerif.variable} ${cosmicSans.variable} ${handjet.variable} ${jetMono.variable} ${unbounded.variable} ${oswald.variable}`}>
      {/* suppressHydrationWarning: расширения браузера (менеджеры паролей,
          Grammarly и т.п.) добавляют атрибуты на body — гасим рассинхрон. */}
      <body suppressHydrationWarning>
        {/* Общесайтовая разметка Schema.org: издатель + сам сайт.
            Страницы добавляют к ней свои BreadcrumbList/Service. */}
        <JsonLd data={[organizationSchema(), webSiteSchema()]} />
        <AuthProvider>
          <AuthModalProvider>
            {/* RefTracker и AffiliateTracker нужны в Suspense из-за useSearchParams */}
            <Suspense fallback={null}>
              <RefTracker />
              <AffiliateTracker />
            </Suspense>
            <Nav />
            {children}
            <Footer />
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
