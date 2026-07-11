import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getText, getBait, buildBreakdown, buildForecast, buildCompatibility } from './index.js'
import { normalizeBirth } from './index.js'

const TODAY = new Date('2026-07-05T12:00:00Z')

test('getText: отсутствующий ключ даёт видимый плейсхолдер, не падает', () => {
  // key 999 не существует ни при каком наполнении (числа только 1..9,11,22),
  // поэтому тест проверяет фолбэк независимо от того, сколько текстов уже залито.
  const t = getText({ scenario: 'breakdown', block: 'karma', key: 999 })
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

test('getBait: раздел без вариантов даёт видимый плейсхолдер', () => {
  // destiny — бесплатный блок, байта не имеет и в BAIT не входит,
  // поэтому остаётся стабильным примером плейсхолдера при любом наполнении.
  const b = getBait({ scenario: 'breakdown', block: 'destiny', number: 5 })
  assert.match(b, /^\[байт: breakdown\.destiny\]$/)
})

test('getBait: заполненный раздел возвращает реальный текст (не плейсхолдер)', () => {
  const b = getBait({ scenario: 'compatibility', block: 'fidelity', number: '5-8' })
  assert.equal(typeof b, 'string')
  assert.ok(!b.startsWith('[байт'), 'ожидали реальный байт-текст, а не плейсхолдер')
})

test('getBait: выбор варианта детерминирован по числу', () => {
  const a = getBait({ scenario: 'compatibility', block: 'fidelity', number: '5-8' })
  const b = getBait({ scenario: 'compatibility', block: 'fidelity', number: '5-8' })
  assert.equal(a, b) // один и тот же вход -> один и тот же вариант
})

test('buildCompatibility: платный блок несёт bait, бесплатный — нет', () => {
  const r = buildCompatibility({ date: '1990-11-29', name: 'Анна', date2: '1988-05-08', name2: 'Пётр' })
  const fidelity = r.blocks.find(b => b.id === 'fidelity')
  const general = r.blocks.find(b => b.id === 'general')
  assert.equal(typeof fidelity.bait, 'string') // платный -> есть байт
  assert.equal(general.bait, undefined)         // бесплатный -> байт не нужен
})

test('normalizeBirth: валидная ISO-дата или null', () => {
  assert.equal(normalizeBirth('1990-11-29'), '1990-11-29')
  assert.equal(normalizeBirth(''), null)
  assert.equal(normalizeBirth('не дата'), null)
  assert.equal(normalizeBirth(null), null)
})
