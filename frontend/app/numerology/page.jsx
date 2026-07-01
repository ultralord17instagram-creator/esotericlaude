import { getProduct } from '../products.config'
import NumerologyClient from './NumerologyClient'

export const metadata = {
  title: 'Нумерология — числа твоей судьбы',
  description: 'Нумерологический расчёт по имени и дате рождения. Узнай своё число жизненного пути и скрытый потенциал.',
}

export default function NumerologyPage() {
  const product = getProduct('numerology')
  return <NumerologyClient product={product} />
}
