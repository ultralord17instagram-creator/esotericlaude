# ═══════════════════════════════════════════════════════════════════════════════
# infrastructure/sql/mappers/user_mapper.py — маппер UserEntity ↔ UserModel
#
# МОЖНО МЕНЯТЬ: при добавлении полей в UserEntity и UserModel
#   добавляй их в оба метода (to_entity и to_model).
#
# Маппер — единственное место где доменный объект и SQLAlchemy-модель встречаются.
# Entity не знает о SQLAlchemy. Model не знает о domain.
# ═══════════════════════════════════════════════════════════════════════════════

from app.domain.entities.user import UserEntity
from app.infrastructure.sql.models.user_models import UserModel


class UserMapper:
    @staticmethod
    def to_entity(model: UserModel) -> UserEntity:
        """Преобразовать SQLAlchemy-модель → доменную сущность.

        Вызывается в репозитории после SELECT из БД.
        """
        return UserEntity(
            id=model.id,
            auth_user_id=model.auth_user_id,
            referral_code=model.referral_code,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def to_model(entity: UserEntity) -> UserModel:
        """Преобразовать доменную сущность → SQLAlchemy-модель.

        Вызывается в репозитории перед INSERT/UPDATE в БД.
        """
        return UserModel(
            id=entity.id,
            auth_user_id=entity.auth_user_id,
            referral_code=entity.referral_code,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
        )
