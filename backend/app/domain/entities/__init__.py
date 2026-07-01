# Экспорт доменных сущностей оффера.
# При добавлении новой сущности — добавь импорт сюда.
from .base import BaseEntity
from .user import UserEntity

__all__ = ["BaseEntity", "UserEntity"]
