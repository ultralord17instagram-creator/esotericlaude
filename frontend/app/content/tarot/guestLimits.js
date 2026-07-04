// Мягкий суточный лимит для НЕзалогиненных (гостей).
// Живёт в localStorage, обходится очисткой хранилища — это осознанно: платный
// контент (темы/полные толкования) всё равно строго за токеном на бэкенде,
// поэтому обход гостевого лимита не открывает платного. Сброс — по суткам МСК
// (тот же день, что на бэкенде и в «карте дня»).
import { moscowDayKey } from './index'

const KEY = 'tarot_guest_usage'

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function save(value) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {}
}

const slot = (spreadId, themeId) => `${spreadId}:${themeId || ''}`

// Текущее состояние счётчиков за сегодня (с авто-сбросом на новый день).
function today() {
  const day = String(moscowDayKey())
  const data = load()
  if (data.day !== day) return { day, counts: {} }
  return { day, counts: data.counts || {} }
}

// Проверить и, если доступно, учесть использование у гостя.
// Возвращает тот же формат, что серверный consumeUsage: { allowed, remaining, reason }.
export function consumeGuest(spreadId, themeId, limit) {
  const state = today()
  const key = slot(spreadId, themeId)
  const used = state.counts[key] ?? 0
  if (used >= limit) return { allowed: false, reason: 'limit' }
  state.counts[key] = used + 1
  save(state)
  return { allowed: true, remaining: limit - state.counts[key] }
}

// Остаток гостевых использований на сегодня (для UI).
export function guestRemaining(spreadId, themeId, limit) {
  const state = today()
  return Math.max(0, limit - (state.counts[slot(spreadId, themeId)] ?? 0))
}
