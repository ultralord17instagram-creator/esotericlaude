// 22 Старших аркана, прямое положение (Rider–Waite–Smith: 8 — Сила, 11 — Справедливость).
// yesno — фиксированный полюс ответа для сценария «Да/Нет».
// keywords — 4 ключевых слова аркана (метаданная карты, для экрана результата).
//   Значения — канонические RWS; при желании копирайтер-чат может уточнить тон.
// TODO(content): выверить полюса yesno при наполнении текстами (сейчас — провизорные).
// Задел на будущее (не используется сейчас): image, arcana, reversedMeaning.
export const DECK = [
  { number: 0,  en: 'The Fool',           ru: 'Шут',            yesno: 'yes', keywords: ['Новое начало', 'Свобода', 'Спонтанность', 'Вера в путь'] },
  { number: 1,  en: 'The Magician',       ru: 'Маг',            yesno: 'yes', keywords: ['Воля', 'Мастерство', 'Проявление', 'Ресурсы'] },
  { number: 2,  en: 'The High Priestess', ru: 'Жрица',          yesno: 'no',  keywords: ['Интуиция', 'Тайна', 'Внутренний голос', 'Терпение'] },
  { number: 3,  en: 'The Empress',        ru: 'Императрица',    yesno: 'yes', keywords: ['Изобилие', 'Забота', 'Творчество', 'Плодородие'] },
  { number: 4,  en: 'The Emperor',        ru: 'Император',      yesno: 'yes', keywords: ['Порядок', 'Структура', 'Власть', 'Опора'] },
  { number: 5,  en: 'The Hierophant',     ru: 'Иерофант',       yesno: 'yes', keywords: ['Традиция', 'Наставник', 'Ценности', 'Опыт'] },
  { number: 6,  en: 'The Lovers',         ru: 'Влюблённые',     yesno: 'yes', keywords: ['Выбор', 'Любовь', 'Союз', 'Созвучие'] },
  { number: 7,  en: 'The Chariot',        ru: 'Колесница',      yesno: 'yes', keywords: ['Воля', 'Движение', 'Победа', 'Контроль'] },
  { number: 8,  en: 'Strength',           ru: 'Сила',           yesno: 'yes', keywords: ['Мягкая сила', 'Терпение', 'Храбрость', 'Самообладание'] },
  { number: 9,  en: 'The Hermit',         ru: 'Отшельник',      yesno: 'no',  keywords: ['Уединение', 'Поиск', 'Мудрость', 'Внутренний свет'] },
  { number: 10, en: 'Wheel of Fortune',   ru: 'Колесо Фортуны', yesno: 'yes', keywords: ['Перемены', 'Циклы', 'Судьба', 'Удача'] },
  { number: 11, en: 'Justice',            ru: 'Справедливость', yesno: 'yes', keywords: ['Справедливость', 'Баланс', 'Ответственность', 'Истина'] },
  { number: 12, en: 'The Hanged Man',     ru: 'Повешенный',     yesno: 'no',  keywords: ['Пауза', 'Иная перспектива', 'Отпускание', 'Ожидание'] },
  { number: 13, en: 'Death',              ru: 'Смерть',         yesno: 'no',  keywords: ['Завершение', 'Трансформация', 'Обновление', 'Отпускание'] },
  { number: 14, en: 'Temperance',         ru: 'Умеренность',    yesno: 'yes', keywords: ['Мера', 'Баланс', 'Гармония', 'Терпение'] },
  { number: 15, en: 'The Devil',          ru: 'Дьявол',         yesno: 'no',  keywords: ['Привязанность', 'Соблазн', 'Зависимость', 'Тень'] },
  { number: 16, en: 'The Tower',          ru: 'Башня',          yesno: 'no',  keywords: ['Слом', 'Прозрение', 'Освобождение', 'Внезапность'] },
  { number: 17, en: 'The Star',           ru: 'Звезда',         yesno: 'yes', keywords: ['Надежда', 'Исцеление', 'Вдохновение', 'Вера'] },
  { number: 18, en: 'The Moon',           ru: 'Луна',           yesno: 'no',  keywords: ['Иллюзии', 'Страхи', 'Подсознание', 'Неясность'] },
  { number: 19, en: 'The Sun',            ru: 'Солнце',         yesno: 'yes', keywords: ['Радость', 'Успех', 'Ясность', 'Витальность'] },
  { number: 20, en: 'Judgement',          ru: 'Суд',            yesno: 'yes', keywords: ['Пробуждение', 'Призвание', 'Итог', 'Обновление'] },
  { number: 21, en: 'The World',          ru: 'Мир',            yesno: 'yes', keywords: ['Завершение', 'Полнота', 'Целостность', 'Достижение'] },
]

export const getCard = (number) => DECK.find((c) => c.number === number) ?? null
