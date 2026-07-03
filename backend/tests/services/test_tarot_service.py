# ═══════════════════════════════════════════════════════════════════════════════
# tests/services/test_tarot_service.py — правила суточных лимитов Таро
#
# Тестируем бизнес-логику без БД: FakeRepo (in-memory) вместо SqlTarotUsageRepository.
# ═══════════════════════════════════════════════════════════════════════════════

from datetime import date
from uuid import uuid4

from app.domain.entities.tarot_usage import TarotUsageEntity
from app.services.tarot_service import TarotService

TODAY = date(2026, 7, 3)


class FakeRepo:
    """In-memory реализация ITarotUsageRepository для тестов."""

    def __init__(self) -> None:
        self.rows: dict[tuple, TarotUsageEntity] = {}

    async def get(self, auth_user_id, spread_id, theme_id, usage_date):
        return self.rows.get((auth_user_id, spread_id, theme_id, usage_date))

    async def save(self, entity):
        key = (entity.auth_user_id, entity.spread_id, entity.theme_id, entity.usage_date)
        self.rows[key] = entity
        return entity


async def test_free_limited_allows_until_limit_then_blocks():
    svc = TarotService(FakeRepo())
    uid = uuid4()
    # yesno: лимит 3 в сутки
    for i in range(3):
        res = await svc.check_and_consume(
            uid, "yesno", None, is_subscribed=False, today=TODAY
        )
        assert res.allowed is True
        assert res.remaining == 2 - i
    blocked = await svc.check_and_consume(
        uid, "yesno", None, is_subscribed=False, today=TODAY
    )
    assert blocked.allowed is False
    assert blocked.reason == "limit"


async def test_subscriber_bypasses_free_limit():
    svc = TarotService(FakeRepo())
    uid = uuid4()
    res = None
    for _ in range(10):
        res = await svc.check_and_consume(
            uid, "yesno", None, is_subscribed=True, today=TODAY
        )
        assert res.allowed is True
    assert res.remaining is None  # безлимит


async def test_paid_theme_requires_subscription():
    svc = TarotService(FakeRepo())
    uid = uuid4()
    denied = await svc.check_and_consume(
        uid, "three", "shadow", is_subscribed=False, today=TODAY
    )
    assert denied.allowed is False
    assert denied.reason == "subscription"
    ok = await svc.check_and_consume(
        uid, "three", "shadow", is_subscribed=True, today=TODAY
    )
    assert ok.allowed is True


async def test_three_ppf_free_once_per_day():
    svc = TarotService(FakeRepo())
    uid = uuid4()
    first = await svc.check_and_consume(
        uid, "three", "ppf", is_subscribed=False, today=TODAY
    )
    assert first.allowed is True
    assert first.remaining == 0
    second = await svc.check_and_consume(
        uid, "three", "ppf", is_subscribed=False, today=TODAY
    )
    assert second.allowed is False
    assert second.reason == "limit"


async def test_get_limits_reports_remaining():
    svc = TarotService(FakeRepo())
    uid = uuid4()
    await svc.check_and_consume(uid, "yesno", None, is_subscribed=False, today=TODAY)
    limits = await svc.get_limits(uid, is_subscribed=False, today=TODAY)
    assert limits[("yesno", None)] == 2
    assert limits[("three", "ppf")] == 1


async def test_get_limits_unlimited_for_subscriber():
    svc = TarotService(FakeRepo())
    uid = uuid4()
    limits = await svc.get_limits(uid, is_subscribed=True, today=TODAY)
    assert limits[("yesno", None)] is None
    assert limits[("three", "ppf")] is None
