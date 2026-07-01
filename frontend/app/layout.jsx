import { Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
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
import RefTracker from './components/RefTracker'
import AffiliateTracker from './components/AffiliateTracker'
import Nav from './components/Nav'

export const metadata = {
  // Переопределяется на каждой странице через generateMetadata или export metadata
  title: 'Offer Name',
  description: 'Описание оффера',
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <AuthProvider>
          {/* RefTracker и AffiliateTracker нужны в Suspense из-за useSearchParams */}
          <Suspense fallback={null}>
            <RefTracker />
            <AffiliateTracker />
          </Suspense>
          <Nav />
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
