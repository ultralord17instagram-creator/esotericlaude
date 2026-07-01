# LeadPeak Offer Backend — Контекст для AI-ассистента

## Инструкция для AI

Этот документ — единственный источник истины при генерации кода бэкенда оффера.
Не придумывай эндпоинты, паттерны, структуру папок — следуй тому, что описано здесь.
Если задача явно не покрыта этим документом, напиши:
**«Уточните у разработчиков: [конкретный вопрос]»**

---

## Архитектура (DDD, слои)

```
domain ← infrastructure ← repositories ← services ← api
```

Зависимости идут только вправо → влево. Каждый слой знает только о слоях левее себя.

| Слой | Папка | Что знает | Что не знает |
|---|---|---|---|
| **domain** | `app/domain/` | Чистый Python | FastAPI, SQLAlchemy, httpx |
| **infrastructure** | `app/infrastructure/` | SQLAlchemy, httpx | FastAPI, бизнес-логика |
| **repositories** | `app/repositories/` | domain + infrastructure/sql | FastAPI, бизнес-логика |
| **services** | `app/services/` | domain + repositories (Protocol) | FastAPI, SQLAlchemy, httpx |
| **api** | `app/api/v1/` | FastAPI, services, schemas | domain entities напрямую |

**Ключевое правило:** сервис принимает `IXxxRepository` (Protocol), не `SqlXxxRepository` — это позволяет тестировать без БД.

---

## Доступная инфраструктура в роутах

Из `app/api/v1/dependencies.py`:

```python
from app.api.v1.dependencies import (
    get_current_user,      # → UserContext (user_id, referral_code, has_active_subscription)
    get_db_session,        # → AsyncSession (SQLAlchemy)
    get_user_service,      # → UserService (с репозиторием)
    get_auth_client,       # → AuthS2SClient (запросы к auth_service партнёрки)
    get_payment_client,    # → PaymentS2SClient (запросы к payment_service)
    map_exception_to_http_exception,  # domain exception → HTTPException
)
```

`get_current_user` гарантирует: пользователь аутентифицирован **и** имеет активную подписку (middleware уже проверил). Не дублируй проверку авторизации в роутах.

---

## Как добавить новую сущность — пошаговый рецепт

Пример: добавляем сущность `Article` (статья с контентом оффера).

### Шаг 1. Domain entity

Файл: `app/domain/entities/article.py`

```python
from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID, uuid4


@dataclass(kw_only=True)
class ArticleEntity:
    title: str
    body: str
    author_id: UUID              # auth_user_id автора

    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    def update_body(self, new_body: str) -> None:
        self.body = new_body
        self.updated_at = datetime.now(UTC)
```

Зарегистрировать в `app/domain/entities/__init__.py`:
```python
from .article import ArticleEntity
```

### Шаг 2. Domain exceptions

Файл: `app/domain/exceptions/__init__.py` — добавить в конец:

```python
class ArticleNotFoundError(BaseOfferException):
    def __init__(self, article_id: object) -> None:
        super().__init__(f"Article not found: id={article_id}")
```

### Шаг 3. SQL модель

Файл: `app/infrastructure/sql/models/article_models.py`

```python
from datetime import datetime
from uuid import UUID
import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base


class ArticleModel(Base):
    __tablename__ = "articles"

    id: Mapped[UUID] = mapped_column(sa.Uuid, primary_key=True)
    title: Mapped[str] = mapped_column(sa.String(255), nullable=False)
    body: Mapped[str] = mapped_column(sa.Text, nullable=False)
    author_id: Mapped[UUID] = mapped_column(sa.Uuid, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), server_default=sa.func.now(),
        onupdate=sa.func.now(), nullable=False
    )
```

Зарегистрировать модель для Alembic в `app/infrastructure/alembic/env.py`:
```python
from app.infrastructure.sql.models import article_models  # noqa: F401
```
*(или убедиться что env.py импортирует Base из base.py, которую наследует модель)*

### Шаг 4. Mapper

Файл: `app/infrastructure/sql/mappers/article_mapper.py`

```python
from app.domain.entities.article import ArticleEntity
from app.infrastructure.sql.models.article_models import ArticleModel


class ArticleMapper:
    @staticmethod
    def to_entity(model: ArticleModel) -> ArticleEntity:
        return ArticleEntity(
            id=model.id,
            title=model.title,
            body=model.body,
            author_id=model.author_id,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: ArticleEntity) -> ArticleModel:
        return ArticleModel(
            id=entity.id,
            title=entity.title,
            body=entity.body,
            author_id=entity.author_id,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )
```

