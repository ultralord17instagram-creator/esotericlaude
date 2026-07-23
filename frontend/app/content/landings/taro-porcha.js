// Конфиг лендинга «Проверка на порчу». engine=diagnostic переключает клиента в page.jsx.
// Тексты в taro-porcha-copy.js. Пользовательский копирайт: без длинного тире.
import { TARO_PORCHA_COPY } from './taro-porcha-copy.js'

export const taroPorchaLanding = {
  slug: 'taro-porcha',
  product: 'tarot',
  engine: 'diagnostic',
  theme: 'diagnostic',
  ...TARO_PORCHA_COPY,
}
