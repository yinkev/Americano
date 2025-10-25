"""
Configuration Management with Pydantic Settings

Handles environment variables and application configuration.
Follows 12-factor app principles.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator, Field
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings from environment variables.

    Uses Pydantic V2 BaseSettings for validation and type safety.
    """

    # Environment
    ENVIRONMENT: str = "development"  # development, staging, production

    # Server
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    # Database
    DATABASE_URL: str
    DB_ADAPTER: str = "sqlalchemy"  # prisma | sqlalchemy (default: sqlalchemy)

    # CORS Origins (comma-separated string)
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS string into a list."""
        try:
            origins_str = self.CORS_ORIGINS.strip().strip('"\'')
            return [o.strip() for o in origins_str.split(",") if o.strip()]
        except Exception:
            return ["http://localhost:3000", "http://localhost:3001"]

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text

    # Model settings
    MODEL_VERSION: str = "v1.0"
    MODEL_TYPE: str = "rule_based"  # rule_based or logistic_regression
    MODEL_PATH: str = "./models"

    # Feature extraction cache TTL (seconds)
    CACHE_TTL_PROFILE: int = 3600  # 1 hour
    CACHE_TTL_PATTERNS: int = 43200  # 12 hours
    CACHE_TTL_METRICS: int = 1800  # 30 minutes

    # Performance
    MAX_WORKERS: int = 4
    BATCH_SIZE: int = 100

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        env_parse_enums=True
    )


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.

    Using lru_cache ensures Settings is only instantiated once.
    """
    return Settings()


# Global settings instance
settings = get_settings()
