import json
import os
from fastapi import APIRouter, Depends, BackgroundTasks, UploadFile, File
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

cadenas_activas = {}

@router.post("/api/chat")
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
    
    texto_lore = contextos[0]["texto"] if contextos else ""
    fuente_lore = contextos[0]["fuente"] if contextos else None
    
    inyeccion_memoria = f"\n\n[ESTADO DEL MUNDO ACTUAL:\n{req.memoria_rol}]" if req.memoria_rol else ""
    inyeccion_reglas = f"\n\n[REGLAS ABSOLUTAS:\n{req.detalles_extra}]" if req.detalles_extra else ""
    inyeccion_jugador = f"\n\n[IDENTIDAD DEL JUGADOR CON EL QUE HABLAS:\n{req.perfil_jugador}]" if req.perfil_jugador else ""
    inyeccion_lore = f"\n\n[LORE CONFIDENCIAL: {texto_lore}]" if texto_lore else "" 
    
    recordatorio_formato = (
        "\n\n[REGLAS MAESTRAS DEL MOTOR DE ROL (DE CUMPLIMIENTO OBLIGATORIO):\n"
        "1. LECTURA DEL JUGADOR: El jugador mezclará palabras habladas y acciones físicas. Las acciones físicas y gestos del jugador suelen ir entre asteriscos (*...*). DEBES analizar y reaccionar obligatoriamente a estas acciones de forma realista.\n"
        "2. TU FORMATO DE RESPUESTA: Responde EXCLUSIVAMENTE actuando la escena. Escribe tus diálogos entre guiones largos (—...—) y describe tus acciones en tercera persona.\n"
        "3. AUTONOMÍA ESTRICTA: Tienes ESTRICTAMENTE PROHIBIDO narrar los sentimientos, acciones, reacciones o diálogos del jugador. Solo tienes permitido controlar y describir a TU personaje.\n"
        "4. CERO METARROL: No uses frases como 'Esto es un hecho inmutable', ni des explicaciones de tus acciones como si fueras una IA. Solo actúa.]"
    )
    
    mensaje_para_ia = req.mensaje + inyeccion_memoria + inyeccion_reglas + inyeccion_jugador + inyeccion_lore + recordatorio_formato
    
    # 👇 A PARTIR DE AQUÍ INICIA LA LÓGICA DE STREAMING 👇
    
    # 1. Guardamos el mensaje del JUGADOR de inmediato antes de procesar la IA
    if not req.regenerar:
        msg_usuario = models.Mensaje(id_escena=req.id_escena, id_emisor=0, contenido=req.mensaje)
        db.add(msg_usuario)
        db.commit()

    # 2. Definimos el Generador de Streaming SSE
    def generador_streaming():
        respuesta_completa = ""
        
        # A. Emitimos la etiqueta del Lorebook primero si existe
        if fuente_lore:
            yield f"data: {json.dumps({'tipo': 'lore', 'fuente_lore': fuente_lore})}\n\n"

        try:
            # B. Transmitimos fragmento por fragmento (token por token)
            for chunk in chain.stream({"user_input": mensaje_para_ia, "memoria_rol_actual": req.memoria_rol}):
                
                # LangChain devuelve diferentes estructuras dependiendo del modelo, esto lo estandariza:
                texto_fragmento = ""
                if isinstance(chunk, str):
                    texto_fragmento = chunk
                elif isinstance(chunk, dict) and "text" in chunk:
                    texto_fragmento = chunk["text"]
                elif hasattr(chunk, "content"):
                    texto_fragmento = chunk.content
                
                if texto_fragmento:
                    respuesta_completa += texto_fragmento
                    yield f"data: {json.dumps({'tipo': 'chunk', 'texto': texto_fragmento})}\n\n"
                    
        except Exception as e:
            print(f"⚠️ Error en streaming: {e}")
            yield f"data: {json.dumps({'tipo': 'error', 'mensaje': 'Se cortó la conexión con Ollama.'})}\n\n"

        # C. Al terminar de hablar, guardamos todo en SQLite
        texto_para_db = f"[FUENTE_LORE:{fuente_lore}]\n{respuesta_completa}" if fuente_lore else respuesta_completa
        msg_ia = models.Mensaje(id_escena=req.id_escena, id_emisor=1, contenido=texto_para_db)
        db.add(msg_ia)
        db.commit()

        # D. Ejecutamos el agente Cronista síncronamente tras guardar
        try:
            redactar_cronica(req.mensaje, respuesta_completa, req.personaje, req.id_escena)
        except Exception as e:
            print(f"⚠️ Error al redactar crónica en streaming: {e}")

        # E. Señal de finalización para el Frontend
        yield "data: [DONE]\n\n"

    # 3. Retornamos la respuesta tipo Event-Stream
    return StreamingResponse(generador_streaming(), media_type="text/event-stream")

# ... (EL RESTO DE TUS ENDPOINTS SIGUEN EXACTAMENTE IGUAL) ...

@router.get("/api/chat/historial/{id_escena}")
def obtener_historial(id_escena: int, db: Session = Depends(get_db)):
    mensajes = db.query(models.Mensaje).filter(models.Mensaje.id_escena == id_escena).all()
    return {"mensajes": [{"id": m.id, "emisor": "Jugador" if m.id_emisor == 0 else "IA", "contenido": m.contenido} for m in mensajes]}

@router.post("/api/director_magico")
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

@router.post("/api/sintetizar_memoria")
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

DOCUMENTO ACTUAL:
{memoria_anterior}

ÚLTIMOS EVENTOS DEL CHAT:
{historial_texto}

Reescribe el documento cumpliendo las instrucciones y añadiendo el [REGISTRO DE CAMBIOS]:"""

    try:
        resultado = llm.invoke(prompt)
        return {"estado": "éxito", "nueva_memoria": resultado.content.strip()}
    except Exception as e:
        return {"error": str(e)}

@router.put("/api/mensajes/{id_mensaje}")
def editar_mensaje(id_mensaje: int, req: MensajeEdit, db: Session = Depends(get_db)):
    msg = db.query(models.Mensaje).filter(models.Mensaje.id == id_mensaje).first()
    if msg:
        msg.contenido = req.contenido
        db.commit()
        cadenas_activas.clear()
        return {"estado": "éxito"}
    return {"error": "Mensaje no encontrado"}

@router.delete("/api/mensajes/{id_mensaje}")
def borrar_mensaje(id_mensaje: int, db: Session = Depends(get_db)):
    msg = db.query(models.Mensaje).filter(models.Mensaje.id == id_mensaje).first()
    if msg:
        db.delete(msg)
        db.commit()
        cadenas_activas.clear()
        return {"estado": "éxito"}
    return {"error": "Mensaje no encontrado"}

@router.post("/api/tavern/leer_tarjeta")
async def leer_tarjeta_tavern(archivo: UploadFile = File(...)):
    if not archivo.filename.endswith('.png'):
        return {"error": "El archivo debe ser un PNG."}
        
    ruta_temporal = f"temp_{archivo.filename}"
    try:
        contenido = await archivo.read()
        with open(ruta_temporal, "wb") as f:
            f.write(contenido)
            
        resultado = extraer_datos_personaje(ruta_temporal)
        
        if os.path.exists(ruta_temporal):
            os.remove(ruta_temporal)
        return resultado
    except Exception as e:
        if os.path.exists(ruta_temporal):
            os.remove(ruta_temporal)
        return {"error": f"Ocurrió un error al procesar el archivo: {str(e)}"}