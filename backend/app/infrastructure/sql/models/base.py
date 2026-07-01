# ═══════════════════════════════════════════════════════════════════════════════
# infrastructure/sql/models/base.py — DeclarativeBase для SQLAlchemy
#
# НЕЛЬЗЯ МЕНЯТЬ: все SQLAlchemy-модели импортируют Base отсюда.
# Изменение Base ломает Alembic autogenerate.
# ═══════════════════════════════════════════════════════════════════════════════

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Базовый класс для всех SQLAlchemy-моделей оффера."""
