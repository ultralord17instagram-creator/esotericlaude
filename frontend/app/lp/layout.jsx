import styles from './lp.module.css'
import Backdrop from './components/Backdrop'

export const metadata = { robots: { index: true, follow: true } }

// Тёмная бордово-золотая тема Astrix, скоуплена на всё поддерево /lp.
// Основной сайт (светлый) не затрагивается: обёртка задаёт свои цвета/фон.
export default function LpLayout({ children }) {
  return (
    <div className={styles.root}>
      <Backdrop />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
