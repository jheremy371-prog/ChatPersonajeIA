from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str
    VERSION: str
    
    OLLAMA_MODEL: str
    OLLAMA_TEMPERATURE: float
    OLLAMA_CTX_SIZE: int
    OLLAMA_REPEAT_PENALTY: float
    
    CHROMA_DB_PATH: str

    # Reemplazamos la clase Config por ConfigDict moderno de Pydantic V2
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()