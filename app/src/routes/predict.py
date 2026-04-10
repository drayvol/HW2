from fastapi import APIRouter, Body, HTTPException,status,Depends
from schemas.predict import PredictRequest, PredictResponse
from services.services import UserService, MLModelService,TaskService
from database.database import get_session
from typing import Dict
import logging
logger = logging.getLogger(__name__)

predict_route = APIRouter()
@predict_route.post("/{user_id}", response_model=PredictResponse)
def predict(user_id:int, data: PredictRequest, session = Depends(get_session)):
    user=UserService.get_by_id(session,user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    model = MLModelService.get_by_id(session,data.model_id)
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    try:
        task=TaskService.create_task(
            session=session,
            name=data.task_name,
            user=user,
            ml_model=model,
            input_data=data.input_data
        )
        result =TaskService.process_task(session,task)
        session.commit()
        session.refresh(user.balance)

        return PredictResponse(
            task_id=task.id,
            status=task.status.value,
            model=model.name,
            credits_charged=model.price,
            result=result.output,
            balance=user.balance.amount
        )
    except ValueError as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        session.rollback()
        raise HTTPException(status_code=500, detail="Prediction failed")

