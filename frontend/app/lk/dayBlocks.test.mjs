import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDayBlocks, DAY_BLOCKS } from './dayBlocks.js'

const TODAY = new Date('2026-07-11T12:00:00Z')

test('DAY_BLOCKS: четыре блока в фиксированном порядке', () => {
  assert.deepEqual(DAY_BLOCKS.map(b => b.id), ['card', 'number', 'mood', 'lunar'])
})

test('buildDayBlocks: с датой рождения все четыре доступны и несут контент', () => {
  const blocks = buildDayBlocks({ birth: '1990-11-29', today: TODAY })
  assert.equal(blocks.length, 4)
  assert.ok(blocks.every(b => b.available))
  const byId = Object.fromEntries(blocks.map(b => [b.id, b]))
  assert.equal(typeof byId.card.content.name, 'string')
  assert.equal(typeof byId.card.content.message, 'string')
  assert.ok(Number.isInteger(byId.number.content.number))
  assert.equal(typeof byId.number.content.text, 'string')
  assert.equal(typeof byId.mood.content.sign, 'string')
  assert.equal(typeof byId.mood.content.text, 'string')
  assert.ok(byId.lunar.content.lunarDay >= 1 && byId.lunar.content.lunarDay <= 30)
})

test('buildDayBlocks: без даты карта и луна доступны, число и настрой нет', () => {
  const byId = Object.fromEntries(buildDayBlocks({ birth: null, today: TODAY }).map(b => [b.id, b]))
  assert.equal(byId.card.available, true)
  assert.equal(byId.lunar.available, true)
  assert.equal(byId.number.available, false)
  assert.equal(byId.number.content, null)
  assert.equal(byId.mood.available, false)
  assert.equal(byId.mood.content, null)
})

test('buildDayBlocks: детерминирован по дате', () => {
  const a = buildDayBlocks({ birth: '1990-11-29', today: TODAY })
  const b = buildDayBlocks({ birth: '1990-11-29', today: TODAY })
  assert.deepEqual(a.find(x => x.id === 'card').content, b.find(x => x.id === 'card').content)
})
