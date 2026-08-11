# Offer Template

Шаблон для партнёрского оффера: FastAPI-бэкенд + Next.js фронтенд. Содержит готовую
S2S авторизацию через auth_service партнёрки, PostgreSQL, Alembic, Docker + Nginx.

**Партнёр пишет только предметную область — инфраструктура работает с первого запуска.**

---

## Структура

```
offer-template/
├── backend/          # FastAPI (Python 3.12, uv, SQLAlchemy 2.0)
├── frontend/         # Next.js 14 (App Router)
├── nginx/            # Конфиги Nginx (dev/prod)
├── scripts/          # deploy.sh, ssl_init.sh
├── docker-compose.dev.yml
└── docker-compose.prod.yml
```

---

## Работа с AI-ассистентом

Хочешь использовать ChatGPT, Claude или Cursor для разработки оффера?
Перед началом скормить ИИ нужный контекст — без него он будет придумывать несуществующие эндпоинты и ломать авторизацию.

| Что разрабатываешь | Файл с контекстом |
|---|---|
| Фронтенд (страницы, стили, UX) | `frontend/LEADPEAK_OFFER_FRONTEND.md` |
| Бэкенд (новые сущности, бизнес-логика) | `backend/LEADPEAK_OFFER_BACKEND.md` |

Открой нужный файл, скопируй его целиком и вставь в начало диалога с ИИ перед своим вопросом.

---

## Быстрый старт

### 1. Backend

```bash
# Скопировать и заполнить .env
cp .env.example .env
# AUTH_SERVICE_API_KEY и OFFER_ID — получить у команды партнёрки

# Запустить PostgreSQL + backend
docker compose -f docker-compose.dev.yml up -d

# Применить миграции
docker compose -f docker-compose.dev.yml exec backend uv run alembic upgrade head

# Проверить
curl http://localhost:8000/health
# → {"status": "ok"}
```

### 2. Frontend

```bash
cd frontend

# Скопировать и заполнить .env.local
cp .env.example .env.local
# Заполнить переменные (см. раздел «Переменные окружения»)

npm install
npm run dev
# → http://localhost:3000
```

---

## Два варианта оплаты

### Variant A — редирект на платёжную форму LeadPeak

Пользователь кликает «Оформить подписку» → backend создаёт PENDING-подписку → редирект на `PAY_FORM_URL`.

- Используется роут `frontend/app/api/payment/create/route.js`
- Не требует CloudPayments Public ID и прямого доступа к Payment Service

### Variant B — собственная форма с CloudPayments виджетом

Пользователь переходит на `/checkout` → Next.js создаёт подписки в AS + PS → открывается
CloudPayments виджет прямо на сайте.

- Используется роут `frontend/app/api/payment/checkout-start/route.js`
- Требует `NEXT_PUBLIC_CP_PUBLIC_ID`, `PS_URL`, `PS_API_KEY`

---

## Переменные окружения

### Backend (`.env` в корне репозитория)

| Переменная | Описание | Источник |
|---|---|---|
| `DATABASE_URL` | PostgreSQL URL (asyncpg) | Сам настраиваешь |
| `AUTH_SERVICE_URL` | URL auth_service партнёрки | Команда партнёрки |
| `AUTH_SERVICE_API_KEY` | API-ключ оффера (секрет) | Команда партнёрки |
| `OFFER_ID` | ID оффера в системе партнёрки | Команда партнёрки |
| `PAYMENT_SERVICE_URL` | URL payment_service партнёрки | Команда партнёрки |
| `PAY_FORM_URL` | URL платёжной формы LeadPeak | Команда партнёрки |
| `DEBUG` | `true`/`false` | `false` в продакшне |

### Frontend (`frontend/.env.local`)

