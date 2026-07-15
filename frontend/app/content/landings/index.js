import { loveLanding } from './love.js'
import { himLanding } from './him.js'

export const LANDINGS = { love: loveLanding, him: himLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
