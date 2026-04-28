import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

ROOT_DIR = Path(__file__).resolve().parents[2]
SRC_DIR = ROOT_DIR / "app" / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from api import create_app
from database.database import get_session
from models.models import Base, MLModelORM
import services.rm.rm as rm_module

rm_module.send_task = lambda *args, **kwargs: None


@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    session = TestingSessionLocal()
    session.add(
        MLModelORM(
            id=1,
            name="OCR",
            description="Test OCR model",
            price=10,
        )
    )
    session.commit()

    try:
        yield session
    finally:
        session.close()


@pytest.fixture(name="client")
def client_fixture(session):
    app = create_app()
    app.dependency_overrides[get_session] = lambda: session

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(name="user_credentials")
def user_credentials_fixture():
    return {
        "email": "user@test.com",
        "password": "StrongPass123!",
    }


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(client: TestClient, user_credentials: dict[str, str]):
    signup_response = client.post("/auth/signup", json=user_credentials)
    assert signup_response.status_code == 201

    signin_response = client.post(
        "/auth/signin",
        data={
            "username": user_credentials["email"],
            "password": user_credentials["password"],
        },
    )
    assert signin_response.status_code == 200
    token = signin_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}