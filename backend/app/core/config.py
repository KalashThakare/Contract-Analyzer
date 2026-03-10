from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Contract Analyzer API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    DATABASE_URL: str = "postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres"

    MODEL_DIR: Path = Path("models")
    UNFAIR_DETECTOR_MODEL: str = "unfair_detector"
    SIMILARITY_MODEL: str = "similarity"
    MISSING_CLAUSE_MODEL: str = "missing_clause"

    HF_REPO_ID: str = "AnkushRaheja/Legal-Document-Analyzer"
    HF_SUBFOLDER: str = "sklearn-models"

    NER_MODEL: str = "Devil1710/Legal-Document-Analyzer-NER"

    MAX_UPLOAD_SIZE_MB: int = 20
    UPLOAD_DIR: Path = Path("uploads")

    RATE_LIMIT_PER_MINUTE: int = 30

    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
