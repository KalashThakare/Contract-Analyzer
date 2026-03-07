import logging

from fastapi import APIRouter

from app.schemas.missing_clause import MissingClauseRequest, MissingClauseResponse
from app.services.missing_clause_service import MissingClauseService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/detect", response_model=MissingClauseResponse)
async def detect_missing_clauses(payload: MissingClauseRequest):
    """Identify important clauses missing from a contract."""
    service = MissingClauseService()
    return await service.detect(payload.clauses, payload.contract_type)
