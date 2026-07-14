import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeReturnPath } from './returnPath.js'

test('пропускает внутренний путь лендинга', () => {
  assert.equal(safeReturnPath('/lp/love'), '/lp/love')
})

test('отбрасывает внешние и мусорные значения', () => {
  assert.equal(safeReturnPath('https://evil.com'), null)
  assert.equal(safeReturnPath('//evil.com'), null)
  assert.equal(safeReturnPath('/lk'), null)
  assert.equal(safeReturnPath(null), null)
  assert.equal(safeReturnPath(''), null)
})
