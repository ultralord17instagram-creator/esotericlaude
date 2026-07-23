import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SHADOW_NUMBERS, EXIT_NUMBERS, SHADOW_DECK, EXIT_DECK,
  scoreTicks, bucketFor, ticksSignature, buildSeed, pickVariant, pickReadingCards, buildReading,
} from './diagnosticMachine.js'

// Мини-фикстура копирайта: покрывает все теневые/выходные арканы и оба бакета.
const SHADOW = [18, 15, 16, 13, 12, 2]
const EXIT = [17, 19, 20, 21, 14, 8]
const mapNums = (nums, tag) => Object.fromEntries(nums.map((n) => [n, `${tag}${n}`]))
const COPY = {
  scan: {
    threshold: 4,
    symptoms: [
      { key: 'a', label: 'A', weight: 1 },
      { key: 'b', label: 'B', weight: 2 },
      { key: 'c', label: 'C', weight: 1 },
    ],
  },
  slots: {
    A: { openers: { heavy: ['H-open'], light: ['L-open'] }, intros: mapNums(SHADOW, 'A') },
    B: { intros: mapNums(SHADOW, 'B') },
    C: { intros: mapNums(EXIT, 'C'), tails: { heavy: ['H-tail'], light: ['L-tail'] } },
  },
  final: {
    headings: { heavy: mapNums(SHADOW, 'FH'), light: mapNums(SHADOW, 'FL') },
    listIntro: 'LI', promises: ['p1', 'p2', 'p3'], cta: 'Узнать',
  },
}

test('теневой и выходной наборы: по 6 арканов, не пересекаются', () => {
  assert.deepEqual(SHADOW_NUMBERS, [18, 15, 16, 13, 12, 2])
  assert.deepEqual(EXIT_NUMBERS, [17, 19, 20, 21, 14, 8])
  assert.equal(SHADOW_DECK.length, 6)
  assert.equal(EXIT_DECK.length, 6)
  assert.ok(SHADOW_DECK.every((c) => c && c.ru))          // валидные карты из колоды
  const overlap = SHADOW_NUMBERS.filter((n) => EXIT_NUMBERS.includes(n))
  assert.equal(overlap.length, 0)
})

test('scoreTicks: сумма весов, пустой и неизвестный ключ дают 0', () => {
  assert.equal(scoreTicks([], COPY.scan.symptoms), 0)
  assert.equal(scoreTicks(['b'], COPY.scan.symptoms), 2)
  assert.equal(scoreTicks(['a', 'b', 'c'], COPY.scan.symptoms), 4)
  assert.equal(scoreTicks(['zzz'], COPY.scan.symptoms), 0)
})

test('bucketFor: порог включительно даёт heavy', () => {
  assert.equal(bucketFor(4, 4), 'heavy')
  assert.equal(bucketFor(5, 4), 'heavy')
  assert.equal(bucketFor(3, 4), 'light')
  assert.equal(bucketFor(0, 4), 'light')
})

test('ticksSignature стабильна к порядку, buildSeed склеивает', () => {
  assert.equal(ticksSignature(['b', 'a']), ticksSignature(['a', 'b']))
  assert.equal(buildSeed('Аня', 'heavy', ['b', 'a']), 'Аня|heavy|a,b')
})

test('pickVariant детерминирован и в границах массива', () => {
  const arr = ['x', 'y']
  assert.equal(pickVariant('seed', arr), pickVariant('seed', arr))
  assert.ok(arr.includes(pickVariant('seed', arr)))
  assert.equal(pickVariant('seed', []), '')
})

test('pickReadingCards: A,B из теневого набора и различны, C из выходного', () => {
  const [a, b, c] = pickReadingCards('Аня|heavy|a,b')
  assert.ok(SHADOW_NUMBERS.includes(a.number))
  assert.ok(SHADOW_NUMBERS.includes(b.number))
  assert.notEqual(a.number, b.number)
  assert.ok(EXIT_NUMBERS.includes(c.number))
  // детерминизм
  const again = pickReadingCards('Аня|heavy|a,b')
  assert.deepEqual(again.map((x) => x.number), [a, b, c].map((x) => x.number))
})

test('buildReading: детерминизм и сборка heavy', () => {
  const r1 = buildReading(COPY, { name: 'Аня', ticks: ['a', 'b', 'c'] })
  const r2 = buildReading(COPY, { name: 'Аня', ticks: ['c', 'a', 'b'] }) // порядок не важен
  assert.deepEqual(r1, r2)
  assert.equal(r1.bucket, 'heavy')
  assert.equal(r1.cards.length, 3)
  assert.equal(r1.slots.length, 3)
  const src = r1.cards[1].number
  // финал берётся по карте источника (слот B) и бакету
  assert.equal(r1.final.heading, `FH${src}`)
  // слот A = опенер бакета + вступление карты A; слот C = вступление карты C + хвост бакета
  assert.ok(r1.slots[0].startsWith('H-open'))
  assert.ok(r1.slots[0].includes(`A${r1.cards[0].number}`))
  assert.ok(r1.slots[2].includes('H-tail'))
})

test('buildReading: пустая шкала -> light, но расклад полный (нет тупика)', () => {
  const r = buildReading(COPY, { name: '', ticks: [] })
  assert.equal(r.bucket, 'light')
  assert.equal(r.cards.length, 3)
  assert.ok(r.slots.every((s) => s && s.length > 0))     // 3 непустых толкования
  assert.ok(r.final.heading && r.final.heading.length > 0) // финал есть
  assert.ok(r.slots[0].startsWith('L-open'))
  assert.ok(r.slots[2].includes('L-tail'))
})
