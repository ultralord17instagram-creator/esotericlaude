// Тонкий клиент над backend-лимитами Таро.
// Same-origin, HttpOnly cookie access_token шлётся автоматически.
import { consumeGuest } from './guestLimits'

// Возвращает { 'three:ppf': number|null, 'yesno:': number|null } или null при ошибке.
// null у значения = безлимит (подписчик).
export async function fetchLimits() {
  const res = await fetch('/api/v1/tarot/limits')
  if (!res.ok) return null
  const data = await res.json()
  return data.limits
}

// Проверяет лимит/подписку и, если доступно, учитывает использование.
// Возвращает { allowed, remaining, reason }. reason: 'limit' | 'subscription' | 'auth' | 'error'.
export async function consumeUsage(spreadId, themeId = null) {
  const res = await fetch('/api/v1/tarot/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spread_id: spreadId, theme_id: themeId }),
  })
  if (res.status === 401) return { allowed: false, reason: 'auth' }
  if (!res.ok) return { allowed: false, reason: 'error' }
  return res.json()
}

// Единая проверка лимита: залогиненный → честный серверный лимит;
// гость → мягкий localStorage-лимит на `limit` использований в сутки.
// Подписчик проходит через сервер (тот вернёт allowed без лимита).
export async function requestUsage({ user, spreadId, themeId = null, limit }) {
  if (user) return consumeUsage(spreadId, themeId)
  return consumeGuest(spreadId, themeId, limit)
}
