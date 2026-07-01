from dataclasses import dataclass
from datetime import date
from uuid import UUID


@dataclass
class UserProfileEntity:
    auth_user_id: UUID
    name: str | None = None
    birth_date: date | None = None
    gender: str | None = None  # 'male' | 'female'
