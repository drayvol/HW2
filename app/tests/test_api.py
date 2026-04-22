from fastapi.testclient import TestClient
import io

def _make_image():
    png = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
        b'\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00'
        b'\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18'
        b'\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    return io.BytesIO(png)


def test_healthcheck(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_signup_signin_repeat_signin_and_profile(client: TestClient):
    credentials = {
        "email": "api-user@test.com",
        "password": "StrongPass123!",
    }

    signup_response = client.post("/auth/signup", json=credentials)
    assert signup_response.status_code == 201
    assert signup_response.json() == {"message": "User successfully registered"}

    signin_response = client.post(
        "/auth/signin",
        data={"username": credentials["email"], "password": credentials["password"]},
    )
    assert signin_response.status_code == 200
    token = signin_response.json()["access_token"]

    repeat_signin_response = client.post(
        "/auth/signin",
        data={"username": credentials["email"], "password": credentials["password"]},
    )
    assert repeat_signin_response.status_code == 200

    profile_response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert profile_response.status_code == 200
    assert profile_response.json()["email"] == credentials["email"]


def test_signup_and_signin_error_handling(client: TestClient):
    credentials = {
        "email": "duplicate@test.com",
        "password": "StrongPass123!",
    }

    first_signup = client.post("/auth/signup", json=credentials)
    assert first_signup.status_code == 201

    duplicate_signup = client.post("/auth/signup", json=credentials)
    assert duplicate_signup.status_code == 409
    assert duplicate_signup.json()["error"]["message"] == "User with this email already exists"

    wrong_password = client.post(
        "/auth/signin",
        data={"username": credentials["email"], "password": "WrongPass123!"},
    )
    assert wrong_password.status_code == 403
    assert wrong_password.json()["error"]["message"] == "Wrong credentials passed"

    missing_user = client.post(
        "/auth/signin",
        data={"username": "missing@test.com", "password": "StrongPass123!"},
    )
    assert missing_user.status_code == 404
    assert missing_user.json()["error"]["message"] == "User does not exist"


def test_balance_flow(client: TestClient, auth_headers: dict[str, str]):
    initial_balance = client.get("/balance/me", headers=auth_headers)
    assert initial_balance.status_code == 200
    assert initial_balance.json()["balance"] == 0

    invalid_top_up = client.post("/balance/me/top-up", json={"amount": 0}, headers=auth_headers)
    assert invalid_top_up.status_code == 422

    top_up_response = client.post("/balance/me/top-up", json={"amount": 50}, headers=auth_headers)
    assert top_up_response.status_code == 200
    assert top_up_response.json()["balance"] == 50

    updated_balance = client.get("/balance/me", headers=auth_headers)
    assert updated_balance.status_code == 200
    assert updated_balance.json()["balance"] == 50


def test_predict_requires_sufficient_balance(client: TestClient, auth_headers: dict[str, str]):
    response = client.post(
        "/predict/me",
        data={"model_id": "1", "task_name": "need-balance"},
        files={"image": ("formula.png", _make_image(), "image/png")},
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["error"]["message"] == "Insufficient balance"


def test_predict_success_charges_only_after_result_saved(client: TestClient, auth_headers: dict[str, str]):
    top_up_response = client.post("/balance/me/top-up", json={"amount": 50}, headers=auth_headers)
    assert top_up_response.status_code == 200

    predict_response = client.post(
        "/predict/me",
        data={"model_id": "1", "task_name": "ocr-task"},
        files={"image": ("formula.png", _make_image(), "image/png")},
        headers=auth_headers,
    )

    assert predict_response.status_code == 200
    predict_payload = predict_response.json()
    assert predict_payload["status"] == "pending"
    assert predict_payload["balance"] == 50

    balance_before_result = client.get("/balance/me", headers=auth_headers)
    assert balance_before_result.status_code == 200
    assert balance_before_result.json()["balance"] == 50

    save_result_response = client.post(
        f"/predict/{predict_payload['task_id']}/result",
        json={"latex": "x^2 + y^2 = z^2"},
    )
    assert save_result_response.status_code == 200

    result_response = client.get(f"/predict/{predict_payload['task_id']}/result", headers=auth_headers)
    assert result_response.status_code == 200
    assert result_response.json()["status"] == "completed"
    assert result_response.json()["result"] == "x^2 + y^2 = z^2"

    balance_after_result = client.get("/balance/me", headers=auth_headers)
    assert balance_after_result.status_code == 200
    assert balance_after_result.json()["balance"] == 40


def test_predict_invalid_input_does_not_charge_balance(client: TestClient, auth_headers: dict[str, str]):
    top_up_response = client.post("/balance/me/top-up", json={"amount": 50}, headers=auth_headers)
    assert top_up_response.status_code == 200

    invalid_model_response = client.post(
        "/predict/me",
        data={"model_id": "999", "task_name": "invalid-model"},
        files={"image": ("formula.png", b"fake-image-content", "image/png")},
        headers=auth_headers,
    )
    assert invalid_model_response.status_code == 404
    assert invalid_model_response.json()["error"]["message"] == "Model not found"

    balance_response = client.get("/balance/me", headers=auth_headers)
    assert balance_response.status_code == 200
    assert balance_response.json()["balance"] == 50


def test_history_contains_transactions_and_tasks(client: TestClient, auth_headers: dict[str, str]):
    client.post("/balance/me/top-up", json={"amount": 50}, headers=auth_headers)

    predict_response = client.post(
        "/predict/me",
        data={"model_id": "1", "task_name": "history-task"},
        files={"image": ("formula.png", _make_image(), "image/png")},
        headers=auth_headers,
    )

    assert predict_response.status_code == 200
    task_id = predict_response.json()["task_id"]

    client.post(
        f"/predict/{task_id}/result",
        json={"latex": "\\frac{a}{b}"},
    )

    transactions_response = client.get("/history/me/transactions", headers=auth_headers)
    assert transactions_response.status_code == 200
    transactions = transactions_response.json()
    assert any(tx["transaction_type"] == "top_up" and tx["amount"] == 50 for tx in transactions)
    assert any(tx["transaction_type"] == "charge" and tx["task_id"] == task_id and tx["amount"] == 10 for tx in transactions)

    tasks_response = client.get("/history/me/tasks", headers=auth_headers)
    assert tasks_response.status_code == 200
    tasks = tasks_response.json()
    assert any(task["id"] == task_id and task["status"] == "completed" for task in tasks)
