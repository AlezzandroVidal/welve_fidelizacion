from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_ENV = Path(__file__).parent.parent.parent.parent / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT_ENV, extra="ignore")

    # MongoDB
    mongo_uri: str = "mongodb+srv://202211304_db_user:xIOqfhqvSR2GiruS@welve.yaus4t3.mongodb.net/?appName=welve"
    mongo_db: str = "welve"

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    # JWT
    secret_key: str = "dev-secret-key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # App
    environment: str = "development"
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()