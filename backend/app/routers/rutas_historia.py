from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.database.database import SessionLocal
from app.models import models
from app.core.lorebook import agregar_entrada_lore

# 👇 Importamos la memoria RAM viva de LangChain para poder limpiarla
from app.routers.rutas_ia import cadenas_activas 

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- MODELOS PYDANTIC ---
class EscenaCreate(BaseModel):
    nombre: str
class EscenaUpdate(BaseModel):
    nombre: str
class EntidadCreate(BaseModel):
    id_escena: int
    nombre: str
    tipo: str
    descripcion: str
class LoreRequest(BaseModel):
    id_escena: int
    id_documento: str
    texto_lore: str
class MensajeUpdate(BaseModel):
    contenido: str

# --- ENDPOINTS DE ESCENAS ---
@router.get("/api/escenas")
def obtener_escenas(db: Session = Depends(get_db)):
    escenas = db.query(models.Escena).all()
    if not escenas: 
        e = models.Escena(nombre_escena="Aventura 1", estado="activa")
        db.add(e)
        db.commit()
        db.refresh(e)
        escenas = [e]
    return [{"id": e.id, "nombre": e.nombre_escena} for e in escenas]

@router.post("/api/escenas")
def crear_escena(req: EscenaCreate, db: Session = Depends(get_db)):
    e = models.Escena(nombre_escena=req.nombre, estado="activa")
    db.add(e)
    db.commit()
    db.refresh(e)
    return {"id": e.id, "nombre": e.nombre_escena}

@router.put("/api/escenas/{id_escena}")
def renombrar_escena(id_escena: int, req: EscenaUpdate, db: Session = Depends(get_db)):
    e = db.query(models.Escena).filter(models.Escena.id == id_escena).first()
    if e:
        e.nombre_escena = req.nombre
        db.commit()
        return {"estado": "éxito"}
    return {"error": "No encontrada"}

@router.delete("/api/escenas/{id_escena}")
def eliminar_escena(id_escena: int, db: Session = Depends(get_db)):
    escena = db.query(models.Escena).filter(models.Escena.id == id_escena).first()
    if not escena: return {"error": "Escena no encontrada"}
    
    db.query(models.Mensaje).filter(models.Mensaje.id_escena == id_escena).delete()
    db.query(models.Entidad).filter(models.Entidad.id_escena == id_escena).delete()
    db.query(models.CronicaHistoria).filter(models.CronicaHistoria.id_escena == id_escena).delete()
    db.delete(escena)
    db.commit()
    
    # 🧹 ELIMINADOR DE FANTASMAS EN RAM (Aventura Completa)
    llave = f"escena_{id_escena}"
    if llave in cadenas_activas:
        del cadenas_activas[llave]

    return {"estado": "éxito"}


# --- ENDPOINTS DE MENSAJES (NUEVOS) ---
@router.delete("/api/mensajes/{id_mensaje}")
def eliminar_mensaje(id_mensaje: int, db: Session = Depends(get_db)):
    mensaje = db.query(models.Mensaje).filter(models.Mensaje.id == id_mensaje).first()
    if not mensaje:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
        
    id_escena = mensaje.id_escena 
    
    db.delete(mensaje)
    db.commit()

    # 🧹 ELIMINADOR DE FANTASMAS EN RAM (Mensaje Individual)
    llave = f"escena_{id_escena}"
    if llave in cadenas_activas:
        del cadenas_activas[llave] # Obliga a LangChain a olvidar y recargar desde SQLite

    return {"estado": "éxito", "detalle": "Mensaje y caché eliminados"}

@router.put("/api/mensajes/{id_mensaje}")
def editar_mensaje(id_mensaje: int, req: MensajeUpdate, db: Session = Depends(get_db)):
    mensaje = db.query(models.Mensaje).filter(models.Mensaje.id == id_mensaje).first()
    if not mensaje:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    
    mensaje.contenido = req.contenido
    id_escena = mensaje.id_escena
    db.commit()

    # 🧹 ELIMINADOR DE FANTASMAS EN RAM (Al editar también reseteamos memoria)
    llave = f"escena_{id_escena}"
    if llave in cadenas_activas:
        del cadenas_activas[llave] 
        
    return {"estado": "éxito"}


# --- ENDPOINTS DE LORE Y COMPENDIO ---
@router.post("/api/entidades")
def crear_entidad(req: EntidadCreate, db: Session = Depends(get_db)):
    nueva_entidad = models.Entidad(id_escena=req.id_escena, nombre=req.nombre, tipo=req.tipo, descripcion=req.descripcion)
    db.add(nueva_entidad)
    db.commit()
    return {"estado": "éxito"}

@router.get("/api/entidades/{id_escena}")
def obtener_entidades(id_escena: int, db: Session = Depends(get_db)):
    entidades = db.query(models.Entidad).filter(models.Entidad.id_escena == id_escena).all()
    return [{"id": e.id, "nombre": e.nombre, "tipo": e.tipo, "descripcion": e.descripcion} for e in entidades]

@router.post("/api/lore")
def guardar_lore(req: LoreRequest):
    agregar_entrada_lore(req.id_documento, req.texto_lore, req.id_escena) 
    return {"estado": "éxito"}


# --- ENDPOINTS DE LECTURA Y BACKUP ---
@router.get("/api/cronicas/{id_escena}")
def obtener_cronicas(id_escena: int, db: Session = Depends(get_db)):
    cronicas = db.query(models.CronicaHistoria).filter(models.CronicaHistoria.id_escena == id_escena).order_by(models.CronicaHistoria.id.asc()).all()
    return [{"id": c.id, "capitulo": c.titulo_capitulo, "contenido": c.contenido_narrativo} for c in cronicas]

@router.get("/api/escenas/{id_escena}/exportar")
def exportar_escena(id_escena: int, db: Session = Depends(get_db)):
    escena = db.query(models.Escena).filter(models.Escena.id == id_escena).first()
    if not escena: return {"error": "Escena no encontrada"}
    
    mensajes = db.query(models.Mensaje).filter(models.Mensaje.id_escena == id_escena).order_by(models.Mensaje.id.asc()).all()
    cronicas = db.query(models.CronicaHistoria).filter(models.CronicaHistoria.id_escena == id_escena).order_by(models.CronicaHistoria.id.asc()).all()
    entidades = db.query(models.Entidad).filter(models.Entidad.id_escena == id_escena).all()
    
    export_data = {
        "aventura": escena.nombre_escena,
        "fecha_exportacion": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "entidades": [{"nombre": e.nombre, "tipo": e.tipo, "descripcion": e.descripcion} for e in entidades],
        "mensajes": [{"emisor": "Jugador" if m.id_emisor == 0 else "IA", "contenido": m.contenido} for m in mensajes],
        "cronicas": [{"capitulo": c.titulo_capitulo, "contenido": c.contenido_narrativo} for c in cronicas]
    }
    return export_data