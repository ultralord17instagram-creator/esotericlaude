# ═══════════════════════════════════════════════════════════════════════════════
# infrastructure/alembic/env.py — async Alembic runner
#
# НЕЛЬЗЯ МЕНЯТЬ: стандартный async runner для asyncpg + SQLAlchemy 2.0.
# Изменение может сломать autogenerate или применение миграций.
#
# В ИСКЛЮЧИТЕЛЬНЫХ СЛУЧАЯХ: при добавлении новой SQLAlchemy-модели
# добавь её импорт в секцию "Импорт всех моделей" ниже.
# ═══════════════════════════════════════════════════════════════════════════════

import asyncio
import os
import sys
from logging.config import fileConfig

# Добавляем backend/ в sys.path чтобы `from app.xxx import ...` работало
# независимо от того, откуда запускается alembic (корень проекта или backend/).
# Путь: этот файл находится в backend/app/infrastructure/alembic/env.py
# env.py → alembic/ → infrastructure/ → app/ → backend/
_backend_dir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..")
)
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from alembic import context  # noqa: E402
from sqlalchemy.ext.asyncio import create_async_engine  # noqa: E402

# DeclarativeBase — нужен для target_metadata
from app.infrastructure.sql.models.base import Base  # noqa: E402

# ── Импорт всех моделей ───────────────────────────────────────────────────────
# ВАЖНО: все модели должны быть импортированы ДО строки target_metadata = Base.metadata
# Иначе Alembic autogenerate не "видит" таблицы и не генерирует миграции.
#
# При добавлении новой модели добавь её импорт здесь:
from app.infrastructure.sql.models.user_models import UserModel  # noqa: E402, F401

# ─────────────────────────────────────────────────────────────────────────────

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata для autogenerate — содержит схему всех импортированных моделей
target_metadata = Base.metadata


def get_database_url() -> str:
    """Получить URL БД из переменной окружения.

    URL берётся из DATABASE_URL — не из alembic.ini.
    Источник: .env файл → docker-compose через env_file → переменная окружения.
    """
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set. "
            "Copy .env.example to .env and fill DATABASE_URL."
        )
    return url


def run_migrations_offline() -> None:
    """Генерировать SQL без подключения к БД.

    Используется для ревью миграций: alembic upgrade head --sql
    Выводит SQL на stdout вместо применения к БД.
    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Применить миграции через async подключение к PostgreSQL (asyncpg)."""
    engine = create_async_engine(get_database_url())
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
