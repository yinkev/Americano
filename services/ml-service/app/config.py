from pydantic import BaseModel
from functools import lru_cache
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    fastapi_env: str = os.getenv("FASTAPI_ENV", "development")
    debug: bool = os.getenv("DEBUG", "true").lower() == "true"
    database_url: Optional[str] = os.getenv("DATABASE_URL")

@lru_cache
def get_settings() -> Settings:
    return Settings()
