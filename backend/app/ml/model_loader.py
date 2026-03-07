"""Centralized model loader with lazy-loading and caching."""

import logging
from pathlib import Path
from functools import lru_cache

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@lru_cache
def get_model_path(model_name: str) -> Path:
    path = settings.MODEL_DIR / model_name
    if not path.exists():
        logger.warning("Model directory not found: %s", path)
    return path
