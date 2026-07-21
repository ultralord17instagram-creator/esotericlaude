import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildReveal, ARCHETYPE_BY_NUMBER, revealFields, ROD_DOSSIER, windowYear,
} from './rod-copy.js'

const FLAVORS = ['alone', 'endure', 'unhappy', 'nomen']

test('ARCHETYPE_BY_NUMBER покрывает 1..22, каждое ровно раз, значения — валидные флейворы', () => {
  const keys = Object.keys(ARCHETYPE_BY_NUMBER).map(Number).sort((a, b) => a - b)
  assert.deepEqual(keys, Array.from({ length: 22 }, (_, i) => i + 1))
  for (const n of keys) assert.ok(FLAVORS.includes(ARCHETYPE_BY_NUMBER[n]), `число ${n} -> невалидный архетип`)
})

test('revealFields: 5 блоков, 2 открытых, 3 залоченных, правильные id/порядок', () => {
  assert.deepEqual(revealFields.map(f => f.id),
    ['scenario', 'howItShows', 'maleLine', 'whereBreaks', 'howToBreak'])
  assert.deepEqual(revealFields.filter(f => !f.locked).map(f => f.id), ['scenario', 'howItShows'])
  assert.deepEqual(revealFields.filter(f => f.locked).map(f => f.id), ['maleLine', 'whereBreaks', 'howToBreak'])
})

test('ROD_DOSSIER: все 4 флейвора заполнены всеми полями', () => {
  for (const fl of FLAVORS) {
    const d = ROD_DOSSIER[fl]
    assert.ok(d, `нет флейвора ${fl}`)
    for (const key of ['scenarioBody', 'howItShows', 'maleLine', 'whereBreaks', 'howToBreak']) {
      assert.equal(typeof d[key], 'string')
      assert.ok(d[key].length > 0, `${fl}.${key} пустой`)
      assert.ok(!d[key].includes('—'), `${fl}.${key} содержит длинное тире`)
    }
  }
})

test('buildReveal отдаёт 5 полей с label/locked/value для каждого флейвора', () => {
  for (const fl of FLAVORS) {
    const fields = buildReveal(fl, 8)
    assert.equal(fields.length, 5)
    assert.deepEqual(fields.map(f => f.id), revealFields.map(f => f.id))
    for (const f of fields) {
      assert.equal(typeof f.label, 'string')
      assert.equal(typeof f.locked, 'boolean')
      assert.equal(typeof f.value, 'string')
    }
  }
})

test('matched: архетип числа совпал с флейвором -> прямое подтверждение', () => {
  // 12 -> endure (см. ARCHETYPE_BY_NUMBER)
  assert.equal(ARCHETYPE_BY_NUMBER[12], 'endure')
  const scenario = buildReveal('endure', 12).find(f => f.id === 'scenario').value
  assert.ok(scenario.includes('12'), 'нет числа 12')
  assert.ok(scenario.includes('подтверждает это напрямую'), 'нет опенера matched')
  assert.ok(scenario.includes('терпения'), 'нет ярлыка архетипа флейвора')
  assert.ok(scenario.includes(ROD_DOSSIER.endure.scenarioBody), 'тело сценария не приклеено')
})

test('secondLayer: архетип числа разошёлся с флейвором -> второй слой', () => {
  // 8 -> alone, флейвор endure
  assert.equal(ARCHETYPE_BY_NUMBER[8], 'alone')
  const scenario = buildReveal('endure', 8).find(f => f.id === 'scenario').value
  assert.ok(scenario.includes('8'), 'нет числа 8')
  assert.ok(scenario.includes('это не всё'), 'нет опенера secondLayer')
  assert.ok(scenario.includes('силы и одиночества'), 'нет ярлыка архетипа ЧИСЛА')
  assert.ok(scenario.includes(ROD_DOSSIER.endure.scenarioBody), 'тело всё равно от флейвора')
})

test('токены подставлены: {N} и {year} не остаются литералами', () => {
  const fields = buildReveal('endure', 12)
  for (const f of fields) {
    assert.ok(!f.value.includes('{N}'), `${f.id}: остался {N}`)
    assert.ok(!f.value.includes('{year}'), `${f.id}: остался {year}`)
  }
  const howToBreak = fields.find(f => f.id === 'howToBreak').value
  assert.ok(new RegExp(`\\b${windowYear(12)}\\b`).test(howToBreak), 'год окна не подставлен')
})

test('детерминизм: одинаковый вход -> одинаковый выход', () => {
  assert.deepEqual(buildReveal('unhappy', 15), buildReveal('unhappy', 15))
})
