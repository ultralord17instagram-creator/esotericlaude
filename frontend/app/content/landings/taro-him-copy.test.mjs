import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TARO_HIM_COPY } from './taro-him-copy.js'

test('4 вопроса, у каждого 3 толкования + actionBait + label + id', () => {
  assert.equal(TARO_HIM_COPY.questions.length, 4)
  for (const q of TARO_HIM_COPY.questions) {
    assert.equal(q.interps.length, 3)
    assert.ok(q.actionBait && q.label && q.id)
  }
})

test('экраны на месте: hero, question, tuning, pick, reading (3 позиции), action', () => {
  assert.ok(TARO_HIM_COPY.hero.cta && TARO_HIM_COPY.hero.placeholder)
  assert.ok(TARO_HIM_COPY.question.title)
  assert.equal(TARO_HIM_COPY.tuning.lines.length, 3)
  assert.ok(TARO_HIM_COPY.pick.cta)
  assert.equal(TARO_HIM_COPY.reading.positions.length, 3)
  assert.ok(TARO_HIM_COPY.action.cardTitle && TARO_HIM_COPY.action.cta)
})

test('нигде нет длинного тире', () => {
  const blob = JSON.stringify(TARO_HIM_COPY)
  assert.ok(!blob.includes('—'))
})
