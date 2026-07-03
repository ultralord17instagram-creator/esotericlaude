from sqlalchemy import (
    TIMESTAMP,
    Column,
    Date,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID

from app.infrastructure.sql.models.base import Base


class TarotUsageModel(Base):
    __tablename__ = "tarot_usage"

    id = Column(UUID(as_uuid=True), primary_key=True)
    auth_user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    spread_id = Column(String(32), nullable=False)
    theme_id = Column(String(32), nullable=True)
    usage_date = Column(Date, nullable=False)
    count = Column(Integer, nullable=False, server_default=text("0"))
    created_at = Column(
        TIMESTAMP(timezone=True), server_default=text("now()"), nullable=False
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        server_default=text("now()"),
        onupdate=text("now()"),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "auth_user_id",
            "spread_id",
            "theme_id",
            "usage_date",
            name="uq_tarot_usage_day",
        ),
    )
