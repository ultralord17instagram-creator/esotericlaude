import { CHAKRA_LABELS } from '../content/matrix-content'
import styles from './matrix.module.css'

const CHAKRA_ORDER = ['sahasrara', 'ajna', 'vishuddha', 'anahata', 'manipura', 'svadhishthana', 'muladhara']

export default function ChakraMap({ chakras }) {
  return (
    <div className={styles.chakraSection}>
      <h2 className={styles.sectionTitle}>Карта чакр</h2>
      <table className={styles.chakraTable}>
        <thead>
          <tr>
            <th colSpan={2}>Название чакры</th>
            <th>Итог</th>
            <th>Причина</th>
            <th>Страх</th>
          </tr>
        </thead>
        <tbody>
          {CHAKRA_ORDER.map(key => {
            const label = CHAKRA_LABELS[key]
            const data = chakras[key]
            return (
              <tr key={key}>
                <td className={styles.chakraNum}>{label.number}</td>
                <td className={styles.chakraName} style={{ color: label.color }}>
                  {label.ru}
                </td>
                <td>{data.total}</td>
                <td>{data.cause}</td>
                <td>{data.fear}</td>
              </tr>
            )
          })}
          <tr className={styles.chakraGeneral}>
            <td colSpan={2}><strong>Общее</strong></td>
            <td>{chakras.general.total}</td>
            <td>{chakras.general.cause}</td>
            <td>{chakras.general.fear}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
