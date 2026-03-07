from pydantic import BaseModel


class MissingClauseRequest(BaseModel):
    clauses: list[str]
    contract_type: str = "general"


class MissingClauseResponse(BaseModel):
    contract_type: str
    missing_clauses: list[str]
    coverage_score: float
