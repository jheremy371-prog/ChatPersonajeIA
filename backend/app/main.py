from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import engine
from app.models import models
from app.core.config import settings
from app.routers import rutas_historia, rutas_ia 

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ESCUDO ANTI-COLAPSOS (MANEJADOR GLOBAL DE ERRORES) ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc).lower()
    
    # Traducimos errores técnicos a mensajes amigables para el jugador
    if "connection refused" in error_msg or "connecterror" in error_msg:
        mensaje_amigable = "⚠️ El motor neuronal está desconectado. ¿Encendiste Ollama?"
    elif "cuda out of memory" in error_msg or "memory" in error_msg:
        mensaje_amigable = "⚠️ Tu tarjeta gráfica se quedó sin memoria VRAM. Reinicia el servidor."
    elif "timeout" in error_msg:
        mensaje_amigable = "⚠️ El cerebro de la IA tardó demasiado en responder."
    else:
        mensaje_amigable = f"⚠️ Ocurrió una anomalía en el motor: {str(exc)}"
        
    print(f"\n[ESCUDO ACTIVO] Error interceptado: {error_msg}\n")
        
    return JSONResponse(
        status_code=503, # 503 = Servicio no disponible temporalmente
        content={"error": mensaje_amigable}
    )

# --- CONEXIÓN DE ROUTERS ---
app.include_router(rutas_historia.router)
app.include_router(rutas_ia.router)