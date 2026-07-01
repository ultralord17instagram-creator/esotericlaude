# ═══════════════════════════════════════════════════════════════════════════════
# api/v1/dependencies.py — FastAPI dependencies
#
# НЕЛЬЗЯ МЕНЯТЬ: get_current_user, get_db_session, get_user_repository —
#   эти dependencies используются во всех роутах как основа авторизации и БД.
#
# МОЖНО ДОБАВЛЯТЬ:
#   — новые dependency-функции для своих роутов
#   — новые маппинги в map_exception_to_http_exception()
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.exceptions import (
    BaseOfferException,
    UserAlreadyExistsError,
    UserNotFoundError,
)
from app.infrastructure.clients.auth_clients import AuthS2SClient, UserContext
from app.infrastructure.clients.payment_clients import PaymentS2SClient
from app.repositories.user_repo import IUserRepository, SqlUserRepository
from app.services.user_service import UserService


def get_current_user(request: Request) -> UserContext:
    """Получить UserContext текущего пользователя из request.state.

    Middleware уже проверил токен и подписку — здесь просто читаем результат.
    Гарантирует: пользователь аутентифицирован И имеет активную подписку.

    Использование в роуте:
        @router.get("/content")
        async def get_content(user: UserContext = Depends(get_current_user)):
            return {"user_id": user.user_id}
    """
    return request.state.user


async def get_db_session(request: Request):
    """Получить AsyncSession из app.state.session_factory.

    session_factory создаётся в lifespan (main.py).
    Каждый запрос получает свою сессию — транзакции изолированы между запросами.
    Транзакция автоматически commit/rollback через context manager.
    """
    async with request.app.state.session_factory() as session:
        async with session.begin():
            yield session


def get_user_repository(
    session: AsyncSession = Depends(get_db_session),
) -> IUserRepository:
    """Создать SqlUserRepository с сессией текущего запроса."""
    return SqlUserRepository(session)


def get_user_service(
    repo: IUserRepository = Depends(get_user_repository),
) -> UserService:
    """Создать UserService с репозиторием текущего запроса."""
    return UserService(user_repo=repo)


def get_auth_client(request: Request) -> AuthS2SClient:
    """Получить AuthS2SClient из app.state (создан в lifespan)."""
    return request.app.state.auth_client


def get_payment_client(request: Request) -> PaymentS2SClient:
    """Получить PaymentS2SClient из app.state (создан в lifespan)."""
    return request.app.state.payment_client


def map_exception_to_http_exception(exc: BaseOfferException) -> HTTPException:
    """Маппинг domain exceptions → HTTPException с нужным HTTP статусом.

    МОЖНО ДОБАВЛЯТЬ новые маппинги при добавлении domain exceptions.
    Это единственное место где domain exceptions превращаются в HTTP-ответы.

    Использование в роуте:
        try:
            result = await svc.do_something()
        except BaseOfferException as exc:
            raise map_exception_to_http_exception(exc) from exc
    """
    if isinstance(exc, UserNotFoundError):
        return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    if isinstance(exc, UserAlreadyExistsError):
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    # Fallback для незамапленных domain exceptions
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=str(exc),
    )
