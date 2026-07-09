import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sign } from './astro.js'

test('sign: дата определяет знак и латинский id', () => {
  assert.equal(sign('1990-11-29').id, 'sagittarius') // Стрелец
  assert.equal(sign('1988-05-08').id, 'taurus')      // Телец
  assert.equal(sign('2000-01-10').id, 'capricorn')   // Козерог (начало года)
  assert.equal(sign('2000-12-25').id, 'capricorn')   // Козерог (конец года)
  assert.equal(sign('1995-03-21').name, 'Овен')      // граница
})
