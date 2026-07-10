import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getBait } from './index.js'

test('getBait: несуществующий блок даёт видимый плейсхолдер', () => {
  const b = getBait('today', 'unknown', 'aries')
  assert.match(b, /^\[байт: today\.unknown\]$/)
})

test('getBait: заполненный блок возвращает реальную строку, не плейсхолдер', () => {
  const b = getBait('today', 'love', 'aries')
  assert.equal(typeof b, 'string')
  assert.doesNotMatch(b, /^\[байт:/)
})

test('getBait: выбор варианта детерминирован по сиду', () => {
  const a = getBait('today', 'love', 'aries')
  const b = getBait('today', 'love', 'aries')
  assert.equal(a, b)
})

import { getToday } from './index.js'

const TODAY = new Date('2026-07-09T12:00:00Z')

test('getToday: собирает живое небо и блоки, платные несут bait', () => {
  const r = getToday('aries', TODAY)
  // живое небо
  assert.equal(typeof r.sky.phase.name, 'string')
  assert.ok(r.sky.lunarDay >= 1 && r.sky.lunarDay <= 30)
  assert.equal(typeof r.sky.planetary.planet, 'string')
  assert.ok(Array.isArray(r.sky.retro))
  // блоки: 6 штук (mood/love/money/health/luck/advice)
  assert.equal(r.blocks.length, 6)
  const mood = r.blocks.find(b => b.id === 'mood')
  assert.equal(mood.free, true)
  assert.equal(typeof mood.text, 'string') // бесплатный -> строка
  const love = r.blocks.find(b => b.id === 'love')
  assert.equal(love.free, false)
  assert.equal(typeof love.text.teaser, 'string') // платный -> { teaser, body }
  assert.equal(typeof love.text.body, 'string')
  assert.equal(typeof love.bait, 'string')        // платный несёт байт
  assert.equal(mood.bait, undefined)               // бесплатный без байта
})

import { getPortrait, getLunar } from './index.js'

test('getPortrait: 6 блоков, core бесплатный (строка), остальные платные', () => {
  const r = getPortrait('leo')
  assert.equal(r.blocks.length, 6)
  const core = r.blocks.find(b => b.id === 'core')
  assert.equal(core.free, true)
  assert.equal(typeof core.text, 'string')
  const power = r.blocks.find(b => b.id === 'power')
  assert.equal(power.free, false)
  assert.equal(typeof power.text.teaser, 'string')
  assert.equal(typeof power.bait, 'string')
})

test('getLunar: сегодняшний день, сферы с рейтингами по 30 дней', () => {
  const r = getLunar(new Date('2026-07-09T12:00:00Z'))
  assert.ok(r.lunarDay >= 1 && r.lunarDay <= 30)
  assert.equal(typeof r.todayMeaning, 'string')
  assert.equal(r.spheres.length, 5)
  const beauty = r.spheres.find(s => s.id === 'beauty')
  assert.equal(beauty.ratings.length, 30)
  assert.ok(['good', 'neutral', 'bad'].includes(beauty.ratings[0])) // валидный рейтинг
})

import { normalizeBirth } from './index.js'

test('normalizeBirth: принимает валидную ISO-дату, отбрасывает мусор', () => {
  assert.equal(normalizeBirth('1990-11-29'), '1990-11-29')
  assert.equal(normalizeBirth(''), null)
  assert.equal(normalizeBirth('не дата'), null)
  assert.equal(normalizeBirth(null), null)
})
