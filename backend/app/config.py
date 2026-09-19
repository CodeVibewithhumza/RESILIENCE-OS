"""System Configuration using Pydantic Settings."""
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    DEBUG: bool = True
    ENVIRONMENT: str = "development"
    
    # Simulation
    SIMULATION_TICK_RATE_MS: int = 1000
    DEFAULT_SCENARIO: str = "baseline_hospital"
    MAX_CASCADE_DEPTH: int = 5
    
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
