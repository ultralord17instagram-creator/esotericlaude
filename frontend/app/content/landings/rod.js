// Конфиг лендинга «Родовой сценарий». engine=rod переключает RodClient в page.jsx.
// Продукт — Матрица судьбы (calculateMatrix). Тексты: без длинного тире, женский голос.
import { revealFields } from './rod-copy.js'

export const rodLanding = {
  slug: 'rod',
  product: 'matrix',
  engine: 'rod',
  theme: 'ancestry',
  meta: {
    title: 'Родовой сценарий по дате рождения: что ты несёшь по женской линии',
    description: 'Пройди короткий тест и узнай по матрице, какой сценарий женщины твоего рода передают по наследству и на ком он обрывается.',
  },
  hero: {
    eyebrow: 'Родовой сценарий',
    title: 'В твоём роду это повторяется. И круг идёт к тебе.',
    titleAccent: 'круг идёт к тебе',
    subtitle: '2 минуты и только дата рождения. Матрица покажет, что ты несёшь по женской линии.',
    cta: 'Узнать свой родовой сценарий',
    note: 'Честно, даже если будет тяжело.',
  },
  quiz: {
    steps: [
      { id: 'mirror', type: 'choice', required: true,
        question: 'Что из этого больше всего похоже на женщин твоего рода?',
        options: [
          { value: 'alone',   label: 'Сильные и одинокие, всё тянули на себе' },
          { value: 'endure',  label: 'Терпели ради семьи и гасили себя' },
          { value: 'unhappy', label: 'Замужем, но несчастливы, или не сложилось' },
          { value: 'nomen',   label: 'Рано остались без мужчин: развод, вдовство, ушли' },
        ] },
      { id: 'circle', type: 'choice', required: true,
        question: 'Замечала, что твоя жизнь идёт по тому же кругу, что у мамы?',
        options: [
          { value: 'exact',    label: 'Да, почти точь-в-точь' },
          { value: 'why',      label: 'Да, но не понимаю почему' },
          { value: 'catch',    label: 'Иногда ловлю себя на этом' },
          { value: 'no',       label: 'Нет, у меня иначе' },
        ] },
      { id: 'mother_love', type: 'choice', required: true,
        question: 'Твоя мама была счастлива в любви?',
        options: [
          { value: 'yes',    label: 'Да, у неё сложилось' },
          { value: 'no',     label: 'Скорее нет' },
          { value: 'alone',  label: 'Она была одна' },
          { value: 'silent', label: 'Не знаю, у нас про это не говорили' },
        ] },
      { id: 'family_feel', type: 'choice', required: true,
        question: 'Что ты чаще всего чувствуешь, когда думаешь о своей семье?',
        options: [
          { value: 'guilt',   label: 'Вину' },
          { value: 'duty',    label: 'Долг, будто я всем должна' },
          { value: 'grudge',  label: 'Обиду' },
          { value: 'heavy',   label: 'Тяжесть, хочется отдалиться' },
        ] },
      { id: 'fear_pass', type: 'choice', required: true,
        question: 'Боишься, что передашь это дальше, дочери или детям?',
        options: [
          { value: 'much',    label: 'Да, очень' },
          { value: 'some',    label: 'Иногда думаю об этом' },
          { value: 'nokids',  label: 'Детей пока нет, но боюсь' },
          { value: 'no',      label: 'Нет' },
        ] },
      { id: 'yes_ladder', type: 'choice', required: true,
        question: 'Если в твоей матрице записано, на ком этот круг рвётся, хочешь узнать?',
        options: [
          { value: 'yes',   label: 'Да, конечно' },
          { value: 'badly', label: 'Очень хочу' },
          { value: 'doubt', label: 'Да, но не верю, что это реально' },
        ] },
      { id: 'birth_date', type: 'date', required: true,
        question: 'Теперь дата рождения, чтобы построить твою матрицу рода' },
      { id: 'name', type: 'text', required: true, placeholder: 'Имя',
        question: 'Как тебя зовут?' },
    ],
  },
  calculating: {
    title: 'Читаю твою женскую линию…',
    lines: [
      'Свожу твою дату с линией матери и бабки…',
      'Смотрю, что повторяется из поколения в поколение…',
      'Ищу точку, где круг рвётся…',
    ],
  },
  result: {
    kicker: 'ТВОЙ РОДОВОЙ СЦЕНАРИЙ',
    captionWithName: '{name}, твоя матрица рода',
    caption: 'Твоя матрица рода',
    chipLabel: 'точка рода',
    unlockCta: 'Узнать',
  },
  revealFields,
}
