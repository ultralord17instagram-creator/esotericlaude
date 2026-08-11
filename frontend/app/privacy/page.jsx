import LegalDoc from '../components/legal/LegalDoc'
import { buildMetadata } from '../seo.config'
import { REQUISITES } from '../legal/operator'
import { SECTIONS, REVISION } from './privacy.content'

export const metadata = buildMetadata({
  title: 'Политика конфиденциальности',
  description: 'Какие данные собирает Astrix, для чего они используются, кому передаются и как их удалить.',
  path: '/privacy',
})

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Политика конфиденциальности"
      revision={REVISION}
      sections={SECTIONS}
      requisites={REQUISITES}
      requisitesTitle="Реквизиты оператора"
    />
  )
}
