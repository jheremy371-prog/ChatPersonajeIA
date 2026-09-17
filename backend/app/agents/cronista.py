from app.database.database import SessionLocal
from app.models import models
from app.core.llm import get_llm
from langchain_core.prompts import PromptTemplate

# [MODIFICADO] Añadimos "id_escena" como parámetro
def redactar_cronica(texto_usuario: str, texto_ia: str, personaje: str, id_escena: int):
    db = SessionLocal()
    try:
        llm = get_llm()
        
        # [MODIFICADO] Inyectamos la regla estricta de ESPAÑOL en el template
        prompt = PromptTemplate.from_template(
            "Eres el Cronista del motor Archivista. Tu tarea es observar un diálogo "
            "y transformarlo en un único párrafo narrativo en tercera persona, con tono de novela épica.\n\n"
            "REGLA DE ORO: ESCRIBE TODA LA CRÓNICA ESTRICTAMENTE EN ESPAÑOL FLUIDO Y NATIVO. "
            "ESTÁ TOTALMENTE PROHIBIDO USAR PALABRAS EN INGLÉS O SPANGLISH.\n\n"
            "El jugador dijo/hizo: {usuario}\n"
            "{personaje} respondió: {ia}\n\n"
            "Escribe la crónica narrativa exclusivamente en español:"
        )
        
        cadena = prompt | llm
        resultado = cadena.invoke({"usuario": texto_usuario, "ia": texto_ia, "personaje": personaje})
        
        nueva_cronica = models.CronicaHistoria(
            id_escena=id_escena, 
            contenido_narrativo=resultado.content
        )
        db.add(nueva_cronica)
        db.commit()
        
        print(f"📝 [Cronista] Nueva crónica guardada en la escena {id_escena}.")
        
    except Exception as e:
        print(f"❌ [Cronista] Ocurrió un error al redactar: {e}")
    finally:
        db.close()