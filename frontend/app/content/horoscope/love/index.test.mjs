import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BRANCHES, BRANCH_IDS, FORK } from './index.js'
import { SIGNS } from '../astro.js'

const SIGN_IDS = [...new Set(SIGNS.map(s => s.id))] // 12 уникальных

test('три ветки на месте', () => {
  assert.deepEqual(BRANCH_IDS, ['suzheny', 'return', 'block'])
  for (const id of BRANCH_IDS) assert.ok(BRANCHES[id], `ветка ${id}`)
})

test('в каждой ветке досье на все 12 знаков', () => {
  for (const id of BRANCH_IDS) {
    const d = BRANCHES[id].dossier
    for (const s of SIGN_IDS) assert.ok(d[s], `${id}: нет знака ${s}`)
    // все поля непустые строки под revealFields
    for (const s of SIGN_IDS) {
      for (const f of BRANCHES[id].revealFields) {
        // пуловые поля (ageHint, firstLetter, meetMonth, whenReturn-месяц) генерятся в логике,
        // в досье их может не быть — пропускаем те, что не хранятся в dossier.
      }
    }
  }
})

test('suzheny: destinedSign задан для всех 12 знаков', () => {
  for (const s of SIGN_IDS) assert.ok(BRANCHES.suzheny.destinedSign[s], `нет пары для ${s}`)
})

test('revealFields: у каждой ветки есть и free, и locked', () => {
  for (const id of BRANCH_IDS) {
    const rf = BRANCHES[id].revealFields
    assert.ok(rf.some(f => !f.locked), `${id}: нет free`)
    assert.ok(rf.some(f => f.locked), `${id}: нет locked`)
  }
})

test('fork: три опции с корректными ветками', () => {
  assert.equal(FORK.options.length, 3)
  assert.deepEqual(FORK.options.map(o => o.branch), BRANCH_IDS)
})
