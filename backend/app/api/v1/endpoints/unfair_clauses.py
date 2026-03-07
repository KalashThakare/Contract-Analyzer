import logging

from fastapi import APIRouter

from app.schemas.unfair_clause import UnfairClauseRequest, UnfairClauseResponse
from app.services.unfair_clause_service import UnfairClauseService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/detect", response_model=list[UnfairClauseResponse])
async def detect_unfair_clauses(payload: UnfairClauseRequest):
    """Detect potentially unfair clauses in the given text."""
    service = UnfairClauseService()
    return await service.detect(payload.clauses)
