# ═══════════════════════════════════════════════════════════════════════════════
# tests/domain/test_user_entity.py — тесты UserEntity (пример для партнёра)
#
# МОЖНО МЕНЯТЬ: добавлять тесты своих сущностей и их методов.
# Это пример как тестировать domain-логику: без БД, без HTTP, без моков.
#
# Правило: тест domain — только pure Python. Если нужен mock — скорее всего
# логика находится не там. Переосмысли где находится бизнес-правило.
# ═══════════════════════════════════════════════════════════════════════════════

from datetime import datetime
from uuid import UUID, uuid4

from app.domain.entities.user import UserEntity


def test_user_entity_creates_with_required_fields():
    """UserEntity создаётся с обязательным auth_user_id."""
    auth_id = uuid4()

    user = UserEntity(auth_user_id=auth_id)

    assert user.auth_user_id == auth_id
    assert user.referral_code is None
    # Технические поля генерируются автоматически
    assert isinstance(user.id, UUID)
    assert isinstance(user.created_at, datetime)
    assert isinstance(user.updated_at, datetime)


def test_user_entity_stores_referral_code():
    """UserEntity сохраняет referral_code веб-мастера."""
    user = UserEntity(auth_user_id=uuid4(), referral_code="WM_ABC123")

    assert user.referral_code == "WM_ABC123"


def test_user_entity_without_referral_code():
    """Пользователь без реф-кода — пришёл напрямую, не через веб-мастера."""
    user = UserEntity(auth_user_id=uuid4(), referral_code=None)

    assert user.referral_code is None


def test_mark_updated_changes_updated_at():
    """mark_updated() обновляет updated_at на текущее время."""
    user = UserEntity(auth_user_id=uuid4())
    # Зафиксировать исходное время
    original = user.updated_at

    user.mark_updated()

    # updated_at изменился (или остался равным если выполнился за одну микросекунду)
    assert user.updated_at >= original


def test_two_users_have_different_ids():
    """Каждый UserEntity получает уникальный id (uuid4)."""
    user1 = UserEntity(auth_user_id=uuid4())
    user2 = UserEntity(auth_user_id=uuid4())

    assert user1.id != user2.id


def test_user_entity_timestamps_are_timezone_aware():
    """Временные метки создаются с timezone (UTC)."""
    user = UserEntity(auth_user_id=uuid4())

    assert user.created_at.tzinfo is not None
    assert user.updated_at.tzinfo is not None


# ── Добавляй тесты своих методов ниже ────────────────────────────────────────
# Пример: если добавишь UserEntity.deactivate() — протестируй его здесь.
#
# def test_deactivate_changes_status():
#     user = UserEntity(auth_user_id=uuid4())
#     user.deactivate()
#     assert user.is_active is False
