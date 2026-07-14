const VERSION = 1
const key = (slug) => `lp_quiz_${slug}`

export function serializeQuiz(slug, answers) {
  return JSON.stringify({ v: VERSION, slug, answers })
}

export function deserializeQuiz(raw, slug) {
  try {
    const data = JSON.parse(raw)
    if (!data || data.v !== VERSION || data.slug !== slug) return null
    return data.answers ?? null
  } catch {
    return null
  }
}

export function saveQuiz(slug, answers) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key(slug), serializeQuiz(slug, answers)) } catch {}
}

export function loadQuiz(slug) {
  if (typeof window === 'undefined') return null
  try { return deserializeQuiz(localStorage.getItem(key(slug)) || '', slug) } catch { return null }
}

export function clearQuiz(slug) {
  if (typeof window === 'undefined') return
  try { localStorage.removeItem(key(slug)) } catch {}
}
