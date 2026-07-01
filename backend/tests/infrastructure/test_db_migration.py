# ═══════════════════════════════════════════════════════════════════════════════
# tests/infrastructure/test_db_migration.py — проверка Alembic миграций
#
# НЕЛЬЗЯ МЕНЯТЬ: тест гарантирует что alembic upgrade head + downgrade base
# проходят без ошибок на чистой БД.
#
# Требует PostgreSQL — пропускается если TEST_DATABASE_URL не задан.
#
# Запуск локально (postgres из docker-compose.dev.yml):
#   TEST_DATABASE_URL=postgresql+asyncpg://offer_user:secret@localhost:5432/offer_test \
#   pytest tests/infrastructure/test_db_migration.py
#
# В CI: добавить postgres-сервис и TEST_DATABASE_URL в environment.
# ═══════════════════════════════════════════════════════════════════════════════

import os

import pytest
from alembic import command
from alembic.config import Config


@pytest.mark.skipif(
    not os.environ.get("TEST_DATABASE_URL"),
    reason="TEST_DATABASE_URL не задан — тест миграций пропущен. "
    "Задай: TEST_DATABASE_URL=postgresql+asyncpg://user:pass@host/db",
)
def test_alembic_upgrade_and_downgrade():
    """alembic upgrade head → downgrade base → upgrade head проходят без ошибок.

    Проверяет что:
    1. Начальная миграция (001) создаёт схему корректно
    2. downgrade() откатывает всё обратно
    3. Повторный upgrade() идемпотентен

    Источник TEST_DATABASE_URL: переменная окружения (не из .env).
    Используй отдельную тестовую БД — тест очищает её через downgrade.
    """
    cfg = Config("alembic.ini")
    # Подменяем URL на тестовую БД чтобы не трогать рабочую
    cfg.set_main_option("sqlalchemy.url", os.environ["TEST_DATABASE_URL"])

    # Применить все миграции
    command.upgrade(cfg, "head")

    # Откатить все миграции — схема должна вернуться к начальному состоянию
    command.downgrade(cfg, "base")

    # Повторное применение — проверяем идемпотентность
    command.upgrade(cfg, "head")
