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

import { moonPhase, lunarDay, REF_NEW_MOON, SYNODIC } from './astro.js'

test('moonPhase: опорная дата это новолуние, лунный день 1', () => {
  const ref = new Date(REF_NEW_MOON)
  assert.equal(moonPhase(ref).name, 'Новолуние')
  assert.equal(lunarDay(ref), 1)
})

test('moonPhase: середина цикла это полнолуние', () => {
  const half = new Date(REF_NEW_MOON + (SYNODIC / 2) * 86400000)
  assert.equal(moonPhase(half).name, 'Полнолуние')
})

test('lunarDay всегда в диапазоне 1..30', () => {
  for (const iso of ['2026-01-01', '2026-06-15', '2027-03-30', '2026-11-07']) {
    const ld = lunarDay(new Date(iso + 'T12:00:00Z'))
    assert.ok(ld >= 1 && ld <= 30, `лунный день ${ld} вне диапазона для ${iso}`)
  }
})
