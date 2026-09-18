import json
from datetime import datetime
from fastapi import FastAPI, Depends, BackgroundTasks, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage, AIMessage

from app.database.database import engine, SessionLocal
from app.models import models
from app.core.llm import crear_cadena_personaje, get_llm  
from app.core.lorebook import agregar_entrada_lore, buscar_contexto 
from app.agents.cronista import redactar_cronica
from app.core.tavern import extraer_datos_personaje

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Archivista Engine API", version="2.5.0 - Multiverso Estable")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- MODELOS ---
class MensajeTest(BaseModel):
    mensaje: str
    personaje: str
    universo: str 
    tematica: str
    detalles_extra: str = ""
    memoria_rol: str = ""  
    perfil_jugador: str = ""
    id_escena: int  
    regenerar: bool = False

class MensajeEdit(BaseModel):
    contenido: str

class LoreRequest(BaseModel):
    id_escena:int
    id_documento: str
    texto_lore: str

class TextoDirectorRequest(BaseModel):
    id_escena: int 
    texto_crudo: str

class EscenaCreate(BaseModel):
    nombre: str

class EscenaUpdate(BaseModel):
    nombre: str

class EntidadCreate(BaseModel):
    id_escena: int
    nombre: str
    tipo: str
    descripcion: str

class SintetizarRequest(BaseModel):
    id_escena: int
    memoria_actual: str

cadenas_activas = {}

# --- ENDPOINTS DEL MENÚ DESARROLLADOR ---
@app.post("/api/entidades")
def crear_entidad(req: EntidadCreate, db: Session = Depends(get_db)):
    nueva_entidad = models.Entidad(id_escena=req.id_escena, nombre=req.nombre, tipo=req.tipo, descripcion=req.descripcion)
    db.add(nueva_entidad)
    db.commit()
    return {"estado": "éxito"}

@app.get("/api/entidades/{id_escena}")
def obtener_entidades(id_escena: int, db: Session = Depends(get_db)):
    entidades = db.query(models.Entidad).filter(models.Entidad.id_escena == id_escena).all()
    return [{"id": e.id, "nombre": e.nombre, "tipo": e.tipo, "descripcion": e.descripcion} for e in entidades]

# --- ENDPOINTS DE ESCENAS ---
@app.get("/api/escenas")
def obtener_escenas(db: Session = Depends(get_db)):
    escenas = db.query(models.Escena).all()
    if not escenas: 
        e = models.Escena(nombre_escena="Aventura 1", estado="activa")
        db.add(e)
        db.commit()
        db.refresh(e)
        escenas = [e]
    return [{"id": e.id, "nombre": e.nombre_escena} for e in escenas]

@app.post("/api/escenas")
def crear_escena(req: EscenaCreate, db: Session = Depends(get_db)):
    e = models.Escena(nombre_escena=req.nombre, estado="activa")
    db.add(e)
    db.commit()
    db.refresh(e)
    return {"id": e.id, "nombre": e.nombre_escena}

@app.put("/api/escenas/{id_escena}")
def renombrar_escena(id_escena: int, req: EscenaUpdate, db: Session = Depends(get_db)):
    e = db.query(models.Escena).filter(models.Escena.id == id_escena).first()
    if e:
        e.nombre_escena = req.nombre
        db.commit()
        return {"estado": "éxito"}
    return {"error": "No encontrada"}

@app.delete("/api/escenas/{id_escena}")
def eliminar_escena(id_escena: int, db: Session = Depends(get_db)):
    escena = db.query(models.Escena).filter(models.Escena.id == id_escena).first()
    if not escena: return {"error": "Escena no encontrada"}
    db.query(models.Mensaje).filter(models.Mensaje.id_escena == id_escena).delete()
    db.query(models.Entidad).filter(models.Entidad.id_escena == id_escena).delete()
    db.query(models.CronicaHistoria).filter(models.CronicaHistoria.id_escena == id_escena).delete()
    db.delete(escena)
    db.commit()
    return {"estado": "éxito"}

# --- ENDPOINTS CORE ---
@app.post("/api/lore")
def guardar_lore(req: LoreRequest):
    resultado = agregar_entrada_lore(req.id_documento, req.texto_lore, req.id_escena) 
    return {"estado": "éxito"}

