from datetime import date
from uuid import UUID
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.dependencies import get_current_user, get_db_session
from app.infrastructure.clients.auth_clients import UserContext
from app.repositories.user_profile_repo import SqlUserProfileRepository
from app.services.user_profile_service import UserProfileService

router = APIRouter(prefix='/profile', tags=['profile'])


class ProfileResponse(BaseModel):
    auth_user_id: UUID
    name: str | None
    birth_date: date | None
    gender: str | None


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    birth_date: date | None = None
    gender: str | None = None


@router.get('/me', response_model=ProfileResponse)
async def get_my_profile(
    current_user: UserContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    svc = UserProfileService(SqlUserProfileRepository(session))
    profile = await svc.get_profile(current_user.user_id)
    if profile is None:
        return ProfileResponse(auth_user_id=current_user.user_id, name=None, birth_date=None, gender=None)
    return ProfileResponse(
        auth_user_id=profile.auth_user_id,
        name=profile.name,
        birth_date=profile.birth_date,
        gender=profile.gender,
    )


@router.patch('/me', response_model=ProfileResponse)
async def update_my_profile(
    body: ProfileUpdateRequest,
    current_user: UserContext = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    svc = UserProfileService(SqlUserProfileRepository(session))
    updated = await svc.update_profile(
        auth_user_id=current_user.user_id,
        name=body.name,
        birth_date=body.birth_date,
        gender=body.gender,
    )
    return ProfileResponse(
        auth_user_id=updated.auth_user_id,
        name=updated.name,
        birth_date=updated.birth_date,
        gender=updated.gender,
    )
