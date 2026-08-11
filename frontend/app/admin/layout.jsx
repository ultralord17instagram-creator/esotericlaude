import { buildMetadata } from '../seo.config'

// app/admin/page.jsx — клиентский компонент ('use client'), а из таких
// экспортировать metadata нельзя. Поэтому мета живёт в этом layout.
// noindex, nofollow — админка. Также закрыта в robots.txt.
export const metadata = buildMetadata({
  title: 'Администрирование',
  path: '/admin',
  noindex: true,
  nofollow: true,
})

export default function AdminLayout({ children }) {
  return children
}
