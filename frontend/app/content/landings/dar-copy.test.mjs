import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  revealFields, DAR_PACK, buildReveal, arcanaFromMatrix,
} from './dar-copy.js'
import { calculateMatrix } from '../matrix.js'

const BLOCK_IDS = ['gift', 'whyAsleep', 'realization', 'mission', 'firstStep']

test('revealFields: 5 блоков, 2 открытых, 3 залоченных, правильные id/порядок', () => {
  assert.deepEqual(revealFields.map(f => f.id), BLOCK_IDS)
  assert.deepEqual(revealFields.filter(f => !f.locked).map(f => f.id), ['gift', 'whyAsleep'])
  assert.deepEqual(revealFields.filter(f => f.locked).map(f => f.id),
    ['realization', 'mission', 'firstStep'])
})

test('DAR_PACK: Аркан 1 заполнен всеми блоками, без длинного тире', () => {
  const d = DAR_PACK[1]
  assert.ok(d, 'нет аркана 1')
  for (const key of BLOCK_IDS) {
    assert.equal(typeof d[key], 'string')
    assert.ok(d[key].length > 0, `1.${key} пустой`)
    assert.ok(!d[key].includes('—'), `1.${key} содержит длинное тире`)
  }
})

test('arcanaFromMatrix: 1..22 из точки личного предназначения', () => {
  const m = calculateMatrix('1990-01-01')
  const a = arcanaFromMatrix(m)
  assert.equal(a, m.purposes.personal.adult)
  assert.ok(Number.isInteger(a) && a >= 1 && a <= 22, `аркан вне диапазона: ${a}`)
})

test('buildReveal: 5 полей с label/locked/value для заполненного аркана', () => {
  const fields = buildReveal(1, { name: 'Аня' })
  assert.equal(fields.length, 5)
  assert.deepEqual(fields.map(f => f.id), BLOCK_IDS)
  for (const f of fields) {
    assert.equal(typeof f.label, 'string')
    assert.equal(typeof f.locked, 'boolean')
    assert.equal(typeof f.value, 'string')
    assert.ok(f.value.length > 0)
  }
})

test('buildReveal: токен {name} подставлен, литерал не остаётся', () => {
  const fields = buildReveal(1, { name: 'Аня' })
  for (const f of fields) assert.ok(!f.value.includes('{name}'), `${f.id}: остался {name}`)
})

test('buildReveal: фолбэк на Аркан 1, пока пак не полон', () => {
  // Аркан без прозы должен не падать, а отдавать эталон.
  const fields = buildReveal(999, { name: 'Аня' })
  assert.equal(fields.length, 5)
  assert.deepEqual(fields.map(f => f.value), buildReveal(1, { name: 'Аня' }).map(f => f.value))
})

test('детерминизм: одинаковый вход -> одинаковый выход', () => {
  assert.deepEqual(buildReveal(1, { name: 'Аня' }), buildReveal(1, { name: 'Аня' }))
})
