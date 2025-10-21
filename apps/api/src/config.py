"""
Configuration module for the Americano Python API service.

Uses pydantic-settings for type-safe environment variable loading.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # OpenAI Configuration
    openai_api_key: str
    openai_model: str = "gpt-4"  # Will use GPT-5 when available
    openai_temperature: float = 0.3  # Low temperature for consistent evaluation
    openai_max_tokens: int = 2000  # Detailed feedback

    # Database Configuration (Story 4.6)
    database_url: str = "postgresql://kyin@localhost:5432/americano"

    # Application Configuration
    environment: Literal["development", "staging", "production"] = "development"
    log_level: Literal["debug", "info", "warning", "error"] = "info"
    api_host: str = "0.0.0.0"
    api_port: int = 8001  # Epic 4 port (see CLAUDE.md port allocation)

    # CORS Configuration (for Next.js integration - Epic 4 uses port 3001)
    cors_origins: list[str] = ["http://localhost:3001", "http://127.0.0.1:3001"]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Global settings instance
settings = Settings()
