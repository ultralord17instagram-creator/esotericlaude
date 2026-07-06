// Разбор: { blockId: { <число>: текст } }. Платные тексты — { teaser, body }.
// Бесплатный destiny — цельная строка. Реальные тексты пишутся отдельным чатом.
// Пустой объект = все ключи резолвятся в плейсхолдер (см. index.js getText).
export const BREAKDOWN_TEXTS = {
  destiny:  {}, // free, строки по числу 1..9,11,22
  karma:    {}, // { teaser, body } по числу
  ancestry: {},
  talents:  {},
  love:     {},
  money:    {},
}
