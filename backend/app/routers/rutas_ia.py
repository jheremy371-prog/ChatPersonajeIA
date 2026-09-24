import json
import os
import tempfile
import shutil

from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage
from fastapi.responses import StreamingResponse

from app.database.database import SessionLocal
from app.models import models
from app.core.llm import crear_cadena_personaje, get_llm  
from app.core.lorebook import buscar_contexto 
from app.agents.cronista import redactar_cronica
from app.core.tavern import extraer_datos_personaje

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

class TextoDirectorRequest(BaseModel):
    id_escena: int 
    texto_crudo: str

class SintetizarRequest(BaseModel):
    id_escena: int
    memoria_actual: str

class ExtraerEntidadesRequest(BaseModel):
    id_escena: int 
    texto: str

class OrquestadorRequest(BaseModel):
    id_escena: int
    mensaje: str
    personajes_presentes: list[str]

@router.post("/api/chat")
def chat_con_personaje(req: MensajeTest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    
    # 1. RECUPERAR DATOS Y SINCRONIZAR SQLITE
    escena = db.query(models.Escena).filter(models.Escena.id == req.id_escena).first()
    if not escena:
        raise HTTPException(status_code=404, detail="Escena no encontrada")
        
    if not escena.id_personaje:
        nuevo_personaje = models.Personaje(nombre=req.personaje or "Desconocido")
        db.add(nuevo_personaje)
        db.commit()
        db.refresh(nuevo_personaje)
        escena.id_personaje = nuevo_personaje.id
        db.commit()
        db.refresh(escena)
        
    personaje_db = escena.personaje
    
    if req.personaje: personaje_db.nombre = req.personaje
    if req.universo: personaje_db.universo = req.universo
    if req.tematica: personaje_db.tematica = req.tematica
    if req.detalles_extra: personaje_db.detalles_extra = req.detalles_extra
    if req.perfil_jugador: escena.perfil_jugador = req.perfil_jugador
    if req.memoria_rol: escena.resumen_contexto = req.memoria_rol
    db.commit()

    # 2. CONTEXT BUILDER: Construimos el cerebro inyectando todo en el Sistema, NO en el usuario.
    contextos = buscar_contexto(req.mensaje, req.id_escena)
    texto_lore = contextos[0]["texto"] if contextos else ""
    fuente_lore = contextos[0]["fuente"] if contextos else None

    system_prompt = (
        f"Eres {personaje_db.nombre} del universo de '{personaje_db.universo}'.\n"
        f"Entorno: {personaje_db.tematica}.\n\n"
        "[REGLAS CANÓNICAS ABSOLUTAS]\n"
        "1. Eres este personaje y hablas en primera persona.\n"
        "2. Los textos entre asteriscos (*) del jugador son HECHOS INMUTABLES. Reacciona a ellos obligatoriamente.\n"
        "3. FORMATO: Tu diálogo hablado SIEMPRE va primero entre guiones (—). Tus acciones van ABAJO en un nuevo párrafo. NUNCA uses metarrol. Solo actúa.\n"
    )

    # Inyecciones modulares directas al subconsciente de la IA
    if personaje_db.detalles_extra:
        system_prompt += f"\n[PERSONALIDAD Y REGLAS DEL PERSONAJE]\n{personaje_db.detalles_extra}\n"
    if escena.perfil_jugador:
        system_prompt += f"\n[IDENTIDAD DEL JUGADOR]\n{escena.perfil_jugador}\n"
    if escena.resumen_contexto:
        system_prompt += f"\n[ESTADO DEL MUNDO ACTUAL (MEMORIA)]\n{escena.resumen_contexto}\n"
    if texto_lore:
        system_prompt += f"\n[LORE CONFIDENCIAL RECUPERADO (RAG)]\n{texto_lore}\n"

    chain = crear_cadena_personaje(system_prompt)
    
    # 3. RECARGAR HISTORIAL DE SQLITE (CON SOPORTE MULTIVERSO)
    def recolectar_mensajes_ancestros(esc):
        mensajes_propios = db.query(models.Mensaje).filter(models.Mensaje.id_escena == esc.id).all()
        if esc.escena_padre_id and esc.mensaje_bifurcacion_id:
            padre = db.query(models.Escena).filter(models.Escena.id == esc.escena_padre_id).first()
            if padre:
                historia_pasada = recolectar_mensajes_ancestros(padre)
                historia_recortada = [m for m in historia_pasada if m.id <= esc.mensaje_bifurcacion_id]
                return historia_recortada + mensajes_propios
        return mensajes_propios

    historial_completo = recolectar_mensajes_ancestros(escena)
    historial_completo.sort(key=lambda x: x.id)

    # Si estamos regenerando, ignoramos la última mala respuesta de la IA
    if req.regenerar and historial_completo:
        historial_completo.pop()

    # Tomamos solo los últimos 8 mensajes para no saturar los tokens de LangChain
    historial_reciente = historial_completo[-8:]

    for msg in historial_reciente:
        if msg.id_emisor == 0: 
            chain.chat_history.append(HumanMessage(content=msg.contenido))
        else: 
            chain.chat_history.append(AIMessage(content=msg.contenido))  

    # 4. EL MENSAJE DEL USUARIO AHORA VA LIMPIO Y PURO
    mensaje_puro = req.mensaje
    
    if not req.regenerar:
        msg_usuario = models.Mensaje(id_escena=req.id_escena, id_emisor=0, contenido=mensaje_puro)
        db.add(msg_usuario)
        db.commit()

    def generador_streaming():
        respuesta_completa = ""
        if fuente_lore:
            yield f"data: {json.dumps({'tipo': 'lore', 'fuente_lore': fuente_lore})}\n\n"

        try:
            # Mandamos el mensaje puro. La memoria_rol_actual va vacía porque ya está en el System Prompt
            for chunk in chain.stream({"user_input": mensaje_puro, "memoria_rol_actual": ""}):
                texto_fragmento = ""
                if isinstance(chunk, str): texto_fragmento = chunk
                elif isinstance(chunk, dict) and "text" in chunk: texto_fragmento = chunk["text"]
                elif hasattr(chunk, "content"): texto_fragmento = chunk.content
                
                if texto_fragmento:
                    respuesta_completa += texto_fragmento
                    yield f"data: {json.dumps({'tipo': 'chunk', 'texto': texto_fragmento})}\n\n"
                    
        except Exception as e:
            yield f"data: {json.dumps({'tipo': 'error', 'mensaje': 'Se cortó la conexión con Ollama.'})}\n\n"

        texto_para_db = f"[FUENTE_LORE:{fuente_lore}]\n{respuesta_completa}" if fuente_lore else respuesta_completa
        msg_ia = models.Mensaje(id_escena=req.id_escena, id_emisor=1, contenido=texto_para_db)
        db.add(msg_ia)
        db.commit()

        background_tasks.add_task(redactar_cronica, mensaje_puro, respuesta_completa, req.personaje, req.id_escena)
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generador_streaming(), 
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
    )

