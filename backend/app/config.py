from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "Divvy AI"
    DATABASE_URL: str = "sqlite+aiosqlite:///./divvy.db"
    SECRET_KEY: str = "divvy-ai-super-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

    # ML & AI Settings
    ML_MODELS_DIR: str = "./ml_models"
    PREDICTION_RETRAIN_INTERVAL_HOURS: int = 24
    ANOMALY_THRESHOLD: float = 0.7
    MIN_TRAINING_SAMPLES: int = 30

    # Open Banking
    OPEN_BANKING_API_URL: str = ""
    OPEN_BANKING_API_KEY: str = ""

    # LLM / Chat Assistant
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gpt-4o-mini"
    LLM_MAX_TOKENS: int = 1024

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
