import BreakdownClient from './BreakdownClient'
import JsonLd from '../../components/JsonLd'
import { buildMetadata, breadcrumbSchema } from '../../seo.config'

const TITLE = 'Нумерологический разбор личности'
const DESCRIPTION =
  'Разбор личности по числам: число жизненного пути, число судьбы, сильные стороны и точки роста. Считаем по дате рождения и имени, демо бесплатно.'

export const metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: '/numerology/breakdown' })

export default function BreakdownPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Главная', path: '/' },
          { name: 'Нумерология', path: '/numerology' },
          { name: 'Разбор личности', path: '/numerology/breakdown' },
        ])}
      />
      <BreakdownClient />
    </>
  )
}
