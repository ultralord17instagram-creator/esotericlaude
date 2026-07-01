'use client'
import { getNumerologyResult } from '../content/numerology'
import ProductPage from '../components/ProductPage'
import NumerologyFreeResult from './NumerologyFreeResult'
import NumerologyPaidResult from './NumerologyPaidResult'

export default function NumerologyClient({ product }) {
  return (
    <ProductPage
      product={product}
      getResult={getNumerologyResult}
      FreeResult={NumerologyFreeResult}
      PaidResult={NumerologyPaidResult}
    />
  )
}
