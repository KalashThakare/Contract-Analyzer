"""Pydantic schemas for contract upload and analysis responses."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, computed_field


class ContractUploadResponse(BaseModel):
    """Response payload returned after successful PDF upload."""

    contract_id: str
    filename: str
    page_count: int
    clause_count: int
    uploaded_at: datetime


class EntityDetail(BaseModel):
    """Named-entity detail extracted from a clause."""

    text: str
    label: str       # PARTY, DATE, AMOUNT, TERM, JURISDICTION
    confidence: float


class ClauseDetail(BaseModel):
    """Normalized per-clause analysis output consumed by the frontend."""

    index: int
    text: str
    clause_type: str | None = None
    classification_confidence: float | None = None
    is_unfair: bool | None = None
    unfair_confidence: float | None = None
    risk_score: float | None = None
    similarity_score: float | None = None
    matched_template: str | None = None
    explanation: str | None = None
    top_risk_terms: list[str] = []
    recommendation: str | None = None
    ai_source: str | None = None
    entities: list[EntityDetail] = []

    @computed_field
    @property
    def risk_level(self) -> str | None:
        """Derive a human-readable risk band from numeric risk_score."""
        if self.risk_score is None:
            return None
        if self.risk_score >= 70:
            return "HIGH"
        elif self.risk_score >= 40:
            return "MEDIUM"
        return "LOW"


class ContractAnalysisResponse(BaseModel):
    """Full analysis response for a contract and its clause-level outputs."""

    contract_id: str
    filename: str
    clauses: list[ClauseDetail]
    missing_clauses: list[Any] = []
    overall_risk_score: float
    analyzed_at: datetime
