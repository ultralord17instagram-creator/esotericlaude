'use client'
import { getHoroscopeResult } from '../content/horoscope'
import ProductPage from '../components/ProductPage'
import HoroscopeFreeResult from './HoroscopeFreeResult'
import HoroscopePaidResult from './HoroscopePaidResult'

export default function HoroscopeClient({ product }) {
  return (
    <ProductPage
      product={product}
      getResult={getHoroscopeResult}
      FreeResult={HoroscopeFreeResult}
      PaidResult={HoroscopePaidResult}
    />
  )
}
