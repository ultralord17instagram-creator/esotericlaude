'use client'
import styles from '../lp.module.css'

// Заголовок с акцентным словом (курсив золотом), как в макете. Данные из конфига.
function Title({ text, accent }) {
  if (accent && text.includes(accent)) {
    const [before, after] = text.split(accent)
    return <>{before}<span className={styles.accent}>{accent}</span>{after}</>
  }
  return text
}

// Космический арт-полумесяц (прототип Astrix). Только для variant=cosmic.
function CosmicArt() {
  return (
    <div className={styles.cosmicArt}>
      <div className={styles.cosmicOrbit1} />
      <div className={styles.cosmicOrbit2} />
      <div className={styles.cosmicMoon} />
      <span className={`${styles.cosmicSpark} ${styles.cosmicSpark1}`} />
      <span className={`${styles.cosmicSpark} ${styles.cosmicSpark2}`} />
      <span className={`${styles.cosmicSpark} ${styles.cosmicSpark3}`} />
    </div>
  )
}

function OrbitArt() {
  return (
    <>
      <div className={styles.orbit}>
        <div className={styles.orbitRing} />
        <div className={styles.orbitRing2} />
        <div className={styles.orbitA} />
        <div className={styles.orbitB} />
        <div className={styles.orbitCore} />
      </div>
      <div className={styles.orbitSun} />
    </>
  )
}

export default function Hero({ hero, onStart, variant }) {
  const cosmic = variant === 'cosmic'
  return (
    <section className={styles.hero}>
      <div className={styles.heroTop}>
        <span className={`${styles.wordmark} ${styles.heroWordmark}`}>Astrix</span>
      </div>

      <div className={styles.heroArt}>
        {cosmic ? <CosmicArt /> : <OrbitArt />}
      </div>

      <div className={styles.heroCopy}>
        <span className={`${styles.wordmark} ${styles.heroWordmarkDesk}`}>Astrix</span>
        <div className={styles.eyebrow}>{hero.eyebrow}</div>
        <h1 className={`${styles.h1} ${styles.heroTitle}`}>
          <Title text={hero.title} accent={hero.titleAccent} />
        </h1>
        <p className={`${styles.lead} ${styles.heroSub}`}>{hero.subtitle}</p>
        <div className={styles.heroFoot}>
          <button className={`${styles.cta} ${styles.ctaFull}`} onClick={onStart}>{hero.cta}</button>
          {hero.note && <span className={styles.micro}>{hero.note}</span>}
        </div>
      </div>
    </section>
  )
}
