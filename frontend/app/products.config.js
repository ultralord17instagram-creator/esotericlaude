// Registry of all esoteric products. Add a new product = add one object here.
export const PRODUCTS = [
  {
    id: 'matrix',
    name: 'Матрица судьбы',
    slug: 'matrix',
    tag: 'Психокарта личности',
    icon: 'Sparkles',
    description: 'Раскрой программу своей судьбы через нумерологический квадрат',
    inputs: ['birth_date'],
    extraInputs: [],
  },
  {
    id: 'numerology',
    name: 'Нумерология',
    slug: 'numerology',
    tag: 'Число судьбы',
    icon: 'Hash',
    description: 'Узнай значение чисел в твоей жизни',
    inputs: ['birth_date', 'name'],
    extraInputs: [],
  },
  {
    id: 'tarot',
    name: 'Расклад Таро',
    slug: 'tarot',
    tag: 'Гадание на картах',
    icon: 'Layers',
    description: 'Карта дня, три карты, да/нет',
    inputs: [],
    extraInputs: [],
  },
  {
    id: 'horoscope',
    name: 'Гороскоп',
    slug: 'horoscope',
    tag: 'Ежедневный прогноз',
    icon: 'Moon',
    description: 'Персональный гороскоп на основе даты рождения',
    inputs: ['birth_date'],
    extraInputs: [],
  },
]

export function getProduct(slug) {
  return PRODUCTS.find(p => p.slug === slug) ?? null
}
