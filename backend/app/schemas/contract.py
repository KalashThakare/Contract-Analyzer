from datetime import datetime

from pydantic import BaseModel


class ContractUploadResponse(BaseModel):
    contract_id: str
    filename: str
    page_count: int
    clause_count: int
    uploaded_at: datetime


class ClauseDetail(BaseModel):
    index: int
    text: str
    clause_type: str | None = None
    is_unfair: bool | None = None
    unfair_confidence: float | None = None
    risk_score: float | None = None
    similarity_score: float | None = None
    matched_template: str | None = None


class ContractAnalysisResponse(BaseModel):
    contract_id: str
    filename: str
    clauses: list[ClauseDetail]
    missing_clauses: list[str]
    overall_risk_score: float
    analyzed_at: datetime
