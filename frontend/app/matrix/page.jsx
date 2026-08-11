import { getProduct } from '../products.config'
import MatrixClient from './MatrixClient'
import AlsoTry from '../components/ui/AlsoTry'
import JsonLd from '../components/JsonLd'
import { buildMetadata, breadcrumbSchema, serviceSchema } from '../seo.config'

const TITLE = 'Матрица судьбы по дате рождения: бесплатный расчёт'
const DESCRIPTION =
  'Персональный расчёт матрицы судьбы по дате рождения. Узнайте своё предназначение, кармические задачи, чакры и денежный канал. Демо бесплатно и без регистрации.'

export const metadata = buildMetadata({ title: TITLE, description: DESCRIPTION, path: '/matrix' })

export default function MatrixPage() {
  const product = getProduct('matrix')
  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: 'Главная', path: '/' },
            { name: 'Матрица судьбы', path: '/matrix' },
          ]),
          serviceSchema({ name: 'Матрица судьбы', description: DESCRIPTION, path: '/matrix' }),
        ]}
      />
      <MatrixClient product={product} />
      <AlsoTry current="matrix" />
    </>
  )
}
