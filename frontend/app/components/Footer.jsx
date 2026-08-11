'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PRODUCTS, VISIBLE_PRODUCTS } from '../products.config'
import { OPERATOR } from '../legal/operator'
import styles from './Footer.module.css'

// Общий подвал сайта. Раньше жил внутри главной, но юридические документы и
// контакт поддержки должны быть доступны с любой страницы, в первую очередь с
// /checkout — этого требуют и платёжный оператор, и здравый смысл.
//
// На /lp/* не рендерится по той же причине, что и Nav: у лендингов собственная
// самодостаточная вёрстка, общий подвал ломал бы их композицию.
export default function Footer() {
  const pathname = usePathname()
  if (pathname?.startsWith('/lp/')) return null

  // На главной витрина сознательно без скрытых продуктов (Таро), на остальных
  // страницах подвал перечисляет весь каталог: так до скрытого сервиса можно
  // дойти кликами, не встречая его на первом экране.
  const services = pathname === '/' ? VISIBLE_PRODUCTS : PRODUCTS

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <circle cx="12" cy="13" r="8.5" fill="none" stroke="#D8B884" strokeWidth="1.3"/>
            <circle cx="15.5" cy="11" r="8.5" fill="#1B1A30"/>
            <path d="M18.7 15 l.7 1.9 1.9 .7 -1.9 .7 -.7 1.9 -.7 -1.9 -1.9 -.7 1.9 -.7 z" fill="#D8B884"/>
          </svg>
          <span className={styles.brandName}>Astrix</span>
        </div>

        <p className={styles.text}>
          Древние практики простым языком. Пробуй бесплатно, открывай полный разбор по подписке.
        </p>

        <div className={styles.cols}>
          <div>
            <div className={styles.colTitle}>Сервисы</div>
            <div className={styles.links}>
              {services.map((p) => <Link key={p.id} href={`/${p.slug}`}>{p.name}</Link>)}
            </div>
          </div>
          <div>
            <div className={styles.colTitle}>Компания</div>
            <div className={styles.links}>
              <Link href="/#how">Как это работает</Link>
              <Link href="/login">Войти</Link>
              <Link href="/register">Регистрация</Link>
            </div>
          </div>
          {/* Все обязательные блоки одной колонкой: их ищут в одном месте,
              и платёжный оператор проверяет наличие каждого. */}
          <div>
            <div className={styles.colTitle}>Документы</div>
            <div className={styles.links}>
              <Link href="/offer">Оферта</Link>
              <Link href="/terms">Условия предоставления услуг</Link>
              <Link href="/privacy">Конфиденциальность</Link>
              <Link href="/tariff">Тарифный план</Link>
              <Link href="/cancel">Отмена подписки</Link>
              <Link href="/info">Информация</Link>
            </div>
          </div>
        </div>

        <div className={styles.rule} />

        <div className={styles.bottom}>
          <div className={styles.legal}>
            <span className={styles.copy}>© 2026 Astrix</span>
            <span className={styles.entity}>{OPERATOR.short}, ИНН {OPERATOR.inn}</span>
            <a className={styles.mail} href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
          </div>
          <div className={styles.socials}>
            <span className={styles.social}>TG</span>
            <span className={styles.social}>VK</span>
            <span className={styles.social}>YT</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
