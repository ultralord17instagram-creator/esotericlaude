// TODO(content): заменить плейсхолдеры реальными текстами. Тон 'ancestral' — мягкий/поддерживающий.
// Модель 3: цельный текст на пару «тема + карта»; от позиции (Прошлое/Настоящее/Будущее) НЕ зависит.
const cardsStub = (themeId) =>
  Object.fromEntries(
    Array.from({ length: 22 }, (_, n) => [n, `[Три карты · ${themeId} · аркан ${n}] Заготовка.`]),
  )

export const THREE_TEXTS = {
  ppf:       { intro: '[intro · ppf] Вводный абзац темы.',       cards: cardsStub('ppf') },
  shadow:    { intro: '[intro · shadow] Вводный абзац темы.',    cards: cardsStub('shadow') },
  purpose:   { intro: '[intro · purpose] Вводный абзац темы.',   cards: cardsStub('purpose') },
  partner:   { intro: '[intro · partner] Вводный абзац темы.',   cards: cardsStub('partner') },
  ancestral: { intro: '[intro · ancestral] Вводный абзац темы.', cards: cardsStub('ancestral') },
}
