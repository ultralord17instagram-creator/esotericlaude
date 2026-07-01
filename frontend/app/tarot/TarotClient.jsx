'use client'
import { getTarotResult } from '../content/tarot'
import ProductPage from '../components/ProductPage'
import TarotFreeResult from './TarotFreeResult'
import TarotPaidResult from './TarotPaidResult'

export default function TarotClient({ product }) {
  return (
    <ProductPage
      product={product}
      getResult={getTarotResult}
      FreeResult={TarotFreeResult}
      PaidResult={TarotPaidResult}
    />
  )
}
