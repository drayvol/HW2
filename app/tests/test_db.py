from auth.hash_password import HashPassword
from services.services import MLModelService, TaskService, UserService

password=HashPassword().create_hash("1234567")
def test_create_user(session):
    user=UserService.create_user_if_not_exists(session=session, email="demo@demo.com",password=password)
    balance=UserService.create_balance_if_not_exists(session=session, user=user)
    session.commit()

    assert user is not None
    assert user.balance.amount == 0


def test_top_up_creates_transaction(session):
    user=UserService.create_user_if_not_exists(session=session, email="top_up@demo.com",password=password)
    UserService.create_balance_if_not_exists(session=session, user=user)
    transaction=UserService.top_up_balance(session=session, user=user, amount=25)
    session.commit()


    assert user.balance.amount == 25
    assert transaction.transaction_type.value == "top_up"
    assert transaction.amount == 25



def test_process_task_creates_result_and_charge(session):
    user=UserService.create_user_if_not_exists(session=session, email="task@demo.com",password=password)
    UserService.create_balance_if_not_exists(session=session, user=user, amount=50)
    model=MLModelService.get_by_id(session, 1)
    task=TaskService.create_task(session=session, user=user, name="test-task",ml_model=model, input_data="image-b64")
    result=TaskService.process_task(session=session, task=task, output="frac{1}/{2}")

    session.commit()
    transactions=UserService.get_transactions(session, user.id)

    assert result.output=="frac{1}/{2}"
    assert task.status.value == "completed"
    assert user.balance.amount == 40
    assert any(tx.transaction_type.value == "charge" and tx.task_id == task.id for tx in transactions)



