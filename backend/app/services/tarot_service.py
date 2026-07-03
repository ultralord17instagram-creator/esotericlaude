# ═══════════════════════════════════════════════════════════════════════════════
# services/tarot_service.py — правила суточных лимитов Таро
#
# check_and_consume: проверить доступность расклада и, если доступно, учесть.
# get_limits: остаток по лимитным сценариям для UI-гейта.
#
# Правила (дизайн §2, §8):
#   — платные темы (PAID_KEYS): доступ по подписке, без суточного лимита;
#   — бесплатные лимитные (TAROT_LIMITS): N в сутки, подписчик — без лимита;
#   — «карта дня» сюда не приходит (детерминирована на клиенте, без бэкенда).
# ═══════════════════════════════════════════════════════════════════════════════

from dataclasses import dataclass
from datetime import date
from uuid import UUID

from app.domain.entities.tarot_usage import TarotUsageEntity
from app.repositories.tarot_usage_repo import ITarotUsageRepository
from app.services.tarot_limits import PAID_KEYS, TAROT_LIMITS, project_today


@dataclass(frozen=True)
class LimitResult:
    allowed: bool
    remaining: int | None = None  # None = безлимит (подписчик)
    reason: str | None = None  # 'limit' | 'subscription'


class TarotService:
    def __init__(self, repo: ITarotUsageRepository) -> None:
        self._repo = repo

    async def check_and_consume(
        self,
        auth_user_id: UUID,
        spread_id: str,
        theme_id: str | None,
        *,
        is_subscribed: bool,
        today: date | None = None,
    ) -> LimitResult:
        key = (spread_id, theme_id)
        day = today or project_today()

        # Платные темы: гейт по подписке, без учёта суток.
        if key in PAID_KEYS:
            if is_subscribed:
                return LimitResult(allowed=True)
            return LimitResult(allowed=False, reason="subscription")

        # Бесплатные сценарии с суточным лимитом.
        if key in TAROT_LIMITS:
            if is_subscribed:
                return LimitResult(allowed=True, remaining=None)  # безлимит
            limit = TAROT_LIMITS[key]
            usage = await self._repo.get(auth_user_id, spread_id, theme_id, day)
            used = usage.count if usage else 0
            if used >= limit:
                return LimitResult(allowed=False, reason="limit")
            if usage is None:
                usage = TarotUsageEntity(
                    auth_user_id=auth_user_id,
                    spread_id=spread_id,
                    theme_id=theme_id,
                    usage_date=day,
                )
            usage.increment()
            await self._repo.save(usage)
            return LimitResult(allowed=True, remaining=limit - usage.count)

        # Неизвестный/безлимитный ключ — пропускаем.
        return LimitResult(allowed=True, remaining=None)

    async def get_limits(
        self,
        auth_user_id: UUID,
        *,
        is_subscribed: bool,
        today: date | None = None,
    ) -> dict[tuple[str, str | None], int | None]:
        day = today or project_today()
        out: dict[tuple[str, str | None], int | None] = {}
        for key, limit in TAROT_LIMITS.items():
            if is_subscribed:
                out[key] = None  # безлимит
                continue
            usage = await self._repo.get(auth_user_id, key[0], key[1], day)
            used = usage.count if usage else 0
            out[key] = max(0, limit - used)
        return out
