# ═══════════════════════════════════════════════════════════════════════════════
# api/v1/routes/tarot.py — суточные лимиты раскладов Таро
#
# ВАЖНО про авторизацию: эти роуты — в PUBLIC_PATHS middleware (s2s_auth.py),
# иначе middleware вернул бы 403 залогиненному БЕЗ активной подписки, а именно
# такие пользователи должны иметь бесплатные лимитные расклады.
# Поэтому токен верифицируется здесь ВРУЧНУЮ (как в subscriptions/start),
# а не через Depends(get_current_user) (тот читает request.state.user, которого
# для публичных путей нет).
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.dependencies import get_auth_client, get_db_session
from app.infrastructure.clients.auth_clients import AuthS2SClient, UserContext
from app.repositories.tarot_usage_repo import SqlTarotUsageRepository
from app.services.tarot_service import TarotService

router = APIRouter(prefix="/tarot", tags=["tarot"])


class UsageRequest(BaseModel):
    spread_id: str
    theme_id: str | None = None


class UsageResponse(BaseModel):
    allowed: bool
    remaining: int | None = None
    reason: str | None = None


class LimitsResponse(BaseModel):
    # Ключ сериализуется как "spread_id:theme_id" (theme_id пустой → без темы).
    limits: dict[str, int | None]


def _key_str(spread_id: str, theme_id: str | None) -> str:
    return f"{spread_id}:{theme_id or ''}"


async def _require_user(request: Request, auth: AuthS2SClient) -> UserContext:
    """Верифицировать access_token из cookie. 401 если нет/невалиден."""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")
    user_ctx = await auth.verify_token(token)
    if not user_ctx:
        raise HTTPException(401, "Invalid or expired token")
    return user_ctx


@router.get("/limits", response_model=LimitsResponse)
async def get_limits(
    request: Request,
    auth: AuthS2SClient = Depends(get_auth_client),
    session: AsyncSession = Depends(get_db_session),
) -> LimitsResponse:
    """Остаток бесплатных использований по лимитным сценариям (для гейта UI)."""
    user = await _require_user(request, auth)
    svc = TarotService(SqlTarotUsageRepository(session))
    raw = await svc.get_limits(
        user.user_id, is_subscribed=user.has_active_subscription
    )
    return LimitsResponse(limits={_key_str(s, t): v for (s, t), v in raw.items()})


@router.post("/usage", response_model=UsageResponse)
async def post_usage(
    body: UsageRequest,
    request: Request,
    auth: AuthS2SClient = Depends(get_auth_client),
    session: AsyncSession = Depends(get_db_session),
) -> UsageResponse:
    """Проверить лимит/подписку и, если доступно, учесть использование.

    Клиент вызывает ПЕРЕД тем, как дать выбрать карты.
    """
    user = await _require_user(request, auth)
    svc = TarotService(SqlTarotUsageRepository(session))
    res = await svc.check_and_consume(
        user.user_id,
        body.spread_id,
        body.theme_id,
        is_subscribed=user.has_active_subscription,
    )
    return UsageResponse(
        allowed=res.allowed, remaining=res.remaining, reason=res.reason
    )
