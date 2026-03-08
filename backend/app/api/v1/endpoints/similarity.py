import logging

from fastapi import APIRouter

from app.schemas.similarity import SimilarityRequest, SimilarityResponse
from app.services.similarity_service import SimilarityService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/compare", response_model=list[SimilarityResponse])
async def compare_clauses(payload: SimilarityRequest):
    service = SimilarityService()
    return await service.compare(payload.clauses, payload.template_category)
