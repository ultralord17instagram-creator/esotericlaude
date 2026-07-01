'use client'
import styles from './Button.module.css'

export default function Button({ children, variant = 'primary', size = 'md', disabled, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${styles[variant]} ${styles[size]}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
