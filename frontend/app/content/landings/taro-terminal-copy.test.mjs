import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TARO_TERMINAL_COPY } from './taro-terminal-copy.js'
import { TERMINAL_DECK } from '../../lp/logic/terminalMachine.js'

const C = TARO_TERMINAL_COPY

test('8 состояний, полная схема варианта B', () => {
  assert.equal(C.states.length, 8)
  for (const s of C.states) {
    assert.ok(s.id && s.menuLabel && s.intro && s.pause, `база ${s.id}`)
    assert.ok(s.q1.prompt && Array.isArray(s.q1.blocks) && s.q1.blocks.length === 4 && s.q1.placeholder, `q1 ${s.id}`)
    assert.ok(s.q2.prompt && Array.isArray(s.q2.blocks) && s.q2.blocks.length === 4 && s.q2.placeholder, `q2 ${s.id}`)
    assert.ok(s.q3.prompt && Array.isArray(s.q3.options) && s.q3.options.length >= 3, `q3 ${s.id}`)
    assert.ok(Array.isArray(s.cardPool) && s.cardPool.length >= 1, `cardPool ${s.id}`)
    const t = s.teaser
    assert.ok(t.quote1 && t.quote2 && t.cardLine && t.thought && t.lock, `teaser ${s.id}`)
  }
})

test('id состояний уникальны', () => {
  assert.equal(new Set(C.states.map((s) => s.id)).size, 8)
})

test('cardPool ссылается только на карты TERMINAL_DECK', () => {
  const valid = new Set(TERMINAL_DECK.map((c) => c.number))
  for (const s of C.states) for (const n of s.cardPool) assert.ok(valid.has(n), `${s.id}: карта ${n}`)
})

test('общие экраны и chrome на месте (вкл. q3, analyze; без paywall)', () => {
  assert.ok(C.boot.title && C.select.title && C.draw.cta && C.reveal.cta)
  assert.ok(C.reading.title && C.reading.cta && C.reading.payoffs.length === 4)
  assert.ok(Array.isArray(C.analyze.lines) && C.analyze.lines.length >= 2)
  assert.ok(!C.paywall, 'paywall убран')
  for (const k of ['intro', 'pause', 'draw', 'reveal', 'q1', 'q2', 'q3', 'analyze', 'reading']) {
    assert.ok(C.chrome[k], `chrome.${k}`)
  }
})

test('тизер-слоты используют только валидные токены', () => {
  const allowed = new Set(['tag', 'cardRu', 'cardKw'])
  for (const s of C.states) {
    const blob = Object.values(s.teaser).join(' ')
    for (const m of blob.matchAll(/\{(\w+)\}/g)) assert.ok(allowed.has(m[1]), `${s.id}: {${m[1]}}`)
  }
})

test('нигде нет длинного тире', () => {
  assert.ok(!JSON.stringify(C).includes('—'))
})
