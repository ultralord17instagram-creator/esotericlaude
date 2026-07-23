import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TARO_PORCHA_COPY } from './taro-porcha-copy.js'
import { SHADOW_NUMBERS, EXIT_NUMBERS } from '../../lp/logic/diagnosticMachine.js'

const C = TARO_PORCHA_COPY

test('экраны intro/scan/name/calculating/reveal на месте', () => {
  assert.ok(C.meta.title && C.meta.description)
  assert.ok(C.intro.eyebrow && C.intro.title && C.intro.subtitle && C.intro.cta && C.intro.note)
  assert.ok(C.scan.title && C.scan.subtitle && C.scan.meterLabel && C.scan.cta)
  assert.ok(C.name.title && C.name.placeholder && C.name.cta)
  assert.ok(C.calculating.title && C.calculating.lines.length === 3)
  assert.ok(C.reveal.eyebrow && C.reveal.title && C.reveal.positions.length === 3)
  assert.ok(C.reveal.cta && C.reveal.loading && C.reveal.restart)
})

test('поля дизайна porcha: hero-акцент, квиз-свайп, экран выбора карт', () => {
  // Заголовок hero в две строки: «На тебе» + акцент «порча?».
  assert.ok(C.intro.titleAccent)
  // Квиз: вопрос, лейблы «да/нет», шаблон счётчика с плейсхолдерами.
  assert.ok(C.scan.question && C.scan.yes && C.scan.no)
  assert.ok(C.scan.signTemplate.includes('{n}') && C.scan.signTemplate.includes('{total}'))
  // Подпись театра загрузки.
  assert.ok(C.calculating.sub)
  // Экран pick: заголовок, подзаголовок, счётчик с {n}, кнопка.
  assert.ok(C.pick.title && C.pick.subtitle && C.pick.cta)
  assert.ok(C.pick.counter.includes('{n}'))
})

test('9 симптомов: уникальные ключи, числовой вес, порог число', () => {
  assert.equal(C.scan.symptoms.length, 9)
  const keys = C.scan.symptoms.map((s) => s.key)
  assert.equal(new Set(keys).size, 9)
  for (const s of C.scan.symptoms) {
    assert.ok(s.key && s.label, `симптом ${s.key}`)
    assert.equal(typeof s.weight, 'number')
  }
  assert.equal(typeof C.scan.threshold, 'number')
})

test('пулы слота A: опенеры обоих бакетов + вступления на все теневые арканы', () => {
  assert.ok(C.slots.A.openers.heavy.length > 0 && C.slots.A.openers.light.length > 0)
  for (const n of SHADOW_NUMBERS) {
    assert.ok(C.slots.A.intros[n] && C.slots.A.intros[n].length > 0, `A.intros[${n}]`)
  }
})

test('пулы слота B: вступления-источники на все теневые арканы', () => {
  for (const n of SHADOW_NUMBERS) {
    assert.ok(C.slots.B.intros[n] && C.slots.B.intros[n].length > 0, `B.intros[${n}]`)
  }
})

test('пулы слота C: вступления на все выходные арканы + хвосты обоих бакетов', () => {
  for (const n of EXIT_NUMBERS) {
    assert.ok(C.slots.C.intros[n] && C.slots.C.intros[n].length > 0, `C.intros[${n}]`)
  }
  assert.ok(C.slots.C.tails.heavy.length > 0 && C.slots.C.tails.light.length > 0)
})

test('финалы: heavy и light на все теневые (источник) арканы, 3 обещания, кнопка', () => {
  assert.ok(C.final.eyebrow && C.final.listIntro && C.final.cta && C.final.restart)
  assert.equal(C.final.promises.length, 3)
  for (const n of SHADOW_NUMBERS) {
    assert.ok(C.final.headings.heavy[n] && C.final.headings.heavy[n].length > 0, `heavy[${n}]`)
    assert.ok(C.final.headings.light[n] && C.final.headings.light[n].length > 0, `light[${n}]`)
  }
})

test('нигде нет длинного тире', () => {
  assert.ok(!JSON.stringify(C).includes('—'))
})
