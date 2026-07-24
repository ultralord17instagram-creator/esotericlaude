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

// subscribeHref — необязательный override пути по кнопке CTA. По умолчанию
// (на продуктовых страницах) залогиненного ведём в /lk, гостя — на регистрацию.
// Post-registration пейволл (/subscribe) передаёт '/checkout', чтобы сразу вести
// на оплату и сохранить возврат на лендинг (post_checkout_return читает /checkout).
export default function Paywall({ subscribeHref }) {
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
        Он раскрывает полные разборы во всех сервисах.
      </p>

      <div className={styles.plan}>
        <div className={styles.planHead}>
          <div className={styles.price}>
            <span className={styles.priceNum}>7 ₽</span>
          </div>
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

      <button className={styles.cta} onClick={() => router.push(subscribeHref ?? (user ? '/lk' : '/register'))}>
        Оформить <span aria-hidden>→</span>
      </button>
      <p className={styles.fine}>Отмена в любой момент · без скрытых платежей</p>
      {!user && (
        <p className={styles.secondary}>Уже оформили? <a href="/login">Войти</a></p>
      )}
    </div>
  )
}
