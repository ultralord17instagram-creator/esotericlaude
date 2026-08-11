import CheckoutClient from './CheckoutClient'
import { buildMetadata } from '../seo.config'

// noindex, nofollow — платёжный шаг воронки. Также закрыт в robots.txt.
export const metadata = buildMetadata({
  title: 'Оформление подписки',
  path: '/checkout',
  noindex: true,
  nofollow: true,
})

export default function CheckoutPage() {
  return <CheckoutClient />
}
