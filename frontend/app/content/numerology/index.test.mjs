import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getText, buildBreakdown, buildForecast } from './index.js'

const TODAY = new Date('2026-07-05T12:00:00Z')

test('getText: отсутствующий ключ даёт видимый плейсхолдер, не падает', () => {
  const t = getText({ scenario: 'breakdown', block: 'karma', key: 5 })
  // платный блок -> { teaser, body }, оба строки-плейсхолдеры
  assert.equal(typeof t.teaser, 'string')
  assert.equal(typeof t.body, 'string')
  assert.match(t.body, /karma/)
})

test('getText: бесплатный блок возвращает строку', () => {
  const t = getText({ scenario: 'breakdown', block: 'destiny', key: 5, free: true })
  assert.equal(typeof t, 'string')
})

test('buildBreakdown собирает 6 блоков с числами и флагом free', () => {
  const r = buildBreakdown({ date: '1990-11-29', name: 'Анна' })
  assert.equal(r.blocks.length, 6)
  const destiny = r.blocks.find(b => b.id === 'destiny')
  assert.equal(destiny.number, 5)
  assert.equal(destiny.free, true)
  const talents = r.blocks.find(b => b.id === 'talents')
  assert.equal(talents.number, 5) // expression('Анна')
})

test('buildForecast(day) выбирает вариант детерминированно и он бесплатный', () => {
  const r = buildForecast({ date: '1990-11-29', horizon: 'day', today: TODAY })
  assert.equal(r.number, 8) // personalDay
  assert.equal(r.free, true)
})
