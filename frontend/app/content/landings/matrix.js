// Конфиг лендинга «Матрица судьбы». Один продукт = один такой файл.
// Тексты пользовательские: без длинного тире.
export const matrixLanding = {
  slug: 'matrix',
  product: 'matrix',
  meta: {
    title: 'Матрица судьбы: пройди тест и узнай свою программу',
    description: 'Ответь на 5 вопросов и получи персональный разбор матрицы судьбы по дате рождения.',
  },
  hero: {
    eyebrow: 'Матрица судьбы',
    title: 'Узнай, какая программа зашита в твоей дате рождения',
    subtitle: 'Ответь на 5 коротких вопросов и получи персональный разбор: предназначение, деньги, отношения.',
    cta: 'Пройти тест',
    proof: 'Более 100 000 расчётов',
  },
  quiz: {
    steps: [
      { id: 'birth_date', type: 'date', question: 'Когда ты родился?', required: true },
      { id: 'gender', type: 'choice', question: 'Твой пол?', required: true,
        options: [ { value: 'female', label: 'Женский' }, { value: 'male', label: 'Мужской' } ] },
      { id: 'focus', type: 'choice', question: 'Что сейчас волнует больше всего?', required: true,
        options: [
          { value: 'money', label: 'Деньги' },
          { value: 'relationships', label: 'Отношения' },
          { value: 'purpose', label: 'Предназначение' },
          { value: 'talents', label: 'Таланты и самореализация' },
        ] },
      { id: 'life_scale', type: 'scale', question: 'Насколько ощущаешь, что живёшь не свою жизнь?',
        min: 1, max: 5, required: true },
      { id: 'name', type: 'text', question: 'Как тебя зовут?', placeholder: 'Имя', required: true },
    ],
  },
  // Ответ шага focus -> ключ аспекта в MATRIX_CONTENT (см. matrix-content.js).
  focusToAspect: {
    money: 'money',
    relationships: 'relationships',
    purpose: 'personalPurpose',
    talents: 'talents',
  },
}
