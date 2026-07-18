import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveBranch, generate, buildReveal } from './horoLove.js'

test('resolveBranch: валидные ветки', () => {
  assert.equal(resolveBranch('suzheny'), 'suzheny')
  assert.equal(resolveBranch('return'), 'return')
  assert.equal(resolveBranch('block'), 'block')
})
test('resolveBranch: мусор -> null', () => {
  assert.equal(resolveBranch('nope'), null)
  assert.equal(resolveBranch(null), null)
  assert.equal(resolveBranch(''), null)
})

const SUZH = { branch: 'suzheny', birthDate: '1994-09-10', name: 'Аня' } // Дева

test('generate suzheny: детерминизм', () => {
  const a = generate(SUZH)
  const b = generate(SUZH)
  assert.deepEqual(a, b)
})
test('generate suzheny: free-поля из досье её знака', () => {
  const v = generate(SUZH)
  assert.match(v.destined, /Скорпион/)         // Дева -> Скорпион
  assert.ok(v.character && v.meetHow && v.ageHint)
})
test('generate suzheny: locked-поля собраны из шаблонов', () => {
  const v = generate(SUZH)
  assert.ok(/«.»/.test(v.firstLetter))          // буква подставлена
  assert.ok(!v.meetMonth.includes('{month}'))   // месяц подставлен
})
test('generate return: ключ это выбранный his_sign', () => {
  const v = generate({ branch: 'return', birthDate: '1994-09-10', hisSign: 'scorpio' })
  assert.match(v.willReturn, /Скорпион|всерьёз/)
  assert.ok(!v.whenReturn.includes('{month}'))
})
test('buildReveal: возвращает поля с value и locked', () => {
  const v = generate(SUZH)
  const fields = buildReveal('suzheny', v)
  assert.equal(fields.length, 8)
  assert.ok(fields.every(f => 'value' in f && 'locked' in f))
  assert.ok(fields.filter(f => f.locked).length === 4)
})
