'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <h1>Что-то пошло не так</h1>
      <p>Произошла непредвиденная ошибка. Попробуйте обновить страницу.</p>
      <button onClick={reset}>Попробовать снова</button>
    </main>
  )
}
