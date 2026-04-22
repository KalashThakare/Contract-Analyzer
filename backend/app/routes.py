"""Legacy lightweight router kept for compatibility/testing."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health_check():
    """Return a minimal health response used by legacy routes."""
    return {"status": "ok"}
