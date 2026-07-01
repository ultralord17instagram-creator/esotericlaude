import { getProduct } from '../products.config'
import TarotClient from './TarotClient'

export const metadata = {
  title: 'Расклад Таро — послание карт для тебя',
  description: 'Персональный расклад Таро онлайн. Получи ответ на свой вопрос через символизм карт.',
}

export default function TarotPage() {
  const product = getProduct('tarot')
  return <TarotClient product={product} />
}
