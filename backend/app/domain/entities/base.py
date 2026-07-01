# ═══════════════════════════════════════════════════════════════════════════════
# domain/entities/base.py — базовая доменная сущность
#
# НЕЛЬЗЯ МЕНЯТЬ: используется как основа для всех сущностей оффера.
# МОЖНО ДОБАВЛЯТЬ поля — только если они нужны во всех сущностях без исключения.
#
# Примечание: shared-пакет партнёрки здесь недоступен (это отдельный репо),
# поэтому BaseEntity написан заново — он проще, без методов партнёрки.
# ═══════════════════════════════════════════════════════════════════════════════

from dataclasses import dataclass, field
from datetime import UTC, datetime
from uuid import UUID, uuid4


def _now() -> datetime:
    return datetime.now(UTC)


@dataclass
class BaseEntity:
    """Базовый класс для всех доменных сущностей оффера.

    Содержит только технические поля идентификации и времени — без бизнес-логики.
    Партнёр наследует от него свои сущности.

    Поля с default_factory — создаются автоматически при инициализации.
    """

    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=_now)
    updated_at: datetime = field(default_factory=_now)
