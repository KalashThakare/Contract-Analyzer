from pydantic import BaseModel


class UnfairClauseRequest(BaseModel):
    clauses: list[str]


class UnfairClauseResponse(BaseModel):
    clause: str
    is_unfair: bool
    confidence: float
    explanation: str | None = None
