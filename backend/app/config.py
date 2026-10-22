from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="allow")

    PROJECT_NAME: str = "TeamPulse"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./teampulse.db"
    
    # External Services
    TINYFISH_API_KEY: Optional[str] = None
    TINYFISH_SEARCH_URL: str = "https://api.search.tinyfish.ai"
    TINYFISH_FETCH_URL: str = "https://api.fetch.tinyfish.ai"
    
    # Optional LLM
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-1.5-flash"
    
    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

settings = Settings()
