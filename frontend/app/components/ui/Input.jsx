import styles from './Input.module.css'

export default function Input({ label, id, error, ...props }) {
  return (
    <div className={styles.group}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input id={id} className={`${styles.input} ${error ? styles.inputError : ''}`} {...props} />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
