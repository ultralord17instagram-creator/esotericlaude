# ═══════════════════════════════════════════════════════════════════════════════
# domain/entities/user.py — сущность пользователя оффера
#
# МОЖНО МЕНЯТЬ: добавлять бизнес-поля и методы под свою предметную область.
#   Примеры полей: content_level, last_visit_at, preferences
#   Примеры методов: def activate_premium(self): ...
#
# НЕЛЬЗЯ УДАЛЯТЬ:
#   auth_user_id — главная связь с auth_service партнёрки
#   referral_code — нужен для аналитики и атрибуции в партнёрке
#
# ВАЖНО: пароля здесь нет и быть не должно. Аутентификация — в auth_service.
# Этот объект — локальный факт регистрации пользователя на данном оффере.
# ═══════════════════════════════════════════════════════════════════════════════

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID, uuid4


def _now() -> datetime:
    return datetime.now(UTC)


@dataclass(kw_only=True)
class UserEntity:
    """Пользователь этого оффера.

    kw_only=True: все поля передаются как keyword arguments.
    Это позволяет добавлять обязательные поля (auth_user_id) до необязательных
    с defaults без конфликта порядка в dataclass.

    Создание: UserEntity(auth_user_id=some_uuid, referral_code="ABC123")
    """

    # Обязательные поля (без default) ─────────────────────────────────────────

    # ID пользователя в auth_service партнёрки — главная связь с внешним миром.
    # Источник: UserContext.user_id → middleware → S2S verify_token ответ.
    # Один auth_user_id = один пользователь на этом оффере (UNIQUE в БД).
    auth_user_id: UUID

    # Необязательные поля ─────────────────────────────────────────────────────

    # Реф-код веб-мастера, который привёл пользователя.
    # Источник: UserContext.referral_code → middleware → S2S verify_token ответ.
    # Нужен для атрибуции: партнёрка по нему считает комиссию веб-мастеру.
    referral_code: str | None = None

    # Технические поля — не заполнять вручную ─────────────────────────────────
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=_now)
    updated_at: datetime = field(default_factory=_now)

    # ── Методы: добавляй свою бизнес-логику здесь ────────────────────────────
    # Правило: метод только меняет состояние entity, не ходит в БД.
    # Всё что требует БД — в services/user_service.py.

    def mark_updated(self) -> None:
        """Обновить метку времени при изменении сущности.

        Вызывать в методах, которые меняют состояние пользователя.
        Репозиторий после изменения должен вызвать save().
        """
        self.updated_at = datetime.now(UTC)
