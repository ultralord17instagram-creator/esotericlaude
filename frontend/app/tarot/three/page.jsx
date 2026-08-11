import ThreeClient from './ThreeClient'
import JsonLd from '../../components/JsonLd'
import { buildMetadata, breadcrumbSchema } from '../../seo.config'

const TITLE = 'Расклад Таро на три карты'
const DESCRIPTION =
  'Расклад Таро из трёх карт: прошлое, настоящее и будущее, а также темы отношений, предназначения и родовых программ. Первый расклад бесплатно.'

export const metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: '/tarot/three' })

export default function TarotThreePage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Главная', path: '/' },
          { name: 'Таро', path: '/tarot' },
          { name: 'Три карты', path: '/tarot/three' },
        ])}
      />
      <ThreeClient />
    </>
  )
}
