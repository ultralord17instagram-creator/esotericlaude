import DayClient from './DayClient'
import JsonLd from '../../components/JsonLd'
import { buildMetadata, breadcrumbSchema } from '../../seo.config'

const TITLE = 'Карта дня Таро на сегодня'
const DESCRIPTION =
  'Одна карта Таро на сегодня: общий настрой дня, послание карты и совет. Бесплатно и без регистрации, карта дня обновляется каждые сутки.'

export const metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: '/tarot/day' })

export default function TarotDayPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Главная', path: '/' },
          { name: 'Таро', path: '/tarot' },
          { name: 'Карта дня', path: '/tarot/day' },
        ])}
      />
      <DayClient />
    </>
  )
}