# Reemplaza la función obtener_historial en rutas_ia.py

@router.get("/api/chat/historial/{id_escena}")
def obtener_historial(id_escena: int, db: Session = Depends(get_db)):
    escena_actual = db.query(models.Escena).filter(models.Escena.id == id_escena).first()
    if not escena_actual: return {"mensajes": [], "config": {}}
    
    # 1. Función recursiva para viajar por el multiverso y unir los mensajes
    def recolectar_mensajes_ancestros(escena):
        mensajes_propios = db.query(models.Mensaje).filter(models.Mensaje.id_escena == escena.id).all()
        
        # Si esta escena es una rama alternativa, buscamos el pasado en su padre
        if escena.escena_padre_id and escena.mensaje_bifurcacion_id:
            padre = db.query(models.Escena).filter(models.Escena.id == escena.escena_padre_id).first()
            if padre:
                # Obtenemos la historia del padre, pero la CORTAMOS en el punto de bifurcación
                historia_pasada = recolectar_mensajes_ancestros(padre)
                historia_recortada = [m for m in historia_pasada if m.id <= escena.mensaje_bifurcacion_id]
                return historia_recortada + mensajes_propios
                
        return mensajes_propios

    # 2. Ejecutamos la recolección temporal
    historial_completo = recolectar_mensajes_ancestros(escena_actual)
    
    # Ordenamos por ID para asegurar la línea de tiempo correcta
    historial_completo.sort(key=lambda x: x.id)
    
    config = {
        "personaje": escena_actual.personaje.nombre if escena_actual.personaje else "",
        "universo": escena_actual.personaje.universo if escena_actual.personaje else "",
        "tematica": escena_actual.personaje.tematica if escena_actual.personaje else "",
        "detalles_extra": escena_actual.personaje.detalles_extra if escena_actual.personaje else "",
        "perfil_jugador": escena_actual.perfil_jugador or "",
        "memoria_rol": escena_actual.resumen_contexto or ""
    }
    
    return {
        "mensajes": [{"id": m.id, "emisor": "Jugador" if m.id_emisor == 0 else "IA", "contenido": m.contenido} for m in historial_completo],
        "config": config
    }

