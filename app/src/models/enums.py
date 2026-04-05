from enum import Enum

class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"
    
    
class TransactionType(str, Enum):
    CHARGE = "charge"
    TOP_UP = "top_up"


class TaskStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"