@app.post("/api/chat")
def chat_con_personaje(req: MensajeTest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    llave_personaje = f"{req.personaje}_{req.id_escena}"
    
    if req.regenerar and llave_personaje in cadenas_activas:
        cadenas_activas[llave_personaje].deshacer_ultimo_turno()

    if llave_personaje not in cadenas_activas:
        system_prompt = (
            f"Eres {req.personaje} del universo de '{req.universo}'. "
            f"Entorno: {req.tematica}. "
            "REGLAS CANÓNICAS ABSOLUTAS: "
            "1. Eres este personaje y hablas en primera persona. Nunca admitas ser una IA ni hables en tercera persona sobre 'el personaje'. "
            "2. Los textos entre asteriscos (*) o corchetes ([]) del jugador son HECHOS INMUTABLES. Ocurren sí o sí. Reacciona a ellos asumiéndolos en tu realidad de inmediato. "
            "3. FORMATO ESTRICTO DE RESPUESTA (ESTILO EMOCHI): "
            "   - Tu diálogo hablado SIEMPRE va primero, encerrado entre guiones (-). "
            "   - Tus acciones físicas, emociones y la descripción del entorno van ABAJO del diálogo, en un nuevo párrafo, SIN guiones y SIN asteriscos. "
            "   - NUNCA expliques tu formato. NUNCA uses metarrol ni frases como 'El personaje reacciona a la situación'. Limítate a actuar. "
            "   - PIENSA Y RESPONDE SOLO EN ESPAÑOL.\n\n"
            "EJEMPLO EXACTO DE CÓMO DEBES RESPONDER SIEMPRE A PARTIR DE AHORA:\n"
            "-¡Maldición, la policía nos encontró! ¡Muévete rápido, no dejes que te atrapen!-\n\n"
            "Mi respiración se acelera mientras corro detrás de ti, esquivando los escombros del escondite. Saco mi arma y miro de reojo la ventana, sintiendo el pánico en el pecho mientras los oficiales se acercan."
        )
        chain = crear_cadena_personaje(system_prompt)
        
        historial_db = db.query(models.Mensaje).filter(models.Mensaje.id_escena == req.id_escena).order_by(models.Mensaje.id.desc()).limit(8).all()
        historial_db.reverse()
        for msg in historial_db:
            if msg.id_emisor == 0:
                chain.chat_history.append(HumanMessage(content=msg.contenido))
            else:
                chain.chat_history.append(AIMessage(content=msg.contenido))
                
        cadenas_activas[llave_personaje] = chain
    
    chain = cadenas_activas[llave_personaje]
    contextos = buscar_contexto(req.mensaje, req.id_escena)
    
    inyeccion_memoria = f"\n\n[ESTADO DEL MUNDO ACTUAL:\n{req.memoria_rol}]" if req.memoria_rol else ""
    inyeccion_reglas = f"\n\n[REGLAS ABSOLUTAS:\n{req.detalles_extra}]" if req.detalles_extra else ""
    inyeccion_jugador = f"\n\n[IDENTIDAD DEL JUGADOR CON EL QUE HABLAS:\n{req.perfil_jugador}]" if req.perfil_jugador else ""
    inyeccion_lore = f"\n\n[LORE CONFIDENCIAL: {contextos[0]}]" if contextos else ""
    
    recordatorio_formato = (
        "\n\n[ORDEN DEL SISTEMA PARA ESTE TURNO: Responde EXCLUSIVAMENTE actuando la escena. "
        "Primero tu diálogo entre guiones -...- seguido de tu narración. "
        "TIENES ESTRICTAMENTE PROHIBIDO usar frases de metarrol como 'Esto es un hecho inmutable', "
        "'El personaje reacciona', o explicar tu propio formato. Solo actúa.]"
    )
    
    mensaje_para_ia = req.mensaje + inyeccion_memoria + inyeccion_reglas + inyeccion_jugador + inyeccion_lore + recordatorio_formato
    
    respuesta_ia = chain.predict(user_input=mensaje_para_ia, memoria_rol_actual=req.memoria_rol)

    if not req.regenerar:
        msg_usuario = models.Mensaje(id_escena=req.id_escena, id_emisor=0, contenido=req.mensaje)
        db.add(msg_usuario)
        
    msg_ia = models.Mensaje(id_escena=req.id_escena, id_emisor=1, contenido=respuesta_ia)
    db.add(msg_ia)
    db.commit()

    background_tasks.add_task(redactar_cronica, req.mensaje, respuesta_ia, req.personaje, req.id_escena)
    return {"respuesta": respuesta_ia}

@app.get("/api/chat/historial/{id_escena}")
def obtener_historial(id_escena: int, db: Session = Depends(get_db)):
    mensajes = db.query(models.Mensaje).filter(models.Mensaje.id_escena == id_escena).all()
    return {"mensajes": [{"id": m.id, "emisor": "Jugador" if m.id_emisor == 0 else "IA", "contenido": m.contenido} for m in mensajes]}

@app.post("/api/director_magico")
def analizar_texto_director(req: TextoDirectorRequest, db: Session = Depends(get_db)):
    llm = get_llm()
    prompt = (
        "Devuelve ÚNICAMENTE JSON puro. Claves exactas: "
        '{"personaje": "", "universo": "", "tematica": "", "detalles_extra": "", "titulo_partida": ""}\n'
        f"Texto: {req.texto_crudo}"
    )
    try:
        res = llm.invoke(prompt)
        datos = json.loads(res.content.replace("```json", "").replace("```", "").strip())
        escena = db.query(models.Escena).filter(models.Escena.id == req.id_escena).first()
        if escena:
            escena.contexto_inicial = req.texto_crudo
            db.commit()
        return datos
    except Exception as e:
        return {"error": str(e)}

# --- EL AGENTE NOTARIO (CONCATENACIÓN PURA EN PYTHON) ---
@app.post("/api/sintetizar_memoria")
def sintetizar_memoria(req: SintetizarRequest, db: Session = Depends(get_db)):
    mensajes = db.query(models.Mensaje).filter(models.Mensaje.id_escena == req.id_escena).order_by(models.Mensaje.id.desc()).limit(15).all()
    mensajes.reverse()
    historial_texto = "\n".join([f"{'Jugador' if m.id_emisor==0 else 'IA'}: {m.contenido}" for m in mensajes])
    llm = get_llm()
    memoria_anterior = req.memoria_actual if req.memoria_actual.strip() else "[MISION ACTUAL]\n..."

    prompt = f"""Eres un Notario de Continuidad para un juego de rol. 

INSTRUCCIONES ESTRICTAS:
1. REGLA DE ORO: Copia y mantén INTACTO todo el texto, formato, reglas e identidad del "DOCUMENTO ACTUAL". No borres ni modifiques las instrucciones del sistema.
2. Analiza los "ÚLTIMOS EVENTOS DEL CHAT" para detectar progresos de historia, nuevos objetos, o cambios en el entorno.
3. Añade esa nueva información de forma estructurada DEBAJO del texto original.
4. AL FINAL de tu respuesta, crea obligatoriamente una sección llamada [REGISTRO DE CAMBIOS] donde expliques en 1 o 2 líneas exactas qué información nueva acabas de añadir.

DOCUMENTO ACTUAL (¡NO BORRAR NI RESUMIR ESTE TEXTO!):
{memoria_anterior}

ÚLTIMOS EVENTOS DEL CHAT:
{historial_texto}

Reescribe el documento cumpliendo las instrucciones y añadiendo el [REGISTRO DE CAMBIOS]:"""

    try:
        resultado = llm.invoke(prompt)
        return {"estado": "éxito", "nueva_memoria": resultado.content.strip()}
    except Exception as e:
        return {"error": str(e)}

# --- ENDPOINT DEL VISOR DE CRÓNICAS ---
@app.get("/api/cronicas/{id_escena}")
def obtener_cronicas(id_escena: int, db: Session = Depends(get_db)):
    cronicas = db.query(models.CronicaHistoria).filter(models.CronicaHistoria.id_escena == id_escena).order_by(models.CronicaHistoria.id.asc()).all()
    return [{"id": c.id, "capitulo": c.titulo_capitulo, "contenido": c.contenido_narrativo} for c in cronicas]

# --- ENDPOINTS DE CONTROL DEL TIEMPO (EDITAR Y BORRAR MENSAJES) ---
@app.put("/api/mensajes/{id_mensaje}")
def editar_mensaje(id_mensaje: int, req: MensajeEdit, db: Session = Depends(get_db)):
    msg = db.query(models.Mensaje).filter(models.Mensaje.id == id_mensaje).first()
    if msg:
        msg.contenido = req.contenido
        db.commit()
        cadenas_activas.clear()
        return {"estado": "éxito"}
    return {"error": "Mensaje no encontrado"}

@app.delete("/api/mensajes/{id_mensaje}")
def borrar_mensaje(id_mensaje: int, db: Session = Depends(get_db)):
    msg = db.query(models.Mensaje).filter(models.Mensaje.id == id_mensaje).first()
    if msg:
        db.delete(msg)
        db.commit()
        cadenas_activas.clear()
        return {"estado": "éxito"}
    return {"error": "Mensaje no encontrado"}

# --- ENDPOINT DE EXPORTACIÓN (BACKUP JSON) ---
@app.get("/api/escenas/{id_escena}/exportar")
def exportar_escena(id_escena: int, db: Session = Depends(get_db)):
    escena = db.query(models.Escena).filter(models.Escena.id == id_escena).first()
    if not escena:
        return {"error": "Escena no encontrada"}
    
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

# --- ENDPOINT DEL LECTOR DE TARJETAS TAVERN PNG ---
@app.post("/api/tavern/leer_tarjeta")
async def leer_tarjeta_tavern(archivo: UploadFile = File(...)):
    if not archivo.filename.endswith('.png'):
        return {"error": "El archivo debe ser un PNG."}
        
    ruta_temporal = f"temp_{archivo.filename}"
    
    try:
        # Guardamos la imagen temporalmente para que PIL pueda leerla
        contenido = await archivo.read()
        with open(ruta_temporal, "wb") as f:
            f.write(contenido)
            
        resultado = extraer_datos_personaje(ruta_temporal)
        
        # Borramos el archivo temporal
        if os.path.exists(ruta_temporal):
            os.remove(ruta_temporal)
            
        return resultado
        
    except Exception as e:
        if os.path.exists(ruta_temporal):
            os.remove(ruta_temporal)
        return {"error": f"Ocurrió un error al procesar el archivo: {str(e)}"}