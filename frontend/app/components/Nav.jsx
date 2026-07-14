'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { useAuthModal } from '../context/AuthModalContext'
import styles from './Nav.module.css'

export default function Nav() {
  const pathname = usePathname()
  const { user, loading } = useAuth()
  const { openAuth } = useAuthModal()

  if (pathname?.startsWith('/lp/')) return null

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <circle cx="12" cy="13" r="8.5" fill="none" stroke="#B9954F" strokeWidth="1.3"/>
            <circle cx="15.5" cy="11" r="8.5" fill="#EAE0CE"/>
            <path d="M18.7 15 l.7 1.9 1.9 .7 -1.9 .7 -.7 1.9 -.7 -1.9 -1.9 -.7 1.9 -.7 z" fill="#B9954F"/>
          </svg>
          Astrix
        </Link>
        <div className={styles.links}>
          {!loading && (
            user
              ? <Link href="/lk" className={styles.link}>Кабинет</Link>
              : <>
                  <button type="button" className={styles.link} onClick={() => openAuth('login')}>Войти</button>
                  <button type="button" className={styles.cta} onClick={() => openAuth('register')}><span>Попробовать</span></button>
                </>
          )}
        </div>
      </div>
    </nav>
  )
}
