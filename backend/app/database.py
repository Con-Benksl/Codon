from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()


def build_engine_kwargs(database_url: str, connect_timeout_seconds: int):
    if "sqlite" in database_url:
        return {"connect_args": {"check_same_thread": False}}
    return {
        "connect_args": {"connect_timeout": connect_timeout_seconds},
        "pool_pre_ping": True,
        "pool_recycle": 1800,
    }


engine_kwargs = build_engine_kwargs(
    settings.DATABASE_URL,
    settings.DB_CONNECT_TIMEOUT_SECONDS,
)

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """依赖注入：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