@router.post("/api/director_magico")
def analizar_texto_director(req: TextoDirectorRequest, db: Session = Depends(get_db)):
    llm = get_llm()
    prompt = (
        "Actúa como un extractor de metadatos. Devuelve ÚNICAMENTE un JSON puro y válido con estas claves exactas: "
        '{"personaje": "", "universo": "", "tematica": "", "detalles_extra": "", "titulo_partida": ""}. '
        f"Texto: {req.texto_crudo}"
    )
    try:
        res = llm.invoke(prompt)
        datos = json.loads(res.content.replace("```json", "").replace("```", "").strip())
        
        escena = db.query(models.Escena).filter(models.Escena.id == req.id_escena).first()
        if escena:
            escena.contexto_inicial = req.texto_crudo
            # Si el director adivina el personaje, lo guardamos en la DB
            if not escena.id_personaje and "personaje" in datos:
                nuevo_pj = models.Personaje(nombre=datos["personaje"], universo=datos.get("universo"), tematica=datos.get("tematica"), detalles_extra=datos.get("detalles_extra"))
                db.add(nuevo_pj)
                db.commit()
                db.refresh(nuevo_pj)
                escena.id_personaje = nuevo_pj.id
            elif escena.personaje:
                if "universo" in datos: escena.personaje.universo = datos["universo"]
                if "tematica" in datos: escena.personaje.tematica = datos["tematica"]
            db.commit()
            
        return datos
    except Exception as e:
        return {"error": str(e)}

@router.post("/api/sintetizar_memoria")
def sintetizar_memoria(req: SintetizarRequest, db: Session = Depends(get_db)):
    escena = db.query(models.Escena).filter(models.Escena.id == req.id_escena).first()
    mensajes = db.query(models.Mensaje).filter(models.Mensaje.id_escena == req.id_escena).order_by(models.Mensaje.id.desc()).limit(15).all()
    mensajes.reverse()
    historial_texto = "\n".join([f"{'Jugador' if m.id_emisor==0 else 'IA'}: {m.contenido}" for m in mensajes])
    llm = get_llm()
    
    memoria_anterior = req.memoria_actual if req.memoria_actual.strip() else "[MISION ACTUAL]\n..."
    prompt = f"""Eres un Notario de Continuidad. Copia el DOCUMENTO ACTUAL y añade los nuevos eventos debajo. Al final crea un [REGISTRO DE CAMBIOS].\n\nDOCUMENTO ACTUAL:\n{memoria_anterior}\n\nÚLTIMOS EVENTOS:\n{historial_texto}"""

    try:
        resultado = llm.invoke(prompt)
        nueva_mem = resultado.content.strip()
        
        # GUARDAMOS LA MEMORIA EN SQLITE DEFINITIVAMENTE
        if escena:
            escena.resumen_contexto = nueva_mem
            db.commit()
            
        return {"estado": "éxito", "nueva_memoria": nueva_mem}
    except Exception as e:
        return {"error": str(e)}

