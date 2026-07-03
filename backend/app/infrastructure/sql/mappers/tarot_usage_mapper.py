from app.domain.entities.tarot_usage import TarotUsageEntity
from app.infrastructure.sql.models.tarot_usage_model import TarotUsageModel


def to_entity(model: TarotUsageModel) -> TarotUsageEntity:
    return TarotUsageEntity(
        id=model.id,
        auth_user_id=model.auth_user_id,
        spread_id=model.spread_id,
        theme_id=model.theme_id,
        usage_date=model.usage_date,
        count=model.count,
        created_at=model.created_at,
        updated_at=model.updated_at,
    )


def to_model(entity: TarotUsageEntity) -> TarotUsageModel:
    return TarotUsageModel(
        id=entity.id,
        auth_user_id=entity.auth_user_id,
        spread_id=entity.spread_id,
        theme_id=entity.theme_id,
        usage_date=entity.usage_date,
        count=entity.count,
        created_at=entity.created_at,
        updated_at=entity.updated_at,
    )
