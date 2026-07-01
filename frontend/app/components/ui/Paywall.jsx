'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import Button from './Button'
import styles from './Paywall.module.css'

export default function Paywall() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <div className={styles.paywall}>
      <div className={styles.blur} aria-hidden />
      <div className={styles.box}>
        <span className={styles.accentBar} aria-hidden />
        <span className={styles.chip}>Подписка</span>
        <p className={styles.title}>Хочешь узнать полный расклад?</p>
        <p className={styles.sub}>Открой доступ ко всем продуктам за 9 ₽ на 3 дня</p>
        <Button size="lg" onClick={() => router.push(user ? '/lk' : '/register')}>
          {user ? 'Оформить подписку' : 'Попробовать за 9 ₽'}
        </Button>
        {!user && (
          <p className={styles.hint}>
            Уже есть аккаунт?{' '}
            <a href="/login">Войти</a>
          </p>
        )}
      </div>
    </div>
  )
}
