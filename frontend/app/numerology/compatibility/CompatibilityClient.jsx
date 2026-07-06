'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import { buildCompatibility } from '../../content/numerology'
import CompatibilityForm from '../components/CompatibilityForm'
import BlockCard from '../components/BlockCard'
import styles from '../numerology.module.css'

export default function CompatibilityClient() {
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false
  const [result, setResult] = useState(null)

  const handleSubmit = (v) => {
    if (!v.date || !v.name || !v.date2 || !v.name2) return
    setResult(buildCompatibility(v))
  }

  if (!result) {
    return (
      <div className={styles.page}>
        <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
        <div className={styles.head}>
          <h1 className={styles.title}>Совместимость</h1>
          <p className={styles.subtitle}>Даты и имена двоих покажут, как складывается ваша связь.</p>
        </div>
        <CompatibilityForm onSubmit={handleSubmit} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
      <div className={styles.head}>
        <h1 className={styles.title}>Ваша пара: {result.lp1} и {result.lp2}</h1>
      </div>
      {result.blocks.map(b => (
        <BlockCard key={b.id} title={b.name} number={b.number} text={b.text}
          free={b.free} isSubscribed={isSubscribed} nameTouch={b.nameTouch?.body ?? b.nameTouch} />
      ))}
      <button className={styles.resetBtn} onClick={() => setResult(null)}>Другая пара</button>
    </div>
  )
}
