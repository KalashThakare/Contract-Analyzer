"""Health endpoint response schema."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Service health metadata."""

    status: str
    version: str
