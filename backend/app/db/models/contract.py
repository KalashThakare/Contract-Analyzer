"""SQLAlchemy model representing an uploaded contract document."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID

from app.db.base_class import Base


class Contract(Base):
    """Stores the raw uploaded contract text and basic file metadata."""

    __tablename__ = "contracts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=False)
    page_count = Column(Integer, default=0)
    clause_count = Column(Integer, default=0)
    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
