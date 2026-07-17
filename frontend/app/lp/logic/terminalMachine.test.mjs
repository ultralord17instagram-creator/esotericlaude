import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  PHASES, nextPhase, prevPhase, canGoBack, pickCard, fillTokens, buildTeaser, isMeaningful,
} from './terminalMachine.js'
import { DECK } from '../../content/tarot/deck.js'

test('PHASES: 11 фаз, есть q3 и analyze, нет paywall', () => {
  assert.deepEqual(PHASES, [
    'boot', 'select', 'intro', 'pause', 'draw', 'reveal', 'q1', 'q2', 'q3', 'analyze', 'reading',
  ])
})

test('nextPhase идёт по порядку и упирается в reading', () => {
  assert.equal(nextPhase('q2'), 'q3')
  assert.equal(nextPhase('q3'), 'analyze')
  assert.equal(nextPhase('analyze'), 'reading')
  assert.equal(nextPhase('reading'), 'reading')
})

test('prevPhase идёт назад и упирается в boot', () => {
  assert.equal(prevPhase('select'), 'boot')
  assert.equal(prevPhase('boot'), 'boot')
})

test('canGoBack: шаги уровня intro..q3, не на analyze/reading', () => {
  assert.ok(canGoBack('intro'))
  assert.ok(canGoBack('q3'))
  assert.ok(!canGoBack('analyze'))
  assert.ok(!canGoBack('reading'))
  assert.ok(!canGoBack('boot'))
})

test('pickCard: тянет по номеру из пула состояния', () => {
  assert.equal(pickCard([16], () => 0, DECK).number, 16)         // Башня
  assert.equal(pickCard([16, 18], () => 0.99, DECK).number, 18)  // Луна
})

test('pickCard: пустой или отсутствующий пул → вся колода', () => {
  assert.equal(pickCard([], () => 0, DECK).number, 0)             // Шут
  assert.equal(pickCard(undefined, () => 0.999, DECK).number, 21) // Мир
})

test('fillTokens подставляет все вхождения токена', () => {
  assert.equal(fillTokens('{a} и {a}, {b}', { a: 'X', b: 'Y' }), 'X и X, Y')
})

test('isMeaningful: порог 12 символов, пустое/короткое не проходит', () => {
  assert.ok(!isMeaningful(''))
  assert.ok(!isMeaningful('   '))
  assert.ok(!isMeaningful('страх'))
  assert.ok(isMeaningful('люди которые падают'))
})

test('buildTeaser: 4 слоя, цитаты тегов + свои слова при осмысленном тексте', () => {
  const state = { teaser: {
    quote1: 'Тяжелее всего «{tag}».',
    quote2: 'Опора это «{tag}».',
    cardLine: 'Карта «{cardRu}» про «{cardKw}».',
    thought: 'Мысль.',
    lock: 'Что держит «{tag}» при «{cardRu}»,',
  } }
  const card = { ru: 'Башня', keywords: ['Слом', 'a', 'b', 'c'] }
  const a1 = { tag: 'перегруз', text: 'люди которые падают' } // >=12 → цитируется
  const a2 = { tag: 'пауза', text: '' }                       // пусто → без цитаты
  const t = buildTeaser(state, card, a1, a2)
  assert.equal(t.open.length, 4)
  assert.ok(t.open[0].includes('перегруз') && t.open[0].includes('Твоими словами') && t.open[0].includes('люди которые падают'))
  assert.ok(!t.open[1].includes('Твоими словами'))
  assert.ok(t.open[2].includes('Башня') && t.open[2].includes('Слом'))
  assert.equal(t.open[3], 'Мысль.')
  const blob = `${t.open.join(' ')} ${t.lock}`
  assert.ok(!blob.includes('{'))
})
