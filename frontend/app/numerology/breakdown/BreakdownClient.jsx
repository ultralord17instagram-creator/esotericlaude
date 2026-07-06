'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'
import ProductInputForm from '../../components/ProductInputForm'
import { buildBreakdown, loadProfile, saveProfile } from '../../content/numerology'
import BlockCard from '../components/BlockCard'
import NumberBadge from '../components/NumberBadge'
import styles from '../numerology.module.css'

export default function BreakdownClient({ product }) {
  const { user } = useAuth()
  const isSubscribed = user?.subscribed ?? false
  const [result, setResult] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => { setProfile(loadProfile()) }, [])

  const run = (date, name) => {
    saveProfile({ date, name })
    setProfile({ date, name })
    setResult(buildBreakdown({ date, name }))
  }

  const handleSubmit = (inputs) => {
    const date = inputs.birth_date
    const name = inputs.name
    if (!date || !name) return
    run(date, name)
  }

  // Форма ввода (общая ProductInputForm требует birth_date + name — уже настроено в реестре).
  if (!result) {
    return (
      <div className={styles.page}>
        <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
        <div className={styles.head}>
          <h1 className={styles.title}>Разбор личности</h1>
          <p className={styles.subtitle}>Дата рождения и имя раскроют шесть сфер твоей натуры.</p>
        </div>
        <ProductInputForm product={product} onSubmit={handleSubmit} />
        {profile && (
          <button className={styles.resetBtn} onClick={() => run(profile.date, profile.name)}>
            Повторить последний разбор ({profile.name})
          </button>
        )}
      </div>
    )
  }

  const destiny = result.blocks.find(b => b.free)
  return (
    <div className={styles.page}>
      <Link href="/numerology" className={styles.backLink}>‹ Все сценарии</Link>
      <NumberBadge number={destiny.number} label="Число жизненного пути" />
      {result.blocks.map(b => (
        <BlockCard key={b.id} title={b.name} number={b.number} text={b.text} free={b.free} isSubscribed={isSubscribed} />
      ))}
      <button className={styles.resetBtn} onClick={() => setResult(null)}>Ввести другую</button>
    </div>
  )
}
