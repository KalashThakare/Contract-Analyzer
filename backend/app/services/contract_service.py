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
    EntityDetail,
)
from app.services.pdf_processor import PDFProcessor
from app.services.unfair_clause_service import UnfairClauseService
from app.services.similarity_service import SimilarityService
from app.services.missing_clause_service import MissingClauseService
from app.services.llm_analysis_service import LLMAnalysisService
from app.ml.ner_extractor import extract_entities
from app.ml.multitask_predictor import MultiTaskPredictor

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
        multitask = MultiTaskPredictor(settings.HF_MULTITASK_REPO_ID)

        unfair_results = await unfair_svc.detect(clauses_text)
        similarity_results = await similarity_svc.compare(clauses_text)
        missing_result = await missing_svc.detect(clauses_text)

        clause_details: list[ClauseDetail] = []
        llm_clause_inputs: list[dict] = []
        source_counts = {"multitask": 0, "fallback": 0, "empty": 0}
        for i, text in enumerate(clauses_text):
            # Step 1: Multi-task model first (classification + risk) — fast
            mt_result = multitask.predict(text)
            source = mt_result.get("source", "multitask")
            if source in source_counts:
                source_counts[source] += 1
            clause_type = mt_result["clause_type"]
            classification_confidence = mt_result.get("confidence")
            risk_score = mt_result["risk_score"]
            risk_level = mt_result.get("risk_level", "LOW")

            # Step 2: NER — skip on LOW risk to save time (NER is expensive)
            entities: list[EntityDetail] = []
            if risk_level in {"HIGH", "MEDIUM"}:
                raw_entities = extract_entities(text, settings.NER_MODEL)
                entities = [
                    EntityDetail(text=e["text"], label=e["label"], confidence=e["confidence"])
                    for e in raw_entities
                ]

            clause_details.append(
                ClauseDetail(
                    index=i,
                    text=text,
                    clause_type=clause_type,
                    classification_confidence=classification_confidence,
                    risk_score=risk_score,
                    is_unfair=unfair_results[i].is_unfair if i < len(unfair_results) else None,
                    unfair_confidence=unfair_results[i].confidence if i < len(unfair_results) else None,
                    similarity_score=similarity_results[i].similarity_score if i < len(similarity_results) else None,
                    matched_template=similarity_results[i].most_similar_template if i < len(similarity_results) else None,
                    explanation=None,
                    top_risk_terms=[],
                    recommendation=None,
                    ai_source=source,
                    entities=entities,
                )
            )

            llm_clause_inputs.append(
                {
                    "index": i,
                    "text": text,
                    "clause_type": clause_type,
                    "classification_confidence": classification_confidence,
                    "risk_score": risk_score,
                    "risk_level": mt_result.get("risk_level"),
                    "is_unfair": unfair_results[i].is_unfair if i < len(unfair_results) else None,
                    "unfair_confidence": unfair_results[i].confidence if i < len(unfair_results) else None,
                    "similarity_score": similarity_results[i].similarity_score if i < len(similarity_results) else None,
                    "matched_template": similarity_results[i].most_similar_template if i < len(similarity_results) else None,
                    "entities": [e.model_dump() for e in entities],
                }
            )

        overall_risk = round(
            sum(c.risk_score for c in clause_details if c.risk_score is not None)
            / max(len(clause_details), 1),
            2,
        )

        logger.info(
            "Model source usage for contract %s: multitask=%d fallback=%d empty=%d",
            contract_id,
            source_counts["multitask"],
            source_counts["fallback"],
            source_counts["empty"],
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

    async def llm_analyze_clauses(self, contract_id: str) -> ContractAnalysisResponse:
        """Phase 1: Run LLM clause-by-clause analysis only. Returns immediately when done."""
        # ── Read & close DB immediately (LLM calls can take 8+ min) ───────────
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

        analysis_id       = analysis.id
        contract_filename = contract.filename
        clauses_json_snap = list(analysis.clauses_json)
        missing_snap      = list(analysis.missing_clauses or [])
        overall_risk      = analysis.overall_risk_score
        analyzed_at       = analysis.analyzed_at
        self.db.close()

        clause_details = [ClauseDetail(**c) for c in clauses_json_snap]

        # Cache guard
        has_llm_data = any(c.explanation is not None for c in clause_details)
        if has_llm_data:
            logger.info("Contract %s: clause LLM cache hit. Skipping.", contract_id)
            return ContractAnalysisResponse(
                contract_id=str(contract_id),
                filename=contract_filename,
                clauses=clause_details,
                missing_clauses=missing_snap,
                overall_risk_score=overall_risk,
                analyzed_at=analyzed_at,
            )

        llm_clause_inputs: list[dict] = [
            {
                "index": c.index,
                "text": c.text,
                "clause_type": c.clause_type,
                "classification_confidence": c.classification_confidence,
                "risk_score": c.risk_score,
                "risk_level": "HIGH" if (c.risk_score or 0) >= 70 else "MEDIUM" if (c.risk_score or 0) >= 30 else "LOW",
                "is_unfair": c.is_unfair,
                "unfair_confidence": c.unfair_confidence,
                "similarity_score": c.similarity_score,
                "matched_template": c.matched_template,
                "entities": [e.model_dump() for e in c.entities],
            }
            for c in clause_details
        ]

        from app.services.llm_analysis_service import LLMAnalysisService
        from app.db.session import SessionLocal

        llm_svc = LLMAnalysisService()

        # ── Progressive chunk callback: write partial results to DB after every chunk ──
        # The frontend polls GET /contracts/{id} as isAnalyzing=true.
        # Each completed chunk is persisted immediately so polling sees gradual progress.
        async def _save_partial(partial: dict) -> None:
            # Merge the partial LLM results into clause_details in-place
            for clause in clause_details:
                extra = partial.get(clause.index)
                if not extra:
                    continue
                clause.explanation = extra.get("explanation")
                clause.top_risk_terms = extra.get("top_risk_terms", [])
                clause.recommendation = extra.get("recommendation")

            partial_db = SessionLocal()
            try:
                row = partial_db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
                if row:
                    row.clauses_json = [c.model_dump() for c in clause_details]
                    partial_db.commit()
                    logger.info("Partial chunk saved to DB (%d annotated clauses so far)", sum(1 for c in clause_details if c.explanation))
            except Exception as exc:
                partial_db.rollback()
                logger.warning("Partial chunk DB save failed (non-fatal): %s", exc)
            finally:
                partial_db.close()

        llm_results = await llm_svc.generate_clause_analysis(
            document_context={
                "contract_id": str(contract_id),
                "filename": contract_filename,
                "clauses_count": len(clause_details),
                "missing_clauses": missing_snap,
            },
            clauses=llm_clause_inputs,
            on_chunk_done=_save_partial,
        )

        # Final sync: ensure all annotated clauses are reflected in clause_details
        if llm_results:
            for clause in clause_details:
                extra = llm_results.get(clause.index)
                if not extra:
                    continue
                clause.explanation = extra.get("explanation")
                clause.top_risk_terms = extra.get("top_risk_terms", [])
                clause.recommendation = extra.get("recommendation")

            fresh_db = SessionLocal()
            try:
                fresh = fresh_db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
                if fresh:
                    fresh.clauses_json = [c.model_dump() for c in clause_details]
                    fresh_db.commit()
                    logger.info("Clause LLM results committed for contract %s", contract_id)
            except Exception as exc:
                fresh_db.rollback()
                logger.error("Failed to persist clause LLM results: %s", exc, exc_info=True)
            finally:

                fresh_db.close()

        return ContractAnalysisResponse(
            contract_id=str(contract_id),
            filename=contract_filename,
            clauses=clause_details,
            missing_clauses=missing_snap,
            overall_risk_score=overall_risk,
            analyzed_at=analyzed_at,
        )

    async def llm_analyze_missing(self, contract_id: str) -> ContractAnalysisResponse:
        """Phase 2: Run LLM missing-clause analysis only. Returns immediately when done."""
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

        analysis_id       = analysis.id
        contract_filename = contract.filename
        clauses_json_snap = list(analysis.clauses_json)
        overall_risk      = analysis.overall_risk_score
        analyzed_at       = analysis.analyzed_at
        self.db.close()

        clause_details = [ClauseDetail(**c) for c in clauses_json_snap]

        llm_clause_inputs: list[dict] = [
            {"index": c.index, "text": c.text, "clause_type": c.clause_type}
            for c in clause_details
        ]

        from app.services.llm_analysis_service import LLMAnalysisService
        llm_svc = LLMAnalysisService()
        missing_result = await llm_svc.generate_missing_clauses(llm_clause_inputs)
        final_missing = missing_result if missing_result else []

        if missing_result:
            from app.db.session import SessionLocal
            fresh_db = SessionLocal()
            try:
                fresh = fresh_db.query(AnalysisResult).filter(AnalysisResult.id == analysis_id).first()
                if fresh:
                    fresh.missing_clauses = missing_result
                    fresh_db.commit()
                    logger.info("Missing clauses committed for contract %s", contract_id)
            except Exception as exc:
                fresh_db.rollback()
                logger.error("Failed to persist missing clauses: %s", exc, exc_info=True)
            finally:
                fresh_db.close()

        return ContractAnalysisResponse(
            contract_id=str(contract_id),
            filename=contract_filename,
            clauses=clause_details,
            missing_clauses=final_missing,
            overall_risk_score=overall_risk,
            analyzed_at=analyzed_at,
        )

