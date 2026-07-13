import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveFocusAspect } from './focus.js'

const landing = { focusToAspect: { money: 'money', purpose: 'personalPurpose' } }

test('маппит известный focus в аспект', () => {
  assert.equal(resolveFocusAspect(landing, 'purpose'), 'personalPurpose')
})

test('падает в fallback для неизвестного focus', () => {
  assert.equal(resolveFocusAspect(landing, 'xxx'), 'money')
})

test('не падает, если landing пустой', () => {
  assert.equal(resolveFocusAspect(null, 'money'), 'money')
})
