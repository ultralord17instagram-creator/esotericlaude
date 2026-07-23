'use client'
import { RATING_GLYPH, RATING_LABEL } from './icons'
import styles from '../horoscope.module.css'

const SPHERE_LABEL = {
  beauty: 'Красота', money: 'Деньги', love: 'Любовь',
  affairs: 'Дела', health: 'Здоровье',
}
const RATING_CLASS = { good: 'rGood', neutral: 'rNeutral', bad: 'rBad' }

// spheres: getLunar(...).spheres [{ id, overview, ratings[30] }].
export default function LunarGrid({ spheres }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1)
  return (
    <>
      <div className={styles.gridWrap}>
        <table className={styles.gridTable}>
          <thead>
            <tr>
              <th className={styles.gridSphere}>Сфера</th>
              {days.map(d => <th key={d}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {spheres.map(s => (
              <tr key={s.id}>
                <td className={styles.gridSphere}>{SPHERE_LABEL[s.id] ?? s.id}</td>
                {s.ratings.map((r, i) => (
                  <td key={i} className={styles[RATING_CLASS[r]]} title={RATING_LABEL[r]}>
                    {RATING_GLYPH[r]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.gridLegend}>
        <span className={styles.rGood}>● хорошо</span>
        <span className={styles.rNeutral}>○ нейтрально</span>
        <span className={styles.rBad}>× неблагоприятно</span>
      </div>
    </>
  )
}
