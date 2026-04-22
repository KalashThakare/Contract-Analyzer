"""Unfair-clause binary classifier wrapper around a fine-tuned transformer."""

import logging

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

logger = logging.getLogger(__name__)

BERT_MODEL_ID = "KalashT/unfair-clause-classifier"

_bert_tokenizer = None
_bert_model = None


def _load_bert():
    """Load tokenizer/model once and reuse globally for inference."""
    global _bert_tokenizer, _bert_model
    if _bert_tokenizer is None:
        try:
            logger.info("Loading BERT unfair model: %s", BERT_MODEL_ID)
            _bert_tokenizer = AutoTokenizer.from_pretrained(BERT_MODEL_ID)
            _bert_model = AutoModelForSequenceClassification.from_pretrained(BERT_MODEL_ID)
            _bert_model.eval()
            logger.info("BERT unfair clause model loaded")
        except Exception as e:
            logger.error("Failed to load BERT unfair model: %s", e)
    return _bert_tokenizer, _bert_model


class UnfairDetector:
    """Classify clauses as fair/unfair and return confidence with explanation."""

    LABEL_MAP = {0: "fair", 1: "unfair"}

    def __init__(self):
        self._tokenizer, self._bert = _load_bert()
        self._bert_ready = self._bert is not None

        if self._bert_ready:
            logger.info("UnfairDetector: BERT (KalashT) ready")
        else:
            logger.warning("UnfairDetector: model not loaded — returning fallback")

    def predict(self, clause_text: str) -> dict:
        """Predict unfairness for a single clause with fallback defaults."""
        if self._bert_ready:
            result = self._predict_bert(clause_text)
            if result:
                return result
        return {"is_unfair": False, "confidence": 0.5, "explanation": None}

    def _predict_bert(self, text: str) -> dict | None:
        try:
            inputs = self._tokenizer(
                text,
                truncation=True,
                padding="max_length",
                max_length=128,
                return_tensors="pt",
            )
            with torch.no_grad():
                logits = self._bert(**inputs).logits

            probs = torch.softmax(logits, dim=-1).squeeze()
            predicted_idx = torch.argmax(probs).item()
            label = self.LABEL_MAP[predicted_idx]
            confidence = probs[predicted_idx].item()

            return {
                "is_unfair": predicted_idx == 1,
                "confidence": round(confidence, 4),
                "explanation": f"BERT: '{label}' ({confidence:.1%})",
            }
        except Exception as e:
            logger.error("BERT predict failed: %s", e)
            return None

    def predict_batch(self, clauses: list[str]) -> list[dict]:
        """Predict unfairness for multiple clauses preserving input order."""
        return [self.predict(c) for c in clauses]
