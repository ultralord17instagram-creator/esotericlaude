// frontend/app/lp/logic/compatScore.js
// Детерминированный «подкрученный» счёт совместимости лендинга «Проверь его».
// Одна пара дат всегда даёт одно значение. Числа подкручены осознанно:
// её процент всегда в тревожной зоне, идеальная и соперница всегда выше.
// Движок матрицы (calculateMatrix) не трогаем, только читаем узлы.
import { reduce, calculateMatrix } from '../../content/matrix.js'

// Её совместимость с ним + анонимная «идеальная» + точка притяжения.
export function herVsHim(herDate, hisDate) {
  const her = calculateMatrix(herDate).nodes
  const his = calculateMatrix(hisDate).nodes
  const base = reduce(her.center + his.center)            // 1..22
  const secondary = reduce(her.female1 + his.male1)       // 1..22
  const herScore = 28 + ((base * 7 + secondary * 3) % 31) // 28..58
  const idealScore = 72 + ((base * 5 + 11) % 21)          // 72..92, всегда > herScore
  const attraction = his.female1                          // 1..22, тип женщины, к которой его тянет
  return { herScore, idealScore, attraction }
}

// Соперница по реальной дате: всегда бьёт её на видимый отрыв.
export function rivalVsHim(rivalDate, hisDate, herScore) {
  const rival = calculateMatrix(rivalDate).nodes
  const his = calculateMatrix(hisDate).nodes
  const raw = 60 + ((reduce(rival.center + his.center) * 7) % 33) // 60..92
  return Math.min(95, Math.max(raw, herScore + 15))
}
