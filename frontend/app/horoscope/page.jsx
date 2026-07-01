import { getProduct } from '../products.config'
import HoroscopeClient from './HoroscopeClient'

export const metadata = {
  title: 'Гороскоп — персональный прогноз по знаку зодиака',
  description: 'Гороскоп по дате рождения с прогнозом на месяц, совместимостью и советами звёзд.',
}

export default function HoroscopePage() {
  const product = getProduct('horoscope')
  return <HoroscopeClient product={product} />
}
