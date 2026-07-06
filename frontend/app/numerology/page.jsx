import HubClient from './HubClient'

export const metadata = {
  title: 'Нумерология — числа твоей судьбы',
  description: 'Разбор личности, совместимость пары и персональный прогноз по дате рождения и имени.',
}

export default function NumerologyPage() {
  return <HubClient />
}
