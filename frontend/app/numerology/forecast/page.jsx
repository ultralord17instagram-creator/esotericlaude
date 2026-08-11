import ForecastClient from './ForecastClient'
import JsonLd from '../../components/JsonLd'
import { buildMetadata, breadcrumbSchema } from '../../seo.config'

const TITLE = 'Нумерологический прогноз на день, месяц и год'
const DESCRIPTION =
  'Персональный прогноз по нумерологии: личное число дня, личный месяц и личный год по дате рождения. Прогноз на день открыт бесплатно.'

export const metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: '/numerology/forecast' })

export default function ForecastPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Главная', path: '/' },
          { name: 'Нумерология', path: '/numerology' },
          { name: 'Прогноз', path: '/numerology/forecast' },
        ])}
      />
      <ForecastClient />
    </>
  )
}
