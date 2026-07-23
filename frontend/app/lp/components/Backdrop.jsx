import styles from '../lp.module.css'

// Детерминированный звёздный фон лендинга. Seeded PRNG (без Math.random) —
// SSR и клиент дают одинаковую разметку, без рассинхрона гидрации.
function makeStars(n, seed) {
  let r = seed
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 }
  const out = []
  for (let i = 0; i < n; i++) {
    const size = 1 + Math.round(rnd() * 2)
    out.push({
      top: (3 + rnd() * 92).toFixed(2) + '%',
      left: (3 + rnd() * 94).toFixed(2) + '%',
      width: size + 'px',
      height: size + 'px',
      boxShadow: `0 0 ${4 + size * 2}px rgba(240,211,174,.9)`,
      animation: `twinkle ${(2.5 + rnd() * 3).toFixed(2)}s ease-in-out ${(rnd() * 3).toFixed(2)}s infinite`,
    })
  }
  return out
}

const STARS = makeStars(26, 137)

export default function Backdrop() {
  return (
    <div className={styles.backdrop} aria-hidden="true">
      {STARS.map((s, i) => (
        <div key={i} className={styles.star} style={s} />
      ))}
      <div className={styles.moon} />
    </div>
  )
}
