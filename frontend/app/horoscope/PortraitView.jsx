'use client'
import { getPortrait } from '../content/horoscope'
import PaidReveal from './components/PaidReveal'
import {
  CharacterIcon, SuperpowerIcon, ShadowIcon, HeartIcon, CoinIcon, PurposeIcon,
} from './components/icons'
import styles from './horoscope.module.css'

// Иконка и оттенок подложки по блоку портрета (дизайн §7).
const GoldCoin = (props) => <CoinIcon color="#B9954F" {...props} />
const META = {
  core:    { Icon: CharacterIcon,  tint: 'rgba(154,141,114,.14)' },
  power:   { Icon: SuperpowerIcon, tint: 'rgba(185,149,79,.14)' },
  shadow:  { Icon: ShadowIcon,     tint: 'rgba(142,130,160,.16)' },
  love:    { Icon: HeartIcon,      tint: 'rgba(192,132,151,.14)' },
  money:   { Icon: GoldCoin,       tint: 'rgba(185,149,79,.14)' },
  purpose: { Icon: PurposeIcon,    tint: 'rgba(127,160,122,.16)' },
}

// 6 блоков по знаку. core бесплатный (строка), остальные платные ({ teaser, body }).
export default function PortraitView({ sign, isSubscribed }) {
  const data = getPortrait(sign.id)
  return (
    <div className={styles.portraitGrid}>
      {data.blocks.map(b => {
        const { Icon, tint } = META[b.id] ?? {}
        const unlocked = b.free || isSubscribed
        const isPaid = typeof b.text === 'object'
        const full = isPaid ? `${b.text.teaser} ${b.text.body}` : b.text
        const bait = b.bait ?? (isPaid ? b.text.teaser : b.text)
        const ghost = isPaid ? b.text.body : undefined
        return (
          <div key={b.id} className={styles.pCard}>
            <div className={styles.pIcon} style={{ background: tint }}>{Icon && <Icon />}</div>
            <h3 className={styles.pName}>{b.name}</h3>
            {unlocked
              ? <p className={styles.pText}>{full}</p>
              : <PaidReveal bait={bait} ghost={ghost} />}
          </div>
        )
      })}
    </div>
  )
}
