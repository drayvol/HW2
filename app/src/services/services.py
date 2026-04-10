from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from models.enums import Role, TransactionType, TaskStatus
from models.models import (
    UserORM,
    BalanceORM,
    MLModelORM,
    TaskORM,
    TransactionORM,
    ResultORM,
)


class UserService:
    @staticmethod
    def get_by_id(session: Session, user_id: int) -> Optional[UserORM]:
        stmt = (
            select(UserORM)
            .options(
                joinedload(UserORM.balance),
                joinedload(UserORM.transactions),
                joinedload(UserORM.tasks),
            )
            .where(UserORM.id == user_id)
        )
        return session.scalar(stmt)

    @staticmethod
    def get_by_email(session: Session, email: str) -> Optional[UserORM]:
        stmt = (
            select(UserORM)
            .options(joinedload(UserORM.balance))
            .where(UserORM.email == email)
        )
        return session.scalar(stmt)

    @staticmethod
    def create_user_if_not_exists(
        session: Session,
        email: str,
        password: str,
        role: Role = Role.USER,
    ) -> UserORM:
        user = UserService.get_by_email(session, email)

        if user is None:
            user = UserORM(
                email=email,
                password=password,
                role=role,
            )
            session.add(user)
            session.flush()

        return user

    @staticmethod
    def create_balance_if_not_exists(
        session: Session,
        user: UserORM,
        amount: int = 0,
    ) -> BalanceORM:
        if user.balance is None:
            balance = BalanceORM(
                user=user,
                amount=amount,
            )
            session.add(balance)
            session.flush()
            return balance

        return user.balance

    @staticmethod
    def top_up_balance(
        session: Session,
        user: UserORM,
        amount: int,
        task: Optional[TaskORM] = None,
    ) -> TransactionORM:
        if user.balance is None:
            raise ValueError("У пользователя отсутствует баланс")

        user.balance.top_up(amount)

        transaction = TransactionORM(
            transaction_type=TransactionType.TOP_UP,
            amount=amount,
            user=user,
            task=task,
        )
        session.add(transaction)
        session.flush()
        return transaction

    @staticmethod
    def charge_balance(
        session: Session,
        user: UserORM,
        amount: int,
        task: Optional[TaskORM] = None,
    ) -> TransactionORM:
        if user.balance is None:
            raise ValueError("У пользователя отсутствует баланс")

        user.balance.charge(amount)

        transaction = TransactionORM(
            transaction_type=TransactionType.CHARGE,
            amount=amount,
            user=user,
            task=task,
        )
        session.add(transaction)
        session.flush()
        return transaction

    @staticmethod
    def get_transactions(session: Session, user_id: int) -> list[TransactionORM]:
        stmt = (
            select(TransactionORM)
            .where(TransactionORM.user_id == user_id)
            .order_by(TransactionORM.created_at.desc())
        )
        return list(session.scalars(stmt).all())


class MLModelService:
    @staticmethod
    def get_by_id(session: Session, model_id: int) -> Optional[MLModelORM]:
        return session.get(MLModelORM, model_id)

    @staticmethod
    def get_by_name(session: Session, name: str) -> Optional[MLModelORM]:
        stmt = select(MLModelORM).where(MLModelORM.name == name)
        return session.scalar(stmt)

    @staticmethod
    def create_model_if_not_exists(
        session: Session,
        name: str,
        description: str,
        price: int,
    ) -> MLModelORM:
        model = MLModelService.get_by_name(session, name)

        if model is None:
            model = MLModelORM(
                name=name,
                description=description,
                price=price,
            )
            session.add(model)
            session.flush()

        return model


class TaskService:
    @staticmethod
    def create_task(
        session: Session,
        name: str,
        user: UserORM,
        ml_model: MLModelORM,
        input_data: str,
    ) -> TaskORM:
        task = TaskORM(
            name=name,
            user=user,
            ml_model=ml_model,
            input_data=input_data,
            status=TaskStatus.PENDING,
        )
        session.add(task)
        session.flush()
        return task

    @staticmethod
    def process_task(session: Session, task: TaskORM) -> ResultORM:
        if task.status == TaskStatus.COMPLETED:
            raise ValueError("Задача уже обработана")

        if task.result is not None:
            raise ValueError("Для задачи уже существует результат")

        user = task.user
        model = task.ml_model

        try:
            UserService.charge_balance(
                session=session,
                user=user,
                amount=model.price,
                task=task,
            )

            output = f"Processed by model {model.name}"
            task.complete()

            result = ResultORM(
                task=task,
                model=model,
                output=output,
            )
            session.add(result)
            session.flush()

            return result

        except ValueError:
            task.failed()
            session.flush()
            raise

    @staticmethod
    def get_user_tasks(session: Session, user_id: int) -> list[TaskORM]:
        stmt = (
            select(TaskORM)
            .options(
                joinedload(TaskORM.ml_model),
                joinedload(TaskORM.result),
            )
            .where(TaskORM.user_id == user_id)
            .order_by(TaskORM.created_at.desc())
        )
        return list(session.scalars(stmt).all())

    @staticmethod
    def get_task_by_id(session: Session, task_id: int) -> Optional[TaskORM]:
        stmt = (
            select(TaskORM)
            .options(
                joinedload(TaskORM.user).joinedload(UserORM.balance),
                joinedload(TaskORM.ml_model),
                joinedload(TaskORM.result),
            )
            .where(TaskORM.id == task_id)
        )
        return session.scalar(stmt)