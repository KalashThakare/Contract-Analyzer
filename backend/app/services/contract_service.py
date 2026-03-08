import logging
from datetime import datetime, timezone

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import ContractNotFoundError, PDFProcessingError
from app.db.models.contract import Contract
from app.db.models.analysis_result import AnalysisResult
from app.schemas.contract import (
    ContractUploadResponse,
    ContractAnalysisResponse,
    ClauseDetail,
)
from app.services.pdf_processor import PDFProcessor
from app.services.unfair_clause_service import UnfairClauseService
from app.services.similarity_service import SimilarityService
from app.services.missing_clause_service import MissingClauseService

logger = logging.getLogger(__name__)
settings = get_settings()


class ContractService:
    def __init__(self, db: Session):
        self.db = db

    async def upload(self, file: UploadFile) -> ContractUploadResponse:
        if not file.filename or not file.filename.lower().endswith(".pdf"):
            raise PDFProcessingError("Only PDF files are accepted")

        content = await file.read()
        if len(content) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
            raise PDFProcessingError(
                f"File exceeds maximum size of {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        processor = PDFProcessor()
        raw_text, page_count = processor.extract_text(content)
        clauses = processor.segment_clauses(raw_text)

        contract = Contract(
            filename=file.filename,
            raw_text=raw_text,
            page_count=page_count,
            clause_count=len(clauses),
        )
        self.db.add(contract)
        self.db.commit()
        self.db.refresh(contract)

        logger.info("Contract uploaded: %s (%s)", contract.id, file.filename)
        return ContractUploadResponse(
            contract_id=str(contract.id),
            filename=contract.filename,
            page_count=contract.page_count,
            clause_count=contract.clause_count,
            uploaded_at=contract.uploaded_at,
        )

    async def analyze(self, contract_id: str) -> ContractAnalysisResponse:
        contract = self.db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            raise ContractNotFoundError(contract_id)

        contract_raw_text = contract.raw_text
        contract_filename = contract.filename
        self.db.expunge(contract)
        self.db.close()

        processor = PDFProcessor()
        clauses_text = processor.segment_clauses(contract_raw_text)

        unfair_svc = UnfairClauseService()
        similarity_svc = SimilarityService()
        missing_svc = MissingClauseService()

        from app.ml.risk_scorer import RiskScorer
        from app.ml.clause_classifier import ClauseClassifier

        risk_scorer = RiskScorer()
        clause_clf = ClauseClassifier()

        unfair_results = await unfair_svc.detect(clauses_text)
        similarity_results = await similarity_svc.compare(clauses_text)
        missing_result = await missing_svc.detect(clauses_text)

        clause_details: list[ClauseDetail] = []
        for i, text in enumerate(clauses_text):
            clause_type, clf_confidence = clause_clf.predict(text)
            risk_score = risk_scorer.score(text)

            clause_details.append(
                ClauseDetail(
                    index=i,
                    text=text,
                    clause_type=clause_type,
                    risk_score=risk_score,
                    is_unfair=unfair_results[i].is_unfair if i < len(unfair_results) else None,
                    unfair_confidence=unfair_results[i].confidence if i < len(unfair_results) else None,
                    similarity_score=similarity_results[i].similarity_score if i < len(similarity_results) else None,
                    matched_template=similarity_results[i].most_similar_template if i < len(similarity_results) else None,
                )
            )

        overall_risk = round(
            sum(c.risk_score for c in clause_details if c.risk_score is not None)
            / max(len(clause_details), 1),
            2,
        )

        from app.db.session import SessionLocal
        db = SessionLocal()
        try:
            analysis = AnalysisResult(
                contract_id=contract_id,
                clauses_json=[c.model_dump() for c in clause_details],
                missing_clauses=missing_result.missing_clauses,
                overall_risk_score=overall_risk,
            )
            db.add(analysis)
            db.commit()
            db.refresh(analysis)
            analyzed_at = analysis.analyzed_at
        finally:
            db.close()

        logger.info("Analysis complete for contract %s", contract_id)
        return ContractAnalysisResponse(
            contract_id=str(contract_id),
            filename=contract_filename,
            clauses=clause_details,
            missing_clauses=missing_result.missing_clauses,
            overall_risk_score=overall_risk,
            analyzed_at=analyzed_at,
        )

    def get(self, contract_id: str) -> ContractAnalysisResponse:
        contract = self.db.query(Contract).filter(Contract.id == contract_id).first()
        if not contract:
            raise ContractNotFoundError(contract_id)

        analysis = (
            self.db.query(AnalysisResult)
            .filter(AnalysisResult.contract_id == contract_id)
            .order_by(AnalysisResult.analyzed_at.desc())
            .first()
        )
        if not analysis:
            raise ContractNotFoundError(contract_id)

        clauses = [ClauseDetail(**c) for c in analysis.clauses_json]
        return ContractAnalysisResponse(
            contract_id=str(contract_id),
            filename=contract.filename,
            clauses=clauses,
            missing_clauses=analysis.missing_clauses,
            overall_risk_score=analysis.overall_risk_score,
            analyzed_at=analysis.analyzed_at,
        )
