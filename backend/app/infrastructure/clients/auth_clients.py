# ═══════════════════════════════════════════════════════════════════════════════
# infrastructure/clients/auth_clients.py — S2S клиент к auth_service партнёрки
#
# НЕЛЬЗЯ МЕНЯТЬ: это контракт с auth_service партнёрки.
# Изменение нарушит S2S верификацию — все пользователи потеряют доступ.
#
# Тесты контракта: tests/infrastructure/test_s2s_client.py
# Если auth_service изменил API — сначала обнови тест, потом клиент.
#
# Источник параметров при создании:
#   base_url → Settings.auth_service_url  (.env: AUTH_SERVICE_URL)
#   api_key  → Settings.auth_service_api_key (.env: AUTH_SERVICE_API_KEY)
#              получить у команды партнёрки при регистрации оффера
# ═══════════════════════════════════════════════════════════════════════════════

import logging
from dataclasses import dataclass
from uuid import UUID

import httpx

log = logging.getLogger(__name__)


class AuthServiceError(Exception):
    """Ошибка от auth_service: статус и детали пробрасываются в HTTPException роута."""

    def __init__(self, status_code: int, detail: str) -> None:
        self.status_code = status_code
        self.detail = detail


def _extract_detail(response: httpx.Response) -> str:
    try:
        return response.json().get("detail", "Request failed")
    except Exception:
        return "Request failed"


@dataclass(frozen=True)
class UserContext:
    """Контекст пользователя после успешной S2S верификации токена.

    frozen=True: нельзя случайно мутировать контекст в роуте.
    Инжектируется middleware в request.state.user.

    Читать в роутах через: Depends(get_current_user) из api/v1/dependencies.py
    """

    # ID пользователя в auth_service партнёрки.
    # Используется как auth_user_id при создании UserEntity в локальной БД.
    user_id: UUID

    # Реф-код веб-мастера, который привёл этого пользователя.
    # Нужен для атрибуции в аналитике партнёрки.
    # None — если пользователь пришёл не через реф-ссылку.
    referral_code: str | None

    # True если ACTIVE или CANCELLED+access_until в будущем.
    # False при PENDING (не оплатил) или CLOSED. Middleware возвращает 403 если False.
    has_active_subscription: bool


