from fastapi import APIRouter, Depends, HTTPException, Request

from app.api.v1.dependencies import get_auth_client, get_payment_client
from app.api.v1.schemases import (
    RefundResponse,
    SubscriptionResponse,
    SubscriptionStartResponse,
    TariffResponse,
)
from app.config import get_settings
from app.infrastructure.clients.auth_clients import AuthS2SClient, AuthServiceError
from app.infrastructure.clients.payment_clients import (
    PaymentS2SClient,
    PaymentServiceError,
)

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


# ── Публичные эндпоинты (в PUBLIC_PATHS middleware) ───────────────────────────


@router.get("/tariff", response_model=TariffResponse)
async def get_offer_tariff(
    payment: PaymentS2SClient = Depends(get_payment_client),
) -> TariffResponse:
    """Тариф оффера — цена, период, спецусловия первого платежа.

    Публичный эндпоинт: авторизация не нужна.
    Использовать на лендинге для отображения стоимости подписки.
    """
    cfg = get_settings()
    try:
        data = await payment.get_offer_tariff(cfg.offer_id)
    except PaymentServiceError as e:
        raise HTTPException(e.status_code, e.detail) from e
    return TariffResponse(**data)


@router.post("/start", response_model=SubscriptionStartResponse, status_code=201)
async def start_subscription(
    request: Request,
    auth: AuthS2SClient = Depends(get_auth_client),
) -> SubscriptionStartResponse:
    """Начать оформление подписки.

    Создаёт PENDING auth-подписку и возвращает redirect_url на Pay Form партнёрки.
    Клиент должен перенаправить пользователя по этому URL.

    Публичный эндпоинт: требует валидный access_token в cookie, но не требует
    активной подписки (пользователь только что зарегистрировался).

    Флоу оформления подписки:
      1. POST /auth/register → пользователь зарегистрирован, токены в cookies
      2. POST /subscriptions/start → создаёт PENDING, возвращает redirect_url
      3. Клиент редиректит на redirect_url → Pay Form
      4. Пользователь вводит карту на Pay Form → CloudPayments → webhook
      5. payment_service активирует подписку, auth_service выставляет ACTIVE
      6. verify_token начинает возвращать has_active_subscription=true
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "Not authenticated")

    user_ctx = await auth.verify_token(token)
    if not user_ctx:
        raise HTTPException(401, "Invalid or expired token")

    try:
        sub = await auth.create_subscription(user_ctx.user_id)
    except AuthServiceError as e:
        raise HTTPException(e.status_code, e.detail) from e

    cfg = get_settings()
    redirect_url = (
        f"{cfg.pay_form_url}"
        f"?user_id={user_ctx.user_id}"
        f"&subscription_id={sub['subscription_id']}"
        f"&offer_id={cfg.offer_id}"
    )
    return SubscriptionStartResponse(
        subscription_id=sub["subscription_id"],
        redirect_url=redirect_url,
    )


# ── Защищённые эндпоинты (требуют активной подписки) ─────────────────────────


@router.get("/me", response_model=SubscriptionResponse)
async def get_subscription(
    request: Request,
    auth: AuthS2SClient = Depends(get_auth_client),
) -> SubscriptionResponse:
    """Получить статус auth-подписки (доступа) текущего пользователя."""
    user_id = request.state.user.user_id
    try:
        data = await auth.get_subscription(user_id)
    except AuthServiceError as e:
        raise HTTPException(e.status_code, e.detail) from e
    return SubscriptionResponse(**data)


@router.get("/me/tariff", response_model=TariffResponse)
async def get_subscription_tariff(
    request: Request,
    auth: AuthS2SClient = Depends(get_auth_client),
) -> TariffResponse:
    """Тариф активной payment-подписки текущего пользователя.

    Возвращает условия текущего биллинг-цикла: сумму списания, периодичность.
    404 если у пользователя нет активной payment-подписки.
    """
    user_id = request.state.user.user_id
    try:
        data = await auth.get_subscription_tariff(user_id)
    except AuthServiceError as e:
        raise HTTPException(e.status_code, e.detail) from e
    return TariffResponse(**data)


@router.post("/me/cancel", response_model=SubscriptionResponse)
async def cancel_subscription(
    request: Request,
    auth: AuthS2SClient = Depends(get_auth_client),
) -> SubscriptionResponse:
    """Отменить подписку (мягкая отмена).

    ACTIVE → CANCELLED. Доступ к контенту сохраняется до access_until
    (до конца оплаченного периода). Повторные списания прекращаются.
    Восстановить: POST /subscriptions/me/reopen (пока access_until в будущем).
    """
    user_id = request.state.user.user_id
    try:
        data = await auth.cancel_subscription(user_id)
    except AuthServiceError as e:
        raise HTTPException(e.status_code, e.detail) from e
    return SubscriptionResponse(**data)


@router.post("/me/reopen", response_model=SubscriptionResponse)
async def reopen_subscription(
    request: Request,
    auth: AuthS2SClient = Depends(get_auth_client),
) -> SubscriptionResponse:
    """Восстановить отменённую подписку.

    CANCELLED → ACTIVE. Работает только пока access_until в будущем.
    Если оплаченный период истёк — вернёт ошибку 422.
    """
    user_id = request.state.user.user_id
    try:
        data = await auth.reopen_subscription(user_id)
    except AuthServiceError as e:
        raise HTTPException(e.status_code, e.detail) from e
    return SubscriptionResponse(**data)


@router.post("/me/refund", response_model=RefundResponse)
async def refund_subscription(
    request: Request,
    auth: AuthS2SClient = Depends(get_auth_client),
) -> RefundResponse:
    """Вернуть деньги за последний платёж и закрыть подписку.

    Инициирует возврат через payment_service → CloudPayments.
    Подписка переходит в CLOSED, доступ прекращается немедленно.
    Операция необратима.
    """
    user_id = request.state.user.user_id
    try:
        data = await auth.refund_subscription(user_id)
    except AuthServiceError as e:
        raise HTTPException(e.status_code, e.detail) from e
    return RefundResponse(**data)
