import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: Optional[str] = None
    openai_api_key: Optional[str] = None
    google_client_id: Optional[str] = None
    google_client_secret: Optional[str] = None
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"

    class Config:
        # Pydantic Settings will resolve .env relative to current working directory or absolute.
        # Since we run python from backend/ or travel/ backend/app, let's load from .env.
        env_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        env_file_encoding = "utf-8"

settings = Settings()
