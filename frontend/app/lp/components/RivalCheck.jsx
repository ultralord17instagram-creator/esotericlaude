'use client'
import { useState } from 'react'
import styles from '../lp.module.css'

export default function RivalCheck({ score, onDone }) {
  const [date, setDate] = useState('')

  return (
    <section className={`${styles.funnel} ${styles.shell}`}>
      <div className={`${styles.teaser} ${styles.center}`} style={{ maxWidth: 520, margin: '0 auto' }}>
        <div className={styles.eyebrow}>Проверка соперницы</div>
        <h2 className={styles.h2} style={{ marginTop: 14 }}>
          Знаешь её дату рождения? Введи, и <span className={styles.accent}>я сравню вас напрямую.</span>
        </h2>
        <p className={styles.body} style={{ marginTop: 12 }}>
          Ты совпадаешь с ним на {score.herScore}%. Посмотрим, насколько совпадает она.
        </p>
        <div className={styles.fieldRow} style={{ marginTop: 22 }}>
          <input className={styles.field} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button className={`${styles.cta} ${styles.ctaFull}`} style={{ marginTop: 14 }}
          disabled={!date} onClick={() => onDone(date)}>
          Сравнить нас →
        </button>
        <button className={styles.linkBtn} style={{ marginTop: 14 }} onClick={() => onDone(null)}>
          Пропустить
        </button>
      </div>
    </section>
  )
}
