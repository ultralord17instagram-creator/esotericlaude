const SIGNS = [
  { name: 'Козерог', dates: [1,1,1,19], element: 'Земля', planet: 'Сатурн' },
  { name: 'Водолей', dates: [1,20,2,18], element: 'Воздух', planet: 'Уран' },
  { name: 'Рыбы', dates: [2,19,3,20], element: 'Вода', planet: 'Нептун' },
  { name: 'Овен', dates: [3,21,4,19], element: 'Огонь', planet: 'Марс' },
  { name: 'Телец', dates: [4,20,5,20], element: 'Земля', planet: 'Венера' },
  { name: 'Близнецы', dates: [5,21,6,21], element: 'Воздух', planet: 'Меркурий' },
  { name: 'Рак', dates: [6,22,7,22], element: 'Вода', planet: 'Луна' },
  { name: 'Лев', dates: [7,23,8,22], element: 'Огонь', planet: 'Солнце' },
  { name: 'Дева', dates: [8,23,9,22], element: 'Земля', planet: 'Меркурий' },
  { name: 'Весы', dates: [9,23,10,22], element: 'Воздух', planet: 'Венера' },
  { name: 'Скорпион', dates: [10,23,11,21], element: 'Вода', planet: 'Плутон' },
  { name: 'Стрелец', dates: [11,22,12,21], element: 'Огонь', planet: 'Юпитер' },
  { name: 'Козерог', dates: [12,22,12,31], element: 'Земля', planet: 'Сатурн' },
]

function getSign(birthDate) {
  const [, m, d] = birthDate.split('-').map(Number)
  return SIGNS.find(s => (m === s.dates[0] && d >= s.dates[1]) || (m === s.dates[2] && d <= s.dates[3]))
    ?? SIGNS[0]
}

const DESCRIPTIONS = {
  'Овен': 'Лидер и первопроходец. Твоя энергия зажигает других.',
  'Телец': 'Строитель и гурман. Устойчивость и красота — твоя стихия.',
  'Близнецы': 'Коммуникатор и исследователь. Тебя питает разнообразие.',
  'Рак': 'Хранитель и интуит. Эмоции — твой компас.',
  'Лев': 'Творец и вдохновитель. Твоё сердце — источник силы.',
  'Дева': 'Аналитик и целитель. Совершенство в деталях.',
  'Весы': 'Дипломат и эстет. Гармония — твоя цель.',
  'Скорпион': 'Трансформатор и исследователь глубин. Ты видишь суть.',
  'Стрелец': 'Философ и искатель. Тебя ведёт поиск смысла.',
  'Козерог': 'Архитектор и стратег. Достижение — твоя природа.',
  'Водолей': 'Визионер и реформатор. Ты живёшь будущим.',
  'Рыбы': 'Мистик и эмпат. Границы между мирами для тебя прозрачны.',
}

export function getHoroscopeResult(inputs) {
  const sign = inputs.birth_date ? getSign(inputs.birth_date) : SIGNS[3]
  const desc = DESCRIPTIONS[sign.name] ?? ''

  return {
    free: {
      title: `Твой знак — ${sign.name}`,
      sign: sign.name,
      element: sign.element,
      planet: sign.planet,
      preview: desc,
      teaser: 'Полный гороскоп включает натальную карту, прогноз на месяц, совместимость и сферы жизни...',
    },
    paid: {
      sign,
      description: desc,
      monthForecast: `В ближайший месяц ${sign.name} ощутит усиление энергии в сфере отношений и карьеры. Планета ${sign.planet} поддерживает начинания.`,
      compatibility: `Лучший партнёр для ${sign.name} — те, кто дополняет стихию ${sign.element}.`,
      advice: 'Сфокусируйся на внутреннем росте — внешние результаты последуют.',
    },
  }
}
