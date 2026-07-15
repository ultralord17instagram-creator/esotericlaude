// Конфиг лендинга «Проверь его». engine=compat-jealous переключает клиента в page.jsx.
// Тексты пользовательские: без длинного тире.
export const himLanding = {
  slug: 'him',
  product: 'matrix',
  engine: 'compat-jealous',
  theme: 'jealousy',
  verdictOpener: 'a', // A/B: 'a' | 'b' | 'c'
  meta: {
    title: 'Введи две даты рождения: кого он выбрал бы вместо тебя',
    description: 'Сверь ваши даты рождения и узнай, есть ли та, кто подходит ему больше тебя, и сколько у тебя осталось.',
  },
  hero: {
    eyebrow: 'Совместимость пары',
    title: 'Введи две даты рождения. Узнай, кого он выбрал бы вместо тебя',
    titleAccent: 'вместо тебя',
    subtitle: '2 минуты и только даты рождения. Числа не умеют щадить.',
    cta: 'Проверить его',
    note: 'Честно. Даже если больно.',
  },
  quiz: {
    steps: [
      { id: 'late', type: 'choice', required: true,
        question: 'Он стал отвечать на сообщения позже, чем раньше?',
        options: [
          { value: 'yes', label: 'Да, заметно' },
          { value: 'sometimes', label: 'Иногда' },
          { value: 'no', label: 'Нет' },
        ] },
      { id: 'phone', type: 'choice', required: true,
        question: 'Кладёт телефон экраном вниз?',
        options: [
          { value: 'always', label: 'Всегда' },
          { value: 'sometimes', label: 'Бывает' },
          { value: 'no', label: 'Нет' },
        ] },
      { id: 'name', type: 'choice', required: true,
        question: 'Есть женщина, чьё имя всплывает слишком часто?',
        options: [
          { value: 'yes', label: 'Да, есть такая' },
          { value: 'maybe', label: 'Кажется, да' },
          { value: 'no', label: 'Нет' },
        ] },
      { id: 'checked', type: 'choice', required: true,
        question: 'Ты уже проверяла его переписку или хотела?',
        options: [
          { value: 'checked', label: 'Проверяла' },
          { value: 'wanted', label: 'Очень хотела' },
          { value: 'no', label: 'Нет' },
        ] },
      { id: 'distant', type: 'choice', required: true,
        question: 'Он отдалился, но говорит, что тебе кажется?',
        options: [
          { value: 'yes', label: 'Да, именно так' },
          { value: 'sometimes', label: 'Иногда' },
          { value: 'no', label: 'Нет' },
        ] },
      { id: 'ready', type: 'choice', required: true,
        question: 'Если в ваших числах записано, что он уже смотрит на другую, ты готова это увидеть?',
        options: [
          { value: 'yes', label: 'Да' },
          { value: 'afraid', label: 'Боюсь, но да' },
        ] },
      { id: 'her_date', type: 'date', required: true,
        question: 'Твоя дата рождения' },
      { id: 'his_date', type: 'date', required: true,
        question: 'Его дата рождения' },
    ],
  },
  paywall: {
    heading: 'Открой всю правду о вашей паре',
    payoffs: [
      'Вся правда про его взгляд на сторону, по вашим числам, без общих фраз',
      'Чем берёт соперница и что ты перестала давать',
      'Уйдёт ли он и в каком месяце',
      'Что сделать по вашим числам, чтобы вернуть его к тебе',
    ],
  },
}
