
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.exc import OperationalError
from app.settings import get_settings
import logging
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)
settings = get_settings()


class Base(DeclarativeBase):
    pass


# Try to create database engine, fallback to SQLite if PostgreSQL fails
def create_database_engine():
    """Create database engine with fallback to SQLite"""
    try:
        # Try PostgreSQL first
        database_url = settings.database_url or "postgresql+psycopg://postgres:postgres@db:5432/rtrwh"
        engine = create_engine(database_url, echo=False, future=True)
        
        # Test the connection
        with engine.connect() as conn:
            from sqlalchemy import text
            conn.execute(text("SELECT 1"))
        
        logger.info("Connected to PostgreSQL database")
        return engine
        
    except Exception as e:
        logger.warning(f"PostgreSQL connection failed: {e}")
        logger.info("Falling back to SQLite database")
        
        # Fallback to SQLite
        sqlite_url = "sqlite:///./rtrwh.db"
        engine = create_engine(sqlite_url, echo=False, future=True)
        return engine


# Create engine with fallback
engine = create_database_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)



def get_db():
    """Get database session with error handling (FastAPI-compatible)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


