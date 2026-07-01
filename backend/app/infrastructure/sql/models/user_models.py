# ═══════════════════════════════════════════════════════════════════════════════
# infrastructure/sql/models/user_models.py — SQLAlchemy модель пользователя
#
# МОЖНО МЕНЯТЬ: добавлять колонки, индексы, constraints под свою предметную область.
#   При каждом изменении: создать новую миграцию:
#   alembic revision --autogenerate -m "add column X to users"
#
# НЕЛЬЗЯ УДАЛЯТЬ: auth_user_id, referral_code — нужны для S2S и аналитики.
# НЕЛЬЗЯ ПЕРЕИМЕНОВЫВАТЬ таблицу "users" без миграции.
# ═══════════════════════════════════════════════════════════════════════════════

from datetime import datetime
from uuid import UUID

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class UserModel(Base):
    __tablename__ = "users"

    # Первичный ключ — генерируется на уровне Python в UserEntity, не в БД.
    # Так UUID известен сразу после создания entity, без flush к БД.
    id: Mapped[UUID] = mapped_column(sa.Uuid, primary_key=True)

    # Внешний идентификатор пользователя из auth_service партнёрки.
    # UNIQUE: один пользователь auth_service → одна запись на этом оффере.
    # INDEX: быстрый поиск по auth_user_id при каждом запросе (get_or_create).
    # Источник значения: UserContext.user_id из middleware.
    auth_user_id: Mapped[UUID] = mapped_column(
        sa.Uuid, unique=True, nullable=False, index=True
    )

    # Реф-код веб-мастера, привёдшего пользователя.
    # Источник: UserContext.referral_code из middleware.
    # Нужен аналитике партнёрки для расчёта комиссии.
    referral_code: Mapped[str | None] = mapped_column(sa.String(64), nullable=True)

    # Время создания — server_default: PostgreSQL ставит значение на уровне БД.
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        nullable=False,
    )

    # Время последнего обновления — onupdate: обновляется автоматически при UPDATE.
    updated_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True),
        server_default=sa.func.now(),
        onupdate=sa.func.now(),
        nullable=False,
    )
