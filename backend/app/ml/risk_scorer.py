"""Risk scoring utility with pickled regression model fallback behavior."""

import logging
import numpy as np
from functools import lru_cache

from app.ml.model_loader import load_pkl

logger = logging.getLogger(__name__)


@lru_cache(maxsize=None)
def _load_models():
    """Load fallback risk model artifacts once per process."""
    model = load_pkl("risk_scorer_baseline.pkl")
    vec = load_pkl("risk_vectorizer.pkl")
    return model, vec


class RiskScorer:
    """Predict clause risk score in the range [0, 100]."""

    def __init__(self):
        self._model, self._vec = _load_models()
        if self._model:
            logger.info("RiskScorer ready")
        else:
            logger.warning("RiskScorer in fallback mode — returning 50.0 for all clauses")

    def score(self, clause_text: str) -> float:
        """Score a single clause and clamp outputs to a valid 0-100 range."""
        if self._model is None or self._vec is None:
            return 50.0

        try:
            X_sparse = self._vec.transform([clause_text])
            X_dense = X_sparse.toarray().astype(np.float32)
            raw_score = float(self._model.predict(X_dense)[0])
            return round(float(np.clip(raw_score, 0.0, 100.0)), 2)
        except Exception as e:
            logger.error("RiskScorer.score failed: %s", e)
            return 50.0

    @staticmethod
    def risk_level(score: float) -> str:
        """Convert numeric score into LOW/MEDIUM/HIGH buckets."""
        if score >= 70:
            return "HIGH"
        elif score >= 40:
            return "MEDIUM"
        return "LOW"

    def score_batch(self, clauses: list[str]) -> list[float]:
        """Score multiple clauses while preserving order."""
        return [self.score(c) for c in clauses]
