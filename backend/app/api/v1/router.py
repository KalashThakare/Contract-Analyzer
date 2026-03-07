from fastapi import APIRouter

from app.api.v1.endpoints import (
    health,
    contracts,
    unfair_clauses,
    similarity,
    missing_clauses,
)

router = APIRouter()

router.include_router(health.router, prefix="/health", tags=["Health"])
router.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
router.include_router(unfair_clauses.router, prefix="/unfair-clauses", tags=["Unfair Clauses"])
router.include_router(similarity.router, prefix="/similarity", tags=["Similarity"])
router.include_router(missing_clauses.router, prefix="/missing-clauses", tags=["Missing Clauses"])
