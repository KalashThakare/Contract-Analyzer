from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────
    APP_NAME: str = "Contract Analyzer API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development | staging | production

    # ── Server ───────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # ── Database (Supabase / PostgreSQL) ──────────────────
    DATABASE_URL: str = "postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"

    # ── ML Models ────────────────────────────────────────
    MODEL_DIR: Path = Path("models")
    UNFAIR_DETECTOR_MODEL: str = "unfair_detector"
    SIMILARITY_MODEL: str = "similarity"
    MISSING_CLAUSE_MODEL: str = "missing_clause"

    # ── Upload ───────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 20
    UPLOAD_DIR: Path = Path("uploads")

    # ── Rate Limiting ────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 30

    # ── Logging ──────────────────────────────────────────
    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
