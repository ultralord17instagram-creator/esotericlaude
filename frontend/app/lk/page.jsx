import LKClient from './LKClient'
import { buildMetadata } from '../seo.config'

// noindex, nofollow — приватный раздел. Также закрыт в robots.txt.
export const metadata = buildMetadata({
  title: 'Личный кабинет',
  path: '/lk',
  noindex: true,
  nofollow: true,
})

export default function LKPage() {
  return <LKClient />
}
