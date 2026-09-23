import re
from functools import lru_cache
import chromadb
from chromadb.utils import embedding_functions

# 1. Inicialización del cliente persistente de ChromaDB para guardar la base de datos vectorial en disco[cite: 3, 4]
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# Usar una función de embeddings explícita para transformar textos en vectores matemáticos[cite: 3, 4]
default_ef = embedding_functions.DefaultEmbeddingFunction()

# Crear o recuperar la colección aislada para el Lorebook[cite: 3, 4]
collection = chroma_client.get_or_create_collection(
    name="lorebook", 
    embedding_function=default_ef
)

def limpiar_query(query: str) -> str:
    """
    Elimina marcas de rol (*acción*, [instrucciones], -diálogos-) de la consulta del usuario.
    Esto permite que la búsqueda vectorial se enfoque únicamente en conceptos clave y evite ruido[cite: 3, 4].
    """
    # Nota explicativa: Usa expresiones regulares para eliminar texto entre asteriscos o corchetes[cite: 3, 4]
    texto_limpio = re.sub(r'\*.*?\*|\\[.*?\\]', '', query)
    
    # Nota explicativa: Elimina guiones de diálogo y espacios sobrantes en los extremos[cite: 3, 4]
    texto_limpio = re.sub(r'[-–—]', ' ', texto_limpio).strip()
    
    # Si tras la limpieza el texto queda vacío, devuelve el query original para no perder la búsqueda[cite: 3, 4]
    return texto_limpio if texto_limpio else query

def agregar_entrada_lore(id_documento: str, texto_lore: str, id_escena: int):
    """
    Guarda un documento de lore asociándolo a un universo o escena específica (id_escena)[cite: 3, 4].
    """
    try:
        collection.add(
            documents=[texto_lore],
            metadatas=[{"id_escena": id_escena}],  # Nota: Metadato clave para aislar las partidas[cite: 3, 4]
            ids=[f"{id_escena}_{id_documento}"]      # Nota: ID único compuesto por escena y documento[cite: 3, 4]
        )
        
        # Nota: Invalidamos la caché de búsquedas al inyectar nueva información para mantener los datos actualizados[cite: 3, 4]
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
            # 👈 AÑADIMOS "ids" PARA RECUPERAR EL NOMBRE DEL DOCUMENTO
            include=["documents", "distances", "ids"] 
        )
        
        if resultados and resultados.get('documents') and resultados['documents']:
            distancia = resultados['distances'][0][0]
            documento = resultados['documents'][0][0]
            id_crudo = resultados['ids'][0][0] # Ej: "999_test_dragon"
            
            # Limpiamos el ID (quitamos el prefijo de la escena para que quede solo el título)
            nombre_doc = id_crudo.split('_', 1)[1] if '_' in id_crudo else id_crudo
            
            if distancia <= max_distancia:
                # 👈 AHORA DEVOLVEMOS UN DICCIONARIO
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