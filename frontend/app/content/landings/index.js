import { matrixLanding } from './matrix.js'

export const LANDINGS = { matrix: matrixLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
