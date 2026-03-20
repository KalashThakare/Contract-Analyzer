from datetime import datetime
from typing import Any

from pydantic import BaseModel, computed_field


class ContractUploadResponse(BaseModel):
    contract_id: str
    filename: str
    page_count: int
    clause_count: int
    uploaded_at: datetime


class EntityDetail(BaseModel):
    text: str
    label: str       # PARTY, DATE, AMOUNT, TERM, JURISDICTION
    confidence: float


class ClauseDetail(BaseModel):
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
        if self.risk_score is None:
            return None
        if self.risk_score >= 70:
            return "HIGH"
        elif self.risk_score >= 40:
            return "MEDIUM"
        return "LOW"


class ContractAnalysisResponse(BaseModel):
    contract_id: str
    filename: str
    clauses: list[ClauseDetail]
    missing_clauses: list[Any] = []
    overall_risk_score: float
    analyzed_at: datetime
