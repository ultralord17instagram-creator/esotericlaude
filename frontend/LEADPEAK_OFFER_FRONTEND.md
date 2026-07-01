# LeadPeak Offer Frontend — Контекст для AI-ассистента

## Инструкция для AI

Этот документ — единственный источник истины при генерации кода фронтенда оффера.
Не придумывай эндпоинты, форматы ответов и поведение системы — всё описано здесь.
Если задача явно не покрыта этим документом, напиши:
**«Уточните у разработчиков: [конкретный вопрос]»**

---

## Архитектура

Оффер — отдельный сайт (Next.js 14, App Router). Nginx проксирует трафик:

```
Браузер → Nginx → /api/v1/*  → FastAPI бэкенд (8000)
                  остальное  → Next.js фронтенд (3000)
```

**Фронтенд не обращается к AS/PS/TS напрямую.** Все S2S-запросы идут через FastAPI бэкенд.
Фронтенд вызывает либо `/api/v1/*` (FastAPI через nginx), либо `/api/*` (Next.js Route Handlers).

---

## Авторизация

Токены (`access_token`, `refresh_token`) — **HttpOnly cookies**. Браузер отправляет их
автоматически при каждом запросе к одному домену. Фронтенд токены не видит и не хранит.

**Никогда не хранить токены в localStorage.** В localStorage хранится только отображаемая
информация о пользователе (id, email) под ключом `offer_user_info`.

Весь жизненный цикл авторизации уже реализован в `app/context/AuthContext.jsx`.

---

## FastAPI эндпоинты

Вызываются напрямую: `fetch('/api/v1/...')`. Cookies браузер прикладывает сам.

### Публичные (без авторизации)

| Метод | Путь | Тело запроса | Тело ответа |
|---|---|---|---|
| POST | `/api/v1/auth/register` | `{ email?, username?, password?, referral_code?, tg_init_data?, device_id? }` | `{ user_id, referral_code? }` + устанавливает cookies |
| POST | `/api/v1/auth/login` | `{ email?, username?, password?, tg_init_data?, device_id? }` | `{ user_id, referral_code? }` + устанавливает cookies |
| POST | `/api/v1/auth/refresh` | — (читает `refresh_token` cookie) | `{ user_id, referral_code? }` + обновляет cookies |
| POST | `/api/v1/auth/logout` | — (читает `refresh_token` cookie) | 204 |
| POST | `/api/v1/auth/logout-all` | — (читает `access_token` cookie) | 204 |
| GET | `/api/v1/subscriptions/tariff` | — | `{ id, name, amount, days, first_amount?, first_days?, max_successful_payments? }` |
| POST | `/api/v1/subscriptions/start` | — (нужен `access_token` cookie, **не нужна** активная подписка) | `{ subscription_id, redirect_url }` |

### Защищённые (требуют `access_token` cookie + активную подписку)

| Метод | Путь | Ответ |
|---|---|---|
| GET | `/api/v1/subscriptions/me` | `{ subscription_id, status, subscription_type, access_until?, status_changed_at, is_past_due }` |
| GET | `/api/v1/subscriptions/me/tariff` | `{ id, name, amount, days, first_amount?, first_days? }` |
| POST | `/api/v1/subscriptions/me/cancel` | `{ subscription_id, status, status_changed_at, access_until? }` |
| POST | `/api/v1/subscriptions/me/reopen` | `{ subscription_id, status, status_changed_at, access_until? }` |
| POST | `/api/v1/subscriptions/me/refund` | `{ subscription_id, status, status_changed_at }` |
| GET | `/api/v1/users/me` | `{ auth_user_id, referral_code?, created_at }` |

### HTTP-коды middleware (общие для всех защищённых эндпоинтов)

| Код | Причина | Что делать на фронте |
|---|---|---|
| 401 | Нет токена или токен истёк | Попробовать `POST /api/v1/auth/refresh`, при неудаче → `/login` |
| 403 | Токен валиден, подписка не активна | Показать форму оплаты |

---

## Статусы подписки

| Статус | Доступ к контенту | Типичная реакция UI |
|---|---|---|
| PENDING | Нет | Показать форму оплаты |
| ACTIVE | Есть | Открыть ЛК |
| CANCELLED | Есть (до `access_until`) | ЛК + предупреждение об окончании |
| CLOSED | Нет | Предложить повторно оформить |

```js
// Как AuthContext определяет subscribed:
subscribed = status === 'ACTIVE' || status === 'CANCELLED'
subscribed_until = access_until  // null если не задан
```

---

## Next.js Route Handlers (уже реализованы, не менять)

Вызываются через `fetch('/api/...')`.

| Метод | Путь | Назначение |
|---|---|---|
| POST | `/api/tracking/[event]` | Прокси к Tracking Service (события: `host`, `click`). Fire-and-forget |
| POST | `/api/payment/checkout-start` | Только Variant B. Создаёт AS + PS подписки. Ответ: `{ ps_sub_id, auth_sub_id }` |
| GET | `/api/admin/maintenance` | Текущий статус техработ. Ответ: `{ maintenance: bool }` |
| POST | `/api/admin/maintenance` | Переключить техработы. Тело: `{ enabled: bool }` |
| POST | `/api/admin/verify` | Проверить пароль администратора. Тело: `{ password }` |

---

## Варианты оплаты

