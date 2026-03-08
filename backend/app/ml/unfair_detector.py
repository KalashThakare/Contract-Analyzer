import logging
from functools import lru_cache

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from app.ml.model_loader import load_pkl

logger = logging.getLogger(__name__)

BERT_MODEL_ID = "KalashT/unfair-clause-classifier"

_bert_tokenizer = None
_bert_model = None


def _load_bert():
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


@lru_cache(maxsize=None)
def _load_svc():
    clf = load_pkl("unfair_tos_classifier.pkl")
    vec = load_pkl("utos_vectorizer.pkl")
    return clf, vec


class UnfairDetector:
    LABEL_MAP = {0: "fair", 1: "unfair"}

    def __init__(self):
        self._tokenizer, self._bert = _load_bert()
        self._bert_ready = self._bert is not None

        self._svc, self._svc_vec = _load_svc()
        self._svc_ready = self._svc is not None

        if self._bert_ready:
            logger.info("UnfairDetector: BERT (KalashT) ready")
        if self._svc_ready:
            logger.info("UnfairDetector: LinearSVC (Jayesh) ready")
        if not self._bert_ready and not self._svc_ready:
            logger.warning("UnfairDetector: no models loaded — returning fallback")

    def predict(self, clause_text: str) -> dict:
        bert_result = self._predict_bert(clause_text) if self._bert_ready else None
        svc_result = self._predict_svc(clause_text) if self._svc_ready else None

        # Use BERT as primary, SVC as fallback
        if bert_result:
            return bert_result
        if svc_result:
            return svc_result
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

    def _predict_svc(self, text: str) -> dict | None:
        try:
            X = self._svc_vec.transform([text])
            label = int(self._svc.predict(X)[0])
            decision_score = float(self._svc.decision_function(X)[0])
            confidence = round(min(1.0, max(0.0, abs(decision_score) / 2.0)), 4)

            return {
                "is_unfair": label == 1,
                "confidence": confidence,
                "explanation": "Flagged by unfair ToS classifier" if label == 1 else None,
            }
        except Exception as e:
            logger.error("SVC predict failed: %s", e)
            return None

    def predict_batch(self, clauses: list[str]) -> list[dict]:
        return [self.predict(c) for c in clauses]
