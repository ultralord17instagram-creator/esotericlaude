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

import { moscowDayKey, dayVariantIndex } from './astro.js'

test('moscowDayKey: целочисленный ключ дня в TZ Москвы', () => {
  const k = moscowDayKey(new Date('2026-07-09T00:00:00Z')) // 03:00 по Москве
  assert.equal(k, 20260709)
})

test('dayVariantIndex: детерминированный индекс по модулю count', () => {
  const today = new Date('2026-07-09T12:00:00Z')
  assert.equal(dayVariantIndex(today, 4), 20260709 % 4)
  assert.equal(dayVariantIndex(today, 0), 0) // защита от деления на ноль
})
