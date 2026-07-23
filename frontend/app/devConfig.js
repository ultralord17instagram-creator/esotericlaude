// ═══════════════════════════════════════════════════════════════════════════
// devConfig.js — ручная имитация сессии для тестирования (управляется через чат)
//
// Пока реальная авторизация не готова, приложение можно заставить видеть
// пользователя в нужном состоянии — без логина, регистрации и токена.
// Меняется ОДНА строка DEV_SESSION ниже. Держать 'real' на проде.
//
//   'subscriber' — залогинен + активная подписка: все платные функции открыты,
//                  Paywall скрыт, ProtectedRoute пускает, таро без лимитов.
//   'free'       — залогинен, без подписки: платное под Paywall,
//                  бесплатные расклады с суточным лимитом (localStorage).
//   'guest'      — не залогинен (аноним): как гость, с гостевым лимитом.
//   'real'       — имитация выключена, статус берётся с бэкенда (боевой режим).
// ═══════════════════════════════════════════════════════════════════════════

export const DEV_SESSION = 'free'

export const DEV_ENABLED = DEV_SESSION !== 'real'

// Фейковый пользователь для имитации (без реального логина). null = гость.
export function devUser() {
  if (DEV_SESSION === 'subscriber') {
    return { id: 'dev-user', email: 'dev@local', subscribed: true, subscribed_until: '2099-12-31' }
  }
  if (DEV_SESSION === 'free') {
    return { id: 'dev-user', email: 'dev@local', subscribed: false, subscribed_until: null }
  }
  return null // guest
}
