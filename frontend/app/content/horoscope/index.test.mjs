import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getBait } from './index.js'

test('getBait: несуществующий блок даёт видимый плейсхолдер', () => {
  const b = getBait('today', 'unknown', 'aries')
  assert.match(b, /^\[байт: today\.unknown\]$/)
})

test('getBait: заполненный блок возвращает реальную строку, не плейсхолдер', () => {
  const b = getBait('today', 'love', 'aries')
  assert.equal(typeof b, 'string')
  assert.doesNotMatch(b, /^\[байт:/)
})

test('getBait: выбор варианта детерминирован по сиду', () => {
  const a = getBait('today', 'love', 'aries')
  const b = getBait('today', 'love', 'aries')
  assert.equal(a, b)
})
