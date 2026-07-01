# ═══════════════════════════════════════════════════════════════════════════════
# api/v1/schemases/__init__.py — Pydantic схемы запросов и ответов
#
# МОЖНО МЕНЯТЬ: добавлять схемы для своих роутов.
# НЕЛЬЗЯ: возвращать domain entities напрямую из роутов — только схемы.
#   Entity — внутренний объект, схема — публичный контракт API.
#
# Соглашение об именовании:
#   XxxRequest — тело входящего запроса
#   XxxResponse — тело исходящего ответа
# ═══════════════════════════════════════════════════════════════════════════════

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    """Ответ на GET /api/v1/users/me.

    МОЖНО ДОБАВЛЯТЬ поля — они попадут в JSON-ответ.
    НЕЛЬЗЯ УДАЛЯТЬ auth_user_id — это идентификатор пользователя в системе.
    """

    # ID пользователя в auth_service партнёрки
    auth_user_id: UUID
    # Реф-код веб-мастера — None если пришёл напрямую без реф-ссылки
    referral_code: str | None
    # Дата регистрации пользователя на этом оффере
    created_at: datetime


# ── Auth ─────────────────────────────────────────────────────────────────────


class RegisterRequest(BaseModel):
    email: EmailStr | None = None
    username: str | None = None
    tg_init_data: str | None = None
    password: str | None = None
    referral_code: str | None = None
    device_id: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr | None = None
    username: str | None = None
    tg_init_data: str | None = None
    password: str | None = None
    device_id: str | None = None


class AuthResponse(BaseModel):
    """Ответ на register/login/refresh. Токены передаются в HttpOnly cookies."""

    user_id: UUID
    referral_code: str | None = None


# ── Subscriptions ─────────────────────────────────────────────────────────────


class SubscriptionResponse(BaseModel):
    subscription_id: UUID
    status: str
    is_past_due: bool = False
    subscription_type: str
    status_changed_at: datetime
    access_until: datetime | None = None


class SubscriptionStartResponse(BaseModel):
    """Ответ на POST /subscriptions/start. Клиент редиректит на redirect_url."""

    subscription_id: UUID
    redirect_url: str


class RefundResponse(BaseModel):
    subscription_id: UUID
    status: str
    status_changed_at: datetime


class TariffResponse(BaseModel):
    id: int
    name: str
    amount: Decimal
    days: int
    first_amount: Decimal | None = None
    first_days: int | None = None
    max_successful_payments: int | None = None


# ── Добавляй свои схемы ниже ─────────────────────────────────────────────────
