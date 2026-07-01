'use client'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ProductInputForm from './ProductInputForm'
import Paywall from './ui/Paywall'
import styles from './ProductPage.module.css'

export default function ProductPage({ product, getResult, FreeResult, PaidResult }) {
  const { user } = useAuth()
  const [result, setResult] = useState(null)

  const handleSubmit = async (inputs) => {
    const data = getResult(inputs)
    setResult(data)
  }

  const isSubscribed = user?.subscribed

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <span className={styles.icon}>{product.icon}</span>
        <h1 className={styles.title}>{product.name}</h1>
        <p className={styles.desc}>{product.description}</p>
      </div>

      {!result && (
        <section className={styles.formSection}>
          <ProductInputForm product={product} onSubmit={handleSubmit} />
        </section>
      )}

      {result && (
        <section className={styles.resultSection}>
          <FreeResult result={result.free} />

          {isSubscribed ? (
            <PaidResult result={result.paid} />
          ) : (
            <Paywall />
          )}

          <button
            className={styles.reset}
            onClick={() => setResult(null)}
          >
            Попробовать ещё раз
          </button>
        </section>
      )}
    </div>
  )
}
