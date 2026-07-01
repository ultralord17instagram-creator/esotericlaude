'use client'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { calculateMatrix } from '../content/matrix'
import ProductInputForm from '../components/ProductInputForm'
import MatrixHeader from './MatrixHeader'
import MatrixSVG from './MatrixSVG'
import ChakraMap from './ChakraMap'
import PurposeSection from './PurposeSection'
import MatrixInterpretations from './MatrixInterpretations'
import ChakraInterpretations from './ChakraInterpretations'
import styles from './matrix.module.css'

// products.config.js entry for matrix — passed as prop from page.jsx
export default function MatrixClient({ product }) {
  const { user } = useAuth()
  const [matrixData, setMatrixData] = useState(null)
  const [inputName, setInputName] = useState('')

  const isSubscribed = user?.subscribed ?? false

  const handleSubmit = (inputs) => {
    const birthDate = user && !inputs.birth_date
      ? user.birth_date  // future: may come from profile
      : inputs.birth_date
    if (!birthDate) return
    setInputName(inputs.name || user?.email?.split('@')[0] || '')
    setMatrixData(calculateMatrix(birthDate))
  }

  if (!matrixData) {
    return (
      <div className={styles.page}>
        <div className={styles.formSection}>
          <p className={styles.eyebrow}>Эзотерический хаб</p>
          <h1 className={styles.headerTitle}>Матрица судьбы</h1>
          <ProductInputForm product={product} onSubmit={handleSubmit} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <MatrixHeader
        name={inputName}
        birthDate={matrixData.birthDate}
        age={matrixData.age}
        personalNumber={matrixData.nodes.center}
      />

      <div className={styles.matrixRow}>
        <div className={styles.diagramTile}>
          <MatrixSVG nodes={matrixData.nodes} />
        </div>
        <ChakraMap chakras={matrixData.chakras} />
      </div>

      <PurposeSection purposes={matrixData.purposes} />

      <MatrixInterpretations
        centerNumber={matrixData.nodes.center}
        isSubscribed={isSubscribed}
      />

      <ChakraInterpretations
        chakras={matrixData.chakras}
        isSubscribed={isSubscribed}
      />

      <button className={styles.resetBtn} onClick={() => setMatrixData(null)}>
        Рассчитать другую дату
      </button>
    </div>
  )
}
