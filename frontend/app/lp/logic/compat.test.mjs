import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateMatrix, reduce } from '../../content/matrix.js'
import { relationshipPoint, compatibleCore } from './compat.js'

test('точка отношений это female1', () => {
  const { nodes } = calculateMatrix('1990-05-12')
  assert.equal(relationshipPoint(nodes), nodes.female1)
})

test('число совместимости детерминировано и лежит в 1..22', () => {
  const a = calculateMatrix('1990-05-12').nodes
  const b = calculateMatrix('1990-05-12').nodes
  const v = compatibleCore(a)
  assert.equal(v, compatibleCore(b))
  assert.ok(v >= 1 && v <= 22)
})

test('число совместимости = reduce(center + female1)', () => {
  const { nodes } = calculateMatrix('2001-11-30')
  assert.equal(compatibleCore(nodes), reduce(nodes.center + nodes.female1))
})
