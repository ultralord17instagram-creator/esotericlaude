'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { useTracking } from '../../hooks/useTracking'
import styles from '../lp.module.css'

export default function Paywall({ slug, heading, payoffs, onRestart }) {
  const { user } = useAuth()
  const router = useRouter()
  const { track } = useTracking()

  const onClick = () => {
    track('cta_click', { slug })
    try { localStorage.setItem('post_checkout_return', `/lp/${slug}`) } catch {}
    router.push(user ? '/lk' : '/register')
  }

  return (
    <div className={`${styles.paywall} ${styles.paywallGrid}`}>
      <div>
        <div className={styles.eyebrow}>Полный разбор</div>
        <h2 className={styles.h2} style={{ marginTop: 12 }}>{heading}</h2>
        <ul className={styles.payoffs} style={{ marginTop: 24 }}>
          {payoffs.map((p) => (
            <li key={p} className={styles.payoffRow}>
              <span className={styles.payoffMark}>✦</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.priceCard}>
        <div className={styles.priceCardLabel}>Доступ к полному разбору</div>
        <div className={styles.priceRow}>
          <span className={styles.price}>7 дней</span>
        </div>
        <div className={styles.priceNote}>Бесплатно, дальше по подписке. Отмена в любой момент.</div>
        <button className={`${styles.cta} ${styles.ctaFull}`} onClick={onClick}>
          Открыть полный разбор →
        </button>
        <div className={styles.priceSecure}>🔒 Безопасно · доступ сразу после оформления</div>
        {!user && (
          <p className={styles.loginNote}>Уже оформили? <a href="/login">Войти</a></p>
        )}
      </div>

      {onRestart && (
        <button className={`${styles.linkBtn} ${styles.restart}`} onClick={onRestart}>
          ← пройти заново
        </button>
      )}
    </div>
  )
}
