'use client'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import styles from './Nav.module.css'

export default function Nav() {
  const { user, loading } = useAuth()

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          Эзотерика
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
