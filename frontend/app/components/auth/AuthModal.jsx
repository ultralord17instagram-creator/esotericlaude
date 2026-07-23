'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StarField from './StarField'
import AuthForm from './AuthForm'
import styles from './authModal.module.css'

// Модалка/bottom-sheet для быстрого входа из шапки. Внутренний переключатель
// Вход/Регистрация; форма — общий AuthForm. Закрывается по Esc, скриму и крестику.
export default function AuthModal({ initialMode = 'login', onClose }) {
  const router = useRouter()
  const [mode, setMode] = useState(initialMode)
  const isLogin = mode === 'login'

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div
      className={styles.scrim}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Вход и регистрация"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <aside className={styles.side}>
          <StarField className={styles.sideStars} />
          <div className={styles.sideLogo}>
            <AstrixMark />
            <span className={styles.sideLogoText}>Astrix</span>
          </div>
          <div className={styles.sideHead}>
            <h2 className={styles.sideTitle}>Небо уже сверило ваш день</h2>
            <p className={styles.sideSub}>Продолжите там, где остановились.</p>
          </div>
        </aside>

        <div className={styles.body}>
          <button className={styles.close} onClick={onClose} aria-label="Закрыть">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <div className={styles.handle} aria-hidden="true"><span /></div>

          <div className={styles.segment} role="tablist" aria-label="Вход или регистрация">
            <button
              type="button" role="tab" aria-selected={isLogin}
              className={isLogin ? `${styles.segBtn} ${styles.segBtnOn}` : styles.segBtn}
              onClick={() => setMode('login')}
            >Вход</button>
            <button
              type="button" role="tab" aria-selected={!isLogin}
              className={!isLogin ? `${styles.segBtn} ${styles.segBtnOn}` : styles.segBtn}
              onClick={() => setMode('register')}
            >Регистрация</button>
          </div>

          <div className={styles.head}>
            <h1 className={styles.title}>{isLogin ? 'С возвращением' : 'Создайте аккаунт'}</h1>
            <p className={styles.sub}>
              {isLogin ? 'Войдите, чтобы открыть свой день.' : 'Пара шагов, и ваша карта звёзд с вами.'}
            </p>
          </div>

          <AuthForm
            mode={mode}
            switchDisplay="always"
            onSwitch={setMode}
            onSuccess={() => { onClose(); router.push('/lk') }}
          />
        </div>
      </div>
    </div>
  )
}

function AstrixMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="12" cy="13" r="8.5" fill="none" stroke="#B9954F" strokeWidth="1.3" />
      <circle cx="15.5" cy="11" r="8.5" fill="#1B1A30" />
      <path d="M18.7 15 l.7 1.9 1.9 .7 -1.9 .7 -.7 1.9 -.7 -1.9 -1.9 -.7 1.9 -.7 z" fill="#B9954F" />
    </svg>
  )
}
