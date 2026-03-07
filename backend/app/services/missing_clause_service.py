import logging

from app.schemas.missing_clause import MissingClauseResponse

logger = logging.getLogger(__name__)


class MissingClauseService:
    """Business logic for detecting missing clauses."""

    async def detect(
        self,
        clauses: list[str],
        contract_type: str = "general",
    ) -> MissingClauseResponse:
        from app.ml.missing_clause_detector import MissingClauseDetector

        detector = MissingClauseDetector()
        result = detector.detect(clauses, contract_type)

        logger.info(
            "Missing clause detection: %d missing for contract type '%s'",
            len(result["missing"]),
            contract_type,
        )
        return MissingClauseResponse(
            contract_type=contract_type,
            missing_clauses=result["missing"],
            coverage_score=result["coverage_score"],
        )
