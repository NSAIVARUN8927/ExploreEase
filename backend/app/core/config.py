import os

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "ExploreEase API"
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = "CHANGE-ME-IN-PRODUCTION-USE-A-LONG-RANDOM-SECRET"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    DATABASE_URL: str = "sqlite:///./exploreease.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def use_sqlite_when_database_url_is_blank(cls, value):
        # Keep SQLite as a convenient local-development fallback.
        if value is None or (isinstance(value, str) and not value.strip()):
            return "sqlite:///./exploreease.db"
        value = value.strip()
        # Explicitly select the installed psycopg v3 SQLAlchemy driver.
        if value.startswith("postgres://"):
            value = value.replace("postgres://", "postgresql+psycopg://", 1)
        elif value.startswith("postgresql://"):
            value = value.replace("postgresql://", "postgresql+psycopg://", 1)
        return value

    @model_validator(mode="after")
    def require_persistent_database_on_render(self):
        if os.getenv("RENDER", "").lower() == "true" and self.DATABASE_URL.startswith("sqlite"):
            raise ValueError(
                "Render requires a persistent PostgreSQL DATABASE_URL. "
                "Set the Neon connection string in the backend service Environment."
            )
        return self

    @field_validator("API_V1_PREFIX")
    @classmethod
    def normalize_api_prefix(cls, value: str) -> str:
        value = value.strip()
        if not value.startswith("/"):
            value = f"/{value}"
        return value.rstrip("/") or "/api/v1"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
