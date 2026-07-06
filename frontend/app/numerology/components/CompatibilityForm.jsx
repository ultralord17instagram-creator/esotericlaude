'use client'
import { useState } from 'react'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import styles from '../numerology.module.css'

export default function CompatibilityForm({ initial, onSubmit }) {
  const [v, setV] = useState(initial ?? { date: '', name: '', date2: '', name2: '' })
  const set = (k, val) => setV(s => ({ ...s, [k]: val }))
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(v)
    setLoading(false)
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <div className={styles.pairCol}>
        <p className={styles.pairLabel}>Первый человек</p>
        <Input label="Дата рождения" id="date" type="date" required value={v.date} onChange={e => set('date', e.target.value)} />
        <Input label="Имя" id="name" type="text" required placeholder="Имя" value={v.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className={styles.pairCol}>
        <p className={styles.pairLabel}>Второй человек</p>
        <Input label="Дата рождения" id="date2" type="date" required value={v.date2} onChange={e => set('date2', e.target.value)} />
        <Input label="Имя" id="name2" type="text" required placeholder="Имя" value={v.name2} onChange={e => set('name2', e.target.value)} />
      </div>
      <Button type="submit" size="lg" disabled={loading}>{loading ? 'Считаем...' : 'Проверить пару'}</Button>
    </form>
  )
}