class AuthS2SClient:
    """HTTP-клиент для S2S верификации токенов через auth_service партнёрки.

    Создаётся ОДИН РАЗ в lifespan (main.py) — не создавай в middleware или роутах.
    Переиспользует HTTP connection pool через httpx.AsyncClient.

    Контракт с auth_service:
      Эндпоинт: POST /s2s/auth/token/verify?access_token={token}
      Заголовок: X-Offer-Api-Key: {api_key}
      Ответ 200: {"user_id": str, "offer_id": str, "referral_code": str|null,
                  "has_active_subscription": bool}
      Ответ 401/403: токен невалиден или не принадлежит этому офферу
    """

    def __init__(self, base_url: str, api_key: str) -> None:
        # X-Offer-Api-Key — заголовок авторизации оффера в auth_service.
        # Не путать с X-Internal-Secret (тот для внутренних вызовов партнёрки).
        # Источник api_key: .env AUTH_SERVICE_API_KEY → Settings.auth_service_api_key
        self._client = httpx.AsyncClient(
            base_url=base_url,
            headers={"X-Offer-Api-Key": api_key},
            timeout=10.0,
        )

    async def verify_token(self, token: str) -> UserContext | None:
        """Верифицировать access-токен через auth_service.

        Args:
            token: JWT из HttpOnly cookie access_token.
                   Middleware читает его из request.cookies.

        Returns:
            UserContext при успешной верификации.
            None при 401/403 от auth_service или при сетевой ошибке (fail-safe).

        Fail-safe: сетевые ошибки → логируем WARNING и возвращаем None.
        Лучше отказать в доступе, чем вернуть пользователю 500.
        """
        try:
            response = await self._client.post(
                "/api/v1/s2s/auth/token/verify",
                # Токен как query-параметр — именно так принимает auth_service
                params={"access_token": token},
            )
        except httpx.RequestError as exc:
            log.warning("auth_service S2S request failed: %s", exc)
            return None

        if response.status_code in (401, 403):
            # Токен невалиден или не принадлежит этому офферу
            return None

        if not response.is_success:
            log.warning(
                "auth_service S2S unexpected status=%s body=%s",
                response.status_code,
                response.text[:200],
            )
            return None

        try:
            data = response.json()
            return UserContext(
                user_id=UUID(data["user_id"]),
                referral_code=data.get("referral_code"),
                has_active_subscription=data.get("has_active_subscription", False),
            )
        except (KeyError, ValueError) as exc:
            log.warning(
                "auth_service S2S response parse error: %s | body=%s",
                exc,
                response.text[:200],
            )
            return None

    # ── Auth ─────────────────────────────────────────────────────────────────────

    async def register(self, body: dict) -> dict:
        """Зарегистрировать пользователя. Возвращает токены + user_id."""
        try:
            response = await self._client.post("/api/v1/s2s/auth/register", json=body)
        except httpx.RequestError as exc:
            log.warning("auth_service register S2S error: %s", exc)
            raise AuthServiceError(503, "Auth service unavailable") from exc
        if not response.is_success:
            raise AuthServiceError(response.status_code, _extract_detail(response))
        return response.json()

    async def login(self, body: dict) -> dict:
        """Войти по email/username/tg_init_data. Возвращает токены + user_id."""
        try:
            response = await self._client.post("/api/v1/s2s/auth/login", json=body)
        except httpx.RequestError as exc:
            log.warning("auth_service login S2S error: %s", exc)
            raise AuthServiceError(503, "Auth service unavailable") from exc
        if not response.is_success:
            raise AuthServiceError(response.status_code, _extract_detail(response))
        return response.json()

    async def refresh(self, refresh_token: str) -> dict:
        """Обновить пару токенов по refresh_token. Возвращает новые токены + user_id."""
        try:
            response = await self._client.post(
                "/api/v1/s2s/auth/refresh", json={"refresh_token": refresh_token}
            )
        except httpx.RequestError as exc:
            log.warning("auth_service refresh S2S error: %s", exc)
            raise AuthServiceError(503, "Auth service unavailable") from exc
        if not response.is_success:
            raise AuthServiceError(response.status_code, _extract_detail(response))
        return response.json()

    async def logout(self, refresh_token: str) -> None:
        """Деактивировать refresh_token текущего устройства."""
        try:
            response = await self._client.post(
                "/api/v1/s2s/auth/logout", json={"refresh_token": refresh_token}
            )
        except httpx.RequestError as exc:
            log.warning("auth_service logout S2S error: %s", exc)
            raise AuthServiceError(503, "Auth service unavailable") from exc
        if not response.is_success:
            raise AuthServiceError(response.status_code, _extract_detail(response))

    async def logout_all(self, user_id: UUID) -> None:
        """Инвалидировать все refresh_token пользователя."""
        try:
            response = await self._client.post(
                "/api/v1/s2s/auth/logout-all", json={"user_id": str(user_id)}
            )
        except httpx.RequestError as exc:
            log.warning("auth_service logout_all S2S error: %s", exc)
            raise AuthServiceError(503, "Auth service unavailable") from exc
        if not response.is_success:
            raise AuthServiceError(response.status_code, _extract_detail(response))

    # ── Subscriptions ─────────────────────────────────────────────────────────

    async def create_subscription(self, user_id: UUID) -> dict:
        """Создать PENDING auth-подписку. Вызывать перед редиректом на Pay Form."""
        try:
            response = await self._client.post(
                "/api/v1/s2s/subscriptions", json={"user_id": str(user_id)}
            )
        except httpx.RequestError as exc:
            log.warning("auth_service create_subscription S2S error: %s", exc)
            raise AuthServiceError(503, "Auth service unavailable") from exc
        if not response.is_success:
            raise AuthServiceError(response.status_code, _extract_detail(response))
        return response.json()

    async def get_subscription(self, user_id: UUID) -> dict:
        """Получить auth-подписку (доступ) пользователя."""
        try:
            response = await self._client.get(f"/api/v1/s2s/subscriptions/{user_id}")
        except httpx.RequestError as exc:
            log.warning("auth_service get_subscription S2S error: %s", exc)
            raise AuthServiceError(503, "Auth service unavailable") from exc
        if not response.is_success:
            raise AuthServiceError(response.status_code, _extract_detail(response))
        return response.json()

    async def get_subscription_tariff(self, user_id: UUID) -> dict:
        """Тариф payment-подписки пользователя (проксируется через auth_service)."""
        try:
            response = await self._client.get(
                f"/api/v1/s2s/subscriptions/{user_id}/tariff"
            )
        except httpx.RequestError as exc:
            log.warning("auth_service get_subscription_tariff S2S error: %s", exc)
            raise AuthServiceError(503, "Auth service unavailable") from exc
        if not response.is_success:
            raise AuthServiceError(response.status_code, _extract_detail(response))
        return response.json()

    async def cancel_subscription(self, user_id: UUID) -> dict:
        """Мягкая отмена (ACTIVE → CANCELLED). Доступ сохраняется до access_until."""
        try:
            response = await self._client.post(
                f"/api/v1/s2s/subscriptions/{user_id}/cancel"
            )
        except httpx.RequestError as exc:
            log.warning("auth_service cancel_subscription S2S error: %s", exc)
            raise AuthServiceError(503, "Auth service unavailable") from exc
        if not response.is_success:
            raise AuthServiceError(response.status_code, _extract_detail(response))
        return response.json()

    async def reopen_subscription(self, user_id: UUID) -> dict:
        """Отменить отмену (CANCELLED → ACTIVE). Только пока access_until в будущем."""
        try:
            response = await self._client.post(
                f"/api/v1/s2s/subscriptions/{user_id}/reopen"
            )
        except httpx.RequestError as exc:
            log.warning("auth_service reopen_subscription S2S error: %s", exc)
            raise AuthServiceError(503, "Auth service unavailable") from exc
        if not response.is_success:
            raise AuthServiceError(response.status_code, _extract_detail(response))
        return response.json()

    async def refund_subscription(self, user_id: UUID) -> dict:
        """Вернуть деньги за последний платёж и закрыть подписку."""
        try:
            response = await self._client.post(
                "/api/v1/s2s/subscriptions/refund", json={"user_id": str(user_id)}
            )
        except httpx.RequestError as exc:
            log.warning("auth_service refund_subscription S2S error: %s", exc)
            raise AuthServiceError(503, "Auth service unavailable") from exc
        if not response.is_success:
            raise AuthServiceError(response.status_code, _extract_detail(response))
        return response.json()

    async def aclose(self) -> None:
        """Закрыть HTTP-клиент и connection pool.

        Вызывается в lifespan teardown (main.py). Не вызывать вручную.
        """
        await self._client.aclose()
