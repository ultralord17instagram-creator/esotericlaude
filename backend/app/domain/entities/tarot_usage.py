# ═══════════════════════════════════════════════════════════════════════════════
# domain/entities/tarot_usage.py — учёт суточного использования раскладов Таро
#
# Одна строка = (пользователь, сценарий, тема, дата) с числом использований.
# Бизнес-правило лимитов — в services/tarot_service.py, здесь только состояние.
# ═══════════════════════════════════════════════════════════════════════════════

from dataclasses import dataclass, field
from datetime import UTC, date, datetime
from uuid import UUID, uuid4


def _now() -> datetime:
    return datetime.now(UTC)


@dataclass(kw_only=True)
class TarotUsageEntity:
    """Счётчик использований одного расклада за одни сутки.

    Ключ дня: (auth_user_id, spread_id, theme_id, usage_date).
    theme_id = None для сценариев без тем (например «Да/Нет»).
    """

    # Обязательные поля ────────────────────────────────────────────────────────
    auth_user_id: UUID
    spread_id: str
    usage_date: date

    # Необязательные поля ──────────────────────────────────────────────────────
    theme_id: str | None = None
    count: int = 0

    # Технические поля — не заполнять вручную ──────────────────────────────────
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=_now)
    updated_at: datetime = field(default_factory=_now)

    def increment(self) -> None:
        """Увеличить счётчик использований на 1."""
        self.count += 1
        self.updated_at = _now()
