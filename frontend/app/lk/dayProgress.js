// Факт «открыл блок дня» за сегодня. localStorage, сброс по суткам МСК.
// Осознанно на устройстве: контент дня детерминирован, теряется только галочка
// (дизайн §5.4). Кросс-девайс синхронизация вне скоупа.
import { moscowDayKey } from '../content/tarot/index.js'

export const BLOCK_IDS = ['card', 'number', 'mood', 'lunar']
const KEY = 'lk.day_opened'

// Реальное хранилище браузера или null (SSR / приватный режим).
function browserStore() {
  try { return typeof localStorage !== 'undefined' ? localStorage : null } catch { return null }
}

function readRaw(store) {
  try { return JSON.parse(store.getItem(KEY) || 'null') } catch { return null }
}
function writeRaw(store, value) {
  try { store.setItem(KEY, JSON.stringify(value)) } catch {}
}

// Чистая: по сырому состоянию и ключу сегодняшнего дня вернуть карту открытых.
// Разошёлся день -> пустая карта (авто-сброс).
export function resolveOpened(raw, day) {
  if (!raw || raw.day !== day) return {}
  return raw.opened || {}
}

// Карта открытых блоков за сегодня. { card?: true, ... }.
export function getOpened(now = new Date(), store = browserStore()) {
  if (!store) return {}
  return resolveOpened(readRaw(store), String(moscowDayKey(now)))
}

// Отметить блок открытым за сегодня. Неизвестный id игнорируется.
export function markOpened(blockId, now = new Date(), store = browserStore()) {
  if (!store || !BLOCK_IDS.includes(blockId)) return
  const day = String(moscowDayKey(now))
  const opened = { ...resolveOpened(readRaw(store), day), [blockId]: true }
  writeRaw(store, { day, opened })
}

// Сколько из четырёх блоков открыто сегодня.
export function openedCount(now = new Date(), store = browserStore()) {
  const opened = getOpened(now, store)
  return BLOCK_IDS.filter(id => opened[id]).length
}
