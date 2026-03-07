"""Missing Clause Detection – Multi-label classifier (Legal-BERT).

TODO (Week 2): Replace dummy logic with actual model inference.
- Load fine-tuned Legal-BERT from models/missing_clause/
- Classify which expected clause types are present
- Return list of missing types
"""

import logging

logger = logging.getLogger(__name__)

# Standard clause types expected in a general contract
EXPECTED_CLAUSES: dict[str, list[str]] = {
    "general": [
        "confidentiality",
        "termination",
        "liability",
        "indemnification",
        "governing_law",
        "dispute_resolution",
        "force_majeure",
        "intellectual_property",
        "payment_terms",
        "warranties",
    ],
    "nda": [
        "confidentiality",
        "non_disclosure_obligations",
        "term_and_termination",
        "permitted_disclosures",
        "remedies",
        "governing_law",
    ],
    "employment": [
        "compensation",
        "termination",
        "non_compete",
        "confidentiality",
        "intellectual_property",
        "benefits",
        "governing_law",
    ],
}


class MissingClauseDetector:
    """Identify important clauses missing from a contract."""

    def __init__(self):
        # TODO: Load multi-label classifier
        logger.info("MissingClauseDetector initialized (using placeholder logic)")

    def detect(self, clauses: list[str], contract_type: str = "general") -> dict:
        """Return dict with keys: missing (list[str]), coverage_score (float)."""
        expected = EXPECTED_CLAUSES.get(contract_type, EXPECTED_CLAUSES["general"])

        # Placeholder – pretend all clauses are present
        # Real logic: classify each clause and compare against expected set
        detected: list[str] = []
        missing = [c for c in expected if c not in detected]

        coverage = len(detected) / max(len(expected), 1)
        return {
            "missing": missing,
            "coverage_score": round(coverage, 2),
        }
