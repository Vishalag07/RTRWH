from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "RTRWH-AR"
    app_env: str = "development"
    api_prefix: str = "/api"

    # Security settings
    secret_key: str = "change_me"
    access_token_expire_minutes: int = 60
    
    # CORS settings
    allowed_origins: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
    cors_allow_credentials: bool = True
    cors_max_age: int = 86400  # 24 hours
    
    # Rate limiting
    enable_rate_limit: bool = True
    rate_limit_requests: int = 100
    rate_limit_timeframe: int = 60  # seconds
    
    # Database
    database_url: str | None = None

    google_maps_api_key: str | None = None
    openweather_api_key: str | None = None
    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    
    # Aquifer and groundwater data API keys
    usgs_api_key: str | None = None
    groundwater_api_key: str | None = None
    
    # Soil data API keys
    soilgrids_api_key: str | None = None
    nasa_soil_api_key: str | None = None
    
    # Additional weather data sources
    weather_api_key: str | None = None
    accuweather_api_key: str | None = None

    model_config = {
        "env_file": ".env",
        "env_prefix": "",
        "extra": "ignore",
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()


