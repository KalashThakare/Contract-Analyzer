"""PDF extraction and clause segmentation utilities."""

import logging

logger = logging.getLogger(__name__)


class PDFProcessor:
    """Handle PDF text extraction and heuristic clause segmentation."""

    @staticmethod
    def extract_text(pdf_bytes: bytes) -> tuple[str, int]:
        """Extract concatenated text and page count from PDF bytes using PyMuPDF."""

        import fitz  # PyMuPDF

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        pages: list[str] = []
        for page in doc:
            pages.append(page.get_text())
        doc.close()

        full_text = "\n".join(pages)
        logger.info("Extracted %d pages, %d chars from PDF", len(pages), len(full_text))
        return full_text, len(pages)

    @staticmethod
    def segment_clauses(text: str) -> list[str]:
        """Split contract text into individual clauses.

        Uses a simple heuristic: split on double newlines and numbered
        section patterns. This will be refined with SpaCy / rule-based
        segmentation later.
        """
        import re

        raw_parts = re.split(r"\n{2,}|(?=\n\s*(?:\d+\.|\d+\.\d+|Section\s+\d))", text)
        clauses = [c.strip() for c in raw_parts if len(c.strip()) > 30]
        logger.info("Segmented text into %d clauses", len(clauses))
        return clauses
