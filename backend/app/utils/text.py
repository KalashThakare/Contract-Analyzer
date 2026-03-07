"""Text preprocessing utilities shared across services."""

import re


def clean_text(text: str) -> str:
    """Remove excessive whitespace and non-printable characters."""
    text = re.sub(r"[^\S\n]+", " ", text)  # collapse whitespace (keep newlines)
    text = re.sub(r"\n{3,}", "\n\n", text)  # max two consecutive newlines
    return text.strip()


def truncate(text: str, max_length: int = 512) -> str:
    """Truncate text to max_length, appending ellipsis if clipped."""
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."
