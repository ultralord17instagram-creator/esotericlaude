import LegalDoc from '../components/legal/LegalDoc'
import { buildMetadata } from '../seo.config'
import { REQUISITES } from '../legal/operator'
import { CLAUSES, REVISION } from './terms.content'

// Индексируемая страница: на неё ведёт чекбокс согласия в форме регистрации и
// ссылка в подвале.
export const metadata = buildMetadata({
  title: 'Условия предоставления услуг',
  description: 'Условия предоставления услуг Astrix: тарифы, порядок оплаты и рекуррентные списания.',
  path: '/terms',
})

export default function TermsPage() {
  return (
    <LegalDoc
      title="Условия предоставления услуг"
      revision={REVISION}
      clauses={CLAUSES}
      requisites={REQUISITES}
    />
  )
}
