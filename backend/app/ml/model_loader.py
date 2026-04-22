"""Shared helpers for loading serialized fallback models from Hugging Face."""

import logging
import pickle
from functools import lru_cache

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


@lru_cache(maxsize=None)
def load_pkl(filename: str):
    """Download and deserialize a pickled artifact from the configured model repo."""
    try:
        from huggingface_hub import hf_hub_download

        local_path = hf_hub_download(
            repo_id=settings.HF_REPO_ID,
            filename=f"{settings.HF_SUBFOLDER}/{filename}",
            repo_type="model",
        )
        with open(local_path, "rb") as f:
            obj = pickle.load(f)

        logger.info("Loaded '%s'", filename)
        return obj

    except Exception as e:
        logger.error("Failed to load '%s': %s", filename, e)
        load_pkl.cache_clear()
        return None
