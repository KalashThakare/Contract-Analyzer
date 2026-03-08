import re


def clean_text(text: str) -> str:
    text = re.sub(r"[^\S\n]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def truncate(text: str, max_length: int = 512) -> str:
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."
