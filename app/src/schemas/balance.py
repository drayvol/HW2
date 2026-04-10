from pydantic import BaseModel, Field

class BalanceResponse(BaseModel):
    user_id: int
    balance: int

class TopUpRequest(BaseModel):
    amount: int = Field(gt=0)

class TopUpResponse(BaseModel):
    message: str
    user_id: int
    balance: int