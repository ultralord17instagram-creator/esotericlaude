import Paywall from '../components/ui/Paywall'
import styles from './subscribe.module.css'

export const metadata = {
  title: 'Подписка Astrix',
  description: 'Оформите подписку Astrix и откройте полные разборы во всех сервисах.',
}

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
