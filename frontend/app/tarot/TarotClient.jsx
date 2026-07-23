'use client'
import Link from 'next/link'
import { SPREADS } from '../content/tarot/spreads'
import { StarMark } from './components/icons'
import styles from './components/tarot.module.css'

// Описания и мета для экрана выбора расклада (макет 2b).
const META = {
  day:   { desc: 'Совет и настрой на день',        meta: '1 карта · 30 сек',   art: 'single' },
  three: { desc: 'Прошлое · Настоящее · Будущее',  meta: '3 карты · популярный', art: 'stack' },
  yesno: { desc: 'Чёткий ответ на закрытый вопрос', meta: '1 карта · 30 сек',   art: 'single' },
}

const SingleArt = () => (
  <div className={styles.spreadArt}><StarMark size={22} /></div>
)
const StackArt = () => (
  <div className={styles.spreadArtStack}>
    <span /><span /><span><StarMark size={20} /></span>
  </div>
)

export default function TarotClient() {
  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>Эзотерический хаб</p>
        <h1 className={styles.title}>Выберите расклад</h1>
        <p className={styles.subtitle}>Чем больше карт — тем глубже разбор ситуации.</p>
      </div>

      <div className={styles.spreadGrid}>
        {SPREADS.map((spread) => {
          const m = META[spread.id] ?? META.day
          return (
            <Link key={spread.id} href={`/tarot/${spread.id}`} className={styles.spreadCard}>
              {m.art === 'stack' ? <StackArt /> : <SingleArt />}
              <div>
                <div className={styles.spreadName}>{spread.name}</div>
                <div className={styles.spreadDesc}>{m.desc}</div>
                <div className={styles.spreadMeta}>{m.meta}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
