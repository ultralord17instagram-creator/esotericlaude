// Безопасный путь возврата после оплаты. Разрешаем только внутренние лендинги
// /lp/<slug>, чтобы исключить open redirect.
export function safeReturnPath(value) {
  if (typeof value !== 'string') return null
  if (!/^\/lp\/[a-z0-9-]+$/i.test(value)) return null
  return value
}
