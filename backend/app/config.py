from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "dev"
    database_url: str = "sqlite:///./incognito.db"
    signing_key_b64: str = ""
    credential_ttl_seconds: int = 900
    timestamp_bucket_seconds: int = 3600
    rate_limit_redeem: str = "10/minute"
    rate_limit_submit: str = "20/minute"
    rate_limit_admin_login: str = "5/minute"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
