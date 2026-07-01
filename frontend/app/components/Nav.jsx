'use client'
import Link from 'next/link'
import { useAuth } from '../context/AuthContext'
import styles from './Nav.module.css'

export default function Nav() {
  const { user, loading } = useAuth()

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
                  <Link href="/login" className={styles.link}>Войти</Link>
                  <Link href="/register" className={styles.cta}><span>Попробовать</span></Link>
                </>
          )}
        </div>
      </div>
    </nav>
  )
}