**Выбор варианта фиксирован для каждого оффера. Уточни у разработчиков, если неизвестно.**

### Variant A — редирект на Pay Form LeadPeak (проще)

```
POST /api/v1/subscriptions/start  →  { redirect_url }
window.location.href = redirect_url
```

Пользователь уходит на страницу оплаты LeadPeak, возвращается на `NEXT_PUBLIC_PAYMENT_BACK_URL`.
Уже реализовано в `app/hooks/usePayment.js`. Использовать: `const { startPayment } = usePayment()`.

### Variant B — CloudPayments виджет на сайте (больше контроля над UI)

```
POST /api/payment/checkout-start  →  { ps_sub_id, auth_sub_id }
Открыть CloudPayments виджет с invoiceId = ps_sub_id
```

Требует переменных `NEXT_PUBLIC_CP_PUBLIC_ID`, `PS_URL`, `PS_API_KEY`.
Уже реализовано в `app/checkout/CheckoutClient.jsx`.

---

## Реферальные коды

`RefTracker` (смонтирован в `layout.jsx`) автоматически читает `?ref=CODE` из URL,
сохраняет в localStorage с TTL, отправляет `click`-событие в TS.

При регистрации передавать реф-код так:

```js
const refCode = localStorage.getItem('offer_ref_code') || null
await register({ email, password, refCode })
// register() из AuthContext сам передаёт referral_code в FastAPI
```

---

## useAuth() — что предоставляет

```js
const { user, loading, register, login, logout, refetchUser } = useAuth()
```

| Поле / метод | Тип | Описание |
|---|---|---|
| `user` | `object \| null` | `null` — не авторизован |
| `user.id` | `string` | ID пользователя |
| `user.email` | `string \| null` | Email (из localStorage) |
| `user.subscribed` | `boolean` | Есть ли активный доступ |
| `user.subscribed_until` | `string \| null` | ISO datetime окончания доступа |
| `loading` | `boolean` | `true` пока идёт первичная проверка сессии |
| `register(opts)` | `async fn` | `{ email, password, refCode }` |
| `login(opts)` | `async fn` | `{ email, password }` |
| `logout()` | `async fn` | Очищает cookies и localStorage |
| `refetchUser()` | `async fn` | Перечитать статус подписки с сервера |

---

## ProtectedRoute

```jsx
import ProtectedRoute from '../components/ProtectedRoute'

// Редиректит неавторизованных на /login:
<ProtectedRoute>
  <КонтентТолькоДляАвторизованных />
</ProtectedRoute>
```

---

## Что не трогать

| Файл | Почему |
|---|---|
| `app/context/AuthContext.jsx` | Cookie-авторизация, refresh-логика, состояние сессии |
| `app/components/ProtectedRoute.jsx` | Редирект неавторизованных |
| `app/components/RefTracker.jsx` | Реф-код из URL → localStorage + click-событие |
| `app/components/AffiliateTracker.jsx` | Host-событие один раз за сессию |
| `app/hooks/useTracking.js` | Прокси к TS (API-ключ не светится клиенту) |
| `app/hooks/usePayment.js` | Variant A оплата |
| `app/api/tracking/[event]/route.js` | Прокси к TS |
| `app/api/payment/checkout-start/route.js` | Variant B платёж |
| `app/api/admin/verify/route.js` | Авторизация в админку |
| `app/api/admin/maintenance/route.js` | Техработы |
| `middleware.js` | Редирект на `/maintenance` при техработах |

---

## Что наполнить контентом

| Файл | Что добавить |
|---|---|
| `app/page.jsx` | Лендинг: hero, преимущества, CTA с кнопкой оплаты |
| `app/layout.jsx` | Метаданные (title, description), шрифты, глобальные стили |
| `app/lk/LKClient.jsx` | Дизайн ЛК (логика уже работает — подписка, отмена, выход) |
| `app/login/page.jsx` | Дизайн формы входа |
| `app/register/page.jsx` | Дизайн формы регистрации |
| `app/checkout/CheckoutClient.jsx` | Дизайн формы оплаты (только Variant B) |

---

## SEO — обязательные требования

- Каждая страница: уникальный `metadata` с `title` и `description`
- Один `<h1>` на страницу, заголовки в иерархическом порядке (`h2`, `h3`)
- Семантические теги: `<main>`, `<header>`, `<footer>`, `<nav>`, `<section>`
- ЛК, чекаут, админка, техработы: `robots: { index: false }`
- Изображения: `<Image>` из `next/image` с обязательным `alt`
- Внутренние ссылки: `<Link>` из `next/link`, не `<a>`
- Кнопки: `<button>`, не `<div onClick>`
- Каждый `<input>` связан с `<label htmlFor>`

---

## Типичные ошибки (не делать)

1. **Хранить токены в localStorage** — только HttpOnly cookies, фронт их не трогает
2. **Обращаться к AS/PS/TS напрямую из фронта** — только через FastAPI или Next.js Route Handlers
3. **Переписывать файлы из раздела «Что не трогать»** — сломает авторизацию, трекинг или оплату
4. **Не передавать `referral_code` при регистрации** — вебмастер потеряет атрибуцию
5. **Игнорировать 401** — нужно пробовать refresh, иначе пользователь вылетит после истечения access_token
6. **Не добавлять `robots: { index: false }` на ЛК и Admin** — утечка приватных страниц в поисковики
