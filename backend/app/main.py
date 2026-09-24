import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Importar routers y base de datos
from app.routers import rutas_ia, rutas_historia
from app.database.database import engine
from app.models import models

# Crear tablas (En la Fase 7 usaremos Alembic para migraciones reales)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Archivista Engine", version="2.0.0")

# --- 1. CORS SEGURO (Punto 6 de la auditoría) ---
# Bloqueamos el acceso global. Solo permitimos a tu frontend local de Vite (5173).
# Si el día de mañana subes esto a internet, cambiarás esta variable de entorno.
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"], # Restringimos métodos explícitos
    allow_headers=["*"],
)

# --- 2. MANEJO DE ERRORES PROFESIONAL (Puntos 15 y 16) ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Atrapa cualquier error no controlado (bugs, caídas de base de datos).
    Loguea el error real en la terminal del desarrollador, pero le envía
    un mensaje genérico y seguro al frontend con código 500.
    """
    # 1. Mostrar el error detallado SOLO en la terminal del servidor
    print(f"🚨 ERROR INTERNO CRÍTICO: {str(exc)}")
    
    # 2. Enviar respuesta segura al cliente
    return JSONResponse(
        status_code=500,
        content={"error": "Ocurrió un error interno en el motor. Revisa los logs del servidor."}
    )

# Registrar rutas
app.include_router(rutas_ia.router)
app.include_router(rutas_historia.router)