import logging

from app.schemas.unfair_clause import UnfairClauseResponse

logger = logging.getLogger(__name__)


class UnfairClauseService:
    """Business logic for unfair clause detection.

    Delegates inference to the ML layer (app.ml.unfair_detector).
    """

    async def detect(self, clauses: list[str]) -> list[UnfairClauseResponse]:
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
