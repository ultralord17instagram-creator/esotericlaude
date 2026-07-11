// Сборка данных дашборда дня из существующих генераторов контента (дизайн §5.1).
// Всё детерминировано по дате. Блоки, которым нужна дата рождения, без неё
// возвращают available:false и content:null (онбординг, дизайн §5.6).
import { getDayCard, getText } from '../content/tarot/index.js'
import { buildForecast } from '../content/numerology/index.js'
import { sign as getSign } from '../content/horoscope/astro.js'
import { getToday, getLunar } from '../content/horoscope/index.js'

// Метаданные блоков: порядок, требуется ли дата, продукт и куда ведёт «открыть полностью».
export const DAY_BLOCKS = [
  { id: 'card',   title: 'Карта дня',   needsBirth: false, product: 'Таро',        href: '/tarot/day' },
  { id: 'number', title: 'Число дня',   needsBirth: true,  product: 'Нумерология', href: '/numerology/forecast' },
  { id: 'mood',   title: 'Настрой дня', needsBirth: true,  product: 'Гороскоп',    href: '/horoscope' },
  { id: 'lunar',  title: 'Лунный день', needsBirth: false, product: 'Гороскоп',    href: '/horoscope' },
]

// Контент одного блока. birth: 'YYYY-MM-DD' (для number/mood), today: Date.
function blockContent(id, birth, today) {
  if (id === 'card') {
    const card = getDayCard(today)
    return {
      name: card.ru,
      message: getText({ scenario: 'day', number: card.number }),
      advice: getText({ scenario: 'advice', number: card.number }),
    }
  }
  if (id === 'lunar') {
    const l = getLunar(today)
    return { lunarDay: l.lunarDay, phase: l.phase, meaning: l.todayMeaning }
  }
  if (id === 'number') {
    const f = buildForecast({ date: birth, horizon: 'day', today })
    return { number: f.number, text: f.text }
  }
  if (id === 'mood') {
    const s = getSign(birth)
    const mood = getToday(s.id, today).blocks.find(b => b.id === 'mood')
    const text = typeof mood?.text === 'string' ? mood.text : mood?.text?.teaser
    return { sign: s.name, text }
  }
  return null
}

// Массив блоков с их доступностью и контентом.
export function buildDayBlocks({ birth, today = new Date() }) {
  return DAY_BLOCKS.map(b => {
    const available = !b.needsBirth || !!birth
    return { ...b, available, content: available ? blockContent(b.id, birth, today) : null }
  })
}
