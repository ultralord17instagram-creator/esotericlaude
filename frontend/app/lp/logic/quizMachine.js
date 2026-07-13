// Чистая стейт-машина квиза. Никакого React/DOM — только данные.
export function initQuiz() {
  return { index: 0, answers: {} }
}

export function currentStep(steps, state) {
  return steps[state.index] ?? null
}

export function setAnswer(state, id, value) {
  return { ...state, answers: { ...state.answers, [id]: value } }
}

export function canAdvance(steps, state) {
  const step = steps[state.index]
  if (!step) return false
  if (!step.required) return true
  const v = state.answers[step.id]
  return v !== undefined && v !== null && v !== ''
}

export function advance(steps, state) {
  if (!canAdvance(steps, state)) return state
  return { ...state, index: Math.min(state.index + 1, steps.length) }
}

export function back(state) {
  return { ...state, index: Math.max(state.index - 1, 0) }
}

export function isComplete(steps, state) {
  return state.index >= steps.length
}

export function progress(steps, state) {
  return steps.length ? Math.min(state.index / steps.length, 1) : 0
}
