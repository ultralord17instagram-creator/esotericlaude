'use client'
import { useState } from 'react'
import { PhaseIcon, MoonDayIcon, WeekdayIcon, RetroIcon } from './icons'
import styles from '../horoscope.module.css'

// sky: результат getToday(...).sky { phase, lunarDay, planetary, retro, texts }.
// Десктоп — ряд из четырёх фактов; мобильный — переключаемая карточка с чипами.
export default function SkyWidget({ sky }) {
  const [sel, setSel] = useState(0)

  const retroText = sky.retro.length === 0
    ? 'Сегодня ретроградных планет нет, все идут прямо. Хороший фон, чтобы начинать разговоры и запускать задуманное.'
    : sky.texts.retro.map(r => r.text).join(' ')

  const facts = [
    { label: 'Фаза Луны',   value: sky.phase.name,                                    text: sky.texts.phase,     Icon: PhaseIcon,   moon: true },
    { label: 'Лунный день', value: `${sky.lunarDay}-й день`,                          text: sky.texts.lunarDay,  Icon: MoonDayIcon },
    { label: 'День недели',  value: sky.planetary.planet,                             text: sky.texts.planetary, Icon: WeekdayIcon },
    { label: 'Ретрограды',   value: sky.retro.length ? sky.retro.join(', ') : 'Нет',  text: retroText,           Icon: RetroIcon },
  ]

  const cur = facts[sel]
  const CurIcon = cur.Icon

  return (
    <section>
      {/* Десктоп: четыре карточки в ряд */}
      <div className={styles.skyRow}>
        {facts.map(f => {
          const Icon = f.Icon
          return (
            <div key={f.label} className={styles.skyCard}>
              <div className={`${styles.skyIconWrap} ${f.moon ? styles.skyIconMoon : ''}`}>
                <Icon />
              </div>
              <div className={styles.skyCardLabel}>{f.label}</div>
              <div className={styles.skyCardValue}>{f.value}</div>
              <p className={styles.skyCardText}>{f.text}</p>
            </div>
          )
        })}
      </div>

      {/* Мобильный: чипы + выбранный факт */}
      <div className={styles.skyMobile}>
        <div className={styles.skyChips}>
          {facts.map((f, i) => (
            <button
              key={f.label} type="button"
              className={`${styles.skyChip} ${i === sel ? styles.skyChipOn : ''}`}
              onClick={() => setSel(i)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className={styles.skyMain}>
          <div className={styles.skyMainIcon}><CurIcon /></div>
          <div className={styles.skyMainMeta}>
            <div className={styles.skyMainLabel}>{cur.label}</div>
            <div className={styles.skyMainTitle}>{cur.value}</div>
          </div>
        </div>
        <p className={styles.skyMainText}>{cur.text}</p>
      </div>
    </section>
  )
}
