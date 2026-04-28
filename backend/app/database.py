from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()

engine_kwargs = {
    "connect_args": {"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
}

if "sqlite" not in settings.DATABASE_URL:
    engine_kwargs.update(
        {
            "pool_pre_ping": True,
            "pool_recycle": 1800,
        }
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
