import { test } from 'node:test'
import assert from 'node:assert/strict'
import { markOpened, getOpened, openedCount, resolveOpened, BLOCK_IDS } from './dayProgress.js'

function fakeStore() {
  const m = {}
  return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = v } }
}
const DAY1 = new Date('2026-07-11T12:00:00Z') // 15:00 МСК, день 20260711
const DAY2 = new Date('2026-07-12T12:00:00Z') // следующий день

test('BLOCK_IDS: четыре блока дашборда', () => {
  assert.deepEqual(BLOCK_IDS, ['card', 'number', 'mood', 'lunar'])
})

test('resolveOpened: другой день сбрасывает прогресс', () => {
  assert.deepEqual(resolveOpened({ day: '20260711', opened: { card: true } }, '20260712'), {})
  assert.deepEqual(resolveOpened({ day: '20260711', opened: { card: true } }, '20260711'), { card: true })
  assert.deepEqual(resolveOpened(null, '20260711'), {})
})

test('markOpened/getOpened: отмечает блоки за сегодня', () => {
  const s = fakeStore()
  markOpened('card', DAY1, s)
  markOpened('mood', DAY1, s)
  assert.deepEqual(getOpened(DAY1, s), { card: true, mood: true })
  assert.equal(openedCount(DAY1, s), 2)
})

test('markOpened: смена суток обнуляет счётчик', () => {
  const s = fakeStore()
  markOpened('card', DAY1, s)
  assert.equal(openedCount(DAY1, s), 1)
  assert.equal(openedCount(DAY2, s), 0) // новый день, авто-сброс
})

test('markOpened: игнорирует неизвестный id', () => {
  const s = fakeStore()
  markOpened('bogus', DAY1, s)
  assert.equal(openedCount(DAY1, s), 0)
})
