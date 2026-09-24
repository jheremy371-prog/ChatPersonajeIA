from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.database.database import SessionLocal
from app.models import models
from app.core.lorebook import agregar_entrada_lore

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
    
    return {"estado": "éxito"}


# --- ENDPOINTS DE MENSAJES (NUEVOS) ---
@router.delete("/api/mensajes/{id_mensaje}")
def eliminar_mensaje(id_mensaje: int, db: Session = Depends(get_db)):
    mensaje = db.query(models.Mensaje).filter(models.Mensaje.id == id_mensaje).first()
    if not mensaje:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
        
    db.delete(mensaje)
    db.commit()

    return {"estado": "éxito", "detalle": "Mensaje eliminado"}

@router.put("/api/mensajes/{id_mensaje}")
def editar_mensaje(id_mensaje: int, req: MensajeUpdate, db: Session = Depends(get_db)):
    mensaje = db.query(models.Mensaje).filter(models.Mensaje.id == id_mensaje).first()
    if not mensaje:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    
    mensaje.contenido = req.contenido
    db.commit()
        
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

# --- ENDPOINT DE MULTIVERSO (BIFURCACIÓN TEMPORAL) ---
# Reemplaza el endpoint de clonación al final de rutas_historia.py

@router.post("/api/escenas/{id_escena}/clonar/{id_mensaje}")
def clonar_linea_temporal(id_escena: int, id_mensaje: int, db: Session = Depends(get_db)):
    escena_orig = db.query(models.Escena).filter(models.Escena.id == id_escena).first()
    if not escena_orig:
        raise HTTPException(status_code=404, detail="Escena no encontrada")

    # 1. Creamos la nueva rama que apunta al pasado
    nueva_escena = models.Escena(
        nombre_escena=f"Hilos del Destino ({escena_orig.nombre_escena})",
        estado="activa",
        id_personaje=escena_orig.id_personaje, # Hereda el personaje
        perfil_jugador=escena_orig.perfil_jugador,
        contexto_inicial=escena_orig.contexto_inicial,
        resumen_contexto=escena_orig.resumen_contexto,
        # 👇 MAGIA DEL MULTIVERSO: Enlazamos con el punto de inflexión
        escena_padre_id=id_escena,
        mensaje_bifurcacion_id=id_mensaje 
    )
    db.add(nueva_escena)
    db.commit()
    db.refresh(nueva_escena)

    # Ya no clonamos ni un solo mensaje, ni una entidad, ni una crónica. 
    # Todo se leerá dinámicamente. Ahorro de base de datos = 100%.
    return {"estado": "éxito", "nueva_escena_id": nueva_escena.id}