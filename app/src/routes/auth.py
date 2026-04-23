from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from services.services import UserService
from database.database import get_session
from auth.hash_password import HashPassword
from auth.jwt_handler import create_access_token
from schemas.auth import SignupRequest
from typing import Dict
import logging

logger = logging.getLogger(__name__)
auth_route = APIRouter()
hash_password = HashPassword()


@auth_route.post('/signup', response_model=Dict[str, str], status_code=status.HTTP_201_CREATED)
def signup(data: SignupRequest, session=Depends(get_session)) -> Dict[str, str]:
    try:
        if UserService.get_by_email(session, data.email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User with this email already exists")
        hashed = hash_password.create_hash(data.password)
        user = UserService.create_user_if_not_exists(session, data.email, hashed)
        UserService.create_balance_if_not_exists(session, user)
        session.commit()
        return {"message": "User successfully registered"}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error during signup: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error creating user")


@auth_route.post('/signin')
def auth_signin(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session=Depends(get_session)
):
    user = UserService.get_by_email(session, form_data.username)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist")
    if not hash_password.verify_hash(form_data.password, user.password):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Wrong credentials passed")
    token = create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer"}