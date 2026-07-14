import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getLanding } from './index.js'

test('getLanding отдаёт конфиг love', () => {
  const l = getLanding('love')
  assert.equal(l.slug, 'love')
  assert.equal(l.quiz.steps.length, 9)
})

test('в квизе love нет шагов пол и focus', () => {
  const l = getLanding('love')
  const ids = l.quiz.steps.map(s => s.id)
  assert.ok(!ids.includes('gender'))
  assert.ok(!ids.includes('focus'))
  assert.ok(ids.includes('birth_date'))
  assert.ok(ids.includes('name'))
})

test('старый matrix удалён из реестра', () => {
  assert.equal(getLanding('matrix'), null)
})

test('неизвестный slug это null', () => {
  assert.equal(getLanding('nope'), null)
})
