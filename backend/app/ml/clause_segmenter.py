"""Clause Segmenter — splits raw PDF text into individual legal clauses."""

import re
import logging
from typing import List

logger = logging.getLogger(__name__)

# keywords that typically start a new clause
CLAUSE_KEYWORDS = [
    "WHEREAS", "NOW THEREFORE", "IN WITNESS WHEREOF",
    "Indemnification", "Confidentiality", "Termination",
    "Governing Law", "Jurisdiction", "Arbitration",
    "Intellectual Property", "Non-Compete", "Non-Solicitation",
    "Force Majeure", "Limitation of Liability", "Warranty",
    "Representations", "Covenants", "Conditions",
    "Payment", "Fees", "Expenses", "Notices",
]

MIN_WORDS = 10
MAX_WORDS = 300


def segment_clauses(raw_text: str) -> List[str]:
    
    if not raw_text or len(raw_text.strip()) < 50:
        logger.warning("Text too short to segment: %d chars", len(raw_text))
        return []

    text = _clean_text(raw_text)

    clauses = _split_by_numbered_sections(text)

    if len(clauses) < 3:
        clauses = _split_by_keywords(text)

    if len(clauses) < 3:
        clauses = _split_by_sentences(text)

    clauses = _filter_clauses(clauses)

    logger.info("Segmented %d clauses from %d chars", len(clauses), len(raw_text))
    return clauses


def _clean_text(text: str) -> str:
    """Remove headers, footers, page numbers and extra whitespace."""
    # remove page numbers like "Page 1 of 10"
    text = re.sub(r'Page\s+\d+\s+of\s+\d+', '', text, flags=re.IGNORECASE)
    # remove standalone numbers (page numbers)
    text = re.sub(r'^\s*\d+\s*$', '', text, flags=re.MULTILINE)
    # collapse multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # collapse multiple spaces
    text = re.sub(r' {2,}', ' ', text)
    return text.strip()


def _split_by_numbered_sections(text: str) -> List[str]:
    """Split on numbered section headers like '1.', '2.', 'Section 1'."""
    # matches: "1.", "1.1", "Section 1", "Article 2", "SECTION 1"
    pattern = r'(?:^|\n)(?:Section|Article|SECTION|ARTICLE)?\s*\d+(?:\.\d+)*\.?\s+[A-Z]'

    positions = [m.start() for m in re.finditer(pattern, text, re.MULTILINE)]

    if len(positions) < 2:
        return []

    clauses = []
    for i, start in enumerate(positions):
        end = positions[i + 1] if i + 1 < len(positions) else len(text)
        clause = text[start:end].strip()
        if clause:
            clauses.append(clause)

    return clauses


def _split_by_keywords(text: str) -> List[str]:
    """Split on legal clause-starting keywords."""
    pattern = '|'.join(re.escape(k) for k in CLAUSE_KEYWORDS)
    positions = [m.start() for m in re.finditer(pattern, text)]

    if len(positions) < 2:
        return []

    clauses = []
    for i, start in enumerate(positions):
        end = positions[i + 1] if i + 1 < len(positions) else len(text)
        clause = text[start:end].strip()
        if clause:
            clauses.append(clause)

    return clauses


def _split_by_sentences(text: str) -> List[str]:
    """Fallback: split into sentence groups of roughly 50-150 words."""
    sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
    clauses = []
    current = []
    current_words = 0

    for sentence in sentences:
        words = len(sentence.split())
        if current_words + words > 150 and current:
            clauses.append(' '.join(current))
            current = [sentence]
            current_words = words
        else:
            current.append(sentence)
            current_words += words

    if current:
        clauses.append(' '.join(current))

    return clauses


def _filter_clauses(clauses: List[str]) -> List[str]:
    """Remove clauses that are too short or too long."""
    filtered = []
    for clause in clauses:
        word_count = len(clause.split())
        if MIN_WORDS <= word_count <= MAX_WORDS:
            filtered.append(clause)
        else:
            logger.debug(
                "Filtered clause: %d words (min=%d, max=%d)",
                word_count, MIN_WORDS, MAX_WORDS
            )
    return filtered
