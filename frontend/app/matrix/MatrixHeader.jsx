import styles from './matrix.module.css'

const ARCHETYPES = {
  1: 'Лидер', 2: 'Дипломат', 3: 'Творец', 4: 'Строитель',
  5: 'Авантюрист', 6: 'Воспитатель', 7: 'Мыслитель', 8: 'Организатор',
  9: 'Мудрец', 10: 'Исследователь', 11: 'Мечтатель', 12: 'Жертва',
  13: 'Трансформатор', 14: 'Алхимик', 15: 'Искуситель', 16: 'Бунтарь',
  17: 'Звезда', 18: 'Иллюзионист', 19: 'Победитель', 20: 'Судья',
  21: 'Маг', 22: 'Безумец',
}

export default function MatrixHeader({ name, birthDate, age, personalNumber }) {
  const displayDate = birthDate.includes('-')
    ? birthDate.split('-').reverse().join('.')
    : birthDate

  return (
    <div className={styles.header}>
      <div className={styles.numberMedallion}>{personalNumber}</div>
      <div>
        <p className={styles.eyebrow}>Твоя матрица</p>
        <h1 className={styles.headerTitle}>Матрица судьбы</h1>
        <div className={styles.headerMeta}>
          <span className={styles.headerName}>{name || 'Ваша матрица'}</span>
          <span className={styles.headerDate}>Дата рождения: {displayDate}</span>
          <span className={styles.headerAge}>
            Возраст: {age}
            <span className={styles.archetype}>{ARCHETYPES[personalNumber] || 'Исследователь'}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
