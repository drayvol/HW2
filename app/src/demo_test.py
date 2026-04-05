from database.database import SessionLocal
from services.services import UserService, MLModelService, TaskService


def run_demo() -> None:
    with SessionLocal.begin() as session:
        user = UserService.get_by_email(session, "demo@example.com")
        model = MLModelService.get_by_name(session, "OCR")

        UserService.top_up_balance(session, user, 50)

        task = TaskService.create_task(
            session=session,
            name="demo_task",
            user=user,
            ml_model=model,
            input_data="test image data"
        )

        result = TaskService.process_task(session, task)

        print("Пользователь:", user.email)
        print("Баланс:", user.balance.amount)
        print("Результат:", result.output)

        print("Транзакции:")
        for tx in UserService.get_transactions(session, user.id):
            print(tx.transaction_type, tx.amount, tx.created_at)

        print("История задач:")
        for t in TaskService.get_user_tasks(session, user.id):
            print(t.name, t.status, t.created_at)
if __name__ == "__main__":
    run_demo()