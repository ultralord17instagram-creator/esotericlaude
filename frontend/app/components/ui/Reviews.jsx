'use client'
import { useRef, useState, useCallback } from 'react'
import styles from '../../landing.module.css'

export default function Reviews({ items }) {
  const scrollerRef = useRef(null)
  const [active, setActive] = useState(0)

  const onScroll = useCallback(() => {
    const sc = scrollerRef.current
    if (!sc) return
    const card = sc.querySelector('[data-card]')
    const cw = card ? card.offsetWidth : 1
    setActive(Math.round(sc.scrollLeft / (cw + 14)))
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.reviewsScroller} ref={scrollerRef} onScroll={onScroll}>
        {items.map((r, i) => (
          <div key={i} data-card className={styles.review}>
            <div className={styles.reviewQuote}>“</div>
            <p className={styles.reviewText}>{r.text}</p>
            <div className={styles.reviewFoot}>
              <div className={styles.reviewAvatar}>
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M8 1 l1.4 4.6 4.6 1.4 -4.6 1.4 -1.4 4.6 -1.4 -4.6 -4.6 -1.4 4.6 -1.4 z" fill="#B9954F"/>
                </svg>
              </div>
              <div>
                <div className={styles.reviewName}>{r.name}</div>
                <div className={styles.reviewMeta}>{r.meta}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.dots}>
        {items.map((_, i) => (
          <span key={i} className={`${styles.dot} ${i === active ? styles.dotActive : ''}`} />
        ))}
      </div>
    </div>
  )
}
