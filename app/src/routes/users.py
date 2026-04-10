from fastapi import APIRouter, Body, HTTPException,status,Depends
from schemas.user import UserResponse
from services.services import UserService
from database.database import get_session



users_route= APIRouter()
@users_route.get(
"/{user_id}",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get user by id",
    description="Returns basic information about a user"
)
def get_user(user_id: int, session=Depends(get_session)) -> UserResponse:
    user = UserService.get_by_id(session, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
            )
    return UserResponse(
        id=user.id,
        email=user.email,
        role=user.role.value,
        created_at=user.created_at
    )


