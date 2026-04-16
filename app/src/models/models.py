from sqlalchemy import Integer, String, func, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional, Annotated
from sqlalchemy.orm import DeclarativeBase
from models.enums import Role, TransactionType, TaskStatus

str_256 = Annotated[str, 256]
intpk = Annotated[int, mapped_column(Integer, primary_key=True, autoincrement=True)]


class Base(DeclarativeBase):
    type_annotation_map = {
        str_256: String(256)
    }


class UserORM(Base):
    __tablename__ = "user"

    id: Mapped[intpk]
    email: Mapped[str_256] = mapped_column(unique=True, nullable=False)
    password: Mapped[str_256] = mapped_column(nullable=False)
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.USER, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    balance: Mapped["BalanceORM"] = relationship(
        back_populates="user",
        uselist=False
    )
    tasks: Mapped[list["TaskORM"]] = relationship(
        back_populates="user"
    )
    transactions: Mapped[list["TransactionORM"]] = relationship(
        back_populates="user"
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"


class BalanceORM(Base):
    __tablename__ = "balance"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        primary_key=True
    )
    amount: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    user: Mapped["UserORM"] = relationship(
        back_populates="balance"
    )

    def top_up(self, amount: int) -> None:
        if amount <= 0:
            raise ValueError("Сумма пополнения должна быть положительной")
        self.amount += amount

    def charge(self, amount: int) -> None:
        if amount <= 0:
            raise ValueError("Сумма списания должна быть положительной")
        if amount > self.amount:
            raise ValueError("Недостаточно средств на балансе")
        self.amount -= amount

    def __repr__(self) -> str:
        return f"<Balance user_id={self.user_id} amount={self.amount}>"


class MLModelORM(Base):
    __tablename__ = "ml_models"

    id: Mapped[intpk]
    name: Mapped[str_256] = mapped_column(unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)

    tasks: Mapped[list["TaskORM"]] = relationship(
        back_populates="ml_model",
    )

    def __repr__(self) -> str:
        return f"<MLModel id={self.id} name={self.name}>"


class TaskORM(Base):
    __tablename__ = "tasks"

    id: Mapped[intpk]
    name: Mapped[str_256] = mapped_column(nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    model_id: Mapped[int] = mapped_column(ForeignKey("ml_models.id", ondelete="RESTRICT"))
    input_data: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.PENDING, nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    user: Mapped["UserORM"] = relationship(
        back_populates="tasks"
    )
    ml_model: Mapped["MLModelORM"] = relationship(
        back_populates="tasks"
    )
    result: Mapped[Optional["ResultORM"]] = relationship(
        back_populates="task",
        uselist=False
    )
    transactions: Mapped[list["TransactionORM"]] = relationship(
        back_populates="task"
    )

    def complete(self) -> None:
        self.status = TaskStatus.COMPLETED

    def failed(self) -> None:
        self.status = TaskStatus.FAILED

    def __repr__(self) -> str:
        return f"<Task id={self.id} name={self.name} status={self.status}>"


class TransactionORM(Base):
    __tablename__ = "transaction"

    id: Mapped[intpk]
    transaction_type: Mapped[TransactionType] = mapped_column(Enum(TransactionType), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    task_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    user: Mapped["UserORM"] = relationship(
        back_populates="transactions"
    )
    task: Mapped[Optional["TaskORM"]] = relationship(
        back_populates="transactions"
    )


class ResultORM(Base):
    __tablename__ = "result"

    id: Mapped[intpk]
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        unique=True
    )
    model_id: Mapped[int] = mapped_column(
        ForeignKey("ml_models.id", ondelete="RESTRICT"),
        nullable=False
    )
    output: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    task: Mapped["TaskORM"] = relationship(
        back_populates="result"
    )
    model: Mapped["MLModelORM"] = relationship()

    def __repr__(self) -> str:
        return f"<Result id={self.id} task_id={self.task_id}>"