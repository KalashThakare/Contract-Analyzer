import logging
import json

import torch
from functools import lru_cache

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@lru_cache(maxsize=None)
def _load_bert():
    try:
        from transformers import AutoModelForSequenceClassification, AutoTokenizer
        from huggingface_hub import hf_hub_download

        repo_id = settings.HF_REPO_ID

        tokenizer = AutoTokenizer.from_pretrained(repo_id)
        model = AutoModelForSequenceClassification.from_pretrained(repo_id)
        model.eval()

        label_map_path = hf_hub_download(repo_id, "label_map.json")
        with open(label_map_path) as f:
            raw = json.load(f)
        id2label = {int(k): v for k, v in raw["id2label"].items()}

        logger.info("BERT clause classifier loaded from %s", repo_id)
        return tokenizer, model, id2label

    except Exception as e:
        logger.error("Failed to load BERT clause classifier: %s", e)
        return None, None, {}


@lru_cache(maxsize=None)
def _load_sklearn():
    from app.ml.model_loader import load_pkl
    clf = load_pkl("clause_classifier_baseline.pkl")
    vec = load_pkl("tfidf_vectorizer.pkl")
    return clf, vec


class ClauseClassifier:
    def __init__(self):
        tokenizer, model, id2label = _load_bert()
        self._bert_ready = model is not None
        self._tokenizer = tokenizer
        self._model = model
        self._id2label = id2label

        if not self._bert_ready:
            logger.warning("ClauseClassifier: BERT unavailable, using sklearn fallback")

    def predict(self, clause_text: str) -> tuple[str, float]:
        if self._bert_ready:
            return self._predict_bert(clause_text)
        return self._predict_sklearn(clause_text)

    def _predict_bert(self, text: str) -> tuple[str, float]:
        try:
            inputs = self._tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True,
            )
            with torch.no_grad():
                logits = self._model(**inputs).logits
            probs = torch.softmax(logits, dim=-1)[0]
            class_id = probs.argmax().item()
            confidence = float(probs.max().item())
            label = self._id2label.get(class_id, f"Class_{class_id}")
            return label, round(confidence, 4)
        except Exception as e:
            logger.error("BERT prediction failed: %s", e)
            return "Unknown", 0.0

    def _predict_sklearn(self, text: str) -> tuple[str, float]:
        clf, vec = _load_sklearn()
        if clf is None or vec is None:
            return "Unknown", 0.0
        try:
            X = vec.transform([text])
            label = str(clf.predict(X)[0])
            confidence = float(clf.predict_proba(X)[0].max())
            return label, round(confidence, 4)
        except Exception as e:
            logger.error("sklearn prediction failed: %s", e)
            return "Unknown", 0.0

    def predict_batch(self, clauses: list[str]) -> list[tuple[str, float]]:
        return [self.predict(c) for c in clauses]
