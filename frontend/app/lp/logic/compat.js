// Деривация партнёрских чисел лендинга «Отношения».
// Детерминированно из узлов матрицы: одна дата всегда даёт одно значение.
// Движок расчёта (calculateMatrix) не трогается, используем готовые узлы.
import { reduce } from '../../content/matrix.js'

// «Точка отношений»: узел на женской линии (линия любви на схеме).
// Показывает, кого человек притягивает и почему держится.
export function relationshipPoint(nodes) {
  return nodes.female1
}

// «Число совместимости»: ядро подходящего партнёра, с которым круг обрывается.
export function compatibleCore(nodes) {
  return reduce(nodes.center + nodes.female1)
}
