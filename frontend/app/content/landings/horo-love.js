// Конфиг лендинга horo-love. engine=horo-love переключает клиента в page.jsx.
import { BRANCHES, BRANCH_IDS, FORK } from '../horoscope/love/index.js'

export const horoLoveLanding = {
  slug: 'horo-love',
  product: 'horoscope',
  engine: 'horo-love',
  meta: {
    title: 'Кто станет твоим: узнай по дате рождения',
    description: 'Звёзды уже знают, кто тебе подходит, вернётся ли он и что закрывает тебе любовь. Узнай по дате рождения.',
  },
  fork: FORK,
  branchIds: BRANCH_IDS,
  branches: BRANCHES,
}
