"""Schemas for clause similarity comparison APIs."""

from pydantic import BaseModel


class SimilarityRequest(BaseModel):
    """Input payload for clause-template similarity matching."""

    clauses: list[str]
    template_category: str | None = None


class SimilarityResponse(BaseModel):
    """Similarity result for a single input clause."""

    clause: str
    most_similar_template: str
    similarity_score: float
    category: str
