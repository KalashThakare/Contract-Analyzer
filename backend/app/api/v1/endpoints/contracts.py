import logging

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.contract import (
    ContractUploadResponse,
    ContractAnalysisResponse,
)
from app.services.contract_service import ContractService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload", response_model=ContractUploadResponse)
async def upload_contract(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    service = ContractService(db)
    return await service.upload(file)


@router.get("/{contract_id}/analyze", response_model=ContractAnalysisResponse)
async def analyze_contract(
    contract_id: str,
    db: Session = Depends(get_db),
):
    service = ContractService(db)
    return await service.analyze(contract_id)


@router.post("/{contract_id}/llm-analyze-clauses", response_model=ContractAnalysisResponse)
async def analyze_contract_llm_clauses(
    contract_id: str,
    db: Session = Depends(get_db),
):
    """Phase 1: LLM clause-by-clause explanation. Returns when clause analysis done."""
    service = ContractService(db)
    return await service.llm_analyze_clauses(contract_id)


@router.post("/{contract_id}/llm-analyze-missing", response_model=ContractAnalysisResponse)
async def analyze_contract_llm_missing(
    contract_id: str,
    db: Session = Depends(get_db),
):
    """Phase 2: LLM missing-clause detection. Returns independently."""
    service = ContractService(db)
    return await service.llm_analyze_missing(contract_id)


@router.get("/{contract_id}", response_model=ContractAnalysisResponse)
def get_contract(
    contract_id: str,
    db: Session = Depends(get_db),
):
    service = ContractService(db)
    return service.get(contract_id)
