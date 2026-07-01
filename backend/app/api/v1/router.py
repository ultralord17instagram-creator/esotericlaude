# ═══════════════════════════════════════════════════════════════════════════════
# api/v1/router.py — агрегатор всех APIRouter
#
# МОЖНО МЕНЯТЬ: добавлять include_router() для своих роутеров.
#
# Пример добавления нового роутера:
#   from app.api.v1.routes.content import router as content_router
#   router.include_router(content_router)
# ═══════════════════════════════════════════════════════════════════════════════

from fastapi import APIRouter

from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.subscriptions import router as subscriptions_router
from app.api.v1.routes.users import router as users_router

router = APIRouter()

# Базовые роуты шаблона — не удалять
router.include_router(auth_router)
router.include_router(subscriptions_router)
router.include_router(users_router)

# ── Добавляй свои роутеры ниже ───────────────────────────────────────────────
from app.api.v1.routes.profile import router as profile_router
router.include_router(profile_router)
