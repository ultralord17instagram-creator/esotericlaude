'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { CHAKRA_CONTENT, CHAKRA_LABELS } from '../content/matrix-content'
import Paywall from '../components/ui/Paywall'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import styles from './matrix.module.css'

const CHAKRA_ORDER = ['sahasrara', 'ajna', 'vishuddha', 'anahata', 'manipura', 'svadhishthana', 'muladhara', 'general']

export default function ChakraInterpretations({ chakras, isSubscribed }) {
  // Single-open accordion (all chakra blocks are paid).
  const [openKey, setOpenKey] = useState(null)
  const [payOpen, setPayOpen] = useState(false)

  const toggle = (key) => setOpenKey(cur => (cur === key ? null : key))

  return (
    <div className={styles.interpretations}>
      <h2 className={styles.sectionTitle}>Расшифровка карты чакр</h2>

      {CHAKRA_ORDER.map(key => {
        const label = key === 'general' ? { ru: 'Общее', color: 'var(--text-primary)' } : CHAKRA_LABELS[key]
        const number = chakras[key]?.total || 1
        const text = CHAKRA_CONTENT[key]?.[number] || ''
        const open = openKey === key

        return (
          <div key={key} className={styles.interpretBlock}>
            <button
              type="button"
              className={styles.interpretHeader}
              onClick={() => toggle(key)}
              aria-expanded={open}
            >
              <span className={styles.interpretTitle} style={{ color: label.color }}>
                {label.ru}
              </span>
              <ChevronDown className={styles.chevron} data-open={open} size={18} aria-hidden />
            </button>
            {open && (
              isSubscribed ? (
                <p className={styles.interpretText}>{text}</p>
              ) : (
                <div className={styles.paidReveal}>
                  <p className={styles.interpretPreview}>{text.slice(0, 60)}…</p>
                  <Button variant="unlock" size="sm" onClick={() => setPayOpen(true)}>
                    Смотреть полный разбор
                  </Button>
                </div>
              )
            )}
          </div>
        )
      })}

      {!isSubscribed && (
        <Modal open={payOpen} onClose={() => setPayOpen(false)}>
          <Paywall />
        </Modal>
      )}
    </div>
  )
}
