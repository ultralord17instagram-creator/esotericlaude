from uuid import UUID
from datetime import date
from app.repositories.user_profile_repo import IUserProfileRepository
from app.domain.entities.user_profile import UserProfileEntity


class UserProfileService:
    def __init__(self, repo: IUserProfileRepository) -> None:
        self._repo = repo

    async def get_profile(self, auth_user_id: UUID) -> UserProfileEntity | None:
        return await self._repo.get(auth_user_id)

    async def update_profile(
        self,
        auth_user_id: UUID,
        name: str | None,
        birth_date: date | None,
        gender: str | None,
    ) -> UserProfileEntity:
        entity = UserProfileEntity(
            auth_user_id=auth_user_id,
            name=name,
            birth_date=birth_date,
            gender=gender,
        )
        return await self._repo.upsert(entity)
