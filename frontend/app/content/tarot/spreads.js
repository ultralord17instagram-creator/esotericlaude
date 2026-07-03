// Источник правды о сценариях гадания. Код читает конфиг, а не хардкодит сценарии.
// Числовые лимиты (freeLimit) дублируются в backend (app/services/tarot_limits.py) —
// синхронизировать вручную при изменении.
export const SPREADS = [
  {
    id: 'day',
    name: 'Карта дня',
    cardCount: 1,
    picksFromDeck: false,   // не выбирается — общая на сутки
    dailyForAll: true,      // одна на всех, детерминированно от даты (сид)
    positions: ['День'],
    themes: null,
    demo: false,            // показывается целиком
    tableCards: 1,          // одна рубашка
  },
  {
    id: 'three',
    name: 'Три карты',
    cardCount: 3,
    picksFromDeck: true,
    positions: ['Прошлое', 'Настоящее', 'Будущее'],  // структурные подзаголовки
    tableCards: 8,          // 8 рубашек в веере
    themes: [
      { id: 'ppf',       name: 'Прошлое, Настоящее, Будущее', paid: false, freeLimit: 1 },
      { id: 'shadow',    name: 'Теневая сторона',             paid: true  },
      { id: 'purpose',   name: 'Предназначение',              paid: true  },
      { id: 'partner',   name: 'Идеальный партнёр',           paid: true  },
      { id: 'ancestral', name: 'Проклятие рода',              paid: true, sensitive: true },
    ],
    demo: { freeCards: 1 }, // ЗАДЕЛ: без подписки — вводная + 1 позиция, остальное под пейволом
  },
  {
    id: 'yesno',
    name: 'Да / Нет',
    cardCount: 1,
    picksFromDeck: true,
    needsQuestion: true,    // требуется ввод вопроса
    positions: ['Ответ'],
    tableCards: 8,
    themes: null,
    freeLimit: 3,           // 3 вопроса в сутки бесплатно
    demo: false,
  },
]

export const getSpread = (id) => SPREADS.find((s) => s.id === id) ?? null

export const getTheme = (spreadId, themeId) => {
  const spread = getSpread(spreadId)
  return spread?.themes?.find((t) => t.id === themeId) ?? null
}
