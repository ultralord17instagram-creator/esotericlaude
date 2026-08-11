import Link from 'next/link'
import { buildMetadata, SITE_NAME } from '../seo.config'
import { OPERATOR } from '../legal/operator'
import { TARIFFS, TARIFFS_APPROVED, rub, days } from '../legal/tariffs'
import styles from './tariff.module.css'

// Тарифный план. Раньше страница тянула цену живьём из payment_service, но с
// момента, как конкретные суммы объявлены в оферте, источником правды стала
// тарифная политика в legal/tariffs.js: две страницы, объявляющие разную цену,
// хуже, чем одна слегка запаздывающая. Поменялся тариф в кабинете партнёрки —
// правится legal/tariffs.js, и оферта с этой страницей меняются вместе.
export const metadata = buildMetadata({
  title: 'Тарифный план',
  description: 'Тарифы Astrix: пробный период, основной тариф, автоматическое продление и порядок отмены подписки.',
  path: '/tariff',
})

const INCLUDED = [
  'Полные разборы во всех сервисах',
  'Матрица судьбы, Таро, гороскоп и нумерология',
  'Новые расклады каждую неделю',
  'Сохранение расчётов в личном кабинете',
  'Без рекламы и без ограничений по количеству разборов',
]

const PLANS = [
  {
    plan: TARIFFS.trial,
    when: `С 1 по ${TARIFFS.trial.days} день с момента подключения`,
  },
  {
    plan: TARIFFS.main,
    when: `С ${TARIFFS.trial.days + 1} дня, за каждые последующие ${days(TARIFFS.main.days)}`,
  },
  {
    plan: TARIFFS.special,
    when: `Если средств на карте не хватило на тариф «${TARIFFS.main.name}», за каждые последующие ${days(TARIFFS.special.days)}`,
  },
]

export default function TariffPage() {
  return (
    <main className={styles.page}>
      <article className={styles.doc}>
        <header className={styles.head}>
          <h1 className={styles.h1}>Тарифный план</h1>
          <p className={styles.intro}>
            Часть материалов открыта бесплатно, полные разборы во всех сервисах открывает
            подписка. Тарифная политика утверждена {TARIFFS_APPROVED}.
          </p>
        </header>

        <section className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.planName}>Подписка {SITE_NAME}</span>
          </div>

          {PLANS.map(({ plan, when }) => (
            <div key={plan.name} className={styles.planRow}>
              <div className={styles.planMeta}>
                <span className={styles.planTitle}>Тариф «{plan.name}»</span>
                <span className={styles.planWhen}>{when}</span>
              </div>
              <span className={styles.priceValue}>
                {rub(plan.amount)}
                <span className={styles.pricePeriod}> / {days(plan.days)}</span>
              </span>
            </div>
          ))}

          <div className={styles.rule} />

          <div className={styles.includedTitle}>Что входит</div>
          <ul className={styles.included}>
            {INCLUDED.map((f) => (
              <li key={f}>
                <svg className={styles.check} viewBox="0 0 18 18" aria-hidden="true">
                  <circle cx="9" cy="9" r="9" fill="currentColor" fillOpacity="0.14" />
                  <path d="M5 9.2 l2.6 2.6 5.2-5.7" fill="none" stroke="currentColor" strokeWidth="1.7" />
                </svg>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <Link href="/checkout" className={styles.cta}>Оформить подписку</Link>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>Как меняются тарифы</h2>
          <p className={styles.p}>
            Доступ открывается по тарифу «{TARIFFS.trial.name}» за {rub(TARIFFS.trial.amount)}.
            По истечении {days(TARIFFS.trial.days)} подписка автоматически переходит на тариф
            «{TARIFFS.main.name}»: {rub(TARIFFS.main.amount)} за каждые {days(TARIFFS.main.days)}.
          </p>
          <p className={styles.p}>
            Если в момент списания на карте не хватает средств на тариф «{TARIFFS.main.name}»,
            подписка переводится на тариф «{TARIFFS.special.name}»: {rub(TARIFFS.special.amount)} за
            каждые {days(TARIFFS.special.days)}. Дальнейшие списания идут по этому тарифу.
          </p>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>Как проходит оплата</h2>
          <p className={styles.p}>
            Оплата производится банковской картой через платёжный сервис CloudPayments.
            Реквизиты карты вводятся на стороне платёжного сервиса, мы их не получаем и
            не храним. Кассовый чек приходит на почту, указанную при регистрации.
          </p>
          <p className={styles.p}>
            Все суммы указаны в рублях. Списания рекуррентные: они проходят автоматически,
            без отдельного подтверждения каждого платежа.
          </p>
        </section>

        <section className={styles.block}>
          <h2 className={styles.h2}>Отмена подписки</h2>
          <p className={styles.p}>
            Отменить подписку можно в любой момент в личном кабинете кнопкой «Отменить
            подписку» либо письмом на{' '}
            <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. Доступ сохраняется до
            конца уже оплаченного периода, последующих списаний не будет.
          </p>
          <p className={styles.p}>
            Полные условия оплаты, продления и отмены изложены в{' '}
            <Link href="/offer">публичной оферте</Link>.
          </p>
        </section>
      </article>
    </main>
  )
}
