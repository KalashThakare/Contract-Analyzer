import logging

logger = logging.getLogger(__name__)


class SimilarityMatcher:
    def __init__(self):
        # TODO: load sentence-bert model and template embeddings
        logger.info("SimilarityMatcher initialized (placeholder)")

    def find_most_similar(
        self,
        clause: str,
        category: str | None = None,
    ) -> dict:
        return {
            "template": "Standard confidentiality clause template",
            "score": 0.5,
            "category": category or "general",
        }
