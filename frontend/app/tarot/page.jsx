import TarotClient from './TarotClient'

export const metadata = {
  title: 'Расклад Таро — карта дня, три карты, да/нет',
  description: 'Три сценария гадания на картах Таро: карта дня, расклад из трёх карт и ответ да/нет на твой вопрос.',
}

export default function TarotPage() {
  return <TarotClient />
}
