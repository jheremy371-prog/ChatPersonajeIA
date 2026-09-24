from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base

# 👇 NUEVA TABLA PUENTE PARA EL SISTEMA DE PARTY MULTI-AGENTE 👇
escena_personaje_asociacion = Table(
    'escena_personaje',
    Base.metadata,
    Column('id_escena', Integer, ForeignKey('escenas.id', ondelete="CASCADE"), primary_key=True),
    Column('id_personaje', Integer, ForeignKey('personajes.id', ondelete="CASCADE"), primary_key=True)
)

class Personaje(Base):
    __tablename__ = "personajes"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True, nullable=False)
    
    # NUEVO: Atributos extraídos del frontend y tarjetas Tavern
    universo = Column(String, nullable=True) 
    tematica = Column(String, nullable=True) 
    detalles_extra = Column(String, nullable=True) # Aquí guardaremos Personalidad y Reglas
    
    es_temporal = Column(Boolean, default=False)
    
    # Relación: Un personaje puede tener muchas escenas/partidas a la vez
    escenas = relationship("Escena", back_populates="personaje", cascade="all, delete-orphan")


class Escena(Base):
    __tablename__ = "escenas"
    id = Column(Integer, primary_key=True, index=True)
    id_personaje = Column(Integer, ForeignKey("personajes.id"), nullable=True) 
    
    nombre_escena = Column(String, nullable=False)
    estado = Column(String, default="activa") 
    perfil_jugador = Column(String, nullable=True) 
    contexto_inicial = Column(String, nullable=True, default="")
    resumen_contexto = Column(String, nullable=True)

    # 👇 NUEVO: LOS PILARES DEL MULTIVERSO 👇
    escena_padre_id = Column(Integer, ForeignKey("escenas.id"), nullable=True)
    mensaje_bifurcacion_id = Column(Integer, ForeignKey("mensajes.id"), nullable=True)

    # Relaciones base
    personaje = relationship("Personaje", back_populates="escenas")
    mensajes = relationship("Mensaje", back_populates="escena", cascade="all, delete-orphan", foreign_keys="[Mensaje.id_escena]")
    cronicas = relationship("CronicaHistoria", back_populates="escena", cascade="all, delete-orphan")
    entidades = relationship("Entidad", back_populates="escena", cascade="all, delete-orphan")

    # 👇 NUEVA RELACIÓN MULTI-AGENTE (LA PARTY) 👇
    party = relationship("Personaje", secondary=escena_personaje_asociacion, backref="escenas_activas")


class Mensaje(Base):
    __tablename__ = "mensajes"
    id = Column(Integer, primary_key=True, index=True)
    id_escena = Column(Integer, ForeignKey("escenas.id"))
    id_emisor = Column(Integer, nullable=False) 
    contenido = Column(String, nullable=False)
    fecha_hora = Column(DateTime(timezone=True), server_default=func.now())
    escena = relationship("Escena", back_populates="mensajes", foreign_keys=[id_escena])


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
    escena = relationship("Escena", back_populates="entidades")