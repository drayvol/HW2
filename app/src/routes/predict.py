import base64
from fastapi import APIRouter, HTTPException,status,Depends, UploadFile, File, Form
from schemas.predict import PredictResponse,PredictResult
from services.services import UserService, MLModelService,TaskService
from database.database import get_session
from services.rm.rm import send_task
from auth.authenticate import authenticate

import logging
logger = logging.getLogger(__name__)

predict_route = APIRouter()
@predict_route.post("/me", response_model=PredictResponse)
async def predict(model_id:int = Form(...), task_name:str = Form(...), image:UploadFile=File(...), current_user=Depends(authenticate), session = Depends(get_session)):
    user=UserService.get_by_id(session,current_user.id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    model = MLModelService.get_by_id(session,model_id)
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found"
        )
    if user.balance is None or user.balance.amount < model.price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance"
        )
    try:
        image_bytes = await image.read()
        image_b64 = base64.b64encode(image_bytes).decode("utf-8")
        task=TaskService.create_task(
            session=session,
            name=task_name,
            user=user,
            ml_model=model,
            input_data=image_b64
        )
        send_task(task_id=task.id, user_id=user.id,image_b64=image_b64)
        session.commit()
        session.refresh(user.balance)

        return PredictResponse(
            task_id=task.id,
            status=task.status.value,
            model=model.name,
            credits_charged=model.price,
            balance=user.balance.amount,
            message="Task accepted"
        )
    except ValueError as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        session.rollback()
        logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed")

@predict_route.post("/{task_id}/result")
def result(task_id: int, data: PredictResult, session = Depends(get_session)):
    task=TaskService.get_task_by_id(session,task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    try:
        TaskService.process_task(session,task,data.latex)
        session.commit()
        return {"message": "Result saved"}
    except ValueError as e:
        session.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@predict_route.get("/{task_id}/result")
def get_result(task_id: int, current_user=Depends(authenticate), session=Depends(get_session)):
    task = TaskService.get_task_by_id(session, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return {
        "status": task.status.value,
        "result": task.result.output if task.result else None
    }


