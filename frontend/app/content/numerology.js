function reduceToSingle(n) {
  while (n > 9 && n !== 11 && n !== 22) {
    n = String(n).split('').reduce((a, d) => a + Number(d), 0)
  }
  return n
}

function lifePathNumber(birthDate) {
  const [y, m, d] = birthDate.split('-').map(Number)
  const sum = String(y).split('').reduce((a, b) => a + Number(b), 0) + m + d
  return reduceToSingle(sum)
}

function nameNumber(name) {
  const RU_MAP = { а:1,б:2,в:3,г:4,д:5,е:6,ё:6,ж:7,з:8,и:9,й:1,к:2,л:3,м:4,н:5,о:7,п:8,р:9,с:1,т:2,у:3,ф:4,х:5,ц:6,ч:7,ш:8,щ:9,ъ:0,ы:1,ь:0,э:5,ю:6,я:7 }
  const sum = name.toLowerCase().split('').reduce((a, c) => a + (RU_MAP[c] ?? 0), 0)
  return reduceToSingle(sum)
}

const LP_MEANINGS = {
  1: 'Лидер и первооткрыватель. Твоя миссия — прокладывать новые пути.',
  2: 'Дипломат и миротворец. Сила в партнёрстве и гармонии.',
  3: 'Творец и коммуникатор. Самовыражение — твой главный ресурс.',
  4: 'Строитель и практик. Надёжность и системный подход — твои козыри.',
  5: 'Искатель свободы. Перемены и разнообразие — источник твоей энергии.',
  6: 'Хранитель и наставник. Любовь и ответственность — твоя суть.',
  7: 'Мыслитель и исследователь. Истина — твоя главная ценность.',
  8: 'Организатор и управленец. Материальный успех — твоя область.',
  9: 'Гуманист и мудрец. Служение человечеству — твоё призвание.',
  11: 'Мастер-интуит. Высшая чувствительность и духовная миссия.',
  22: 'Мастер-строитель. Способность воплощать великие идеи в реальность.',
}

export function getNumerologyResult(inputs) {
  const lp = inputs.birth_date ? lifePathNumber(inputs.birth_date) : 7
  const nn = inputs.name ? nameNumber(inputs.name) : 5
  return {
    free: {
      title: 'Твоё число жизненного пути',
      number: lp,
      preview: LP_MEANINGS[lp] ?? LP_MEANINGS[7],
      teaser: 'Полный анализ включает число судьбы, число души, число личности, ключевые годы и персональный прогноз...',
    },
    paid: {
      lifePath: { number: lp, meaning: LP_MEANINGS[lp] ?? '' },
      nameNumber: { number: nn, meaning: `Число имени ${nn} раскрывает твою социальную маску — то, как тебя воспринимают окружающие.` },
      compatibility: `Числа ${lp} и ${nn} в сочетании указывают на твою уникальную энергетическую подпись.`,
      forecast: 'Персональный год и ключевые месяцы рассчитаны на основе твоих данных.',
    },
  }
}
