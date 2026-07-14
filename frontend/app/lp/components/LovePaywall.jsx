'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import styles from '../lp.module.css'

const PAYOFFS = [
  'с каким числом партнёра твой сценарий обрывается',
  'как узнать его при первой встрече',
  'твой персональный прогноз по годам, когда всё может развернуться',
]

export default function LovePaywall({ slug }) {
  const { user } = useAuth()
  const router = useRouter()
  const { track } = useTracking()

  const onClick = () => {
    track('cta_click', { slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${slug}`) } catch {}
    router.push(user ? '/lk' : '/register')
  }

  return (
    <div className={styles.paywall}>
      <h2 className={styles.title}>Тебе осталось узнать самое важное</h2>
      <ul className={styles.payoffs}>
        {PAYOFFS.map((p) => <li key={p}>{p}</li>)}
      </ul>
      <p className={styles.subtitle}>
        Плюс полный разбор всех сфер жизни. Первые 7 дней бесплатно.
      </p>
      <button className={styles.cta} onClick={onClick}>Открыть полный разбор →</button>
      {!user && (
        <p className={styles.subtitle}>Уже оформили? <a href="/login">Войти</a></p>
      )}
    </div>
  )
}
