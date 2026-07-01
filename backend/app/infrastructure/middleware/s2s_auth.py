# ═══════════════════════════════════════════════════════════════════════════════
# infrastructure/middleware/s2s_auth.py — S2S Auth Middleware
#
# НЕЛЬЗЯ МЕНЯТЬ: единственная точка авторизации в приложении.
# Ошибка здесь = все пользователи без доступа ИЛИ с неограниченным доступом.
#
# В ИСКЛЮЧИТЕЛЬНЫХ СЛУЧАЯХ можно менять PUBLIC_PATHS:
#   добавить путь без авторизации (например /register, /payment-callback).
#   Осторожно: каждый публичный путь — потенциальная дыра в безопасности.
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi import status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.infrastructure.clients.auth_clients import AuthS2SClient


class S2SAuthMiddleware(BaseHTTPMiddleware):
    """Middleware авторизации через auth_service партнёрки.

    Перехватывает КАЖДЫЙ запрос. Алгоритм:
      1. Путь в PUBLIC_PATHS? → пропустить без проверки
      2. Нет cookie access_token? → 401 Not authenticated
      3. auth_service вернул None (токен невалиден/ошибка)? → 401 Invalid token
      4. has_active_subscription == False? → 403 No active subscription
      5. Всё ок → request.state.user = UserContext, передать запрос дальше

    Роуты читают пользователя через Depends(get_current_user) из dependencies.py.
    Не дублируй проверку авторизации в роутах.

    ВАЖНО: JSONResponse вместо raise HTTPException — middleware работает на
    Starlette-уровне, FastAPI exception handlers здесь не вызываются.
    """

    # Пути без авторизации — O(1) lookup.
    # В ИСКЛЮЧИТЕЛЬНЫХ СЛУЧАЯХ добавляй новые публичные пути сюда.
    # Не добавляй без понимания: каждый путь в этом set'е обходит авторизацию.
    PUBLIC_PATHS: frozenset[str] = frozenset(
        {
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            # Auth — нет токена (register/login) или нет подписки (refresh)
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            # Logout — должен работать при любом статусе подписки
            "/api/v1/auth/logout",
            "/api/v1/auth/logout-all",
            # Подписка: токен есть, но has_active_subscription=False
            "/api/v1/subscriptions/start",
            # Тариф оффера — публично, нужен до регистрации (лендинг)
            "/api/v1/subscriptions/tariff",
        }
    )

    def __init__(self, app, auth_client: AuthS2SClient) -> None:
        super().__init__(app)
        # auth_client создаётся в create_app() (main.py) и передаётся сюда.
        # Один клиент на весь lifecycle приложения — переиспользует HTTP-соединения.
        self._auth_client = auth_client

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.PUBLIC_PATHS:
            return await call_next(request)

        # Токен хранится в HttpOnly cookie access_token.
        # Устанавливается auth_service партнёрки при логине/регистрации пользователя.
        # HttpOnly — недоступен из JS, защита от XSS.
        token = request.cookies.get("access_token")
        if not token:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Not authenticated"},
            )

        # Один S2S вызов → и верификация токена, и проверка подписки.
        user_ctx = await self._auth_client.verify_token(token)
        if user_ctx is None:
            # None = токен невалиден, истёк, или сетевая ошибка (fail-safe)
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid or expired token"},
            )

        if not user_ctx.has_active_subscription:
            # Токен валиден, но подписка не активна (PENDING или CLOSED).
            # Пользователь зарегистрирован, но не оплатил или подписка закрыта.
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "No active subscription"},
            )

        # Инжектировать контекст пользователя в запрос.
        # Роуты читают через request.state.user или Depends(get_current_user).
        request.state.user = user_ctx
        return await call_next(request)
