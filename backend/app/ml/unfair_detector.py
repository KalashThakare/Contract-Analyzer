"""Unfair Clause Detection – Fine-tuned BERT binary classifier.

TODO (Week 2): Replace dummy logic with actual model inference.
- Load fine-tuned BERT from models/unfair_detector/
- Tokenize input with AutoTokenizer
- Run inference and return probability
"""

import logging

logger = logging.getLogger(__name__)


class UnfairDetector:
    """Binary classifier for detecting potentially unfair clauses."""

    def __init__(self):
        # TODO: Load actual model weights here
        #   from transformers import AutoModelForSequenceClassification, AutoTokenizer
        #   self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        #   self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        logger.info("UnfairDetector initialized (using placeholder logic)")

    def predict(self, clause: str) -> dict:
        """Return prediction dict with keys: is_unfair, confidence, explanation."""
        # Placeholder – returns dummy prediction until model is trained
        return {
            "is_unfair": False,
            "confidence": 0.5,
            "explanation": "Placeholder – model not yet loaded.",
        }
