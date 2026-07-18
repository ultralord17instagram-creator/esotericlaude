import { test } from 'node:test'
import assert from 'node:assert/strict'
import { AGE_POOL, INITIALS, MONTHS, LETTER_TEMPLATE, MONTH_TEMPLATE } from './pools.js'

test('пулы заполнены', () => {
  assert.equal(AGE_POOL.length, 3)
  assert.equal(INITIALS.length, 12)
  assert.equal(MONTHS.length, 12)
  assert.ok(LETTER_TEMPLATE.includes('{L}'))
  assert.ok(MONTH_TEMPLATE.includes('{month}'))
})
