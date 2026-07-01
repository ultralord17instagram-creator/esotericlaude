from typing import Protocol
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.entities.user_profile import UserProfileEntity
from app.infrastructure.sql.models.user_profile_model import UserProfileModel
from app.infrastructure.sql.mappers.user_profile_mapper import to_entity, to_model


class IUserProfileRepository(Protocol):
    async def get(self, auth_user_id: UUID) -> UserProfileEntity | None: ...
    async def upsert(self, entity: UserProfileEntity) -> UserProfileEntity: ...


class SqlUserProfileRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, auth_user_id: UUID) -> UserProfileEntity | None:
        result = await self._session.execute(
            select(UserProfileModel).where(UserProfileModel.auth_user_id == auth_user_id)
        )
        model = result.scalar_one_or_none()
        return to_entity(model) if model else None

    async def upsert(self, entity: UserProfileEntity) -> UserProfileEntity:
        existing = await self._session.execute(
            select(UserProfileModel).where(UserProfileModel.auth_user_id == entity.auth_user_id)
        )
        model = existing.scalar_one_or_none()
        if model:
            if entity.name is not None:
                model.name = entity.name
            if entity.birth_date is not None:
                model.birth_date = entity.birth_date
            if entity.gender is not None:
                model.gender = entity.gender
        else:
            model = to_model(entity)
            self._session.add(model)
        await self._session.flush()
        return to_entity(model)
