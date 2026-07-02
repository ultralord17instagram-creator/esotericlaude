'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { MATRIX_CONTENT, FREE_ASPECTS, PAID_ASPECTS, ASPECT_LABELS } from '../content/matrix-content'
import Paywall from '../components/ui/Paywall'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import styles from './matrix.module.css'

export default function MatrixInterpretations({ centerNumber, isSubscribed }) {
  const content = MATRIX_CONTENT[centerNumber] || MATRIX_CONTENT[1]

  // Free blocks: expanded by default, each collapsible independently.
  const [freeOpen, setFreeOpen] = useState(
    () => Object.fromEntries(FREE_ASPECTS.map(a => [a, true]))
  )
  // Paid blocks: single-open accordion.
  const [openPaid, setOpenPaid] = useState(null)
  // Paywall modal.
  const [payOpen, setPayOpen] = useState(false)

  const toggleFree = (a) => setFreeOpen(s => ({ ...s, [a]: !s[a] }))
  const togglePaid = (a) => setOpenPaid(cur => (cur === a ? null : a))

  return (
    <div className={styles.interpretations}>
      <h2 className={styles.sectionTitle}>Расшифровка значений</h2>

      {FREE_ASPECTS.map(aspect => {
        const open = freeOpen[aspect]
        return (
          <div key={aspect} className={styles.interpretBlock}>
            <button
              type="button"
              className={styles.interpretHeader}
              onClick={() => toggleFree(aspect)}
              aria-expanded={open}
            >
              <span className={styles.interpretTitle}>{ASPECT_LABELS[aspect]}</span>
              <ChevronDown className={styles.chevron} data-open={open} size={18} aria-hidden />
            </button>
            {open && <p className={styles.interpretText}>{content[aspect]}</p>}
          </div>
        )
      })}

      {PAID_ASPECTS.map(aspect => {
        const open = openPaid === aspect
        return (
          <div key={aspect} className={styles.interpretBlock}>
            <button
              type="button"
              className={styles.interpretHeader}
              onClick={() => togglePaid(aspect)}
              aria-expanded={open}
            >
              <span className={styles.interpretTitle}>{ASPECT_LABELS[aspect]}</span>
              <ChevronDown className={styles.chevron} data-open={open} size={18} aria-hidden />
            </button>
            {open && (
              isSubscribed ? (
                <p className={styles.interpretText}>{content[aspect]}</p>
              ) : (
                <div className={styles.paidReveal}>
                  <p className={styles.interpretPreview}>{content[aspect].slice(0, 60)}…</p>
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
