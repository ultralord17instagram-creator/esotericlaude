'use client'
import styles from '../horoscope.module.css'

// sky: результат getToday(...).sky { phase, lunarDay, planetary, retro, texts }.
export default function SkyWidget({ sky }) {
  return (
    <section className={styles.sky}>
      <div className={styles.skyFact}>
        <div className={styles.skyIcon}>{sky.phase.emoji}</div>
        <div className={styles.skyLabel}>Фаза Луны</div>
        <div className={styles.skyValue}>{sky.phase.name}</div>
        <div className={styles.skyText}>{sky.texts.phase}</div>
      </div>

      <div className={styles.skyFact}>
        <div className={styles.skyIcon}>🌙</div>
        <div className={styles.skyLabel}>Лунный день</div>
        <div className={styles.skyValue}>{sky.lunarDay}</div>
        <div className={styles.skyText}>{sky.texts.lunarDay}</div>
      </div>

      <div className={styles.skyFact}>
        <div className={styles.skyIcon}>✦</div>
        <div className={styles.skyLabel}>День недели</div>
        <div className={styles.skyValue}>{sky.planetary.planet}</div>
        <div className={styles.skyText}>{sky.texts.planetary}</div>
      </div>

      <div className={styles.skyFact}>
        <div className={styles.skyLabel}>Ретрограды</div>
        {sky.retro.length === 0 ? (
          <div className={styles.skyText}>Сегодня ретроградов нет, планеты идут прямо.</div>
        ) : (
          <>
            <div className={styles.retroBadges}>
              {sky.texts.retro.map(r => (
                <span key={r.planet} className={styles.retroBadge}>{r.planet}</span>
              ))}
            </div>
            {sky.texts.retro.map(r => (
              <div key={r.planet} className={styles.skyText}>{r.text}</div>
            ))}
          </>
        )}
      </div>
    </section>
  )
}
