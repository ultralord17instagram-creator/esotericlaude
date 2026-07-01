import { getProduct } from '../products.config'
import MatrixClient from './MatrixClient'

export const metadata = {
  title: 'Матрица судьбы — раскрой программу своей жизни',
  description: 'Персональный расчёт матрицы судьбы по дате рождения. Узнай своё предназначение, кармические задачи и денежный канал.',
}

export default function MatrixPage() {
  const product = getProduct('matrix')
  return <MatrixClient product={product} />
}
