from pydantic import BaseModel, Field

class PredictRequest(BaseModel):
    model_id: int
    task_name: str = Field(min_length=1, max_length=256)
    input_data: str = Field(min_length=1)

class PredictResponse(BaseModel):
    task_id: int
    status: str
    model: str
    credits_charged: int
    result: str
    balance: int