// Совместимость. hot — по ключу пары ('5-8'); background — по числу пары; nameTouch — по числу.
export const COMPATIBILITY_TEXTS = {
  hot: {
    passion:  {}, // { '1-1': {teaser,body}, ... } — платный
    fidelity: {},
    future:   {},
  },
  background: {
    general:  {}, // free, строки по числу пары
    daily:    {},
    money:    {},
    conflict: {},
  },
  nameTouch: {
    general: {}, // штрих к бесплатному Общему: строки по числу
    passion: {}, // штрих к платной Страсти
  },
}
