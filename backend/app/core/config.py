from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str
    VERSION: str
    
    OLLAMA_MODEL: str
    OLLAMA_TEMPERATURE: float
    OLLAMA_CTX_SIZE: int
    OLLAMA_REPEAT_PENALTY: float
    
    CHROMA_DB_PATH: str

    class Config:
        env_file = ".env"

settings = Settings()