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
    """Upload a PDF contract for analysis."""
    service = ContractService(db)
    return await service.upload(file)


@router.get("/{contract_id}/analyze", response_model=ContractAnalysisResponse)
async def analyze_contract(
    contract_id: str,
    db: Session = Depends(get_db),
):
    """Run full analysis pipeline on an uploaded contract."""
    service = ContractService(db)
    return await service.analyze(contract_id)


@router.get("/{contract_id}", response_model=ContractAnalysisResponse)
def get_contract(
    contract_id: str,
    db: Session = Depends(get_db),
):
    """Retrieve a previously analyzed contract."""
    service = ContractService(db)
    return service.get(contract_id)
