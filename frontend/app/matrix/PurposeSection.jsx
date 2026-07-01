import styles from './matrix.module.css'

export default function PurposeSection({ purposes }) {
  const { personal, social, spiritual } = purposes

  return (
    <div className={styles.purposeGrid}>
      <div className={styles.purposeBlock}>
        <h3 className={styles.purposeTitle}>Личное предназначение</h3>
        <p className={styles.purposeDesc}>Проявляется в возрасте от 20 до 40 лет в результате объединения физических и духовных аспектов личности.</p>
        <div className={styles.purposeNumbers}>
          <span>Духовное <span className={styles.purposeNum}>{personal.spiritual}</span></span>
          <span className={styles.purposeArrow}>→</span>
          <span className={styles.purposeAdult}>{personal.adult}</span>
          <span>Взрослая личность</span>
        </div>
        <div className={styles.purposeNumbers}>
          <span>Материальное <span className={styles.purposeNum}>{personal.material}</span></span>
        </div>
      </div>

      <div className={styles.purposeBlock}>
        <h3 className={styles.purposeTitle}>Социальное предназначение</h3>
        <p className={styles.purposeDesc}>То хорошее и полезное, чем вы будете делиться с окружающими в возрасте от 40 до 60 лет.</p>
        <div className={styles.purposeNumbers}>
          <span>Взаимодействие с мужчинами <span className={styles.purposeNum}>{social.withMen}</span></span>
        </div>
        <div className={styles.purposeNumbers}>
          <span>с женщинами <span className={styles.purposeNum}>{social.withWomen}</span></span>
          <span className={styles.purposeArrow}>→</span>
          <span className={styles.purposeNum}>{social.withSociety}</span>
          <span>с социумом</span>
        </div>
      </div>

      <div className={styles.purposeBlock}>
        <h3 className={styles.purposeTitle}>Духовное предназначение</h3>
        <p className={styles.purposeDesc}>В этом суть вашего воплощения после 60 лет. Даётся бонусом в плюсе, если проработаны социальные и личные задачи.</p>
        <div className={styles.purposeNumbers}>
          <span className={styles.purposeNum}>{spiritual.number}</span>
          <span>Делать руками</span>
        </div>
      </div>
    </div>
  )
}
