# ═══════════════════════════════════════════════════════════════════════════════
# tests/conftest.py — общие тестовые фикстуры
#
# НЕЛЬЗЯ МЕНЯТЬ: mock_auth_client, mock_user_context — используются в тестах
#   инфраструктуры. Изменение сломает tests/infrastructure/.
#
# МОЖНО ДОБАВЛЯТЬ свои фикстуры для тестов предметной области.
#   Пример: фикстура создающая тестового пользователя в in-memory репозитории.
# ═══════════════════════════════════════════════════════════════════════════════

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.infrastructure.clients.auth_clients import AuthS2SClient, UserContext


@pytest.fixture
def mock_user_context() -> UserContext:
    """Тестовый UserContext с активной подпиской.

    Используется как заглушка для middleware в тестах domain-логики.
    Источник: не auth_service — генерируется здесь для тестов.
    """
    return UserContext(
        user_id=uuid4(),
        referral_code="TEST123",
        has_active_subscription=True,
    )


@pytest.fixture
def mock_auth_client(mock_user_context: UserContext) -> AuthS2SClient:
    """Мок AuthS2SClient — не делает реальных HTTP-запросов к auth_service.

    Использование:
        async def test_something(mock_auth_client, mock_user_context):
            result = await mock_auth_client.verify_token("any-token")
            assert result == mock_user_context

    Для теста без подписки:
        mock_auth_client.verify_token.return_value = UserContext(
            user_id=uuid4(), referral_code=None, has_active_subscription=False
        )
    """
    client = AsyncMock(spec=AuthS2SClient)
    client.verify_token.return_value = mock_user_context
    return client
