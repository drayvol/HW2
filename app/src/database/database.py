from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import Base
from database.config import get_settings


settings = get_settings()

engine = create_engine(settings.database_url, echo=True)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)

def get_session():
    with SessionLocal() as session:
        yield session