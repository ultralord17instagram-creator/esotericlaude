'use client'
import { useState, useEffect } from 'react'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')

  // Читаем sessionStorage только на клиенте — избегаем hydration mismatch
  useEffect(() => {
    setAuthenticated(sessionStorage.getItem('admin_session') === 'true')
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      sessionStorage.setItem('admin_session', 'true')
      sessionStorage.setItem('admin_password', password)
      setAuthenticated(true)
    } else {
      setAuthError('Неверный пароль')
    }
  }

  if (!authenticated) {
    return (
      <main>
        <h1>Панель администратора</h1>
        <form onSubmit={handleLogin}>
          <label htmlFor="admin-pass">Пароль</label>
          <input
            id="admin-pass"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          {authError && <p role="alert">{authError}</p>}
          <button type="submit">Войти</button>
        </form>
      </main>
    )
  }

  return (
    <main>
      <h1>Панель администратора</h1>
      <AdminDashboard />
    </main>
  )
}

function AdminDashboard() {
  const [maintenance, setMaintenance] = useState(false)
  const [testLog, setTestLog] = useState([])

  useEffect(() => {
    const password = sessionStorage.getItem('admin_password')
    fetch('/api/admin/maintenance', { headers: { 'x-admin-key': password } })
      .then(r => r.json())
      .then(d => { if (typeof d.maintenance === 'boolean') setMaintenance(d.maintenance) })
      .catch(() => {})
  }, [])

  const toggleMaintenance = async () => {
    const password = sessionStorage.getItem('admin_password')
    const next = !maintenance
    const res = await fetch('/api/admin/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': password },
      body: JSON.stringify({ enabled: next }),
    })
    if (res.ok) setMaintenance(next)
  }

  const addLog = (name, status, result) => {
    setTestLog(prev => [...prev, { name, status, result, time: new Date().toLocaleTimeString('ru') }])
  }

  const runTest = async (name, fn) => {
    addLog(name, 'running', '...')
    try {
      const result = await fn()
      setTestLog(prev => prev.map(t => t.name === name && t.status === 'running' ? { ...t, status: 'ok', result } : t))
    } catch (e) {
      setTestLog(prev => prev.map(t => t.name === name && t.status === 'running' ? { ...t, status: 'error', result: e.message } : t))
    }
  }

  const tests = [
    {
      name: 'Регистрация (тест)',
      fn: async () => {
        const email = `test_${Date.now()}@test.com`
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: 'TestPass123!' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Ошибка регистрации')
        return `OK — user_id получен, токен выдан`
      },
    },
    {
      name: 'Логин (тест)',
      fn: async () => {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@test.com', password: 'wrong' }),
        })
        const data = await res.json()
        return res.ok ? 'OK — вход выполнен' : `Ожидаемая ошибка: ${data.detail}`
      },
    },
    {
      name: 'TS: host event',
      fn: async () => {
        const res = await fetch('/api/tracking/host', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: window.location.href }),
        })
        if (!res.ok) throw new Error('TS недоступен')
        return 'OK — host событие отправлено'
      },
    },
    {
      name: 'TS: click event',
      fn: async () => {
        const res = await fetch('/api/tracking/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referral_code: 'test_ref' }),
        })
        if (!res.ok) throw new Error('TS недоступен')
        return 'OK — click событие отправлено'
      },
    },
    {
      name: 'TS: registration event',
      fn: async () => {
        const res = await fetch('/api/tracking/registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: 'test_user_id', referral_code: 'test_ref' }),
        })
        if (!res.ok) throw new Error('TS недоступен')
        return 'OK — registration событие отправлено'
      },
    },
  ]

  return (
    <>
      <section>
        <h2>Режим технических работ</h2>
        <p>Статус: {maintenance ? 'включён' : 'выключен'}</p>
        <button onClick={toggleMaintenance}>
          {maintenance ? 'Выключить' : 'Включить'}
        </button>
      </section>

      <section>
        <h2>Тестирование API</h2>
        <p>Только для администраторов — не показывать модераторам.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tests.map(t => (
            <button key={t.name} onClick={() => runTest(t.name, t.fn)}>
              {t.name}
            </button>
          ))}
        </div>
        {testLog.length > 0 && (
          <pre style={{ marginTop: 16, fontSize: 12 }}>
            {testLog.map(t => `[${t.time}] [${t.status}] ${t.name}: ${t.result}`).join('\n')}
          </pre>
        )}
      </section>
    </>
  )
}
