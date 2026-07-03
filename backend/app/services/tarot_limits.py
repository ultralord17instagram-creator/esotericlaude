# ═══════════════════════════════════════════════════════════════════════════════
# services/tarot_limits.py — источник правды о суточных лимитах Таро (бэкенд)
#
# Числовые лимиты дублируют frontend-конфиг SPREADS (осознанно, см. дизайн §8.4).
# При изменении лимитов синхронизировать ВРУЧНУЮ с:
#   frontend/app/content/tarot/spreads.js
# ═══════════════════════════════════════════════════════════════════════════════

from __future__ import annotations

from datetime import date, datetime
from zoneinfo import ZoneInfo

# Часовой пояс проекта — граница суток для лимитов и «карты дня».
PROJECT_TZ = ZoneInfo("Europe/Moscow")

# Бесплатные сценарии/темы с суточным лимитом.
# Ключ: (spread_id, theme_id | None). Значение: суточный бесплатный лимит.
TAROT_LIMITS: dict[tuple[str, str | None], int] = {
    ("three", "ppf"): 1,
    ("yesno", None): 3,
}

# Платные темы: доступ по подписке, суточного лимита нет.
PAID_KEYS: set[tuple[str, str | None]] = {
    ("three", "shadow"),
    ("three", "purpose"),
    ("three", "partner"),
    ("three", "ancestral"),
}


def project_today(now: datetime | None = None) -> date:
    """Текущая дата в TZ проекта — граница суток для лимитов и «карты дня»."""
    moment = now.astimezone(PROJECT_TZ) if now else datetime.now(PROJECT_TZ)
    return moment.date()
