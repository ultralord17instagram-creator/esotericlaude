// Чистая логика движка live-reveal: нормализация имени, детерминированный
// подбор карт по имени, сборка расклада. Без React и без сети, тестируется node:test.
import { DECK } from '../../content/tarot/deck.js'

const MAX_NAME = 24

// Обрезать до MAX_NAME, схлопнуть пробелы, срезать управляющие символы.
export function normalizeName(raw) {
  if (!raw) return ''
  return String(raw)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME)
}

export function interpolate(text, name) {
  return String(text).split('{name}').join(name)
}

// Детерминированный 32-битный хеш строки (xmur3-подобный).
export function seedFromName(name) {
  let h = 1779033703 ^ name.length
  for (let i = 0; i < name.length; i += 1) {
    h = Math.imul(h ^ name.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

// mulberry32 PRNG от целочисленного сида.
function prng(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// count различных карт из колоды, детерминированно по имени.
export function pickCards(name, count, deck = DECK) {
  const rand = prng(seedFromName(name))
  const pool = deck.slice()
  const picked = []
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const j = Math.floor(rand() * pool.length)
    picked.push(pool.splice(j, 1)[0])
  }
  return picked
}

// Собрать тексты расклада для выбранного вопроса и имени: 3 толкования + байт «Твой ход».
// Лица карт (картинки колоды) назначает клиент через pickCards по имени — тексты от них не зависят.
export function buildReading(question, rawName) {
  const name = normalizeName(rawName)
  return {
    name,
    interps: question.interps.map((t) => interpolate(t, name)),
    actionBait: interpolate(question.actionBait, name),
  }
}
