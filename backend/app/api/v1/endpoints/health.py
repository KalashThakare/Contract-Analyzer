"""Health-check endpoint group."""

from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("", response_model=HealthResponse)
def health_check():
    """Return service liveness metadata for monitoring and smoke tests."""
    return HealthResponse(status="ok", version="0.1.0")