### Шаг 5. Repository

Файл: `app/repositories/article_repo.py`

```python
from typing import Protocol
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.entities.article import ArticleEntity
from app.infrastructure.sql.mappers.article_mapper import ArticleMapper
from app.infrastructure.sql.models.article_models import ArticleModel


class IArticleRepository(Protocol):
    async def get_by_id(self, article_id: UUID) -> ArticleEntity | None: ...
    async def get_all(self) -> list[ArticleEntity]: ...
    async def save(self, article: ArticleEntity) -> ArticleEntity: ...


class SqlArticleRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_id(self, article_id: UUID) -> ArticleEntity | None:
        stmt = select(ArticleModel).where(ArticleModel.id == article_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return ArticleMapper.to_entity(model) if model else None

    async def get_all(self) -> list[ArticleEntity]:
        result = await self._session.execute(select(ArticleModel))
        return [ArticleMapper.to_entity(m) for m in result.scalars().all()]

    async def save(self, article: ArticleEntity) -> ArticleEntity:
        model = ArticleMapper.to_model(article)
        merged = await self._session.merge(model)
        await self._session.flush()
        return ArticleMapper.to_entity(merged)
```

### Шаг 6. Service

Файл: `app/services/article_service.py`

```python
from uuid import UUID
from app.domain.entities.article import ArticleEntity
from app.domain.exceptions import ArticleNotFoundError
from app.repositories.article_repo import IArticleRepository


class ArticleService:
    def __init__(self, repo: IArticleRepository) -> None:
        self._articles = repo

    async def get_all(self) -> list[ArticleEntity]:
        return await self._articles.get_all()

    async def get_by_id(self, article_id: UUID) -> ArticleEntity:
        article = await self._articles.get_by_id(article_id)
        if article is None:
            raise ArticleNotFoundError(article_id)
        return article

    async def create(self, title: str, body: str, author_id: UUID) -> ArticleEntity:
        article = ArticleEntity(title=title, body=body, author_id=author_id)
        return await self._articles.save(article)
```

### Шаг 7. Pydantic schemas

Файл: `app/api/v1/schemases/__init__.py` — добавить в конец:

```python
class ArticleResponse(BaseModel):
    id: UUID
    title: str
    body: str
    author_id: UUID
    created_at: datetime

class CreateArticleRequest(BaseModel):
    title: str
    body: str
```

### Шаг 8. Dependencies

Файл: `app/api/v1/dependencies.py` — добавить:

```python
from app.repositories.article_repo import IArticleRepository, SqlArticleRepository
from app.services.article_service import ArticleService

def get_article_repository(session: AsyncSession = Depends(get_db_session)) -> IArticleRepository:
    return SqlArticleRepository(session)

def get_article_service(repo: IArticleRepository = Depends(get_article_repository)) -> ArticleService:
    return ArticleService(repo=repo)
```

И в `map_exception_to_http_exception()` добавить маппинг:
```python
from app.domain.exceptions import ArticleNotFoundError  # добавить к импортам
# ...
if isinstance(exc, ArticleNotFoundError):
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
```

### Шаг 9. Routes

Файл: `app/api/v1/routes/articles.py`

```python
from uuid import UUID
from fastapi import APIRouter, Depends
from app.api.v1.dependencies import get_article_service, get_current_user, map_exception_to_http_exception
from app.api.v1.schemases import ArticleResponse, CreateArticleRequest
from app.domain.exceptions import BaseOfferException
from app.infrastructure.clients.auth_clients import UserContext
from app.services.article_service import ArticleService

router = APIRouter(prefix="/articles", tags=["articles"])

@router.get("/", response_model=list[ArticleResponse])
async def list_articles(svc: ArticleService = Depends(get_article_service)) -> list[ArticleResponse]:
    articles = await svc.get_all()
    return [ArticleResponse(**vars(a)) for a in articles]

@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: UUID, svc: ArticleService = Depends(get_article_service)) -> ArticleResponse:
    try:
        article = await svc.get_by_id(article_id)
    except BaseOfferException as exc:
        raise map_exception_to_http_exception(exc) from exc
    return ArticleResponse(**vars(article))

@router.post("/", response_model=ArticleResponse, status_code=201)
async def create_article(
    body: CreateArticleRequest,
    user: UserContext = Depends(get_current_user),
    svc: ArticleService = Depends(get_article_service),
) -> ArticleResponse:
    try:
        article = await svc.create(title=body.title, body=body.body, author_id=user.user_id)
    except BaseOfferException as exc:
        raise map_exception_to_http_exception(exc) from exc
    return ArticleResponse(**vars(article))
```

