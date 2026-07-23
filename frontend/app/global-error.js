'use client'
import { useEffect } from 'react'

// Глобальный перехватчик ошибок УРОВНЯ КОРНЕВОГО МАКЕТА (шапка, провайдеры,
// модалка входа). Обычный app/error.jsx ловит ошибки только внутри страницы
// (children), но НЕ в самом layout и не в том, что он рендерит. Такие ошибки
// ловит только этот файл. Без него любой краш в этом слое (например, когда
// расширение-менеджер паролей ломает гидрацию формы входа) обнуляет страницу
// до пустого фона body — тот самый «одноцветный экран».
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('[global error]', error)
  }, [error])

  return (
    <html lang="ru">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#EAE0CE',
          color: '#211F30',
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 440, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, margin: '0 0 12px' }}>Что-то пошло не так</h1>
          <p style={{ margin: '0 0 20px', lineHeight: 1.5, color: '#6E6551' }}>
            Не удалось отобразить страницу. Иногда причина — расширения браузера
            (менеджеры паролей, автозаполнение). Попробуйте обновить страницу или
            открыть сайт в режиме инкогнито.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              borderRadius: 999,
              border: 'none',
              background: '#1B1A30',
              color: '#F3ECDB',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Обновить
          </button>
        </div>
      </body>
    </html>
  )
}
