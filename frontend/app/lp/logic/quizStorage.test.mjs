import { test } from 'node:test'
import assert from 'node:assert/strict'
import { serializeQuiz, deserializeQuiz } from './quizStorage.js'

test('round-trip сериализации', () => {
  const raw = serializeQuiz('matrix', { birth_date: '1990-01-01', focus: 'money' })
  assert.deepEqual(deserializeQuiz(raw, 'matrix'), { birth_date: '1990-01-01', focus: 'money' })
})

test('deserialize отклоняет чужой slug', () => {
  const raw = serializeQuiz('matrix', { a: 1 })
  assert.equal(deserializeQuiz(raw, 'tarot'), null)
})

test('deserialize не падает на мусоре', () => {
  assert.equal(deserializeQuiz('{{{', 'matrix'), null)
  assert.equal(deserializeQuiz('', 'matrix'), null)
})
