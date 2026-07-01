# ═══════════════════════════════════════════════════════════════════════════════
# repositories/user_repo.py — репозиторий пользователей
#
# МОЖНО ДОБАВЛЯТЬ методы в IUserRepository и SqlUserRepository
#   при необходимости новых запросов к БД (например get_by_email, get_all).
#   Добавляй только те методы, которые реально вызываются в сервисах.
#
# НЕЛЬЗЯ МЕНЯТЬ сигнатуры get_by_auth_user_id и save — сервисы зависят от них.
# НЕЛЬЗЯ хранить AsyncSession как атрибут синглтона — сессия per-request.
# ═══════════════════════════════════════════════════════════════════════════════

from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.user import UserEntity
from app.infrastructure.sql.mappers.user_mapper import UserMapper
from app.infrastructure.sql.models.user_models import UserModel


class IUserRepository(Protocol):
    """Интерфейс репозитория пользователей.

    Сервис зависит от этого Protocol, не от SqlUserRepository.
    Это позволяет в тестах подставить in-memory реализацию без БД.

    При добавлении нового метода в SqlUserRepository — добавляй его сюда тоже.
    """

    async def get_by_auth_user_id(self, auth_user_id: UUID) -> UserEntity | None:
        """Найти пользователя по его ID в auth_service. None если не найден."""
        ...

    async def save(self, user: UserEntity) -> UserEntity:
        """Создать или обновить пользователя. Возвращает сохранённую entity."""
        ...


class SqlUserRepository:
    """Реализация репозитория через SQLAlchemy AsyncSession.

    Сессия передаётся в конструктор (dependency injection из api/v1/dependencies.py).
    Не хранить сессию как class-level атрибут — это ломает изоляцию транзакций.

    Каждый HTTP-запрос получает свою сессию из get_db_session() dependency.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_by_auth_user_id(self, auth_user_id: UUID) -> UserEntity | None:
        """SELECT users WHERE auth_user_id = ? LIMIT 1."""
        stmt = select(UserModel).where(UserModel.auth_user_id == auth_user_id)
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        if model is None:
            return None
        return UserMapper.to_entity(model)

    async def save(self, user: UserEntity) -> UserEntity:
        """INSERT или UPDATE пользователя по первичному ключу (id).

        merge() проверяет identity map и БД: если id существует — UPDATE,
        если нет — INSERT. Подходит для идемпотентного сохранения.
        """
        model = UserMapper.to_model(user)
        merged = await self._session.merge(model)
        await self._session.flush()
        return UserMapper.to_entity(merged)
