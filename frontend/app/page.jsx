import Link from 'next/link'
import { VISIBLE_PRODUCTS } from './products.config'
import ProductCards from './components/ui/ProductCards'
import Reviews from './components/ui/Reviews'
import JsonLd from './components/JsonLd'
import { buildMetadata, absoluteUrl } from './seo.config'
import styles from './landing.module.css'

// Свой title вместо DEFAULT_TITLE: главная не рекламирует Таро, оно живёт
// на /tarot и в кабинете. absoluteTitle — чтобы не приклеивался шаблон бренда.
export const metadata = buildMetadata({
  title: 'Astrix — матрица судьбы, нумерология и гороскоп',
  absoluteTitle: true,
  description: 'Древняя мудрость для современных вопросов. Матрица судьбы, нумерология и гороскоп. Попробуйте каждый сервис бесплатно, прежде чем открыть полный разбор.',
  path: '/',
})

// Список сервисов для поисковика. Дублирует то, что видно в блоке «Сервисы»,
// иначе разметка считается несоответствующей контенту.
const servicesListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Сервисы Astrix',
  itemListElement: VISIBLE_PRODUCTS.map((p, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: p.name,
    description: p.description,
    url: absoluteUrl(`/${p.slug}`),
  })),
}

const STEPS = [
  { no: '01', title: 'Попробуй',            desc: 'Открой демо любого сервиса бесплатно — без регистрации и обязательств.' },
  { no: '02', title: 'Убедись',             desc: 'Получи живой фрагмент разбора под свой личный запрос.' },
  { no: '03', title: 'Открой полный доступ', desc: 'Подписка раскрывает полные расклады сразу во всех сервисах.' },
]

const REVIEWS = [
  { text: 'Демо Матрицы попало прямо в точку. Оформила подписку в тот же вечер и не жалею.', name: 'Алина',  meta: '29 лет · Матрица судьбы' },
  { text: 'Утренний гороскоп стал ритуалом. Коротко, тепло и по делу — без пугающих прогнозов.', name: 'Марина', meta: '34 года · Гороскоп' },
  { text: 'Разбор по числу судьбы объяснил, почему я снова и снова выбираю одно и то же.',     name: 'Ксения', meta: '41 год · Нумерология' },
]

export default function HomePage() {
  return (
    <main>
      <JsonLd data={servicesListSchema} />

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <p className={styles.heroEyebrow}>Эзотерический хаб</p>
            <h1 className={styles.heroTitle}>Древняя мудрость для современных вопросов</h1>
            <p className={styles.heroSub}>
              Матрица судьбы, гороскоп и нумерология под одной луной. Попробуй бесплатно, прежде чем открыть полный разбор.
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
          <h2 className={styles.sectionTitle}>Три пути к себе</h2>
          <p className={styles.sectionLead}>Начни с бесплатного демо — подписка открывает полный разбор.</p>
          <ProductCards products={VISIBLE_PRODUCTS} />
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

      {/* Подвал вынесен в components/Footer.jsx и подключён в layout: документы
          и контакты нужны на всех страницах, а не только на главной. */}
    </main>
  )
}
