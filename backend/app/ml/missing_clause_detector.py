"""Rule-based placeholder for identifying missing expected contract clauses."""

import logging

logger = logging.getLogger(__name__)

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
    """Compare observed clauses against a predefined expected-clause catalogue."""

    def __init__(self):
        logger.info("MissingClauseDetector initialized (placeholder)")

    def detect(self, clauses: list[str], contract_type: str = "general") -> dict:
        """Return missing expected clause keys and a simple coverage score."""
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
