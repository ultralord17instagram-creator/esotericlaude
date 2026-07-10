// Декларативный конфиг блоков разделов (дизайн §12.2).
// basis — по чему считается блок; free — открыт без подписки;
// variants — есть варианты по дню (только раздел «Сегодня»).
export const SCENARIOS = {
  today: {
    sky: { free: true }, // живое небо: общие тексты, всегда бесплатно
    blocks: [
      { id: 'mood',   name: 'Гороскоп на сегодня', basis: 'sign', variants: true, free: true  },
      { id: 'love',   name: 'Любовь сегодня',      basis: 'sign', variants: true, free: false },
      { id: 'money',  name: 'Деньги и работа',     basis: 'sign', variants: true, free: false },
      { id: 'health', name: 'Здоровье и энергия',  basis: 'sign', variants: true, free: false },
      { id: 'luck',   name: 'Удача дня',           basis: 'sign', variants: true, free: false },
      { id: 'advice', name: 'Совет дня',           basis: 'sign', variants: true, free: true  },
    ],
  },
  portrait: {
    basis: 'sign',
    blocks: [
      { id: 'core',    name: 'Характер и суть',    free: true  },
      { id: 'power',   name: 'Суперсила знака',     free: false },
      { id: 'shadow',  name: 'Теневая сторона',     free: false },
      { id: 'love',    name: 'Любовь и отношения',  free: false },
      { id: 'money',   name: 'Деньги и карьера',    free: false },
      { id: 'purpose', name: 'Предназначение',      free: false },
    ],
  },
  lunar: {
    basis: 'lunarDay',
    todayFree: true,
    spheres: ['beauty', 'money', 'love', 'affairs', 'health'],
  },
}
