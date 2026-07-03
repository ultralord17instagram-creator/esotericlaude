// 22 Старших аркана, прямое положение (Rider–Waite–Smith: 8 — Сила, 11 — Справедливость).
// yesno — фиксированный полюс ответа для сценария «Да/Нет».
// TODO(content): выверить полюса yesno при наполнении текстами (сейчас — провизорные).
// Задел на будущее (не используется сейчас): image, arcana, reversedMeaning.
export const DECK = [
  { number: 0,  en: 'The Fool',           ru: 'Шут',            yesno: 'yes' },
  { number: 1,  en: 'The Magician',       ru: 'Маг',            yesno: 'yes' },
  { number: 2,  en: 'The High Priestess', ru: 'Жрица',          yesno: 'no'  },
  { number: 3,  en: 'The Empress',        ru: 'Императрица',    yesno: 'yes' },
  { number: 4,  en: 'The Emperor',        ru: 'Император',      yesno: 'yes' },
  { number: 5,  en: 'The Hierophant',     ru: 'Иерофант',       yesno: 'yes' },
  { number: 6,  en: 'The Lovers',         ru: 'Влюблённые',     yesno: 'yes' },
  { number: 7,  en: 'The Chariot',        ru: 'Колесница',      yesno: 'yes' },
  { number: 8,  en: 'Strength',           ru: 'Сила',           yesno: 'yes' },
  { number: 9,  en: 'The Hermit',         ru: 'Отшельник',      yesno: 'no'  },
  { number: 10, en: 'Wheel of Fortune',   ru: 'Колесо Фортуны', yesno: 'yes' },
  { number: 11, en: 'Justice',            ru: 'Справедливость', yesno: 'yes' },
  { number: 12, en: 'The Hanged Man',     ru: 'Повешенный',     yesno: 'no'  },
  { number: 13, en: 'Death',              ru: 'Смерть',         yesno: 'no'  },
  { number: 14, en: 'Temperance',         ru: 'Умеренность',    yesno: 'yes' },
  { number: 15, en: 'The Devil',          ru: 'Дьявол',         yesno: 'no'  },
  { number: 16, en: 'The Tower',          ru: 'Башня',          yesno: 'no'  },
  { number: 17, en: 'The Star',           ru: 'Звезда',         yesno: 'yes' },
  { number: 18, en: 'The Moon',           ru: 'Луна',           yesno: 'no'  },
  { number: 19, en: 'The Sun',            ru: 'Солнце',         yesno: 'yes' },
  { number: 20, en: 'Judgement',          ru: 'Суд',            yesno: 'yes' },
  { number: 21, en: 'The World',          ru: 'Мир',            yesno: 'yes' },
]

export const getCard = (number) => DECK.find((c) => c.number === number) ?? null
