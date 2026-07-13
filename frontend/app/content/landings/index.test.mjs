import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getLanding } from './index.js'

test('getLanding возвращает конфиг для существующего slug', () => {
  const l = getLanding('matrix')
  assert.equal(l.slug, 'matrix')
  assert.equal(l.quiz.steps.length, 5)
})

test('getLanding возвращает null для неизвестного slug', () => {
  assert.equal(getLanding('nope'), null)
})

test('каждый focus-вариант имеет маппинг в аспект', () => {
  const l = getLanding('matrix')
  const focusStep = l.quiz.steps.find(s => s.id === 'focus')
  for (const opt of focusStep.options) {
    assert.ok(l.focusToAspect[opt.value], `нет аспекта для focus=${opt.value}`)
  }
})
