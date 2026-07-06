import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  reduceKeepMaster, reduceToDigit,
  lifePath, expression, soul,
  personalYear, personalMonth, personalDay,
  pairNumber, pairKey, nameCompat,
  moscowDayKey, dayVariantIndex,
} from './numbers.js'

// Полдень UTC, чтобы TZ-сдвиг Москвы (+3) не перекинул дату на соседнюю.
const TODAY = new Date('2026-07-05T12:00:00Z')

test('reduceKeepMaster сохраняет 11 и 22', () => {
  assert.equal(reduceKeepMaster(29), 11)   // 2+9
  assert.equal(reduceKeepMaster(38), 11)   // 3+8
  assert.equal(reduceKeepMaster(2299), 22) // 2+2+9+9=22
  assert.equal(reduceKeepMaster(19), 1)    // 19->10->1
  assert.equal(reduceKeepMaster(11), 11)
  assert.equal(reduceKeepMaster(22), 22)
})

test('reduceToDigit сводит до 1..9 без мастер-чисел', () => {
  assert.equal(reduceToDigit(11), 2)
  assert.equal(reduceToDigit(29), 2)
  assert.equal(reduceToDigit(2026), 1)
})

test('lifePath из ISO-даты', () => {
  assert.equal(lifePath('1990-11-29'), 5)
})

test('expression и soul по имени (кириллица)', () => {
  assert.equal(expression('Анна'), 5) // а1+н6+н6+а1=14->5
  assert.equal(soul('Анна'), 2)       // гласные а,а: 1+1
})

test('expression по латинице', () => {
  assert.equal(expression('Anna'), 3) // a1+n5+n5+a1=12->3
})

test('персональные циклы день/месяц/год', () => {
  assert.equal(personalYear('1990-11-29', TODAY), 5)
  assert.equal(personalMonth('1990-11-29', TODAY), 3)
  assert.equal(personalDay('1990-11-29', TODAY), 8)
})

test('парные числа и ключ пары', () => {
  assert.equal(pairNumber(5, 8), 4)        // reduceKeepMaster(13)
  assert.equal(pairKey(5, 8), '5-8')
  assert.equal(pairKey(8, 5), '5-8')       // неупорядоченная
  assert.equal(pairKey(8, 11), '8-11')     // числовая сортировка, не строковая
  assert.equal(pairKey(11, 22), '11-22')
  assert.equal(nameCompat(5, 6), 11)       // reduceKeepMaster(11) сохраняет мастер
})

test('moscowDayKey и dayVariantIndex детерминированы', () => {
  assert.equal(moscowDayKey(TODAY), 20260705)
  assert.equal(dayVariantIndex(TODAY, 4), 1) // 20260705 % 4
})
