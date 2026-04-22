"""Legacy Pydantic models for simple route responses."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Minimal health response schema."""

    status: str
