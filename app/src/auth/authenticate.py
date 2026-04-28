from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from auth.jwt_handler import verify_access_token
from database.database import get_session
from services.services import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/signin")


async def authenticate(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
):
    try:
        decoded_token = verify_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    email = decoded_token.get("user")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user = UserService.get_by_email(session, email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user