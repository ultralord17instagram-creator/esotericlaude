import Link from 'next/link'
import { PRODUCTS } from './products.config'
import ProductCards from './components/ui/ProductCards'
import Reviews from './components/ui/Reviews'
import styles from './landing.module.css'

export const metadata = {
  title: 'Astrix — матрица судьбы, нумерология, таро и гороскоп',
  description: 'Древняя мудрость для современных вопросов. Попробуй каждый сервис бесплатно, прежде чем открыть полный разбор.',
}

const STEPS = [
  { no: '01', title: 'Попробуй',            desc: 'Открой демо любого сервиса бесплатно — без регистрации и обязательств.' },
  { no: '02', title: 'Убедись',             desc: 'Получи живой фрагмент разбора под свой личный запрос.' },
  { no: '03', title: 'Открой полный доступ', desc: 'Подписка раскрывает полные расклады сразу во всех сервисах.' },
]

const REVIEWS = [
  { text: 'Демо Матрицы попало прямо в точку. Оформила подписку в тот же вечер и не жалею.', name: 'Алина',  meta: '29 лет · Матрица судьбы' },
  { text: 'Утренний гороскоп стал ритуалом. Коротко, тепло и по делу — без пугающих прогнозов.', name: 'Марина', meta: '34 года · Гороскоп' },
  { text: 'Расклад Таро помог решиться на переезд. Формулировки бережные, без давления.',      name: 'Ксения', meta: '41 год · Таро' },
]

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <p className={styles.heroEyebrow}>Эзотерический хаб</p>
            <h1 className={styles.heroTitle}>Древняя мудрость для современных вопросов</h1>
            <p className={styles.heroSub}>
              Матрица судьбы, Таро, гороскоп и нумерология под одной луной. Попробуй бесплатно, прежде чем открыть полный разбор.
            </p>
            <div className={styles.heroActions}>
              <Link href="#products" className={styles.heroCta}>Попробовать бесплатно <span>→</span></Link>
              <Link href="#how" className={styles.heroLink}>Как это работает ↓</Link>
            </div>
          </div>

          <div className={styles.heroMedallion}>
            <svg className={styles.heroMedallionBg} viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              {/* orbital rings */}
              <ellipse cx="200" cy="205" rx="152" ry="66" transform="rotate(-18 200 205)" fill="none" stroke="#C6A667" strokeWidth="1" opacity=".16"/>
              <ellipse cx="200" cy="205" rx="150" ry="150" fill="none" stroke="#C6A667" strokeWidth="1" opacity=".12"/>
              <circle cx="200" cy="205" r="94" fill="none" stroke="#C6A667" strokeWidth="1" opacity=".22"/>
              <circle cx="200" cy="205" r="66" fill="none" stroke="#C6A667" strokeWidth="1" opacity=".3"/>
              {/* constellation */}
              <path d="M74 96 L120 74 L162 100 L206 82 L250 104" fill="none" stroke="#C6A667" strokeWidth="1" opacity=".5"/>
              <g fill="#D8B884">
                <circle cx="74" cy="96" r="2.2"/>
                <circle cx="120" cy="74" r="2.7"/>
                <circle cx="162" cy="100" r="2.2"/>
                <circle cx="206" cy="82" r="2.7"/>
                <circle cx="250" cy="104" r="2.2"/>
              </g>
              {/* crescent moon top-right */}
              <path d="M324 78 a22 22 0 1 0 13 34 a16 16 0 1 1 -13 -34 z" fill="none" stroke="#C6A667" strokeWidth="1.2" opacity=".55"/>
              {/* central diamond */}
              <rect x="163" y="168" width="74" height="74" transform="rotate(45 200 205)" fill="none" stroke="#C6A667" strokeWidth="1.2" opacity=".7"/>
              {/* compass 8-point star */}
              <path d="M200 165 l7.5 32 32 7.5 -32 7.5 -7.5 32 -7.5 -32 -32 -7.5 32 -7.5 z" fill="none" stroke="#D8B884" strokeWidth="1.1" opacity=".85"/>
              <circle cx="200" cy="205" r="3.2" fill="#E4CB98"/>
              {/* sparkles */}
              <path d="M116 306 l2 6.2 6.2 2 -6.2 2 -2 6.2 -2 -6.2 -6.2 -2 6.2 -2 z" fill="#E4CB98" opacity=".8"/>
              <path d="M300 292 l2.5 7 7 2.5 -7 2.5 -2.5 7 -2.5 -7 -7 -2.5 7 -2.5 z" fill="#E4CB98" opacity=".85"/>
            </svg>
            <div className={styles.heroMedallionInner}>
              <span className={styles.heroBadge}>Небо сегодня</span>
              <div className={styles.heroMedallionFoot}>
                <div>
                  <div className={styles.heroMedallionKicker}>Фаза луны</div>
                  <div className={styles.heroMedallionValue}>Полнолуние в Тельце</div>
                </div>
                <div className={styles.heroMedallionArrow}>→</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className={styles.section} id="products">
        <div className={styles.container}>
          <div className={styles.divider} />
          <p className={styles.eyebrow}>Сервисы</p>
          <h2 className={styles.sectionTitle}>Четыре пути к себе</h2>
          <p className={styles.sectionLead}>Начни с бесплатного демо — подписка открывает полный разбор.</p>
          <ProductCards products={PRODUCTS} />
        </div>
      </section>

      {/* How it works */}
      <section className={styles.section} id="how">
        <div className={styles.container}>
          <div className={styles.divider} />
          <p className={styles.eyebrow}>Как это работает</p>
          <h2 className={styles.sectionTitle}>Три шага до полного разбора</h2>
          <div className={styles.stepsGrid}>
            {STEPS.map((s, i) => (
              <div key={s.no} className={styles.step}>
                <div className={styles.stepNumCol}>
                  <span className={styles.stepNum}>{s.no}</span>
                  {i < STEPS.length - 1 && <span className={styles.stepConnector} />}
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
          <div className={styles.divider} />
          <p className={styles.eyebrow}>Отзывы</p>
          <h2 className={styles.sectionTitle}>Им откликнулось</h2>
        </div>
        <Reviews items={REVIEWS} />
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
              <circle cx="12" cy="13" r="8.5" fill="none" stroke="#D8B884" strokeWidth="1.3"/>
              <circle cx="15.5" cy="11" r="8.5" fill="#1B1A30"/>
              <path d="M18.7 15 l.7 1.9 1.9 .7 -1.9 .7 -.7 1.9 -.7 -1.9 -1.9 -.7 1.9 -.7 z" fill="#D8B884"/>
            </svg>
            <span className={styles.footerBrandName}>Astrix</span>
          </div>
          <p className={styles.footerText}>Древние практики простым языком. Пробуй бесплатно — открывай полный разбор по подписке.</p>
          <div className={styles.footerCols}>
            <div>
              <div className={styles.footerColTitle}>Сервисы</div>
              <div className={styles.footerLinks}>
                {PRODUCTS.map((p) => <Link key={p.id} href={`/${p.slug}`}>{p.name}</Link>)}
              </div>
            </div>
            <div>
              <div className={styles.footerColTitle}>Компания</div>
              <div className={styles.footerLinks}>
                <Link href="#how">Как это работает</Link>
                <Link href="/login">Войти</Link>
                <Link href="/register">Регистрация</Link>
              </div>
            </div>
          </div>
          <div className={styles.footerRule} />
          <div className={styles.footerBottom}>
            <span className={styles.footerCopy}>© 2026 Astrix</span>
            <div className={styles.footerSocials}>
              <span className={styles.footerSocial}>TG</span>
              <span className={styles.footerSocial}>VK</span>
              <span className={styles.footerSocial}>YT</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
