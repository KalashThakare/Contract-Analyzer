"""Clause segmenter backed by HF model Devil1710/Legal-Clause-Segmenter."""

import logging
import re
from functools import lru_cache
from typing import List

import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

MIN_WORDS = 10
MAX_WORDS = 320
MIN_SENTENCE_CHARS = 6
DEFAULT_BOUNDARY_THRESHOLD = 0.65


@lru_cache(maxsize=1)
def _load_segmenter(model_id: str):
    """Load and cache tokenizer + segmenter model from Hugging Face."""
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = AutoModelForSequenceClassification.from_pretrained(model_id)
        model.eval()
        model.to("cpu")
        logger.info("Clause segmenter loaded from %s", model_id)
        return tokenizer, model
    except Exception as exc:
        logger.error("Failed to load clause segmenter '%s': %s", model_id, exc)
        return None, None


def _clean_text(text: str) -> str:
    text = re.sub(r"Page\s+\d+\s+of\s+\d+", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^\s*\d+\s*$", "", text, flags=re.MULTILINE)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def _split_sentences(text: str) -> List[str]:
    """Lightweight sentence split to avoid external runtime deps."""
    parts = re.split(r"(?<=[.!?])\s+|\n+", text)
    return [p.strip() for p in parts if len(p.strip()) >= MIN_SENTENCE_CHARS]


def _resolve_boundary_label_id(model) -> int:
    labels = {int(k): str(v).lower() for k, v in model.config.id2label.items()}

    # Prefer explicit label naming if present in model config.
    for idx, name in labels.items():
        if any(key in name for key in ("boundary", "split", "break", "new_clause")):
            return idx

    # Fallback commonly used by binary classifiers.
    if 1 in labels:
        return 1

    return sorted(labels.keys())[-1]


def _predict_sentence_is_boundary(
    sentence: str,
    tokenizer,
    model,
    boundary_label_id: int,
    threshold: float,
) -> bool:
    inputs = tokenizer(
        sentence,
        return_tensors="pt",
        truncation=True,
        max_length=128,
        padding=True,
    )
    with torch.no_grad():
        logits = model(**inputs).logits[0]
    probs = torch.softmax(logits, dim=-1)
    boundary_prob = float(probs[boundary_label_id].item())
    return boundary_prob >= threshold


def _filter_clauses(clauses: List[str]) -> List[str]:
    filtered: List[str] = []
    for clause in clauses:
        word_count = len(clause.split())
        if MIN_WORDS <= word_count <= MAX_WORDS:
            filtered.append(clause)
    return filtered


def segment_clauses(raw_text: str, threshold: float = DEFAULT_BOUNDARY_THRESHOLD) -> List[str]:
    """Split raw contract text into clauses using the HF segmenter model."""
    if not raw_text or len(raw_text.strip()) < 50:
        logger.warning("Text too short to segment: %d chars", len(raw_text or ""))
        return []

    tokenizer, model = _load_segmenter(settings.CLAUSE_SEGMENTER_MODEL)
    if tokenizer is None or model is None:
        return []

    text = _clean_text(raw_text)
    sentences = _split_sentences(text)
    if not sentences:
        return []

    boundary_label_id = _resolve_boundary_label_id(model)

    clauses: List[str] = []
    current_clause: List[str] = []
    for sentence in sentences:
        is_boundary = _predict_sentence_is_boundary(
            sentence,
            tokenizer,
            model,
            boundary_label_id,
            threshold,
        )

        if is_boundary and current_clause:
            clauses.append(" ".join(current_clause).strip())
            current_clause = [sentence]
        else:
            current_clause.append(sentence)

    if current_clause:
        clauses.append(" ".join(current_clause).strip())

    filtered = _filter_clauses(clauses)
    logger.info("Segmented %d clauses from %d chars", len(filtered), len(raw_text))
    return filtered
