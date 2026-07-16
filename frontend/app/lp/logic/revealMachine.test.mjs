import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeName, interpolate, seedFromName, pickCards, buildReading } from './revealMachine.js'

const question = {
  id: 'return',
  interps: [
    '{name} думает о тебе.',
    'Его тянет к тебе.',
    'Рядом карта риска для {name}.',
  ],
  actionBait: 'Сделай шаг, и {name} сам вернётся.',
}

test('normalizeName обрезает, схлопывает пробелы, режет управляющие символы', () => {
  assert.equal(normalizeName('  Артём\t '), 'Артём')
  assert.equal(normalizeName('a'.repeat(50)).length, 24)
  assert.equal(normalizeName(null), '')
})

test('interpolate заменяет все {name}', () => {
  assert.equal(interpolate('{name} и {name}', 'Артём'), 'Артём и Артём')
})

test('seedFromName детерминирован и различает имена', () => {
  assert.equal(seedFromName('Артём'), seedFromName('Артём'))
  assert.notEqual(seedFromName('Артём'), seedFromName('Игорь'))
})

test('pickCards: детерминирован по имени, без дублей, нужное количество', () => {
  const a = pickCards('Артём', 9)
  const b = pickCards('Артём', 9)
  assert.deepEqual(a.map((c) => c.number), b.map((c) => c.number))
  assert.equal(a.length, 9)
  assert.equal(new Set(a.map((c) => c.number)).size, 9)
})

test('buildReading: 3 толкования + байт, {name} подставлен, детерминизм', () => {
  const r1 = buildReading(question, ' Артём ')
  const r2 = buildReading(question, 'Артём')
  assert.equal(r1.name, 'Артём')
  assert.equal(r1.interps.length, 3)
  assert.ok(r1.interps[0].includes('Артём'))
  assert.ok(!r1.interps[0].includes('{name}'))
  assert.ok(r1.actionBait.includes('Артём'))
  assert.deepEqual(r1.interps, r2.interps)
})
