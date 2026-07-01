from app.domain.entities.user_profile import UserProfileEntity
from app.infrastructure.sql.models.user_profile_model import UserProfileModel


def to_entity(model: UserProfileModel) -> UserProfileEntity:
    return UserProfileEntity(
        auth_user_id=model.auth_user_id,
        name=model.name,
        birth_date=model.birth_date,
        gender=model.gender,
    )


def to_model(entity: UserProfileEntity) -> UserProfileModel:
    return UserProfileModel(
        auth_user_id=entity.auth_user_id,
        name=entity.name,
        birth_date=entity.birth_date,
        gender=entity.gender,
    )
