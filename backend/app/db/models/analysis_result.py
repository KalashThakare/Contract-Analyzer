"""SQLAlchemy model for persisted contract analysis outputs."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.base_class import Base


class AnalysisResult(Base):
    """Persists clause-level analysis payloads and aggregate risk metrics."""

    __tablename__ = "analysis_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    contract_id = Column(UUID(as_uuid=True), ForeignKey("contracts.id"), nullable=False, index=True)
    clauses_json = Column(JSONB, nullable=False)
    missing_clauses = Column(JSONB, nullable=False, default=list)
    overall_risk_score = Column(Float, default=0.0)
    analyzed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
