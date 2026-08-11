import TarotClient from './TarotClient'
import AlsoTry from '../components/ui/AlsoTry'
import JsonLd from '../components/JsonLd'
import { buildMetadata, breadcrumbSchema, serviceSchema } from '../seo.config'

const TITLE = 'Расклад Таро онлайн бесплатно'
const DESCRIPTION =
  'Три сценария гадания на картах Таро: карта дня, расклад из трёх карт и ответ да или нет на ваш вопрос. Бесплатно, без регистрации, результат сразу.'

export const metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: '/tarot' })

export default function TarotPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Главная', path: '/' },
            { name: 'Таро', path: '/tarot' },
          ]),
          serviceSchema({ name: 'Расклад Таро', description: DESCRIPTION, path: '/tarot' }),
        ]}
      />
      <TarotClient />
      <AlsoTry current="tarot" />
    </>
  )
}
