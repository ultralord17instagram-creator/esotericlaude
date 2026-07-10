'use client'
import { getPortrait } from '../content/horoscope'
import BlockCard from './components/BlockCard'

// 6 блоков по знаку (дизайн §7). core бесплатный, остальные платные.
export default function PortraitView({ sign, isSubscribed }) {
  const data = getPortrait(sign.id)
  return (
    <div>
      {data.blocks.map(b => <BlockCard key={b.id} block={b} isSubscribed={isSubscribed} />)}
    </div>
  )
}
