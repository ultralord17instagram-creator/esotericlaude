'use client'
import Link from 'next/link'
import Button from '../../components/ui/Button'
import styles from '../lk.module.css'

// Рабочие плейсхолдеры дразнилок «ещё не открыто» (дизайн §14). Без «—».
const TEASERS = {
  card:   'Старший аркан дня уже выбран. Открой послание.',
  number: 'Твоё число дня рассчитано. Посмотри настрой на сегодня.',
  mood:   'Небо настроило твой день. Загляни, каким будет настрой.',
  lunar:  'Луна сегодня в своей фазе. Узнай, чем хорош лунный день.',
}

// Инлайн-контент открытого блока по его id.
function BlockContent({ block }) {
  const c = block.content
  if (block.id === 'card') {
    return (
      <>
        <p className={styles.dashCardValue}>{c.name}</p>
        <p className={styles.dashCardText}>{c.message}</p>
        <p className={styles.dashCardText}>{c.advice}</p>
      </>
    )
  }
  if (block.id === 'number') {
    return (
      <>
        <p className={styles.dashCardValue}>Число дня: {c.number}</p>
        <p className={styles.dashCardText}>{c.text}</p>
      </>
    )
  }
  if (block.id === 'mood') {
    return (
      <>
        <p className={styles.dashCardValue}>{c.sign}</p>
        <p className={styles.dashCardText}>{c.text}</p>
      </>
    )
  }
  if (block.id === 'lunar') {
    return (
      <>
        <p className={styles.dashCardValue}>{c.phase.emoji} Лунный день {c.lunarDay} · {c.phase.name}</p>
        <p className={styles.dashCardText}>{c.meaning}</p>
      </>
    )
  }
  return null
}

// block: { id, title, product, href, available, content }.
// opened: показан ли контент за сегодня. onOpen(id): раскрыть и отметить.
export default function DayBlockCard({ block, opened, onOpen }) {
  // Профиль без даты рождения: мягкий онбординг вместо контента (дизайн §5.6).
  if (!block.available) {
    return (
      <div className={`${styles.dashCard} ${styles.dashCardLocked}`}>
        <div className={styles.dashCardHead}>
          <span className={styles.dashCardTitle}>{block.title}</span>
        </div>
        <p className={styles.dashCardText}>Укажи дату рождения, чтобы открыть.</p>
        <a href="#profile" className={styles.dashProfileLink}>Заполнить профиль</a>
      </div>
    )
  }

  return (
    <div className={`${styles.dashCard} ${opened ? styles.dashCardOpen : ''}`}>
      <div className={styles.dashCardHead}>
        <span className={styles.dashCardTitle}>{block.title}</span>
        <span className={opened ? styles.dashStatusOpen : styles.dashStatusClosed}>
          {opened ? '✓ открыто' : 'ещё нет'}
        </span>
      </div>

      {opened ? (
        <>
          <div className={styles.dashCardBody}><BlockContent block={block} /></div>
          <Link href={block.href} className={styles.dashProductLink}>
            Открыть полностью в «{block.product}»
          </Link>
        </>
      ) : (
        <>
          <p className={styles.dashCardText}>{TEASERS[block.id]}</p>
          <Button variant="secondary" onClick={() => onOpen(block.id)}>Открыть</Button>
        </>
      )}
    </div>
  )
}
