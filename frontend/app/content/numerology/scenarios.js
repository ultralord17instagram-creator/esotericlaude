// Конфиг блоков сценариев (дизайн §12.2). basis — какое число из numbers.js
// считается для блока; free — открыт без подписки; hot — считается по ключу пары;
// nameTouch — вплетается именной штрих; showcase — витринный продающий блок.
export const SCENARIOS = {
  breakdown: {
    inputs: ['date', 'name'],
    blocks: [
      { id: 'destiny',  name: 'Судьба и предназначение', basis: 'lifePath',   free: true  },
      { id: 'karma',    name: 'Кармический урок',        basis: 'lifePath',   free: false },
      { id: 'ancestry', name: 'Ресурс рода',             basis: 'lifePath',   free: false },
      { id: 'talents',  name: 'Таланты и самовыражение', basis: 'expression', free: false },
      { id: 'love',     name: 'Любовь и отношения',      basis: 'soul',       free: false },
      { id: 'money',    name: 'Деньги и достаток',       basis: 'lifePath',   free: false },
    ],
  },
  compatibility: {
    inputs: ['date', 'name', 'date2', 'name2'],
    blocks: [
      { id: 'general',  name: 'Общее',                basis: 'pairNumber', hot: false, free: true,  nameTouch: true  },
      { id: 'passion',  name: 'Страсть и близость',   basis: 'pairKey',    hot: true,  free: false, nameTouch: true  },
      { id: 'daily',    name: 'Быт и повседневность', basis: 'pairNumber', hot: false, free: false },
      { id: 'money',    name: 'Деньги вместе',        basis: 'pairNumber', hot: false, free: false },
      { id: 'fidelity', name: 'Шанс измены',          basis: 'pairKey',    hot: true,  free: false, showcase: true },
      { id: 'conflict', name: 'Конфликты и трения',   basis: 'pairNumber', hot: false, free: false },
      { id: 'future',   name: 'Перспектива союза',    basis: 'pairKey',    hot: true,  free: false, showcase: true },
    ],
  },
  forecast: {
    inputs: ['date'],
    horizons: {
      day:   { free: true, variants: true },
      month: { basis: 'personalMonth', blocks: [
        { id: 'mood',    name: 'Настроение месяца',       free: true  },
        { id: 'love',    name: 'Отношения в этом месяце', free: false },
        { id: 'money',   name: 'Дела и деньги',           free: false },
        { id: 'focus',   name: 'Фокус месяца',            free: false },
        { id: 'warning', name: 'Предостережение',         free: false },
      ] },
      year:  { basis: 'personalYear', blocks: [
        { id: 'theme',     name: 'Тема года',          free: true  },
        { id: 'love',      name: 'Любовь в этом году', free: false },
        { id: 'money',     name: 'Деньги и работа',    free: false },
        { id: 'challenge', name: 'Вызов года',         free: false },
        { id: 'advice',    name: 'Совет',              free: false },
      ] },
    },
  },
}
