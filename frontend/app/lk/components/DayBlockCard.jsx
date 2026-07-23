'use client'
import Link from 'next/link'
import styles from '../lk.module.css'

// Рабочие плейсхолдеры дразнилок «ещё не открыто» (дизайн §14). Без «—».
const TEASERS = {
  card:   'Старший аркан дня уже выбран. Открой послание.',
  number: 'Твоё число дня рассчитано. Посмотри настрой на сегодня.',
  mood:   'Небо настроило твой день. Загляни, каким будет настрой.',
  lunar:  'Луна сегодня в своей фазе. Узнай, чем хорош лунный день.',
}

function CheckBadge() {
  return (
    <span className={styles.badgeOpen}>
      <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2 6.5 L5 9 L10 3" fill="none" stroke="#B9954F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      открыто
    </span>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.6" fill="none" stroke="#8C8069" strokeWidth="1.4" />
      <path d="M5 7 V5.2 a3 3 0 0 1 6 0 V7" fill="none" stroke="#8C8069" strokeWidth="1.4" />
    </svg>
  )
}

function MoonGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="10" cy="11" r="7.5" fill="none" stroke="#B9954F" strokeWidth="1.3" />
      <circle cx="13.4" cy="9" r="7.5" fill="#FBF7EF" />
    </svg>
  )
}

// Инлайн-контент открытого блока по его id.
function BlockContent({ block }) {
  const c = block.content
  if (block.id === 'card') {
    return (
      <>
        <div className={styles.dashCardValue}>{c.name}</div>
        <p className={styles.dashCardText}>{c.message}</p>
        <p className={styles.dashCardText}>{c.advice}</p>
      </>
    )
  }
  if (block.id === 'number') {
    return (
      <>
        <div className={styles.numRow}>
          <div className={styles.numCircle}>{c.number}</div>
        </div>
        <p className={styles.dashCardText}>{c.text}</p>
      </>
    )
  }
  if (block.id === 'mood') {
    return (
      <>
        <div className={styles.dashCardValue}>{c.sign}</div>
        <p className={styles.dashCardText}>{c.text}</p>
      </>
    )
  }
  if (block.id === 'lunar') {
    return (
      <>
        <div className={styles.lunarRow}>
          <MoonGlyph />
          <span className={styles.lunarValue}>Лунный день {c.lunarDay} · {c.phase.name}</span>
        </div>
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
        <div className={styles.lockRow}>
          <LockIcon />
          <span className={`${styles.dashCardTitle} ${styles.dashCardTitleMuted}`}>{block.title}</span>
        </div>
        <div className={`${styles.dashCardValue} ${styles.dashCardValueMuted}`}>Пока закрыто</div>
        <p className={styles.dashCardText}>Укажи дату рождения в профиле, чтобы открыть.</p>
        <a href="#profile" className={styles.dashProfileLink}>Заполнить профиль →</a>
      </div>
    )
  }

  return (
    <div className={styles.dashCard}>
      <div className={styles.dashCardHead}>
        <span className={styles.dashCardTitle}>{block.title}</span>
        {opened && <CheckBadge />}
      </div>

      {opened ? (
        <>
          <BlockContent block={block} />
          <Link href={block.href} className={styles.dashProductLink}>
            Открыть полностью в «{block.product}» →
          </Link>
        </>
      ) : (
        <>
          <p className={styles.dashCardText}>{TEASERS[block.id]}</p>
          <button type="button" className={styles.openBtn} onClick={() => onOpen(block.id)}>Открыть</button>
        </>
      )}
    </div>
  )
}
