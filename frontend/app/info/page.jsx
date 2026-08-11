import LegalDoc from '../components/legal/LegalDoc'
import { buildMetadata } from '../seo.config'
import { REQUISITES } from '../legal/operator'

// Страница «Информация»: реквизиты исполнителя и контакт поддержки. Ровно то,
// что просит платёжный оператор увидеть на сайте перед подключением приёма
// платежей. Ничего сверх REQUISITES здесь не пишем, чтобы не появилось второе
// место правды по реквизитам.
export const metadata = buildMetadata({
  title: 'Информация',
  description: 'Реквизиты исполнителя и контакты службы поддержки сервиса Astrix.',
  path: '/info',
})

export default function InfoPage() {
  return (
    <LegalDoc
      title="Информация"
      intro="Реквизиты исполнителя и контакты службы поддержки. По любым вопросам о работе сервиса, оплате и возврате средств пишите на почту поддержки, ответ приходит в течение рабочего дня."
      requisites={REQUISITES}
    />
  )
}
