from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator, Optional
import redis
from .config import settings

# Database Engine configuration
if "sqlite" in settings.DATABASE_URL:
    # SQLite configuration
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL configuration
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10
    )

# Session Factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base Model Class
Base = declarative_base()

# Redis Connection (optional)
redis_client: Optional[redis.Redis] = None
try:
    redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
    # Test connection
    redis_client.ping()
    print("✅ Redis connected successfully")
except Exception as e:
    print(f"⚠️  Redis not available: {e}")
    redis_client = None

# Database Dependency
def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency for FastAPI endpoints
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Redis Dependency
def get_redis():
    """
    Redis client dependency (returns None if Redis not available)
    """
    return redis_client

# Database utilities
def create_tables():
    """
    Create all database tables
    """
    Base.metadata.create_all(bind=engine)

def drop_tables():
    """
    Drop all database tables (use with caution!)
    """
    Base.metadata.drop_all(bind=engine) 