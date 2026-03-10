"""Legal NER Extractor — finds named entities in contract clauses.

Uses Legal-BERT fine-tuned on CUAD dataset.
Runs on CPU by default (backend does not require GPU).
Model is loaded once and cached via lru_cache.
"""

import logging
import torch
from functools import lru_cache
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# special tokens to always skip
SPECIAL_TOKENS = {"[CLS]", "[SEP]", "[PAD]", "[UNK]", "[MASK]"}

# subword prefix used by BERT tokenizer
SUBWORD_PREFIX = "##"


@lru_cache(maxsize=None)
def _load_ner_model(model_path: str):
    """Load NER model and tokenizer. Cached after first call.

    Args:
        model_path: local path to the ner/ folder or a HuggingFace repo ID

    Returns:
        Tuple of (model, tokenizer, id2label) or (None, None, {}) on failure
    """
    try:
        from transformers import (
            AutoModelForTokenClassification,
            AutoTokenizer
        )

        logger.info("Loading NER model from %s", model_path)

        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForTokenClassification.from_pretrained(model_path)

        # force CPU — backend does not require GPU
        model = model.to("cpu")
        model.eval()

        # id2label is stored inside config.json automatically
        id2label = {int(k): v for k, v in model.config.id2label.items()}

        logger.info(
            "NER model loaded — %d labels, %d parameters",
            len(id2label),
            sum(p.numel() for p in model.parameters())
        )

        return model, tokenizer, id2label

    except Exception as e:
        logger.error("Failed to load NER model: %s", e)
        return None, None, {}


def _subwords_to_words(tokens: List[str], labels: List[str]) -> List[Dict]:
    """Merge subword tokens back into whole words with their labels.

    BERT splits words into subwords e.g. "Apple" → ["Apple", "##Inc"]
    We take the label of the first subword and discard ## continuations.

    Args:
        tokens: list of subword token strings
        labels: list of IOB2 label strings (same length as tokens)

    Returns:
        List of dicts with 'word' and 'label' keys
    """
    word_labels = []

    for token, label in zip(tokens, labels):
        # skip special tokens
        if token in SPECIAL_TOKENS:
            continue
        # skip subword continuations (take first subword only)
        if token.startswith(SUBWORD_PREFIX):
            continue
        word_labels.append({"word": token, "label": label})

    return word_labels


def _iob2_to_entities(word_labels: List[Dict]) -> List[Dict[str, Any]]:
    """Convert IOB2 word-label pairs into entity spans.

    Groups consecutive B-/I- tokens into single entity spans.

    Args:
        word_labels: list of {"word": str, "label": str} dicts

    Returns:
        List of entity dicts with text, label, confidence
    """
    entities = []
    current = None

    for item in word_labels:
        label = item["label"]
        word = item["word"]

        if label.startswith("B-"):
            # save previous entity
            if current:
                entities.append(current)
            # start new entity
            current = {
                "text": word,
                "label": label[2:],   # strip "B-"
                "confidence": 0.0     # filled in later
            }

        elif label.startswith("I-") and current:
            # continuation of current entity
            entity_type = label[2:]
            if entity_type == current["label"]:
                current["text"] += f" {word}"

        else:
            # O label — save current entity and reset
            if current:
                entities.append(current)
                current = None

    # save final entity
    if current:
        entities.append(current)

    return entities


def extract_entities(
    clause_text: str,
    model_path: str = "Devil1710/Legal-Document-Analyzer-NER"
) -> List[Dict[str, Any]]:
    """Extract named entities from a legal clause.

    Args:
        clause_text: plain text string of one legal clause
        model_path:  path to the ner/ model folder or HuggingFace repo ID

    Returns:
        List of entity dicts:
        [
            {"text": "Apple Inc",  "label": "PARTY",  "confidence": 0.97},
            {"text": "$500,000",   "label": "AMOUNT", "confidence": 0.95},
        ]
        Returns empty list on failure (never raises).
    """
    if not clause_text or not clause_text.strip():
        return []

    model, tokenizer, id2label = _load_ner_model(model_path)

    if model is None:
        logger.warning("NER model not loaded — returning empty entities")
        return []

    try:
        # tokenize
        inputs = tokenizer(
            clause_text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            return_offsets_mapping=False
        )

        # inference on CPU — no gradients needed
        with torch.no_grad():
            outputs = model(**inputs)

        # get predicted label ids and probabilities
        logits = outputs.logits[0]               # (seq_len, num_labels)
        probs = torch.softmax(logits, dim=-1)
        pred_ids = torch.argmax(probs, dim=-1)   # (seq_len,)
        pred_probs = probs.max(dim=-1).values    # (seq_len,)

        # convert ids to label strings
        tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
        label_strs = [id2label.get(int(i), "O") for i in pred_ids]
        conf_vals = [float(p) for p in pred_probs]

        # merge subwords back to whole words
        word_labels = _subwords_to_words(tokens, label_strs)

        # convert IOB2 to entity spans
        entities = _iob2_to_entities(word_labels)

        # attach confidence scores (use the confidence of the B- token)
        conf_map = {}
        for token, label, conf in zip(tokens, label_strs, conf_vals):
            if token in SPECIAL_TOKENS or token.startswith(SUBWORD_PREFIX):
                continue
            if label.startswith("B-"):
                conf_map[token] = round(conf, 4)

        for entity in entities:
            first_word = entity["text"].split()[0]
            entity["confidence"] = conf_map.get(first_word, 0.90)

        return entities

    except Exception as e:
        logger.error("NER inference failed: %s", e)
        return []


def extract_entities_batch(
    clauses: List[str],
    model_path: str = "Devil1710/Legal-Document-Analyzer-NER"
) -> List[List[Dict[str, Any]]]:
    """Extract entities from multiple clauses.

    Args:
        clauses:    list of clause strings
        model_path: path to ner/ folder or HuggingFace repo ID

    Returns:
        List of entity lists, one per clause
    """
    return [extract_entities(c, model_path) for c in clauses]
