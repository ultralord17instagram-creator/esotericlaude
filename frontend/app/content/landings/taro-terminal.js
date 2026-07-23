// Конфиг лендинга «Таро Терминал». engine=terminal переключает клиента в page.jsx.
// Тексты в taro-terminal-copy.js. Пользовательский копирайт: без длинного тире.
import { TARO_TERMINAL_COPY } from './taro-terminal-copy.js'

export const taroTerminalLanding = {
  slug: 'taro-terminal',
  product: 'tarot',
  engine: 'terminal',
  theme: 'terminal',
  ...TARO_TERMINAL_COPY,
}
