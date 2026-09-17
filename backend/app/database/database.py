from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# El archivo de la base de datos se creará en la raíz del backend con este nombre
SQLALCHEMY_DATABASE_URL = "sqlite:///./archivista.db"

# connect_args={"check_same_thread": False} es vital para usar SQLite con FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base de la cual heredarán nuestros modelos
Base = declarative_base()