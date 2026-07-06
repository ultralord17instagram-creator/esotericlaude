import { getProduct } from '../../products.config'
import BreakdownClient from './BreakdownClient'

export const metadata = { title: 'Нумерология — Разбор личности' }

export default function BreakdownPage() {
  return <BreakdownClient product={getProduct('numerology')} />
}
