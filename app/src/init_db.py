from database.database import engine, SessionLocal
from models.models import Base
from services.services import UserService, MLModelService
from models.enums import Role
from auth.hash_password import HashPassword
hash_password = HashPassword()

def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


def init_data() -> None:
    with SessionLocal.begin() as session:
        user = UserService.create_user_if_not_exists(
            session=session,
            email="demo@example.com",
            password=hash_password.create_hash("123456"),
            role=Role.USER,
        )
        UserService.create_balance_if_not_exists(
            session=session,
            user=user,
            amount=100,
        )

        admin = UserService.create_user_if_not_exists(
            session=session,
            email="admin@example.com",
            password=hash_password.create_hash("admin123"),
            role=Role.ADMIN,
        )
        UserService.create_balance_if_not_exists(
            session=session,
            user=admin,
            amount=1000,
        )

        MLModelService.create_model_if_not_exists(
            session=session,
            name="OCR",
            description="Модель для распознавания текста с изображения",
            price=10,
        )


def init_db() -> None:
    create_tables()
    init_data()