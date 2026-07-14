import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveCopy, resolveSigns, LOCKED_QUESTIONS_TAIL } from './love-copy.js'

test('заточенные числа возвращают вердикт и вопрос-крючок', () => {
  for (const n of [1, 6, 12, 15]) {
    const c = resolveCopy(n)
    assert.ok(c.verdict && c.verdict.length > 0)
    assert.ok(c.hookQuestion && c.hookQuestion.length > 0)
  }
})

test('незаточенное число падает в фолбэк, но не пусто', () => {
  const c = resolveCopy(3)
  assert.ok(c.verdict.length > 0)
  assert.ok(c.hookQuestion.length > 0)
})

test('два общих вопроса-замка (Q2/Q3) на месте', () => {
  assert.equal(LOCKED_QUESTIONS_TAIL.length, 2)
  for (const q of LOCKED_QUESTIONS_TAIL) assert.ok(q.length > 0)
})

test('признаки партнёра всегда непусты (фолбэк на любое число)', () => {
  for (const n of [1, 7, 22]) {
    assert.ok(resolveSigns(n).length > 0)
  }
})
