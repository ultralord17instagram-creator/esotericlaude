'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import TarotCard from '../components/TarotCard'
import ReadingCard from '../components/ReadingCard'
import { StarMark, IconSays } from '../components/icons'
import { getDayCard, getText } from '../../content/tarot'
import { markOpened } from '../../lk/dayProgress'
import styles from '../components/tarot.module.css'

// «Карта дня»: одна рубашка. Карта детерминирована датой (одна для всех, без бэкенда).
export default function DayClient() {
  const [card, setCard] = useState(null)
  const reveal = () => setCard(getDayCard())

  // Раскрыл карту дня -> отметить блок «карта» открытым в дашборде (дизайн §5.5).
  useEffect(() => { if (card) markOpened('card') }, [card])

  if (card) {
    return (
      <div className={styles.page}>
        <Link href="/tarot" className={styles.backLink}>‹ Все расклады</Link>

        <div className={styles.reading}>
          <div className={styles.readingSingle}>
            <div className={styles.readingCardCol}>
              <div className={styles.cardGlow}>
                <ReadingCard card={card} variant="hero" />
              </div>
            </div>

            <div>
              <div className={styles.eyebrowCenter} style={{ marginBottom: 12 }}>Карта дня</div>
              <h1 className={styles.cardTitle}>{card.ru}</h1>
              <div className={styles.cardKicker}>
                <span className={styles.line} />
                <span className={styles.txt}>Старший аркан</span>
              </div>

              {card.keywords?.length > 0 && (
                <div className={styles.keywords}>
                  {card.keywords.map((k) => <span key={k} className={styles.kw}>{k}</span>)}
                </div>
              )}

              <div className={styles.section}>
                <div className={styles.sectionHead}>
                  <IconSays size={19} />
                  <h3>Послание дня</h3>
                </div>
                <p className={styles.sectionText}>{getText({ scenario: 'day', number: card.number })}</p>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHead}>
                  <StarMark size={18} />
                  <h3>Совет</h3>
                </div>
                <p className={styles.sectionText}>{getText({ scenario: 'advice', number: card.number })}</p>
              </div>

              <div className={styles.readingActions}>
                <Link href="/tarot" className={styles.btnPrimary}>Другие расклады <StarMark size={16} /></Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <Link href="/tarot" className={styles.backLink}>‹ Все расклады</Link>
      <div className={styles.stage}>
        <div className={styles.eyebrowCenter}>Карта дня</div>
        {/* h1, а не p: до раскрытия карты это единственный заголовок страницы,
            и именно он уходит в серверный HTML. Класс задаёт размер, шрифт и
            отступы явно, поэтому смена тега вид не меняет. */}
        <h1 className={styles.questionEcho}>Послание на сегодня</h1>
        <div className={styles.drawGlow}>
          <TarotCard hero />
        </div>
        <p className={styles.hint}>Сделайте вдох, сосредоточьтесь и откройте карту.</p>
        <button className={styles.btnPrimary} onClick={reveal}>
          <StarMark size={19} /> Открыть карту
        </button>
      </div>
    </div>
  )
}
