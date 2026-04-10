from fastapi import APIRouter, Body, HTTPException,status,Depends
from schemas.auth import SignupRequest
from services.services import UserService
from database.database import get_session
from typing import Dict
import logging
logger = logging.getLogger(__name__)

auth_route = APIRouter()
@auth_route.post(
    '/signup',
    response_model=Dict[str, str],
    status_code=status.HTTP_201_CREATED,
    summary="User Registration",
    description="Register a new user with email and password")
def signup(data: SignupRequest, session=Depends(get_session)) -> Dict[str, str]:
    """
       Create new user account.
       Args:
           data: User registration data
           session: Database session
       Returns:
           dict: Success message
       Raises:
           HTTPException: If user already exists
       """
    try:
        if UserService.get_by_email(session, data.email):
            logger.warning(f"Signup attempt with existing email: {data.email}")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
        user = UserService.create_user_if_not_exists(session, data.email, data.password)
        UserService.create_balance_if_not_exists(session, user)
        session.commit()
        logger.info(f"New user registered: {data.email}")
        return {"message": "User successfully registered"}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        logger.error(f"Error during signup: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )

@auth_route.post(
    '/signin',
    response_model=Dict[str, str],
    status_code=status.HTTP_201_CREATED)
def auth_signin(data: SignupRequest, session=Depends(get_session)):
    """
       Authenticate existing user.
       Args:
           form_data: User credentials
           session: Database session
       Returns:
           dict: Success message
       Raises:
           HTTPException: If authentication fails
       """
    user = UserService.get_by_email(session, data.email)
    if user is None:
        logger.warning(f"Signin attempt with non-existing email: {data.email}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User does not exist")
    if user.password != data.password:
        logger.warning(f"Failed login attempt for user: {data.email}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Wrong credentials passed")
    return {"message": "User signed in successfully"}








