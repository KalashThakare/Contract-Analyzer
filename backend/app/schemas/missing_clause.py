"""Schemas for missing-clause detection APIs."""

from pydantic import BaseModel


class MissingClauseRequest(BaseModel):
    """Input payload containing clauses and the contract type context."""

    clauses: list[str]
    contract_type: str = "general"


class MissingClauseResponse(BaseModel):
    """Output payload listing missing clauses and expected-clause coverage."""

    contract_type: str
    missing_clauses: list[str]
    coverage_score: float
