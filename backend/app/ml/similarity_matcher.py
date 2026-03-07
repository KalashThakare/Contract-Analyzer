"""Semantic Similarity – Sentence-BERT based matching.

TODO (Week 2): Replace dummy logic with actual Sentence-BERT model.
- Load Sentence-BERT from models/similarity/
- Encode clauses and templates
- Compute cosine similarity
"""

import logging

logger = logging.getLogger(__name__)


class SimilarityMatcher:
    """Compare clauses against standard templates using Sentence-BERT."""

    def __init__(self):
        # TODO: Load Sentence-BERT model and template embeddings
        #   from sentence_transformers import SentenceTransformer
        #   self.model = SentenceTransformer(model_path)
        #   self.templates = self._load_templates()
        logger.info("SimilarityMatcher initialized (using placeholder logic)")

    def find_most_similar(
        self,
        clause: str,
        category: str | None = None,
    ) -> dict:
        """Return dict with keys: template, score, category."""
        # Placeholder until model & templates are ready
        return {
            "template": "Standard confidentiality clause template",
            "score": 0.5,
            "category": category or "general",
        }
