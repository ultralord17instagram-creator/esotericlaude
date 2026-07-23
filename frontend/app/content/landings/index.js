import { loveLanding } from './love.js'
import { himLanding } from './him.js'
import { taroHimLanding } from './taro-him.js'
import { taroTerminalLanding } from './taro-terminal.js'
import { horoLoveLanding } from './horo-love.js'
import { taroPorchaLanding } from './taro-porcha.js'
import { rodLanding } from './rod.js'
import { darLanding } from './dar.js'

export const LANDINGS = { love: loveLanding, him: himLanding, 'taro-him': taroHimLanding, 'taro-terminal': taroTerminalLanding, 'horo-love': horoLoveLanding, 'taro-porcha': taroPorchaLanding, rod: rodLanding, dar: darLanding }

export function getLanding(slug) {
  return LANDINGS[slug] ?? null
}
