'use client'
import styles from '../lp.module.css'

// Экран-развилка: выбор состояния -> onSelect(branch).
export default function Fork({ fork, onSelect }) {
  return (
    <section className={styles.funnel}>
      <div className={styles.quizBody}>
        <h2 className={`${styles.h2} ${styles.quizQuestion}`}>{fork.title}</h2>
        <div className={styles.options}>
          {fork.options.map((o, i) => (
            <button key={o.branch}
              className={styles.option}
              style={{ animationDelay: `${0.05 + i * 0.06}s` }}
              onClick={() => onSelect(o.branch)}>
              <strong>{o.label}</strong>
              <span className={styles.micro}> {o.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
