import LegalDoc from '../components/legal/LegalDoc'
import { buildMetadata } from '../seo.config'
import { REQUISITES } from '../legal/operator'
import { SECTIONS, REVISION, INTRO } from './offer.content'

export const metadata = buildMetadata({
  title: 'Публичная оферта',
  description: 'Публичная оферта Astrix: предмет договора, стоимость подписки, автоматическое продление и порядок возврата денежных средств.',
  path: '/offer',
})

export default function OfferPage() {
  return (
    <LegalDoc
      title="Публичная оферта"
      revision={REVISION}
      intro={INTRO}
      sections={SECTIONS}
      requisites={REQUISITES}
    />
  )
}
