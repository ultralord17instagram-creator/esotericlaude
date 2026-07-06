import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SCENARIOS } from './scenarios.js'

test('в каждом наборе блоков ровно один бесплатный', () => {
  assert.equal(SCENARIOS.breakdown.blocks.filter(b => b.free).length, 1)
  assert.equal(SCENARIOS.compatibility.blocks.filter(b => b.free).length, 1)
  assert.equal(SCENARIOS.forecast.horizons.month.blocks.filter(b => b.free).length, 1)
  assert.equal(SCENARIOS.forecast.horizons.year.blocks.filter(b => b.free).length, 1)
})

test('id блоков уникальны внутри сценария', () => {
  for (const key of ['breakdown', 'compatibility']) {
    const ids = SCENARIOS[key].blocks.map(b => b.id)
    assert.equal(new Set(ids).size, ids.length, `дубль id в ${key}`)
  }
})
