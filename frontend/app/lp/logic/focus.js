// Возвращает ключ аспекта MATRIX_CONTENT под выбранный на квизе запрос.
export function resolveFocusAspect(landing, focusValue, fallback = 'money') {
  const map = (landing && landing.focusToAspect) || {}
  return map[focusValue] || fallback
}
