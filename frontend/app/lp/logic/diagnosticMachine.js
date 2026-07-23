// Чистая логика движка diagnostic: скоринг симптомов, бакет heavy/light,
// детерминированный подбор карт со смещением по ролям (теневые на A/B, выходные на C),
// сборка расклада и финала. Без React и без сети, тестируется node:test.
// Переиспользует хелперы revealMachine (нормализация имени, хеш-сид, подбор карт).
import { DECK } from '../../content/tarot/deck.js'
import { normalizeName, interpolate, seedFromName, pickCards } from './revealMachine.js'

// Реэкспорт: клиент (DiagnosticClient) берёт нормализацию имени из этого фасада.
export { normalizeName }

// Теневые арканы (проблема): Луна, Дьявол, Башня, Смерть, Повешенный, Жрица -> слоты A и B.
export const SHADOW_NUMBERS = [18, 15, 16, 13, 12, 2]
// Выходные арканы (что дальше): Звезда, Солнце, Суд, Мир, Умеренность, Сила -> слот C.
export const EXIT_NUMBERS = [17, 19, 20, 21, 14, 8]

const cardsByNumbers = (nums) => nums.map((n) => DECK.find((c) => c.number === n))
export const SHADOW_DECK = cardsByNumbers(SHADOW_NUMBERS)
export const EXIT_DECK = cardsByNumbers(EXIT_NUMBERS)

// Сумма весов отмеченных симптомов. Неизвестные ключи игнорируются.
export function scoreTicks(ticks, symptoms) {
  const weight = new Map(symptoms.map((s) => [s.key, s.weight]))
  return (ticks || []).reduce((sum, k) => sum + (weight.get(k) || 0), 0)
}

// Порог включительно: score >= T это heavy, иначе light.
export function bucketFor(score, threshold) {
  return score >= threshold ? 'heavy' : 'light'
}

// Стабильная к порядку подпись набора симптомов (для сида).
export function ticksSignature(ticks) {
  return [...(ticks || [])].sort().join(',')
}

// Строка-сид: имя|бакет|подпись симптомов. Один ввод -> один расклад.
export function buildSeed(name, bucket, ticks) {
  return `${name}|${bucket}|${ticksSignature(ticks)}`
}

// Детерминированный выбор варианта строки из пула (опенер/хвост) по сиду.
export function pickVariant(seedStr, arr) {
  if (!arr || arr.length === 0) return ''
  return arr[seedFromName(seedStr) % arr.length]
}

// Три карты со смещением по ролям: [A, B] различны из теневого набора, C из выходного.
export function pickReadingCards(seedStr) {
  const [a, b] = pickCards(seedStr, 2, SHADOW_DECK)
  const [c] = pickCards(`${seedStr}|c`, 1, EXIT_DECK)
  return [a, b, c]
}

// Собрать расклад: 3 карты, 3 текста слотов, финал по карте источника (слот B) и бакету.
// slotA = опенер[бакет] + вступление карты A; slotB = вступление карты B (источник);
// slotC = вступление карты C + хвост[бакет]. Все токены {name} подставляются.
export function buildReading(copy, { name = '', ticks = [] } = {}) {
  const cleanName = normalizeName(name)
  const score = scoreTicks(ticks, copy.scan.symptoms)
  const bucket = bucketFor(score, copy.scan.threshold)
  const seedStr = buildSeed(cleanName, bucket, ticks)
  const [cardA, cardB, cardC] = pickReadingCards(seedStr)
  const fill = (t) => interpolate(t, cleanName)

  const openerA = pickVariant(`${seedStr}|opA`, copy.slots.A.openers[bucket])
  const tailC = pickVariant(`${seedStr}|tailC`, copy.slots.C.tails[bucket])

  const slots = [
    fill(`${openerA} ${copy.slots.A.intros[cardA.number]}`),
    fill(copy.slots.B.intros[cardB.number]),
    fill(`${copy.slots.C.intros[cardC.number]} ${tailC}`),
  ]

  return {
    score,
    bucket,
    cards: [cardA, cardB, cardC],
    sourceCard: cardB,
    slots,
    final: {
      heading: fill(copy.final.headings[bucket][cardB.number]),
      listIntro: copy.final.listIntro,
      promises: copy.final.promises,
      cta: copy.final.cta,
    },
  }
}
