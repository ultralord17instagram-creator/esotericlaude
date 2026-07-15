import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeName, interpolate, seedFromName, pickCards, buildReveal } from './revealMachine.js'

const question = {
  id: 'return',
  lockTitle: 'Вернётся ли {name} к тебе',
  cards: [
    { position: 'Где он сейчас', text: '{name} думает о тебе.' },
    { position: 'Что внутри', text: 'Его тянет к тебе.' },
    { position: 'Поворот', text: 'Рядом карта риска.' },
  ],
  lockText: 'Вернётся ли {name}, ответ закрыт',
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
  const a = pickCards('Артём', 4)
  const b = pickCards('Артём', 4)
  assert.deepEqual(a.map((c) => c.number), b.map((c) => c.number))
  assert.equal(a.length, 4)
  assert.equal(new Set(a.map((c) => c.number)).size, 4)
})

test('buildReveal: 3 открытых + 1 закрытая, {name} подставлен, детерминизм', () => {
  const r1 = buildReveal(question, ' Артём ')
  const r2 = buildReveal(question, 'Артём')
  assert.equal(r1.cards.length, 4)
  assert.equal(r1.cards.filter((c) => c.locked).length, 1)
  assert.equal(r1.cards[3].locked, true)
  assert.equal(r1.cards[0].locked, false)
  assert.ok(r1.cards[0].text.includes('Артём'))
  assert.ok(!r1.cards[0].text.includes('{name}'))
  assert.equal(r1.cards[3].position, 'Вернётся ли Артём к тебе')
  assert.deepEqual(r1.cards.map((c) => c.card.number), r2.cards.map((c) => c.card.number))
})
