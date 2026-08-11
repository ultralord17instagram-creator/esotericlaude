import CompatibilityClient from './CompatibilityClient'
import JsonLd from '../../components/JsonLd'
import { buildMetadata, breadcrumbSchema } from '../../seo.config'

const TITLE = 'Нумерология совместимости по датам рождения'
const DESCRIPTION =
  'Совместимость пары по нумерологии: сравниваем две даты рождения и показываем сильные стороны союза, зоны трения и общий сценарий отношений.'

export const metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: '/numerology/compatibility' })

export default function CompatibilityPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Главная', path: '/' },
          { name: 'Нумерология', path: '/numerology' },
          { name: 'Совместимость', path: '/numerology/compatibility' },
        ])}
      />
      <CompatibilityClient />
    </>
  )
}
