// TODO(content): заменить плейсхолдеры. Полюс yes/no берётся из DECK.yesno, здесь — только текст.
// Ключ — номер аркана (0..21).
export const YESNO_TEXTS = Object.fromEntries(
  Array.from({ length: 22 }, (_, n) => [n, `[Да/Нет · аркан ${n}] Поддерживающий текст-заготовка.`]),
)
