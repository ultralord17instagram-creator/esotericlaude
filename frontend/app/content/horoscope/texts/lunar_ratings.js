// Рейтинги благоприятности (ДАННЫЕ, не проза). Для каждой сферы на каждый лунный
// день 1..30 одно из: 'good' | 'neutral' | 'bad'. По общепринятому лунному календарю
// и в согласии с текстами дней в lunar.js: растущая Луна и сильные дни (11, 14, 24, 28)
// благоприятны, напряжённые дни (9, 15, 23, 29) осторожны. Незаполненный день движок
// покажет как neutral, но все 150 проставлены осознанно.
export const LUNAR_RATINGS = {
  beauty: {
    1: 'bad', 2: 'neutral', 3: 'good', 4: 'neutral', 5: 'good',
    6: 'good', 7: 'good', 8: 'neutral', 9: 'bad', 10: 'good',
    11: 'good', 12: 'neutral', 13: 'good', 14: 'good', 15: 'bad',
    16: 'good', 17: 'good', 18: 'neutral', 19: 'bad', 20: 'neutral',
    21: 'good', 22: 'good', 23: 'bad', 24: 'neutral', 25: 'neutral',
    26: 'neutral', 27: 'good', 28: 'good', 29: 'bad', 30: 'neutral',
  },
  money: {
    1: 'bad', 2: 'neutral', 3: 'good', 4: 'neutral', 5: 'good',
    6: 'good', 7: 'neutral', 8: 'neutral', 9: 'bad', 10: 'good',
    11: 'good', 12: 'neutral', 13: 'good', 14: 'good', 15: 'bad',
    16: 'neutral', 17: 'neutral', 18: 'neutral', 19: 'good', 20: 'good',
    21: 'good', 22: 'good', 23: 'bad', 24: 'good', 25: 'neutral',
    26: 'bad', 27: 'neutral', 28: 'good', 29: 'bad', 30: 'neutral',
  },
  love: {
    1: 'neutral', 2: 'neutral', 3: 'neutral', 4: 'good', 5: 'good',
    6: 'good', 7: 'good', 8: 'good', 9: 'bad', 10: 'good',
    11: 'neutral', 12: 'good', 13: 'good', 14: 'good', 15: 'bad',
    16: 'good', 17: 'good', 18: 'neutral', 19: 'neutral', 20: 'good',
    21: 'neutral', 22: 'good', 23: 'bad', 24: 'good', 25: 'neutral',
    26: 'neutral', 27: 'good', 28: 'good', 29: 'bad', 30: 'good',
  },
  affairs: {
    1: 'neutral', 2: 'neutral', 3: 'good', 4: 'neutral', 5: 'good',
    6: 'good', 7: 'good', 8: 'neutral', 9: 'bad', 10: 'good',
    11: 'good', 12: 'neutral', 13: 'good', 14: 'good', 15: 'bad',
    16: 'neutral', 17: 'neutral', 18: 'neutral', 19: 'good', 20: 'good',
    21: 'good', 22: 'good', 23: 'bad', 24: 'good', 25: 'neutral',
    26: 'bad', 27: 'neutral', 28: 'good', 29: 'bad', 30: 'neutral',
  },
  health: {
    1: 'neutral', 2: 'good', 3: 'neutral', 4: 'neutral', 5: 'neutral',
    6: 'good', 7: 'neutral', 8: 'good', 9: 'bad', 10: 'good',
    11: 'neutral', 12: 'good', 13: 'neutral', 14: 'good', 15: 'bad',
    16: 'good', 17: 'neutral', 18: 'good', 19: 'good', 20: 'good',
    21: 'good', 22: 'good', 23: 'bad', 24: 'good', 25: 'good',
    26: 'neutral', 27: 'neutral', 28: 'good', 29: 'bad', 30: 'good',
  },
}
