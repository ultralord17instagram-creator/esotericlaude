import HoroscopeClient from './HoroscopeClient'
import AlsoTry from '../components/ui/AlsoTry'
import JsonLd from '../components/JsonLd'
import { buildMetadata, breadcrumbSchema, serviceSchema } from '../seo.config'

const TITLE = 'Гороскоп на сегодня по знаку зодиака'
const DESCRIPTION =
  'Гороскоп на сегодня по знаку зодиака, реальное положение планет и лунный календарь. Введите дату рождения и получите прогноз дня бесплатно.'

export const metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: '/horoscope' })

export default function HoroscopePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Главная', path: '/' },
            { name: 'Гороскоп', path: '/horoscope' },
          ]),
          serviceSchema({ name: 'Гороскоп', description: DESCRIPTION, path: '/horoscope' }),
        ]}
      />
      <HoroscopeClient />
      <AlsoTry current="horoscope" />
    </>
  )
}
