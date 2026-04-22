"""Small reusable text-cleaning helpers used across backend services."""

import re


def clean_text(text: str) -> str:
    """Normalize whitespace while preserving intentional line breaks."""
    text = re.sub(r"[^\S\n]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def truncate(text: str, max_length: int = 512) -> str:
    """Truncate long strings to a max length, appending an ellipsis."""
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."
