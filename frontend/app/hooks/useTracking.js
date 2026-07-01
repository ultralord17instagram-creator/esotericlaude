'use client'

// Fire-and-forget обёртка над /api/tracking/[event].
// API-ключ TS хранится на сервере — клиент не имеет к нему доступа.
export function useTracking() {
  const track = (event, body = {}) => {
    fetch(`/api/tracking/${event}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(() => {})
  }

  return { track }
}
