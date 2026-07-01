import enum
from sqlalchemy import Column, Date, Enum, ForeignKey, VARCHAR, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
from app.infrastructure.sql.models.base import Base


class GenderEnum(str, enum.Enum):
    male = 'male'
    female = 'female'


class UserProfileModel(Base):
    __tablename__ = 'user_profiles'

    auth_user_id = Column(UUID(as_uuid=True), ForeignKey('users.auth_user_id', ondelete='CASCADE'), primary_key=True)
    name = Column(VARCHAR(128), nullable=True)
    birth_date = Column(Date, nullable=True)
    gender = Column(Enum(GenderEnum, name='gender_enum'), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text('now()'), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text('now()'), onupdate=text('now()'), nullable=False)
