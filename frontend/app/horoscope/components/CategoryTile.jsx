'use client'
import { CATEGORY_ICON, CATEGORY_TINT, Lock } from './icons'
import styles from '../horoscope.module.css'

// Плитка платной категории дня. Клик открывает экран деталей (drill-down).
// block: { id, name, text: { teaser, body }, bait }. text — объект (платный).
export default function CategoryTile({ block, onOpen }) {
  const Icon = CATEGORY_ICON[block.id]
  const tint = CATEGORY_TINT[block.id]
  const teaser = typeof block.text === 'object' ? block.text.teaser : block.text

  return (
    <button type="button" className={styles.catTile} onClick={() => onOpen(block.id)}>
      <div className={styles.catTop}>
        <div className={styles.catIcon} style={{ background: tint }}>{Icon && <Icon />}</div>
        <span className={styles.catLock}><Lock size={13} /></span>
      </div>
      <h3 className={styles.catName}>{block.name}</h3>
      <p className={styles.catTeaser}>{teaser}</p>
      <div className={styles.catCta}><Lock size={13} /> Смотреть полный разбор</div>
    </button>
  )
}