@router.post("/api/tavern/leer_tarjeta")
async def leer_tarjeta_tavern(archivo: UploadFile = File(...)):
    # 1. Validación estricta de MIME type y extensión
    if archivo.content_type not in ["image/png", "image/webp"] and not archivo.filename.lower().endswith(('.png', '.webp')):
        return {"error": "Solo se permiten imágenes PNG o WEBP de Tavern."}
        
    # 2. Uso de Tempfile seguro (evita colisiones y lee por fragmentos)
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
            shutil.copyfileobj(archivo.file, tmp)
            ruta_temporal = tmp.name
            
        # 3. Extraer la data
        resultado = extraer_datos_personaje(ruta_temporal)
        
        # 4. Limpieza garantizada
        if os.path.exists(ruta_temporal):
            os.remove(ruta_temporal)
            
        return resultado
        
    except Exception as e:
        if 'ruta_temporal' in locals() and os.path.exists(ruta_temporal):
            os.remove(ruta_temporal)
        return {"error": f"Error al procesar la tarjeta: {str(e)}"}

@router.post("/api/extraer_entidades")
def extraer_entidades_magicas(req: ExtraerEntidadesRequest, db: Session = Depends(get_db)):
    llm = get_llm()
    prompt = (
        "Actúa como un creador de perfiles enciclopédicos para un juego de rol. "
        "Lee el siguiente texto y extrae o inventa perfiles MUY detallados para los personajes, lugares u objetos mencionados. "
        "Incluye edad, universo, apariencia, personalidad o historia si es aplicable. "
        "Devuelve ÚNICAMENTE un JSON puro y válido con esta estructura exacta: "
        '{"entidades": [{"nombre": "Ej: Batman", "tipo": "Personaje/Lugar/Objeto", "descripcion": "..."}]} '
        f"Texto del usuario: {req.texto}"
    )
    
    try:
        res = llm.invoke(prompt)
        datos = json.loads(res.content.replace("```json", "").replace("```", "").strip())
        
        entidades_creadas = []
        for ent in datos.get("entidades", []):
            nueva_entidad = models.Entidad(
                id_escena=req.id_escena, 
                nombre=ent["nombre"], 
                tipo=ent["tipo"], 
                descripcion=ent["descripcion"]
            )
            db.add(nueva_entidad)
            entidades_creadas.append(ent["nombre"])
            
        db.commit()
        return {"estado": "éxito", "creadas": entidades_creadas}
    except Exception as e:
        return {"error": str(e)}  

@router.post("/api/orquestador")
def orquestador_party(req: OrquestadorRequest, db: Session = Depends(get_db)):
    # Obtenemos un poco de contexto reciente para que el Orquestador sepa de qué hablan
    mensajes = db.query(models.Mensaje).filter(models.Mensaje.id_escena == req.id_escena).order_by(models.Mensaje.id.desc()).limit(5).all()
    mensajes.reverse()
    historial = "\n".join([f"{'Jugador' if m.id_emisor==0 else 'IA'}: {m.contenido}" for m in mensajes])
    
    llm = get_llm()
    prompt = f"""
    Actúa como el Orquestador de un chat grupal de rol.
    Personajes presentes en la sala: {', '.join(req.personajes_presentes)}.
    
    Últimos mensajes de la conversación:
    {historial}
    
    Nuevo mensaje del jugador: "{req.mensaje}"
    
    TÚ TRABAJO: Basado en el último mensaje y el contexto, decide lógicamente quién de los personajes presentes DEBE responder.
    - Si el jugador nombra a alguien directamente, elige a ese.
    - Si es una pregunta general, elige al personaje cuya personalidad encaje mejor para hablar primero.
    
    Devuelve ÚNICAMENTE un JSON puro y válido con la clave "siguiente_turno" y el nombre exacto del personaje elegido.
    Ejemplo: {{"siguiente_turno": "{req.personajes_presentes[0]}"}}
    """
    
    try:
        res = llm.invoke(prompt)
        # Limpiamos posibles formatos de markdown que Ollama a veces añade
        datos = json.loads(res.content.replace("```json", "").replace("```", "").strip())
        return datos
    except Exception as e:
        # Fallback de seguridad: si la IA se confunde, le damos el turno al primero de la lista
        if req.personajes_presentes:
            return {"siguiente_turno": req.personajes_presentes[0], "aviso": "fallback"}
        return {"error": str(e)}  