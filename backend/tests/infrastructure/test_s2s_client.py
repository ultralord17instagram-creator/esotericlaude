# ═══════════════════════════════════════════════════════════════════════════════
# tests/infrastructure/test_s2s_client.py — контракт S2S клиента
#
# НЕЛЬЗЯ МЕНЯТЬ: эти тесты охраняют контракт с auth_service партнёрки.
# Нарушение контракта = все пользователи теряют доступ к офферу.
#
# Если auth_service изменил API:
#   1. Сначала обнови тест (контракт — источник истины)
#   2. Потом обнови клиент в infrastructure/clients/auth_clients.py
#
# Запуск: cd backend && pytest tests/infrastructure/test_s2s_client.py
# ═══════════════════════════════════════════════════════════════════════════════

from uuid import UUID

import httpx
import pytest
import respx

from app.infrastructure.clients.auth_clients import AuthS2SClient

# Тестовые константы — не реальные значения, только для проверки контракта.
# Реальные значения: .env → AUTH_SERVICE_URL, AUTH_SERVICE_API_KEY
AUTH_SERVICE_URL = "http://auth-service-test"
API_KEY = "test-offer-api-key"
TEST_TOKEN = "test.jwt.token"
TEST_USER_ID = "123e4567-e89b-12d3-a456-426614174000"


@pytest.mark.asyncio
@respx.mock
async def test_verify_token_sends_correct_header_and_query_param():
    """Клиент передаёт API-ключ в X-Offer-Api-Key и токен в query-параметре.

    Контракт:
      — Заголовок: X-Offer-Api-Key (не X-API-Key, не X-Internal-Secret)
      — Параметр: ?access_token={token} (не Authorization: Bearer)
      — Эндпоинт: POST /s2s/auth/token/verify

    Если заголовок неверный — auth_service вернёт 401 и все пользователи
    потеряют доступ. Этот тест должен зеленеть всегда.
    """
    mock_route = respx.post(f"{AUTH_SERVICE_URL}/api/v1/s2s/auth/token/verify").mock(
        return_value=httpx.Response(
            200,
            json={
                "user_id": TEST_USER_ID,
                "offer_id": "test-offer",
                "referral_code": "ABC123",
                "has_active_subscription": True,
            },
        )
    )

    client = AuthS2SClient(base_url=AUTH_SERVICE_URL, api_key=API_KEY)
    result = await client.verify_token(TEST_TOKEN)
    await client.aclose()

    assert mock_route.called, "HTTP-запрос к auth_service не был отправлен"

    sent_request = mock_route.calls.last.request

    # Заголовок авторизации оффера — должен быть именно X-Offer-Api-Key
    assert sent_request.headers["x-offer-api-key"] == API_KEY, (
        f"Неверный заголовок. Ожидали x-offer-api-key={API_KEY}, "
        f"получили: {dict(sent_request.headers)}"
    )

    # Токен как query-параметр — так принимает auth_service
    assert f"access_token={TEST_TOKEN}" in str(sent_request.url), (
        f"Токен не найден в query-параметрах: {sent_request.url}"
    )

    # Ответ парсится корректно
    assert result is not None
    assert result.user_id == UUID(TEST_USER_ID)
    assert result.referral_code == "ABC123"
    assert result.has_active_subscription is True


@pytest.mark.asyncio
@respx.mock
async def test_verify_token_returns_none_on_401():
    """Клиент возвращает None при 401 от auth_service (токен невалиден).

    Middleware превратит None в 401 ответ для конечного пользователя.
    """
    respx.post(f"{AUTH_SERVICE_URL}/api/v1/s2s/auth/token/verify").mock(
        return_value=httpx.Response(401)
    )

    client = AuthS2SClient(base_url=AUTH_SERVICE_URL, api_key=API_KEY)
    result = await client.verify_token("invalid-token")
    await client.aclose()

    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_verify_token_returns_none_on_403():
    """Клиент возвращает None при 403 (токен не принадлежит этому офферу)."""
    respx.post(f"{AUTH_SERVICE_URL}/api/v1/s2s/auth/token/verify").mock(
        return_value=httpx.Response(403)
    )

    client = AuthS2SClient(base_url=AUTH_SERVICE_URL, api_key=API_KEY)
    result = await client.verify_token("wrong-offer-token")
    await client.aclose()

    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_verify_token_returns_none_on_network_error():
    """Клиент возвращает None при сетевой ошибке (fail-safe).

    Fail-safe: лучше запретить доступ, чем вернуть пользователю 500.
    Сетевая ошибка логируется как WARNING.
    """
    respx.post(f"{AUTH_SERVICE_URL}/api/v1/s2s/auth/token/verify").mock(
        side_effect=httpx.ConnectError("Connection refused")
    )

    client = AuthS2SClient(base_url=AUTH_SERVICE_URL, api_key=API_KEY)
    result = await client.verify_token(TEST_TOKEN)
    await client.aclose()

    assert result is None


@pytest.mark.asyncio
@respx.mock
async def test_verify_token_parses_no_active_subscription():
    """Клиент корректно парсит has_active_subscription=False.

    Middleware вернёт 403 если has_active_subscription=False.
    Проверяем что клиент не игнорирует это поле.
    """
    respx.post(f"{AUTH_SERVICE_URL}/api/v1/s2s/auth/token/verify").mock(
        return_value=httpx.Response(
            200,
            json={
                "user_id": TEST_USER_ID,
                "offer_id": "test-offer",
                "referral_code": None,
                "has_active_subscription": False,
            },
        )
    )

    client = AuthS2SClient(base_url=AUTH_SERVICE_URL, api_key=API_KEY)
    result = await client.verify_token(TEST_TOKEN)
    await client.aclose()

    assert result is not None
    assert result.has_active_subscription is False
    assert result.referral_code is None
