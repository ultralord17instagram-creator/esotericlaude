import { loveLanding } from './love.js'
import { himLanding } from './him.js'
import { taroHimLanding } from './taro-him.js'

export const LANDINGS = { love: loveLanding, him: himLanding, 'taro-him': taroHimLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
