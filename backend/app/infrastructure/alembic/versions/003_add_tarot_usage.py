"""add tarot_usage table

Revision ID: 003
Revises: 002
Create Date: 2026-07-03
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tarot_usage',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('auth_user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('spread_id', sa.String(32), nullable=False),
        sa.Column('theme_id', sa.String(32), nullable=True),
        sa.Column('usage_date', sa.Date, nullable=False),
        sa.Column('count', sa.Integer, server_default=sa.text('0'), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(timezone=True), server_default=sa.text('now()'), nullable=False),
    )
    op.create_index('ix_tarot_usage_auth_user_id', 'tarot_usage', ['auth_user_id'])
    op.create_unique_constraint(
        'uq_tarot_usage_day',
        'tarot_usage',
        ['auth_user_id', 'spread_id', 'theme_id', 'usage_date'],
    )


def downgrade() -> None:
    op.drop_constraint('uq_tarot_usage_day', 'tarot_usage', type_='unique')
    op.drop_index('ix_tarot_usage_auth_user_id', table_name='tarot_usage')
    op.drop_table('tarot_usage')