### Шаг 10. Подключить роутер

Файл: `app/api/v1/router.py` — добавить в секцию «Добавляй свои роутеры»:

```python
from app.api.v1.routes.articles import router as articles_router
router.include_router(articles_router)
```

### Шаг 11. Миграция БД

```bash
# Создать миграцию (внутри контейнера backend)
docker compose -f docker-compose.dev.yml exec backend uv run alembic revision --autogenerate -m "add articles table"

# Применить
docker compose -f docker-compose.dev.yml exec backend uv run alembic upgrade head
```

Миграция создаётся автоматически по разнице между моделями и текущей схемой БД.
**Проверь** сгенерированный файл в `app/infrastructure/alembic/versions/` перед применением.

---

## Правила добавления новой функциональности

### Domain exceptions

```python
# 1. Добавить в app/domain/exceptions/__init__.py
class MyError(BaseOfferException):
    def __init__(self, context: object) -> None:
        super().__init__(f"Описание ошибки: {context}")

# 2. Бросать в service
raise MyError(some_id)

# 3. Маппировать в app/api/v1/dependencies.py → map_exception_to_http_exception()
if isinstance(exc, MyError):
    return HTTPException(status_code=404, detail=str(exc))

# 4. Ловить в route
try:
    result = await svc.do_something()
except BaseOfferException as exc:
    raise map_exception_to_http_exception(exc) from exc
```

### Доступ к auth_client и payment_client в роутах

```python
from app.api.v1.dependencies import get_auth_client, get_payment_client

@router.post("/cancel")
async def cancel(
    user: UserContext = Depends(get_current_user),
    auth: AuthS2SClient = Depends(get_auth_client),
):
    data = await auth.cancel_subscription(user.user_id)
    return data
```

---

## Что не трогать

| Файл | Почему |
|---|---|
| `app/infrastructure/middleware/s2s_auth.py` | Единственная точка авторизации — ошибка здесь = все пользователи без доступа |
| `app/infrastructure/clients/auth_clients.py` | Контракт с auth_service партнёрки |
| `app/infrastructure/clients/payment_clients.py` | Контракт с payment_service |
| `app/infrastructure/alembic/env.py` | Async Alembic runner |
| `app/main.py` | lifespan, middleware регистрация |
| `app/config.py` | Базовые переменные окружения (можно только ДОБАВЛЯТЬ) |
| `app/infrastructure/sql/models/base.py` | SQLAlchemy DeclarativeBase |
| `tests/infrastructure/test_s2s_client.py` | Охраняет S2S контракт — падение = сломан auth |
| `tests/infrastructure/test_db_migration.py` | Проверяет миграции |

---

## Переменные окружения (backend `.env`)

| Переменная | Нельзя удалять | Источник |
|---|---|---|
| `DATABASE_URL` | ✓ | Настроить самостоятельно |
| `AUTH_SERVICE_URL` | ✓ | Команда партнёрки |
| `AUTH_SERVICE_API_KEY` | ✓ | Команда партнёрки (секрет) |
| `OFFER_ID` | ✓ | Команда партнёрки |
| `PAYMENT_SERVICE_URL` | ✓ | Команда партнёрки |
| `PAY_FORM_URL` | ✓ | Команда партнёрки |
| `DEBUG` | — | `false` в продакшне |

Добавлять свои переменные — в `app/config.py` в класс `Settings`.

---

## Типичные ошибки (не делать)

1. **Импортировать FastAPI или SQLAlchemy в `domain/`** — domain знает только Python
2. **Хранить `AsyncSession` как атрибут класса** — сессия per-request, не синглтон
3. **Делать HTTP-запросы в сервисе** — только через clients, передавать в сервис через конструктор
4. **Кидать `HTTPException` в сервисе** — только `BaseOfferException`; маппинг в роуте
5. **Менять `PUBLIC_PATHS` в middleware без понимания** — каждый добавленный путь обходит авторизацию
6. **Создавать миграцию без `--autogenerate`** — Alembic не увидит изменения моделей автоматически
7. **Удалять `auth_user_id` или `referral_code` из UserEntity** — партнёрка потеряет атрибуцию
