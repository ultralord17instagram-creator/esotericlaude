// Тонкий клиент над backend-лимитами Таро.
// Same-origin, HttpOnly cookie access_token шлётся автоматически.
import { consumeGuest } from './guestLimits'
import { DEV_ENABLED, DEV_SESSION } from '../../devConfig'

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
  // DEV: имитация без токена — сервер вернул бы 401, поэтому решаем на клиенте.
  // subscriber → безлимит; free/guest → мягкий гостевой лимит в localStorage.
  if (DEV_ENABLED) {
    if (DEV_SESSION === 'subscriber') return { allowed: true, remaining: null }
    return consumeGuest(spreadId, themeId, limit)
  }
  if (user) return consumeUsage(spreadId, themeId)
  return consumeGuest(spreadId, themeId, limit)
}
