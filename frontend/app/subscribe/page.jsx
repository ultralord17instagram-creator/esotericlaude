import Paywall from '../components/ui/Paywall'
import { buildMetadata } from '../seo.config'
import styles from './subscribe.module.css'

// noindex: пейволл показывается только внутри воронки после регистрации,
// в органике он бессмысленен и ловил бы запросы вместо продуктовых страниц.
export const metadata = buildMetadata({
  title: 'Подписка',
  description: 'Оформите подписку Astrix и откройте полные разборы во всех сервисах.',
  path: '/subscribe',
  noindex: true,
})

// Пейволл после регистрации с лендинга. На него ведёт AuthPage, когда в
// localStorage есть post_checkout_return (пользователь пришёл с /lp/*). Кнопка
// Paywall ведёт на /checkout, а тот после оплаты возвращает на лендинг.
export default function SubscribePage() {
  return (
    <main className={styles.page}>
      <Paywall subscribeHref="/checkout" />
    </main>
  )
}
