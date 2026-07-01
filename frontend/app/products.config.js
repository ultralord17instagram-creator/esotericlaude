// Registry of all esoteric products. Add a new product = add one object here.
export const PRODUCTS = [
  {
    id: 'matrix',
    name: 'Матрица судьбы',
    slug: 'matrix',
    icon: 'Sparkles',
    description: 'Раскрой программу своей судьбы через нумерологический квадрат',
    inputs: ['birth_date'],
    extraInputs: [],
  },
  {
    id: 'numerology',
    name: 'Нумерология',
    slug: 'numerology',
    icon: 'Hash',
    description: 'Узнай значение чисел в твоей жизни',
    inputs: ['birth_date', 'name'],
    extraInputs: [],
  },
  {
    id: 'tarot',
    name: 'Расклад Таро',
    slug: 'tarot',
    icon: 'Layers',
    description: 'Получи ответ на волнующий вопрос',
    inputs: [],
    extraInputs: ['intention'],
  },
  {
    id: 'horoscope',
    name: 'Гороскоп',
    slug: 'horoscope',
    icon: 'Moon',
    description: 'Персональный гороскоп на основе даты рождения',
    inputs: ['birth_date'],
    extraInputs: [],
  },
]

export function getProduct(slug) {
  return PRODUCTS.find(p => p.slug === slug) ?? null
}
