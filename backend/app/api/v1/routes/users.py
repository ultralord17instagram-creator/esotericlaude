# ═══════════════════════════════════════════════════════════════════════════════
# api/v1/routes/users.py — роуты пользователей (пример для партнёра)
#
# МОЖНО МЕНЯТЬ: добавлять свои роуты, изменять GET /me под нужды оффера.
#
# Паттерн роута:
#   1. Depends(get_current_user) — получить UserContext (авторизован middleware)
#   2. Depends(get_user_service) — получить сервис с инжектированным репозиторием
#   3. Вызов сервиса
#   4. Обернуть domain exception через map_exception_to_http_exception()
#   5. Вернуть Pydantic-схему (не entity)
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi import APIRouter, Depends

from app.api.v1.dependencies import (
    get_current_user,
    get_user_service,
    map_exception_to_http_exception,
)
from app.api.v1.schemases import UserResponse
from app.domain.exceptions import BaseOfferException
from app.infrastructure.clients.auth_clients import UserContext
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(
    user_ctx: UserContext = Depends(get_current_user),
    svc: UserService = Depends(get_user_service),
) -> UserResponse:
    """Получить профиль текущего авторизованного пользователя.

    При первом визите — создаёт локальную запись пользователя в БД оффера
    и фиксирует referral_code (от кого пришёл).
    При повторных — возвращает существующий профиль.

    Пользователь уже прошёл авторизацию и проверку подписки в middleware.
    Здесь только читаем данные из request.state через get_current_user.
    """
    try:
        user = await svc.get_or_create(
            auth_user_id=user_ctx.user_id,
            referral_code=user_ctx.referral_code,
        )
    except BaseOfferException as exc:
        raise map_exception_to_http_exception(exc) from exc

    return UserResponse(
        auth_user_id=user.auth_user_id,
        referral_code=user.referral_code,
        created_at=user.created_at,
    )
