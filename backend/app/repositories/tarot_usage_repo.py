from datetime import date
from typing import Protocol
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.tarot_usage import TarotUsageEntity
from app.infrastructure.sql.mappers.tarot_usage_mapper import to_entity, to_model
from app.infrastructure.sql.models.tarot_usage_model import TarotUsageModel


class ITarotUsageRepository(Protocol):
    async def get(
        self,
        auth_user_id: UUID,
        spread_id: str,
        theme_id: str | None,
        usage_date: date,
    ) -> TarotUsageEntity | None: ...

    async def save(self, entity: TarotUsageEntity) -> TarotUsageEntity: ...


class SqlTarotUsageRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _day_filter(
        self,
        auth_user_id: UUID,
        spread_id: str,
        theme_id: str | None,
        usage_date: date,
    ):
        # theme_id может быть NULL — сравнение через IS NULL, а не = NULL.
        theme_clause = (
            TarotUsageModel.theme_id.is_(None)
            if theme_id is None
            else TarotUsageModel.theme_id == theme_id
        )
        return select(TarotUsageModel).where(
            TarotUsageModel.auth_user_id == auth_user_id,
            TarotUsageModel.spread_id == spread_id,
            theme_clause,
            TarotUsageModel.usage_date == usage_date,
        )

    async def get(
        self,
        auth_user_id: UUID,
        spread_id: str,
        theme_id: str | None,
        usage_date: date,
    ) -> TarotUsageEntity | None:
        result = await self._session.execute(
            self._day_filter(auth_user_id, spread_id, theme_id, usage_date)
        )
        model = result.scalar_one_or_none()
        return to_entity(model) if model else None

    async def save(self, entity: TarotUsageEntity) -> TarotUsageEntity:
        result = await self._session.execute(
            self._day_filter(
                entity.auth_user_id,
                entity.spread_id,
                entity.theme_id,
                entity.usage_date,
            )
        )
        model = result.scalar_one_or_none()
        if model:
            model.count = entity.count
            model.updated_at = entity.updated_at
        else:
            model = to_model(entity)
            self._session.add(model)
        await self._session.flush()
        return to_entity(model)
