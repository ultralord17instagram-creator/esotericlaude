'use client'
import { useRouter } from 'next/navigation'
import StarField from './StarField'
import AuthForm from './AuthForm'
import { safeReturnPath } from '../../lp/logic/returnPath.js'
import styles from './auth.module.css'

// Полноэкранная страница входа/регистрации (split-screen).
// Десктоп: небесный герой слева + форма справа. Мобайл: тёмный герой сверху
// с заголовком формы, форма ниже. Роуты /login и /register рендерят её с mode.
const COPY = {
  login: {
    heroTitle: ['Небо уже сверило', 'ваш день'],
    heroDesc: 'Ежедневный гороскоп, натальная карта и лунный календарь там, где вы остановились.',
    formTitle: 'С возвращением',
    formSub: 'Войдите, чтобы открыть свой день по звёздам.',
    switchText: 'Нет аккаунта?',
    switchLabel: 'Создать',
    next: 'register',
  },
  register: {
    heroTitle: ['Карта звёзд', 'ждёт владельца'],
    heroDesc: 'Создайте аккаунт за минуту и получите первый разбор дня бесплатно.',
    formTitle: 'Создайте аккаунт',
    formSub: 'Пара шагов, и ваша карта звёзд с вами.',
    switchText: 'Уже с нами?',
    switchLabel: 'Войти',
    next: 'login',
  },
}

export default function AuthPage({ mode }) {
  const router = useRouter()
  const c = COPY[mode]
  const goto = (m) => router.push(m === 'login' ? '/login' : '/register')

  // После регистрации с лендинга (в localStorage лежит post_checkout_return,
  // который ставят все /lp/*) показываем пейволл /subscribe. Обычная регистрация
  // и любой логин ведут в личный кабинет, как раньше.
  const onSuccess = () => {
    if (mode === 'register') {
      let fromLanding = null
      try { fromLanding = safeReturnPath(localStorage.getItem('post_checkout_return')) } catch {}
      if (fromLanding) { router.push('/subscribe'); return }
    }
    router.push('/lk')
  }

  return (
    <div className={styles.page}>
      <aside className={styles.hero}>
        <StarField className={styles.stars} />

        <div className={styles.heroLogo}>
          <AstrixMark />
          <span className={styles.heroLogoText}>Astrix</span>
        </div>

        <div className={styles.heroBody}>
          <h2 className={styles.heroTitle}>
            {c.heroTitle[0]}<br />{c.heroTitle[1]}
          </h2>
          <p className={styles.heroDesc}>{c.heroDesc}</p>
        </div>

        <ul className={styles.heroFeatures}>
          <li className={styles.heroFeature}>
            <span className={styles.heroFeatureIcon}>
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 0 l1.3 5 5 1.3 -5 1.3 -1.3 5 -1.3 -5 -5-1.3 5-1.3 z" fill="#B9954F" />
              </svg>
            </span>
            <span className={styles.heroFeatureText}>Персональный гороскоп на каждый день</span>
          </li>
          <li className={styles.heroFeature}>
            <span className={styles.heroFeatureIcon}>
              <svg width="16" height="16" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="7" fill="none" stroke="#B9954F" strokeWidth="1.3" />
                <circle cx="12.5" cy="8.5" r="7" fill="#1B1A30" />
              </svg>
            </span>
            <span className={styles.heroFeatureText}>Натальная карта и лунный календарь</span>
          </li>
        </ul>

        {/* Мобайл: заголовок формы внутри тёмного героя */}
        <div className={styles.heroFormHead}>
          <button className={styles.back} onClick={() => router.back()} aria-label="Назад">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M9.5 3 L5 8 L9.5 13" fill="none" stroke="#F3ECDB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className={styles.heroFormTitle}>{c.formTitle}</h1>
          <p className={styles.heroFormSub}>{c.formSub}</p>
        </div>
      </aside>

      <main className={styles.formCol}>
        <div className={styles.formTop}>
          {c.switchText}
          <button className={styles.topSwitchLink} onClick={() => goto(c.next)}>{c.switchLabel}</button>
        </div>

        <div className={styles.formInner}>
          <div className={styles.formHead}>
            <h1 className={styles.formTitle}>{c.formTitle}</h1>
            <p className={styles.formSub}>{c.formSub}</p>
          </div>

          <AuthForm
            mode={mode}
            switchDisplay="mobileOnly"
            onSwitch={goto}
            onSuccess={onSuccess}
          />
        </div>
      </main>
    </div>
  )
}

function AstrixMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 26 26" aria-hidden="true">
      <circle cx="12" cy="13" r="8.5" fill="none" stroke="#B9954F" strokeWidth="1.3" />
      <circle cx="15.5" cy="11" r="8.5" fill="#1B1A30" />
      <path d="M18.7 15 l.7 1.9 1.9 .7 -1.9 .7 -.7 1.9 -.7 -1.9 -1.9 -.7 1.9 -.7 z" fill="#B9954F" />
    </svg>
  )
}
