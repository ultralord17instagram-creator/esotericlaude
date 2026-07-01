from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.api.v1.dependencies import get_auth_client
from app.api.v1.schemases import AuthResponse, LoginRequest, RegisterRequest
from app.infrastructure.clients.auth_clients import AuthS2SClient, AuthServiceError

router = APIRouter(prefix="/auth", tags=["auth"])

# ── Cookie helpers ────────────────────────────────────────────────────────────

_COOKIE_OPTS = dict(httponly=True, secure=True, samesite="lax")


def _set_auth_cookies(
    response: Response, access_token: str, refresh_token: str
) -> None:
    response.set_cookie("access_token", access_token, **_COOKIE_OPTS)
    response.set_cookie("refresh_token", refresh_token, **_COOKIE_OPTS)


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")


# ── Routes ────────────────────────────────────────────────────────────────────


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(
    body: RegisterRequest,
    response: Response,
    auth: AuthS2SClient = Depends(get_auth_client),
) -> AuthResponse:
    """Зарегистрировать нового пользователя.

    Токены устанавливаются в HttpOnly cookies — не возвращаются в теле ответа.
    После регистрации пользователь должен оформить подписку: POST /subscriptions/start.

    Поддерживаемые провайдеры (нужно заполнить одно из трёх):
    - email + password
    - username + password
    - tg_init_data (Telegram Mini App)
    """
    try:
        data = await auth.register(body.model_dump(exclude_none=True))
    except AuthServiceError as e:
        raise HTTPException(e.status_code, e.detail) from e
    _set_auth_cookies(response, data["access_token"], data["refresh_token"])
    return AuthResponse(
        user_id=data["user_id"], referral_code=data.get("referral_code")
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    body: LoginRequest,
    response: Response,
    auth: AuthS2SClient = Depends(get_auth_client),
) -> AuthResponse:
    """Войти в аккаунт. Токены устанавливаются в HttpOnly cookies."""
    try:
        data = await auth.login(body.model_dump(exclude_none=True))
    except AuthServiceError as e:
        raise HTTPException(e.status_code, e.detail) from e
    _set_auth_cookies(response, data["access_token"], data["refresh_token"])
    return AuthResponse(
        user_id=data["user_id"], referral_code=data.get("referral_code")
    )


@router.post("/refresh", response_model=AuthResponse)
async def refresh(
    request: Request,
    response: Response,
    auth: AuthS2SClient = Depends(get_auth_client),
) -> AuthResponse:
    """Обновить пару токенов. Читает refresh_token из cookie, выдаёт новые cookies.

    Вызывать при получении 401 от любого защищённого эндпоинта.
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(401, "No refresh token")
    try:
        data = await auth.refresh(refresh_token)
    except AuthServiceError as e:
        raise HTTPException(e.status_code, e.detail) from e
    _set_auth_cookies(response, data["access_token"], data["refresh_token"])
    return AuthResponse(
        user_id=data["user_id"], referral_code=data.get("referral_code")
    )


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    auth: AuthS2SClient = Depends(get_auth_client),
) -> None:
    """Выйти с текущего устройства. Деактивирует refresh_token, очищает cookies."""
    refresh_token = request.cookies.get("refresh_token")
    if refresh_token:
        try:
            await auth.logout(refresh_token)
        except AuthServiceError:
            pass  # cookies всё равно чистим
    _clear_auth_cookies(response)


@router.post("/logout-all", status_code=204)
async def logout_all(
    request: Request,
    response: Response,
    auth: AuthS2SClient = Depends(get_auth_client),
) -> None:
    """Выйти со всех устройств. Требует валидный access_token в cookie.

    Инвалидирует все refresh_token пользователя, очищает cookies на текущем устройстве.
    """
    token = request.cookies.get("access_token")
    if token:
        # verify_token возвращает None при невалидном токене — не кидаем ошибку,
        # просто чистим cookies чтобы пользователь не завис на клиенте.
        user_ctx = await auth.verify_token(token)
        if user_ctx:
            try:
                await auth.logout_all(user_ctx.user_id)
            except AuthServiceError:
                pass
    _clear_auth_cookies(response)
