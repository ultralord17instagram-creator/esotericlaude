'use client'
import { useEffect } from 'react'
import styles from '../lp.module.css'

export default function Calculating({ onDone, duration = 2500 }) {
  useEffect(() => {
    const t = setTimeout(onDone, duration)
    return () => clearTimeout(t)
  }, [onDone, duration])

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Строим твою матрицу...</h2>
      <p className={styles.subtitle}>Считаем числа по дате рождения</p>
    </div>
  )
}
