import HubClient from './HubClient'
import AlsoTry from '../components/ui/AlsoTry'
import JsonLd from '../components/JsonLd'
import { buildMetadata, breadcrumbSchema, serviceSchema } from '../seo.config'

const TITLE = 'Нумерология по дате рождения и имени'
const DESCRIPTION =
  'Числа вашей судьбы: разбор личности, совместимость пары и персональный прогноз по дате рождения и имени. Начните с бесплатного демо, регистрация не нужна.'

export const metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: '/numerology' })

export default function NumerologyPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Главная', path: '/' },
            { name: 'Нумерология', path: '/numerology' },
          ]),
          serviceSchema({ name: 'Нумерология', description: DESCRIPTION, path: '/numerology' }),
        ]}
      />
      <HubClient />
      <AlsoTry current="numerology" />
    </>
  )
}
