import { getProduct } from '../../products.config'
import ForecastClient from './ForecastClient'
export const metadata = { title: 'Нумерология — Прогноз' }
export default function ForecastPage() { return <ForecastClient product={getProduct('numerology')} /> }
