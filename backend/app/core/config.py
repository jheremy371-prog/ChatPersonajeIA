from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Tus variables existentes (asegúrate de que los nombres coincidan con tu .env)
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"
    db_url: str = "sqlite:///./archivista.db"
    
    # Añade las variables que estaban causando el error
    frontend_url: str = "http://localhost:5173"
    rag_top_k: int = 3
    rag_max_distance: float = 1.1

    # Esta es la parte clave: le dice a Pydantic que ignore cualquier otra
    # variable de entorno que no esté definida explícitamente arriba
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore" # Cambia el comportamiento estricto
    )

settings = Settings()