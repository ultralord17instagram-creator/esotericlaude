import Link from 'next/link'
import { PRODUCTS } from '../../products.config'
import ServiceIcon from './ServiceIcon'
import styles from './AlsoTry.module.css'

// Перелинковка между сервисами. Берёт ПОЛНЫЙ каталог (PRODUCTS), а не витрину
// главной: скрытые продукты (Таро) не показываются на главной, но должны
// оставаться доступными кликами — путь «главная → любой сервис → Таро».
export default function AlsoTry({ current }) {
  const items = PRODUCTS.filter((p) => p.id !== current)
  if (!items.length) return null

  return (
    <section className={styles.wrap} aria-labelledby="also-try-title">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Ещё в Astrix</p>
        <h2 id="also-try-title" className={styles.title}>Загляни и сюда</h2>
        <div className={styles.grid}>
          {items.map((p) => (
            <Link key={p.id} href={`/${p.slug}`} className={styles.card}>
              <span className={styles.medallion}>
                <ServiceIcon id={p.id} size={24} />
              </span>
              <span className={styles.body}>
                <span className={styles.name}>{p.name}</span>
                <span className={styles.tag}>{p.tag ?? p.description}</span>
              </span>
              <span className={styles.arrow} aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
