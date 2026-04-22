"""FastAPI entrypoint for the Contract Analyzer backend.

This module wires app startup, middleware, API routing, and background model warmup.
"""

import logging
import os
import threading
from contextlib import asynccontextmanager
from pathlib import Path

_ssl_cert = os.environ.get("SSL_CERT_FILE", "")
if _ssl_cert and not Path(_ssl_cert).is_file():
    # Fall back to certifi defaults when a stale SSL_CERT_FILE is configured.
    logging.getLogger("startup").warning(
        "SSL_CERT_FILE points to a missing file (%s) — removing it so certifi is used.", _ssl_cert
    )
    del os.environ["SSL_CERT_FILE"]
# ─────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.logging import setup_logging
from app.core.middleware import RequestLoggingMiddleware
from app.api.v1.router import router as v1_router
from app.db.base_class import Base
from app.db.session import engine
from app.db.models import contract, analysis_result  # noqa: F401 — ensure models are registered

settings = get_settings()

_warmup_logger = logging.getLogger("model_warmup")


def _warmup_models():
    """Load ML models in a background thread to reduce first-request latency."""
    _warmup_logger.info("Background warmup: starting model pre-loading...")

    try:
        # 1. Unfair Clause Legal-BERT Classifier
        from app.ml.unfair_detector import _load_bert
        _load_bert()
        _warmup_logger.info("Warmup [1/4]: Unfair-clause Legal-BERT loaded.")

        # 2. Fallback Risk Scorers (lightweight Pickle models)
        from app.ml.model_loader import load_pkl
        load_pkl("risk_scorer_baseline.pkl")
        load_pkl("risk_vectorizer.pkl")
        _warmup_logger.info("Warmup [2/4]: Fallback risk scorer PKL models loaded.")

        # 3. Multi-Task Legal-BERT (Clause Classification + Risk Regression)
        from app.ml.multitask_predictor import MultiTaskPredictor
        MultiTaskPredictor(settings.HF_MULTITASK_REPO_ID)
        _warmup_logger.info("Warmup [3/5]: Multi-task Legal-BERT loaded.")

        # 4. Clause Segmenter (boundary detector)
        

        # 5. NER Token Extractor (Entity Ontology)
        from app.ml.ner_extractor import _load_ner_model
        _load_ner_model(settings.NER_MODEL)
        _warmup_logger.info("Warmup [5/5]: NER Legal-BERT loaded.")

        _warmup_logger.info(
            "All ML models are fully cached in memory. Ready to serve requests."
        )

    except Exception as exc:  # pragma: no cover
        _warmup_logger.error("Model warmup failed: %s", exc, exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize logging/DB on startup and schedule model warmup asynchronously."""
    setup_logging()

    # Ensure DB tables exist — fast, no model loading here.
    Base.metadata.create_all(bind=engine)

    thread = threading.Thread(target=_warmup_models, daemon=True, name="model-warmup")
    thread.start()

    # ── uvicorn prints "Application startup complete." here ──────────────
    yield
    # ────────────────────────────────────────────────────────────────────


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix="/api/v1")


@app.get("/")
def root():
    """Lightweight root endpoint used for simple service reachability checks."""
    return {"message": "Contract Analyzer API is running"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
