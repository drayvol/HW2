from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    model_id: int
    task_name: str = Field(min_length=1, max_length=256)
    image_b64: str = Field(min_length=1)

class PredictResponse(BaseModel):
    task_id: int
    status: str
    model: str
    credits_charged: int
    balance: int
    message: str
class PredictResult(BaseModel):
    latex:str