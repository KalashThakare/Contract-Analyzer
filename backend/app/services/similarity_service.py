"""Service wrapper for semantic similarity matching."""

import logging

from app.schemas.similarity import SimilarityResponse

logger = logging.getLogger(__name__)


class SimilarityService:
    """Compute best template matches for each input clause."""

    async def compare(
        self,
        clauses: list[str],
        template_category: str | None = None,
    ) -> list[SimilarityResponse]:
        """Return similarity metadata for each clause in order."""
        from app.ml.similarity_matcher import SimilarityMatcher

        matcher = SimilarityMatcher()
        results: list[SimilarityResponse] = []

        for clause in clauses:
            match = matcher.find_most_similar(clause, category=template_category)
            results.append(
                SimilarityResponse(
                    clause=clause,
                    most_similar_template=match["template"],
                    similarity_score=match["score"],
                    category=match["category"],
                )
            )

        logger.info("Similarity comparison completed for %d clauses", len(clauses))
        return results
