"""Joint clause classification and risk scoring predictor with graceful fallback."""

import json
import logging
from functools import lru_cache

import torch
import torch.nn as nn
from huggingface_hub import hf_hub_download
from transformers import AutoModel, AutoTokenizer

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class MultiTaskLegalModel(nn.Module):
    """Transformer encoder with dual heads for class logits and risk regression."""

    def __init__(
        self,
        model_name: str,
        num_labels: int,
        hidden_size: int = 768,
        dropout_rate: float = 0.25,
    ):
        super().__init__()
        self.bert = AutoModel.from_pretrained(model_name)
        self.dropout = nn.Dropout(dropout_rate)

        self.classifier = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(hidden_size // 2, num_labels),
        )

        self.regressor = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(hidden_size // 2, 1),
            nn.Sigmoid(),
        )

    def forward(self, input_ids, attention_mask, token_type_ids=None, **kwargs):
        bert_kwargs = {
            "input_ids": input_ids,
            "attention_mask": attention_mask,
            "return_dict": True,
        }
        if token_type_ids is not None:
            bert_kwargs["token_type_ids"] = token_type_ids

        out = self.bert(**bert_kwargs)
        cls = self.dropout(out.last_hidden_state[:, 0, :])
        class_logits = self.classifier(cls)
        risk01 = self.regressor(cls).squeeze(-1)
        return class_logits, risk01


@lru_cache(maxsize=1)
def _load_multitask(repo_id: str):
    """Load multitask model weights, metadata, and tokenizer from Hugging Face."""
    meta_path = hf_hub_download(repo_id=repo_id, filename="metadata.json", repo_type="model")
    weights_path = hf_hub_download(repo_id=repo_id, filename="full_model.pt", repo_type="model")

    with open(meta_path, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    tokenizer = AutoTokenizer.from_pretrained(repo_id)
    model = MultiTaskLegalModel(
        model_name=metadata["model_name"],
        num_labels=metadata["num_labels"],
        hidden_size=metadata.get("hidden_size", 768),
        dropout_rate=metadata.get("dropout_rate", 0.25),
    )

    state = torch.load(weights_path, map_location="cpu")
    if any(k.startswith("module.") for k in state.keys()):
        state = {k.replace("module.", "", 1): v for k, v in state.items()}

    model.load_state_dict(state, strict=False)
    model.eval()

    logger.info("Multi-task model loaded from %s", repo_id)
    return tokenizer, model, metadata


class MultiTaskPredictor:
    """High-level predictor that prefers multitask BERT and falls back to legacy models."""

    def __init__(self, repo_id: str | None = None):
        self.repo_id = repo_id or settings.HF_MULTITASK_REPO_ID
        self._tokenizer = None
        self._model = None
        self._metadata = {}

        self._fallback_clf = None
        self._fallback_risk = None

        try:
            self._tokenizer, self._model, self._metadata = _load_multitask(self.repo_id)
        except Exception as e:
            logger.error("Failed to load multi-task model '%s': %s", self.repo_id, e)
            self._enable_fallback()

    @staticmethod
    def _risk_level(score: float) -> str:
        """Map numeric risk score to LOW/MEDIUM/HIGH bands."""
        if score >= 70:
            return "HIGH"
        if score >= 40:
            return "MEDIUM"
        return "LOW"

    def _enable_fallback(self):
        """Initialize fallback clause and risk models lazily."""
        if self._fallback_clf is not None and self._fallback_risk is not None:
            return

        from app.ml.clause_classifier import ClauseClassifier
        from app.ml.risk_scorer import RiskScorer

        self._fallback_clf = ClauseClassifier()
        self._fallback_risk = RiskScorer()
        logger.warning("MultiTaskPredictor fallback enabled: ClauseClassifier + RiskScorer")

    def _predict_multitask(self, text: str) -> dict:
        """Run transformer inference and return normalized analysis fields."""
        inputs = self._tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=self._metadata.get("max_sequence_length", 256),
            padding=True,
        )

        with torch.no_grad():
            logits, risk01 = self._model(**inputs)

        probs = torch.softmax(logits, dim=1)[0]
        class_id = int(torch.argmax(probs).item())
        confidence = float(torch.max(probs).item())

        label_names = self._metadata.get("label_names", [])
        clause_type = label_names[class_id] if class_id < len(label_names) else f"Class_{class_id}"

        risk_score = round(float(risk01.item()) * 100.0, 2)

        return {
            "clause_type": clause_type,
            "confidence": round(confidence, 4),
            "risk_score": risk_score,
            "risk_level": self._risk_level(risk_score),
            "source": "multitask",
        }

    def _predict_fallback(self, text: str) -> dict:
        """Run legacy independent models when multitask model is unavailable."""
        self._enable_fallback()

        clause_type, confidence = self._fallback_clf.predict(text)
        risk_score = self._fallback_risk.score(text)

        return {
            "clause_type": clause_type,
            "confidence": round(float(confidence), 4),
            "risk_score": round(float(risk_score), 2),
            "risk_level": self._risk_level(float(risk_score)),
            "source": "fallback",
        }

    def predict(self, text: str) -> dict:
        """Predict clause metadata for one text input with automatic fallback."""
        if not text or not text.strip():
            return {
                "clause_type": "Unknown",
                "confidence": 0.0,
                "risk_score": 50.0,
                "risk_level": "MEDIUM",
                "source": "empty",
            }

        if self._model is not None and self._tokenizer is not None:
            try:
                return self._predict_multitask(text)
            except Exception as e:
                logger.error("Multi-task inference failed: %s", e)

        return self._predict_fallback(text)

    def predict_batch(self, clauses: list[str]) -> list[dict]:
        """Predict analysis metadata for a list of clauses."""
        return [self.predict(c) for c in clauses]
