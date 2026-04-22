"""Service wrapper for unfair-clause classification."""

import logging

from app.schemas.unfair_clause import UnfairClauseResponse

logger = logging.getLogger(__name__)


class UnfairClauseService:
    """Run unfairness prediction and map results into API schemas."""

    async def detect(self, clauses: list[str]) -> list[UnfairClauseResponse]:
        """Classify each clause and return fairness verdicts with confidence."""
        from app.ml.unfair_detector import UnfairDetector

        detector = UnfairDetector()
        results: list[UnfairClauseResponse] = []

        for clause in clauses:
            prediction = detector.predict(clause)
            results.append(
                UnfairClauseResponse(
                    clause=clause,
                    is_unfair=prediction["is_unfair"],
                    confidence=prediction["confidence"],
                    explanation=prediction.get("explanation"),
                )
            )

        logger.info("Unfair clause detection completed for %d clauses", len(clauses))
        return results
