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

test('getLanding отдаёт конфиг taro-him на движке live-reveal', () => {
  const l = getLanding('taro-him')
  assert.equal(l.slug, 'taro-him')
  assert.equal(l.engine, 'live-reveal')
  assert.equal(l.product, 'tarot')
  assert.equal(l.questions.length, 4)
})

test('getLanding отдаёт конфиг taro-terminal на движке terminal', () => {
  const l = getLanding('taro-terminal')
  assert.equal(l.slug, 'taro-terminal')
  assert.equal(l.engine, 'terminal')
  assert.equal(l.product, 'tarot')
  assert.equal(l.states.length, 8)
})

test('getLanding отдаёт конфиг horo-love на движке horo-love', () => {
  const l = getLanding('horo-love')
  assert.equal(l.slug, 'horo-love')
  assert.equal(l.engine, 'horo-love')
  assert.equal(l.product, 'horoscope')
  assert.equal(l.branchIds.length, 3)
  assert.ok(l.fork.options.length === 3)
})

test('getLanding отдаёт конфиг taro-porcha на движке diagnostic', () => {
  const l = getLanding('taro-porcha')
  assert.equal(l.slug, 'taro-porcha')
  assert.equal(l.engine, 'diagnostic')
  assert.equal(l.product, 'tarot')
  assert.equal(l.scan.symptoms.length, 9)
})

test('getLanding отдаёт конфиг rod на движке rod', () => {
  const l = getLanding('rod')
  assert.equal(l.slug, 'rod')
  assert.equal(l.engine, 'rod')
  assert.equal(l.product, 'matrix')
  assert.equal(l.theme, 'ancestry')
  assert.equal(l.quiz.steps.length, 8)
  const ids = l.quiz.steps.map(s => s.id)
  assert.equal(ids[0], 'mirror')
  assert.ok(ids.includes('birth_date'))
  assert.ok(ids.includes('name'))
  assert.equal(l.revealFields.length, 5)
})
