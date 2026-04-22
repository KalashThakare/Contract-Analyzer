"""Reusable FastAPI dependency providers for API endpoints."""

from typing import Generator

from sqlalchemy.orm import Session

from app.db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Yield a database session per request and ensure it is always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
