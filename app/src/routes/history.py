from fastapi import APIRouter, HTTPException, Depends
from database.database import get_session
from services.services import UserService, TaskService
from schemas.history import TaskHistoryItem, TransactionHistoryItem
from auth.authenticate import authenticate
from typing import List



history_route = APIRouter()
@history_route.get("/me/tasks", response_model=List[TaskHistoryItem])
def get_task_history(current_user=Depends(authenticate), session=Depends(get_session)):
    user=UserService.get_by_id(session, current_user.id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    tasks = TaskService.get_user_tasks(session, current_user.id)
    return [
        TaskHistoryItem(
            id=task.id,
            name=task.name,
            status=task.status.value,
            model_name=task.ml_model.name,
            created_at=task.created_at,
            result=task.result.output if task.result else None
        )
        for task in tasks
    ]
@history_route.get("/me/transactions", response_model=List[TransactionHistoryItem])
def get_transaction_history(current_user=Depends(authenticate), session=Depends(get_session)):
    user=UserService.get_by_id(session, current_user.id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    transactions=UserService.get_transactions(session, current_user.id)
    return [
        TransactionHistoryItem(
            id=tx.id,
            transaction_type=tx.transaction_type.value,
            amount=tx.amount,
            task_id=tx.task_id,
            created_at=tx.created_at
        )
        for tx in transactions
    ]