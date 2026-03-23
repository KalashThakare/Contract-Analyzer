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
    HF_MULTITASK_REPO_ID: str = "AnkushRaheja/Cls_Class_Risk_Scr"
    CLAUSE_SEGMENTER_MODEL: str = "Devil1710/Legal-Clause-Segmenter"

    NER_MODEL: str = "Devil1710/Legal-NER-v2"

    # LLM Provider Switch
    LLM_ENABLED: bool = True
    LLM_PROVIDER: str = "ollama" 

    # Ollama Configuration
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "llama3"
    OLLAMA_API_KEY: str | None = None
    OLLAMA_CHUNK_SIZE: int = 3

    # Groq Configuration
    GROQ_API_KEY: str | None = None
    GROQ_MODEL: str = "deepseek-r1-distill-llama-70b"
    GROQ_BASE_URL: str = "https://api.groq.com/openai/v1"
    GROQ_CHUNK_SIZE: int = 8
    GROQ_MAX_TOKENS: int = 4096
    GROQ_TEMPERATURE: float = 0.1

    # HuggingFace Configuration
    HF_LLM_MODEL: str = "HuggingFaceH4/zephyr-7b-beta"
    HF_TOKEN: str | None = None

    # Shared LLM Timeouts
    LLM_TIMEOUT_SECONDS: float = 900.0       
    LLM_READ_TIMEOUT_SECONDS: float = 600.0  
    LLM_CONNECT_TIMEOUT_SECONDS: float = 15.0
    LLM_MAX_TERMS_PER_CLAUSE: int = 5
    LLM_CHUNK_SIZE: int = 3

    MAX_UPLOAD_SIZE_MB: int = 20
    UPLOAD_DIR: Path = Path("uploads")

    RATE_LIMIT_PER_MINUTE: int = 30

    LOG_LEVEL: str = "INFO"


@lru_cache
def get_settings() -> Settings:
    return Settings()
