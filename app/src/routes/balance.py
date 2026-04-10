from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from database.database import get_session
from services.services import UserService
from schemas.balance import BalanceResponse, TopUpRequest, TopUpResponse

balance_route = APIRouter()

@balance_route.get("/{user_id}", response_model=BalanceResponse)
def get_balance(user_id: int, session: Session = Depends(get_session)):
    user = UserService.get_by_id(session, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.balance is None:
        raise HTTPException(status_code=404, detail="Balance not found")

    return BalanceResponse(user_id=user.id, balance=user.balance.amount)

@balance_route.post("/{user_id}/top-up", response_model=TopUpResponse)
def top_up_balance(user_id: int, data: TopUpRequest, session: Session = Depends(get_session)):
    user = UserService.get_by_id(session, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        UserService.top_up_balance(session, user, data.amount)
        session.commit()
        session.refresh(user.balance)
        return TopUpResponse(
            message="Balance topped up successfully",
            user_id=user.id,
            balance=user.balance.amount
        )
    except ValueError as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        session.rollback()
        raise HTTPException(status_code=500, detail="Internal server error")