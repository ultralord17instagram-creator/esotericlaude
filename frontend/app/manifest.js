import { SITE_NAME, DEFAULT_DESCRIPTION } from './seo.config'

// Отдаётся по /manifest.webmanifest. Нужен для установки как PWA и для
// корректного превью при добавлении сайта на домашний экран.
export default function manifest() {
  return {
    name: `${SITE_NAME}: матрица судьбы, таро и гороскоп`,
    short_name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    lang: 'ru',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#EAE0CE',
    theme_color: '#1B1A30',
    categories: ['lifestyle', 'entertainment'],
    icons: [
      { src: '/icon.svg',     sizes: 'any',     type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
