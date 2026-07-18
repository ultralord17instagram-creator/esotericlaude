import { loveLanding } from './love.js'
import { himLanding } from './him.js'
import { taroHimLanding } from './taro-him.js'
import { taroTerminalLanding } from './taro-terminal.js'
import { horoLoveLanding } from './horo-love.js'

export const LANDINGS = { love: loveLanding, him: himLanding, 'taro-him': taroHimLanding, 'taro-terminal': taroTerminalLanding, 'horo-love': horoLoveLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
