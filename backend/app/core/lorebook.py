import re
from functools import lru_cache
import chromadb
from chromadb.utils import embedding_functions

# 1. Inicialización del cliente persistente de ChromaDB para guardar la base de datos vectorial en disco
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Usar una función de embeddings explícita para transformar textos en vectores matemáticos
default_ef = embedding_functions.DefaultEmbeddingFunction()

# Crear o recuperar la colección aislada para el Lorebook
collection = chroma_client.get_or_create_collection(
    name="lorebook", 
    embedding_function=default_ef
)

def limpiar_query(query: str) -> str:
    """
    Elimina marcas de rol (*acción*, [instrucciones], -diálogos-) de la consulta del usuario.
    Esto permite que la búsqueda vectorial se enfoque únicamente en conceptos clave y evite ruido.
    """
    # Usa expresiones regulares para eliminar texto entre asteriscos o corchetes
    texto_limpio = re.sub(r'\*.*?\*|\[.*?\]', '', query)
    
    # Elimina guiones de diálogo y espacios sobrantes en los extremos
    texto_limpio = re.sub(r'[-–—]', ' ', texto_limpio).strip()
    
    # Si tras la limpieza el texto queda vacío, devuelve el query original para no perder la búsqueda
    return texto_limpio if texto_limpio else query

def agregar_entrada_lore(id_documento: str, texto_lore: str, id_escena: int):
    """
    Guarda un documento de lore asociándolo a un universo o escena específica (id_escena).
    """
    try:
        collection.add(
            documents=[texto_lore],
            metadatas=[{"id_escena": id_escena, "titulo": id_documento}],  # Guardamos el título en metadatos para evitar parsear IDs
            ids=[f"{id_escena}_{id_documento}"]      # ID único compuesto por escena y documento
        )
        
        # Invalidamos la caché de búsquedas al inyectar nueva información para mantener los datos actualizados
        buscar_contexto_cacheado.cache_clear()
        return "Lore guardado correctamente."
    except Exception as e:
        print(f"⚠️ Error al guardar en ChromaDB: {e}")
        return "Error al guardar el lore."

@lru_cache(maxsize=128)
def buscar_contexto_cacheado(query_limpio: str, id_escena: int, max_distancia: float = 1.1):
    """Consulta optimizada con caché en memoria y filtro por umbral de similitud."""
    try:
        resultados = collection.query(
            query_texts=[query_limpio],
            n_results=1,
            where={"id_escena": id_escena},
            include=["documents", "metadatas", "distances"] # CORRECCIÓN AQUÍ
        )
        
        if resultados and resultados.get('documents') and resultados['documents']:
            # Verificamos que la lista interna no esté vacía antes de acceder
            if len(resultados['documents'][0]) > 0:
                distancia = resultados['distances'][0][0]
                documento = resultados['documents'][0][0]
                
                # Extraemos la fuente desde los metadatos de forma segura en lugar de los IDs
                metadatos = resultados['metadatas'][0][0]
                nombre_doc = metadatos.get("titulo", "Documento RAG") if metadatos else "Documento RAG"
                
                if distancia <= max_distancia:
                    # Devolvemos un diccionario que la IA inyectará
                    return {"texto": documento, "fuente": nombre_doc} 
        return None
    except Exception as e:
        print(f"⚠️ Error al buscar en ChromaDB: {e}")
        return None

def buscar_contexto(query: str, id_escena: int):
    """Punto de entrada principal utilizado por main.py."""
    if not query or len(query.strip()) < 3:
        return []
        
    query_sanitizado = limpiar_query(query)
    resultado = buscar_contexto_cacheado(query_sanitizado, id_escena)
    
    # Retorna una lista con el diccionario adentro
    return [resultado] if resultado else []