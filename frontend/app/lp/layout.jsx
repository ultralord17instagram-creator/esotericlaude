import styles from './lp.module.css'
import Backdrop from './components/Backdrop'

// robots/canonical/OG для лендингов задаются в app/lp/[slug]/page.jsx через
// generateMetadata: дублировать их здесь нельзя, иначе появятся два источника
// правды и они рано или поздно разъедутся.

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
