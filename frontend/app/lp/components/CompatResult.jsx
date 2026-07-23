'use client'
import { useRouter } from 'next/navigation'
import { resolveVerdict, leaveMonth, RESULT_FALLBACK } from '../../content/landings/him-copy.js'
import styles from '../lp.module.css'

export default function CompatResult({ score, rivalScore }) {
  const router = useRouter()
  const month = leaveMonth(score)

  return (
    <section className={`${styles.funnel} ${styles.shell}`}>
      <div className={styles.result}>
        <div className={`${styles.eyebrow} ${styles.center}`}>Вот вся правда о вашей паре</div>

        <div className={styles.center} style={{ marginBottom: 8 }}>
          <span className={styles.pointChip}>ты <b>{score.herScore}%</b></span>{' '}
          <span className={styles.pointChip}>
            {rivalScore != null ? 'она' : 'идеальная'} <b>{rivalScore ?? score.idealScore}%</b>
          </span>
        </div>

        <div className={styles.resultBlock}>
          <h3>Сколько у тебя осталось</h3>
          <p>{RESULT_FALLBACK.timeLeft}</p>
        </div>

        <div className={styles.resultBlock}>
          <h3>Когда он решит уйти</h3>
          <p>Если ничего не менять, поворот приходится на {month}. {RESULT_FALLBACK.leaveWhen}</p>
        </div>

        <div className={styles.resultBlock}>
          <h3>Чем она берёт его</h3>
          <p>{resolveVerdict(score.attraction)}</p>
        </div>

        <div className={styles.resultBlock}>
          <h3>Как вернуть его к тебе</h3>
          <p>{RESULT_FALLBACK.keepHow}</p>
        </div>

        <div className={styles.triumph}>
          <h3>Готово. Теперь тебе доступны все продукты Astrix</h3>
          <p>Матрица, таро, гороскоп и нумерология. Подписка открыта во всём сервисе.</p>
          <button className={`${styles.cta} ${styles.ctaFull}`} onClick={() => router.push('/')}>
            Перейти в Astrix →
          </button>
        </div>
      </div>
    </section>
  )
}
