import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initQuiz, currentStep, setAnswer, canAdvance, advance, back, isComplete, progress } from './quizMachine.js'

const steps = [
  { id: 'a', required: true },
  { id: 'b', required: false },
  { id: 'c', required: true },
]

test('initQuiz стартует с нулевого шага и пустых ответов', () => {
  const s = initQuiz()
  assert.equal(s.index, 0)
  assert.deepEqual(s.answers, {})
})

test('canAdvance=false пока обязательный шаг без ответа', () => {
  const s = initQuiz()
  assert.equal(canAdvance(steps, s), false)
})

test('setAnswer + advance двигают индекс', () => {
  let s = initQuiz()
  s = setAnswer(s, 'a', '1990-01-01')
  assert.equal(canAdvance(steps, s), true)
  s = advance(steps, s)
  assert.equal(s.index, 1)
  assert.equal(currentStep(steps, s).id, 'b')
})

test('advance не двигает, если обязательный шаг пуст', () => {
  let s = initQuiz()
  s = advance(steps, s) // a обязателен, ответа нет
  assert.equal(s.index, 0)
})

test('необязательный шаг можно проскочить', () => {
  let s = { index: 1, answers: { a: 'x' } }
  assert.equal(canAdvance(steps, s), true)
})

test('back не уходит ниже нуля', () => {
  const s = back(initQuiz())
  assert.equal(s.index, 0)
})

test('isComplete=true когда индекс дошёл до конца', () => {
  let s = { index: 3, answers: {} }
  assert.equal(isComplete(steps, s), true)
  assert.equal(progress(steps, s), 1)
})
