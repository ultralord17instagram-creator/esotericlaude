'use client'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Input from './ui/Input'
import Button from './ui/Button'
import styles from './ProductInputForm.module.css'

export default function ProductInputForm({ product, onSubmit }) {
  const { user } = useAuth()
  const [forOther, setForOther] = useState(false)
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (key, val) => setValues(v => ({ ...v, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(values)
    setLoading(false)
  }

  const needsBirthDate = product.inputs.includes('birth_date')
  const needsName = product.inputs.includes('name')
  const needsIntention = product.extraInputs.includes('intention')

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {user && (
        <div className={styles.toggle}>
          <button
            type="button"
            className={`${styles.tab} ${!forOther ? styles.active : ''}`}
            onClick={() => setForOther(false)}
          >
            Для себя
          </button>
          <button
            type="button"
            className={`${styles.tab} ${forOther ? styles.active : ''}`}
            onClick={() => setForOther(true)}
          >
            Для другого
          </button>
        </div>
      )}

      {needsBirthDate && (!user || forOther) && (
        <Input
          label="Дата рождения"
          id="birth_date"
          type="date"
          required
          value={values.birth_date ?? ''}
          onChange={e => set('birth_date', e.target.value)}
        />
      )}

      {needsName && (!user || forOther) && (
        <Input
          label="Имя"
          id="name"
          type="text"
          required
          placeholder="Введи имя"
          value={values.name ?? ''}
          onChange={e => set('name', e.target.value)}
        />
      )}

      {needsIntention && (
        <Input
          label="Вопрос или намерение (необязательно)"
          id="intention"
          type="text"
          placeholder="Например: что меня ждёт в отношениях?"
          value={values.intention ?? ''}
          onChange={e => set('intention', e.target.value)}
        />
      )}

      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Считаем...' : 'Получить результат'}
      </Button>
    </form>
  )
}
