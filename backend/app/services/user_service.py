# ═══════════════════════════════════════════════════════════════════════════════
# services/user_service.py — бизнес-логика пользователей
#
# МОЖНО МЕНЯТЬ: добавлять методы для своей предметной области.
#   Примеры: get_user_content(), update_preferences(), block_user()
#
# Правила сервиса:
#   — не импортирует FastAPI, HTTPException, SQLAlchemy (только domain + repo)
#   — при ошибках бросает domain exceptions из domain/exceptions/__init__.py
#   — принимает IUserRepository (не конкретную реализацию) → тесты без БД
# ═══════════════════════════════════════════════════════════════════════════════

import logging
from uuid import UUID

from app.domain.entities.user import UserEntity
from app.domain.exceptions import UserNotFoundError
from app.repositories.user_repo import IUserRepository

log = logging.getLogger(__name__)


class UserService:
    """Сервис бизнес-логики для пользователей оффера.

    Принимает IUserRepository — в продакшне это SqlUserRepository,
    в тестах — in-memory mock. FastAPI инжектирует через Depends(get_user_service).
    """

    def __init__(self, user_repo: IUserRepository) -> None:
        self._users = user_repo

    async def get_or_create(
        self,
        auth_user_id: UUID,
        referral_code: str | None,
    ) -> UserEntity:
        """Получить или создать пользователя по его ID из auth_service.

        Точка входа при первом и повторных визитах пользователя на оффер.
        При первом визите — создаёт локальную запись с привязкой реф-кода.
        При повторных — возвращает существующего пользователя.

        Источник аргументов:
            auth_user_id → UserContext.user_id из request.state.user (middleware)
            referral_code → UserContext.referral_code из request.state.user

        Пример вызова в роуте:
            user = await svc.get_or_create(
                auth_user_id=user_ctx.user_id,
                referral_code=user_ctx.referral_code,
            )
        """
        existing = await self._users.get_by_auth_user_id(auth_user_id)
        if existing:
            return existing

        user = UserEntity(auth_user_id=auth_user_id, referral_code=referral_code)
        created = await self._users.save(user)
        log.info(
            "user registered | auth_user_id=%s referral_code=%s",
            auth_user_id,
            referral_code,
        )
        return created

    async def get_by_auth_user_id(self, auth_user_id: UUID) -> UserEntity:
        """Получить пользователя или поднять UserNotFoundError.

        Используй когда пользователь гарантированно должен существовать.
        Для create-if-not-exists используй get_or_create().
        """
        user = await self._users.get_by_auth_user_id(auth_user_id)
        if user is None:
            raise UserNotFoundError(auth_user_id)
        return user
