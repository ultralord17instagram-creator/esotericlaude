import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TARO_HIM_COPY } from './taro-him-copy.js'

test('4 вопроса, у каждого 3 карты + lockText + lockTitle', () => {
  assert.equal(TARO_HIM_COPY.questions.length, 4)
  for (const q of TARO_HIM_COPY.questions) {
    assert.equal(q.cards.length, 3)
    assert.ok(q.lockText && q.lockTitle && q.label && q.id)
  }
})

test('пейвол: ровно 4 выгоды и заголовок с {name}', () => {
  assert.equal(TARO_HIM_COPY.paywall.payoffs.length, 4)
  assert.ok(TARO_HIM_COPY.paywall.heading.includes('{name}'))
})

test('нигде нет длинного тире', () => {
  const blob = JSON.stringify(TARO_HIM_COPY)
  assert.ok(!blob.includes('—'))
})
