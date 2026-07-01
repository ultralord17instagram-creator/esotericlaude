import Link from 'next/link'
import ServiceIcon from './ServiceIcon'
import styles from '../../landing.module.css'

export default function ProductCards({ products }) {
  return (
    <div className={styles.productsGrid}>
      {products.map((p) => (
        <Link key={p.id} href={`/${p.slug}`} className={styles.productCard}>
          <span className={styles.productAccentBar} aria-hidden="true" />
          <div className={styles.productTop}>
            <span className={styles.productMedallion}>
              <ServiceIcon id={p.id} />
            </span>
            <span className={styles.productDemo}>Демо</span>
          </div>
          <div>
            <div className={styles.productTag}>{p.tag ?? p.name}</div>
            <h3 className={styles.productName}>{p.name}</h3>
          </div>
          <p className={styles.productDesc}>{p.description}</p>
          <div className={styles.productFoot}>
            <span className={styles.productCta}>Открыть демо →</span>
            <span className={styles.productSub}>
              <svg width="11" height="12" viewBox="0 0 11 12" aria-hidden="true">
                <rect x="1.5" y="5" width="8" height="6" rx="1.4" fill="none" stroke="#9A8D72" strokeWidth="1.1"/>
                <path d="M3.2 5 V3.4 a2.3 2.3 0 0 1 4.6 0 V5" fill="none" stroke="#9A8D72" strokeWidth="1.1"/>
              </svg>
              Подписка
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
