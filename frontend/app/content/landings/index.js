import { loveLanding } from './love.js'

export const LANDINGS = { love: loveLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
