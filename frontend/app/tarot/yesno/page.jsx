import YesNoClient from './YesNoClient'
import JsonLd from '../../components/JsonLd'
import { buildMetadata, breadcrumbSchema } from '../../seo.config'

const TITLE = 'Гадание Таро да или нет'
const DESCRIPTION =
  'Задайте картам Таро закрытый вопрос и получите ответ да или нет со шкалой уверенности. Бесплатно, без регистрации, ответ приходит сразу.'

export const metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: '/tarot/yesno' })

export default function TarotYesNoPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: 'Главная', path: '/' },
          { name: 'Таро', path: '/tarot' },
          { name: 'Да или нет', path: '/tarot/yesno' },
        ])}
      />
      <YesNoClient />
    </>
  )
}
