"""add user_profiles table

Revision ID: 002
Revises: 001
Create Date: 2026-06-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user_profiles',
        sa.Column('auth_user_id', UUID(as_uuid=True), sa.ForeignKey('users.auth_user_id', ondelete='CASCADE'), primary_key=True),
        sa.Column('name', sa.VARCHAR(128), nullable=True),
        sa.Column('birth_date', sa.DATE, nullable=True),
        sa.Column('gender', sa.Enum('male', 'female', name='gender_enum'), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('user_profiles')
    op.execute("DROP TYPE IF EXISTS gender_enum")
