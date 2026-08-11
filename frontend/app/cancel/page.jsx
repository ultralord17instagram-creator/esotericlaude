import CancelClient from './CancelClient'
import { buildMetadata } from '../seo.config'
import styles from './cancel.module.css'

// Индексируемая страница: её ищут поиском словами «отменить подписку», и лучше
// чтобы находили нашу форму, а не сторонние инструкции.
export const metadata = buildMetadata({
  title: 'Отмена подписки',
  description: 'Форма заявки на отмену подписки Astrix. Отменяем в течение 24 часов после обращения.',
  path: '/cancel',
})

export default function CancelPage() {
  return (
    <main className={styles.page}>
      <CancelClient />
    </main>
  )
}
