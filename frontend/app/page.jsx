import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PRODUCTS } from './products.config'
import styles from './landing.module.css'

const Aurora = dynamic(() => import('./components/ui/Aurora'), { ssr: false })
const Particles = dynamic(() => import('./components/ui/Particles'), { ssr: false })
const BlurText = dynamic(() => import('./components/ui/BlurText'), { ssr: false })
const ScrollReveal = dynamic(() => import('./components/ui/ScrollReveal'), { ssr: false })
const AnimatedCards = dynamic(() => import('./components/ui/AnimatedCards'), { ssr: false })

export const metadata = {
  title: 'Эзотерический хаб — матрица судьбы, нумерология, таро и гороскоп',
  description: 'Попробуй каждый сервис бесплатно. Матрица судьбы, нумерология, расклад Таро и персональный гороскоп — всё в одном месте.',
}

const HOW_IT_WORKS = [
  { step: '01', title: 'Выбери продукт', desc: 'Нажми на любую карточку — каждый сервис доступен бесплатно' },
  { step: '02', title: 'Введи данные', desc: 'Дата рождения или вопрос — ничего лишнего' },
  { step: '03', title: 'Открой полный доступ', desc: 'Демо-результат сразу. Полный анализ — по подписке за 9 ₽' },
]

const REVIEWS = [
  { name: 'Анна К.', text: 'Матрица судьбы просто перевернула моё понимание себя. Всё точь-в-точь!' },
  { name: 'Михаил Д.', text: 'Расклад Таро помог принять сложное решение. Теперь пользуюсь каждую неделю.' },
  { name: 'Елена В.', text: 'Нумерология объяснила паттерны, которые я замечала всю жизнь. Рекомендую.' },
]

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.auroraWrap}>
          <Aurora
            colorStops={["#0369A1", "#38BDF8", "#0EA5E9"]}
            blend={0.4}
            amplitude={0.8}
            speed={0.3}
          />
        </div>
        <div className={styles.particlesWrap}>
          <Particles
            particleColors={["#38BDF8", "#7DD3FC", "#BAE6FD"]}
            particleCount={80}
            particleSpread={8}
            speed={0.04}
            particleBaseSize={60}
            sizeRandomness={1.5}
            alphaParticles={true}
            disableRotation={false}
            moveParticlesOnHover={false}
          />
        </div>
        <div className={styles.heroContent}>
          <p className={styles.heroEyebrow}>Эзотерический хаб</p>
          <div className={styles.heroTitle} role="heading" aria-level="1">
            <BlurText
              text="Познай себя через"
              delay={100}
              animateBy="words"
              direction="top"
              stepDuration={0.5}
            />
            <BlurText
              text="язык символов"
              delay={100}
              animateBy="words"
              direction="top"
              stepDuration={0.5}
              className={styles.accent}
            />
          </div>
          <p className={styles.heroSub}>
            Матрица судьбы, нумерология, Таро и гороскоп — попробуй каждый сервис бесплатно
          </p>
          <Link href="#products" className={styles.heroCta}>
            Начать бесплатно
          </Link>
        </div>
        <div className={styles.heroScroll} aria-hidden="true">
          <div className={styles.heroScrollLine} />
        </div>
      </section>

      {/* Products */}
      <section className={styles.section} id="products">
        <div className={styles.container}>
          <ScrollReveal baseOpacity={0} enableBlur blurStrength={6} baseRotation={2}>
            Выбери продукт
          </ScrollReveal>
          <AnimatedCards products={PRODUCTS} />
        </div>
      </section>

      {/* How it works */}
      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.container}>
          <ScrollReveal baseOpacity={0} enableBlur blurStrength={6} baseRotation={2}>
            Как это работает
          </ScrollReveal>
          <div className={styles.stepsGrid}>
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.step} className={styles.step}>
                <div className={styles.stepNumCol}>
                  <span className={styles.stepNum}>{s.step}</span>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className={styles.stepConnector} />
                  )}
                </div>
                <div className={styles.stepBody}>
                  <h3 className={styles.stepTitle}>{s.title}</h3>
                  <p className={styles.stepDesc}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className={styles.section}>
        <div className={styles.container}>
          <ScrollReveal baseOpacity={0} enableBlur blurStrength={6} baseRotation={2}>
            Отзывы
          </ScrollReveal>
          <div className={styles.reviewsGrid}>
            {REVIEWS.map((r, i) => (
              <div key={i} className={styles.review}>
                <p className={styles.reviewText}>«{r.text}»</p>
                <p className={styles.reviewName}>{r.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>© 2026 Эзотерический хаб · <Link href="/login">Войти</Link> · <Link href="/register">Регистрация</Link></p>
        </div>
      </footer>
    </main>
  )
}
