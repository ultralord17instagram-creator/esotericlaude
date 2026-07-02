'use client'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import styles from './Paywall.module.css'

const FEATURES = [
  'Полные разборы во всех сервисах',
  'Матрица, Таро, гороскоп и нумерология',
  'Новые расклады каждую неделю',
  'Без рекламы и ограничений',
]

export default function Paywall() {
  const { user } = useAuth()
  const router = useRouter()

  return (
    <div className={styles.box}>
      <svg className={styles.constellation} viewBox="0 0 300 160" fill="none" aria-hidden>
        <path d="M40 60 L110 34 L172 66 L240 40 L286 78" stroke="currentColor" strokeWidth="1" opacity="0.34" />
        <circle className={styles.twinkle} cx="40" cy="60" r="2" fill="currentColor" />
        <circle cx="110" cy="34" r="2.6" fill="currentColor" />
        <circle className={styles.twinkle} cx="172" cy="66" r="1.7" fill="currentColor" />
        <circle cx="240" cy="40" r="2.2" fill="currentColor" />
        <circle className={styles.twinkle} cx="286" cy="78" r="1.6" fill="currentColor" />
        <path d="M150 104 l1.8 4.8 4.8 1.8 -4.8 1.8 -1.8 4.8 -1.8 -4.8 -4.8 -1.8 4.8 -1.8 z" fill="currentColor" opacity="0.75" />
      </svg>

      <div className={styles.eyebrow}>Подписка Astrix</div>
      <h2 className={styles.title}>Открой полный доступ</h2>
      <p className={styles.sub}>
        Демо — только начало. Подписка раскрывает полные разборы во всех сервисах и обновляется каждую неделю.
      </p>

      <div className={styles.plan}>
        <div className={styles.planHead}>
          <div className={styles.price}>
            <span className={styles.priceNum}>399 ₽</span>
            <span className={styles.priceUnit}>/ мес</span>
          </div>
          <span className={styles.trial}>7 дней бесплатно</span>
        </div>
        <div className={styles.planDivider} />
        <ul className={styles.features}>
          {FEATURES.map(f => (
            <li key={f} className={styles.feature}>
              <svg className={styles.check} viewBox="0 0 18 18" aria-hidden>
                <circle cx="9" cy="9" r="9" fill="currentColor" fillOpacity="0.14" />
                <path d="M5 9.2 l2.6 2.6 5.2-5.7" fill="none" stroke="currentColor" strokeWidth="1.7" />
              </svg>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>

      <button className={styles.cta} onClick={() => router.push(user ? '/lk' : '/register')}>
        Оформить подписку <span aria-hidden>→</span>
      </button>
      <p className={styles.fine}>Отмена в любой момент · без скрытых платежей</p>
      {!user && (
        <p className={styles.secondary}>Уже оформили? <a href="/login">Войти</a></p>
      )}
    </div>
  )
}
