from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TaskHistoryItem(BaseModel):
    id: int
    name: str
    status: str
    model_name: str
    created_at: datetime
    result: Optional[str] = None

class TransactionHistoryItem(BaseModel):
    id: int
    transaction_type: str
    amount: int
    task_id: Optional[int]
    created_at: datetime