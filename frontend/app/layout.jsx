import { Suspense } from 'react'
import { AuthProvider } from './context/AuthContext'
import './styles/theme.css'
import { Cinzel, Inter } from 'next/font/google'

const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-cinzel' })
const inter = Inter({ subsets: ['latin', 'cyrillic'], weight: ['300', '400', '500', '600'], variable: '--font-inter' })
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
    <html lang="ru" className={`${cinzel.variable} ${inter.variable}`}>
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
