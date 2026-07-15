// Конфиг лендинга «Расклад Таро на него». engine=live-reveal переключает клиента в page.jsx.
// Тексты в taro-him-copy.js. Тексты пользовательские: без длинного тире.
import { TARO_HIM_COPY } from './taro-him-copy.js'

export const taroHimLanding = {
  slug: 'taro-him',
  product: 'tarot',
  engine: 'live-reveal',
  theme: 'him',
  ...TARO_HIM_COPY,
}
