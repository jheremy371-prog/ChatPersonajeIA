from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base

class Personaje(Base):
    __tablename__ = "personajes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    es_temporal = Column(Boolean, default=False)
    system_prompt = Column(String, nullable=False)
    historia_fondo = Column(String, nullable=True)

class Escena(Base):
    __tablename__ = "escenas"
    id = Column(Integer, primary_key=True, index=True)
    nombre_escena = Column(String, nullable=False)
    estado = Column(String, default="activa") 
    contexto_inicial = Column(String, nullable=True, default="")
    resumen_contexto = Column(String, nullable=True)

    mensajes = relationship("Mensaje", back_populates="escena", cascade="all, delete-orphan")
    cronicas = relationship("CronicaHistoria", back_populates="escena", cascade="all, delete-orphan")

class Mensaje(Base):
    __tablename__ = "mensajes"
    id = Column(Integer, primary_key=True, index=True)
    id_escena = Column(Integer, ForeignKey("escenas.id"))
    
    # CORRECCIÓN: Eliminamos el ForeignKey. 0 = Jugador, 1 = IA.
    id_emisor = Column(Integer, nullable=False) 
    
    contenido = Column(String, nullable=False)
    fecha_hora = Column(DateTime(timezone=True), server_default=func.now())
    escena = relationship("Escena", back_populates="mensajes")

class CronicaHistoria(Base):
    __tablename__ = "cronicas_historia"
    id = Column(Integer, primary_key=True, index=True)
    id_escena = Column(Integer, ForeignKey("escenas.id"))
    titulo_capitulo = Column(String)
    contenido_narrativo = Column(String, nullable=False)
    fecha_generacion = Column(DateTime(timezone=True), server_default=func.now())
    escena = relationship("Escena", back_populates="cronicas")

class Entidad(Base):
    __tablename__ = "entidades"
    id = Column(Integer, primary_key=True, index=True)
    id_escena = Column(Integer, ForeignKey("escenas.id"))
    nombre = Column(String, index=True)
    tipo = Column(String)  
    descripcion = Column(String, nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())