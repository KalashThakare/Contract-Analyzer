"""Schemas for unfair-clause detection APIs."""

from pydantic import BaseModel


class UnfairClauseRequest(BaseModel):
    """Input payload containing clauses to classify for fairness."""

    clauses: list[str]


class UnfairClauseResponse(BaseModel):
    """Output payload for an unfair-clause classification result."""

    clause: str
    is_unfair: bool
    confidence: float
    explanation: str | None = None
