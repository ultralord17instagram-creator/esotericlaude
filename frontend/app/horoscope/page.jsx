import HoroscopeClient from './HoroscopeClient'

export const metadata = {
  title: 'Гороскоп: знак, живое небо и лунный календарь',
  description: 'Гороскоп на сегодня по знаку зодиака, реальное состояние неба и лунный календарь.',
}

export default function HoroscopePage() {
  return <HoroscopeClient />
}
