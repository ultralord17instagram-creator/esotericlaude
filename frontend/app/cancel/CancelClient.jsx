'use client'
import { useState, useId } from 'react'
import Link from 'next/link'
import { OPERATOR } from '../legal/operator'
import styles from './cancel.module.css'

// Форма заявки на отмену подписки.
//
// ЗАГЛУШКА: никуда ничего не отправляет. Введённые данные живут только в стейте
// компонента и исчезают вместе с ним. Когда появится приёмник заявок, запрос
// уходит из handleSubmit, и тогда же нужно:
//   1. добавить первые 6 и последние 4 цифры карты в перечень обрабатываемых
//      данных в privacy.content.js (сейчас их там нет, потому что мы их не
//      собираем);
//   2. убедиться, что цифры карты не попадают ни в какие логи.
// Первые 6 (BIN) и последние 4 цифры полным номером карты не являются и под
// требования PCI DSS к хранению PAN не подпадают, но обращаться с ними всё
// равно нужно как с платёжными данными.

const only = (value, max) => value.replace(/\D/g, '').slice(0, max)

export default function CancelClient() {
  const uid = useId()

  const [email, setEmail] = useState('')
  const [first6, setFirst6] = useState('')
  const [last4, setLast4] = useState('')
  const [telegram, setTelegram] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (e) => {
    e.preventDefault()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Укажите email, который вводили при оплате подписки')
      return
    }
    if (first6.length !== 6) {
      setError('Первые 6 цифр номера карты: нужно ровно 6 цифр')
      return
    }
    if (last4.length !== 4) {
      setError('Последние 4 цифры номера карты: нужно ровно 4 цифры')
      return
    }

    setError('')
    // TODO: здесь будет отправка заявки. Пока просто показываем подтверждение.
    setSent(true)
  }

  if (sent) {
    return (
      <div className={styles.card}>
        <div className={styles.doneIcon} aria-hidden="true">
          <svg viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="21" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.35" />
            <path d="M13 22.5 l6 6 12-13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className={styles.title}>Заявка принята</h1>
        <p className={styles.sub}>
          Мы отменим подписку в течение 24 часов и пришлём подтверждение на {email}.
          Если письмо не придёт, напишите на <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.
        </p>
        <Link href="/" className={styles.secondaryBtn}>Вернуться на главную</Link>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Заявка на отмену подписки</h1>
      <p className={styles.sub}>Заполните форму, и мы отменим вашу подписку в течение 24 часов.</p>

      <form onSubmit={submit} noValidate className={styles.form}>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor={`${uid}-email`} className={styles.label}>
              Email, введённый при оплате подписки
            </label>
            <input
              id={`${uid}-email`}
              type="email"
              className={styles.input}
              placeholder="astra@почта.ру"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              suppressHydrationWarning
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={`${uid}-first6`} className={styles.label}>
              Первые 6 цифр номера карты
            </label>
            <input
              id={`${uid}-first6`}
              type="text"
              inputMode="numeric"
              className={styles.input}
              placeholder="123456"
              value={first6}
              onChange={(e) => setFirst6(only(e.target.value, 6))}
              autoComplete="off"
              required
              suppressHydrationWarning
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={`${uid}-last4`} className={styles.label}>
              Последние 4 цифры номера карты
            </label>
            <input
              id={`${uid}-last4`}
              type="text"
              inputMode="numeric"
              className={styles.input}
              placeholder="1234"
              value={last4}
              onChange={(e) => setLast4(only(e.target.value, 4))}
              autoComplete="off"
              required
              suppressHydrationWarning
            />
          </div>

          <div className={styles.field}>
            <label htmlFor={`${uid}-tg`} className={styles.label}>
              Ссылка на ваш Telegram <span className={styles.optional}>необязательно</span>
            </label>
            <input
              id={`${uid}-tg`}
              type="text"
              className={styles.input}
              placeholder="@username"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              autoComplete="off"
              suppressHydrationWarning
            />
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <button type="submit" className={styles.submit}>Отменить подписку</button>

        <p className={styles.note}>
          Полные цифры карты мы не спрашиваем: первых шести и последних четырёх достаточно,
          чтобы найти ваш платёж. Если вы вошли в аккаунт, подписку можно отменить быстрее в{' '}
          <Link href="/lk">личном кабинете</Link>.
        </p>
      </form>
    </div>
  )
}