| Переменная | Описание | Где взять |
|---|---|---|
| `NEXT_PUBLIC_OFFER_ID` | ID оффера | Команда партнёрки |
| `NEXT_PUBLIC_REF_TTL_DAYS` | TTL реф-кода в localStorage (дней) | По умолчанию `7` |
| `BACKEND_URL` | URL FastAPI-бэкенда | Dev: `http://localhost:8000` |
| `TS_URL` | URL Tracking Service LeadPeak | Команда партнёрки |
| `TS_API_KEY` | API-ключ Tracking Service | Команда партнёрки |
| `ADMIN_PASSWORD` | Пароль для `/admin` | Сам устанавливаешь |
| `PS_URL` | URL Payment Service LeadPeak (Variant B) | Команда партнёрки |
| `PS_API_KEY` | API-ключ Payment Service (Variant B) | Команда партнёрки |
| `NEXT_PUBLIC_CP_PUBLIC_ID` | CloudPayments Public ID (Variant B) | Кабинет CloudPayments |
| `NEXT_PUBLIC_PAYMENT_BACK_URL` | Редирект после оплаты (Variant B) | Сам настраиваешь |
| `NEXT_PUBLIC_SITE_URL` | Канонический адрес сайта для SEO | Твой домен, без слэша на конце |
| `NEXT_PUBLIC_YANDEX_VERIFICATION` | Код Яндекс.Вебмастера | Кабинет Яндекс.Вебмастера |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION` | Код Google Search Console | Кабинет Search Console |

---

## SEO

Вся SEO-обвязка собрана в `frontend/app/seo.config.js`. Страницы не пишут
объект `metadata` руками, а зовут `buildMetadata()` — так canonical, og:url и
robots не разъезжаются между страницами.

**Что генерируется автоматически**

| URL | Откуда | Что внутри |
|---|---|---|
| `/robots.txt` | `app/robots.js` | Allow/Disallow, `Host`, ссылка на sitemap |
| `/sitemap.xml` | `app/sitemap.js` | 11 страниц сайта + все лендинги `/lp/*` |
| `/manifest.webmanifest` | `app/manifest.js` | PWA-манифест, иконки, цвета темы |

**Правила индексации**

- Индексируются: главная, `/matrix`, `/numerology/*`, `/tarot/*`, `/horoscope`,
  все `/lp/*`.
- `noindex, follow`: `/login`, `/register`, `/subscribe`, 404.
- `noindex, nofollow` + `Disallow` в robots.txt: `/lk`, `/checkout`, `/admin`,
  `/maintenance`, `/api/`.
- Страницы с `noindex` намеренно **не** закрыты в `robots.txt` (кроме приватных):
  закрытую в robots страницу бот не скачает и тега `noindex` не увидит, из-за
  чего URL останется в выдаче «без описания».

**Structured data (Schema.org)**

`Organization` + `WebSite` на всех страницах, `ItemList` сервисов на главной,
`BreadcrumbList` на внутренних, `Service` на четырёх продуктовых разделах.
Разметку отзывов (`AggregateRating`) намеренно не ставим: отзывы на главной
не подтверждены реальными оценками, а фиктивные оценки Google санкционирует.

**Домен.** Берётся из `NEXT_PUBLIC_SITE_URL`. Это `NEXT_PUBLIC_*`-переменная,
она вшивается в бандл **на сборке**, поэтому `docker-compose.prod.yml` передаёт
её как build arg. Поменял домен — пересобери фронт:

```bash
docker compose -f docker-compose.prod.yml build frontend
```

**Картинка для соцсетей.** `frontend/public/og.png` (1200×630) — временная
заглушка с фирменным полумесяцем, без текста. Заменяется простой подменой файла,
править код не нужно; размеры в метатегах уже прописаны.

**После первого деплоя на реальный домен**

1. Проверить `https://домен/robots.txt` и `https://домен/sitemap.xml`.
2. Добавить сайт в Яндекс.Вебмастер и Google Search Console, вписать коды
   подтверждения в `NEXT_PUBLIC_*_VERIFICATION`, пересобрать фронт.
3. Отправить sitemap в обоих кабинетах.

---

## Что менять, что не трогать

### ✅ Менять под свою предметную область

**Backend:**

| Файл/Папка | Что делать |
|---|---|
| `backend/app/domain/entities/user.py` | Добавить бизнес-поля и методы |
| `backend/app/domain/entities/` | Добавить свои сущности |
| `backend/app/domain/exceptions/__init__.py` | Добавить domain exceptions |
| `backend/app/domain/value_objects/__init__.py` | Добавить Value Objects |
| `backend/app/domain/enums/__init__.py` | Добавить enum'ы |
| `backend/app/api/v1/routes/` | Добавить свои роуты |
| `backend/app/api/v1/schemases/__init__.py` | Добавить Pydantic схемы |
| `backend/app/services/user_service.py` | Добавить бизнес-логику |
| `backend/app/repositories/user_repo.py` | Добавить методы репозитория |
| `backend/tests/domain/` | Добавить тесты своей domain-логики |
| `nginx/prod.conf` | Заменить `YOUR_DOMAIN` |

**Frontend:**

| Файл/Папка | Что делать |
|---|---|
| `frontend/app/page.jsx` | Главная страница (контент, SEO) |
| `frontend/app/layout.jsx` | Метаданные, шрифты, глобальные стили |
| `frontend/app/lk/LKClient.jsx` | Личный кабинет |
| `frontend/app/login/page.jsx` | Страница входа |
| `frontend/app/register/page.jsx` | Страница регистрации |
| `frontend/app/checkout/CheckoutClient.jsx` | Форма оплаты (Variant B) |

### 🚫 Не трогать без понимания

**Backend:**

| Файл/Папка | Почему |
|---|---|
| `backend/app/infrastructure/middleware/s2s_auth.py` | Единственная точка авторизации |
| `backend/app/infrastructure/clients/auth_clients.py` | Контракт с auth_service |
| `backend/app/main.py` | lifespan, middleware регистрация |
| `backend/app/config.py` | Базовые переменные окружения |
| `backend/tests/infrastructure/` | Тесты-инварианты контракта |
| `backend/app/infrastructure/alembic/env.py` | Async Alembic runner |

**Frontend:**

| Файл/Папка | Почему |
|---|---|
| `frontend/app/context/AuthContext.jsx` | Управление сессией пользователя |
| `frontend/app/components/ProtectedRoute.jsx` | Гейт авторизации |
| `frontend/app/api/auth/` | S2S прокси к backend (HttpOnly cookies) |
| `frontend/middleware.js` | Режим технических работ |

---

## Архитектура backend

```
domain ← infrastructure ← repositories ← services ← api
```

- **domain/** — чистые Python-классы, никакого FastAPI/SQLAlchemy
- **infrastructure/** — SQL-модели, HTTP-клиенты, middleware
- **repositories/** — скрывают SQLAlchemy за интерфейсом (IUserRepository)
- **services/** — бизнес-логика через репозитории
- **api/v1/** — тонкий слой: принять запрос → сервис → схема

### S2S авторизация

Оффер не хранит пароли. Авторизация через auth_service партнёрки:

```
Пользователь → cookie(access_token) → S2SAuthMiddleware
    → POST /s2s/auth/token/verify?access_token={token}
    ← {user_id, referral_code, has_active_subscription}
    → request.state.user = UserContext
    → роут
```

- `401` — нет токена или токен невалиден
- `403` — токен валиден, но нет активной подписки

---

## Добавление новой функциональности

1. **Новая сущность** → `domain/entities/`
2. **Новое исключение** → `domain/exceptions/__init__.py` + маппинг в `api/v1/dependencies.py`
3. **Новая таблица** → SQLAlchemy модель + маппер + `alembic revision --autogenerate`
4. **Новый роут** → `api/v1/routes/` + схемы в `schemases/__init__.py` + `include_router` в `router.py`

---

## Деплой

### Первый деплой (один раз)

```bash
# 1. Заменить YOUR_DOMAIN в nginx/prod.conf на реальный домен
# 2. Убедиться что домен указывает на сервер (DNS)
# 3. Запустить без SSL (certbot нужен HTTP для проверки домена)
docker compose -f docker-compose.prod.yml up -d nginx

# 4. Получить SSL-сертификат
./scripts/ssl_init.sh your-domain.com admin@your-email.com

# 5. Запустить всё
./scripts/deploy.sh
```

### Последующие деплои

```bash
./scripts/deploy.sh
```

Скрипт: `git pull` → `docker build` → `alembic upgrade head` → `nginx restart`.

---

## Тесты

```bash
cd backend

# Все тесты
uv run pytest

# Только инварианты контракта (не нужна БД)
uv run pytest tests/infrastructure/test_s2s_client.py

# Тесты domain-логики (не нужна БД, не нужен auth_service)
uv run pytest tests/domain/

# Тест миграций (нужен PostgreSQL)
TEST_DATABASE_URL=postgresql+asyncpg://offer_user:secret@localhost:5432/offer_test \
uv run pytest tests/infrastructure/test_db_migration.py
```

**Правило:** `tests/infrastructure/test_s2s_client.py` должен зеленеть всегда.
Если он падает — S2S контракт сломан и все пользователи без доступа.
