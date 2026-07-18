import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveBranch } from './horoLove.js'

test('resolveBranch: валидные ветки', () => {
  assert.equal(resolveBranch('suzheny'), 'suzheny')
  assert.equal(resolveBranch('return'), 'return')
  assert.equal(resolveBranch('block'), 'block')
})
test('resolveBranch: мусор -> null', () => {
  assert.equal(resolveBranch('nope'), null)
  assert.equal(resolveBranch(null), null)
  assert.equal(resolveBranch(''), null)
})
