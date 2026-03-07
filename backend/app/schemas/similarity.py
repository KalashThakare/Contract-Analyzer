from pydantic import BaseModel


class SimilarityRequest(BaseModel):
    clauses: list[str]
    template_category: str | None = None


class SimilarityResponse(BaseModel):
    clause: str
    most_similar_template: str
    similarity_score: float
    category: str
