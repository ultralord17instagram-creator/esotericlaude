"""initial: create users table

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

НЕЛЬЗЯ МЕНЯТЬ: начальная миграция создаёт базовую схему.
Свои изменения добавляй новыми ревизиями:
    alembic revision --autogenerate -m "описание изменения"
"""

import sqlalchemy as sa
from alembic import op

# revision identifiers
revision: str = "001"
down_revision: str | None = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("auth_user_id", sa.Uuid(), nullable=False),
        sa.Column("referral_code", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("auth_user_id"),
    )
    op.create_index("ix_users_auth_user_id", "users", ["auth_user_id"])


def downgrade() -> None:
    op.drop_index("ix_users_auth_user_id", table_name="users")
    op.drop_table("users")
