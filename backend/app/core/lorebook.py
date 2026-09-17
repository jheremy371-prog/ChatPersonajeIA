import chromadb

# 1. Inicializamos ChromaDB para que guarde los vectores en una carpeta local
chroma_client = chromadb.PersistentClient(path="./chroma_db")

# 2. Creamos (o cargamos) la colección donde guardaremos la historia del mundo
coleccion_lore = chroma_client.get_or_create_collection(name="universo_archivista")

def agregar_entrada_lore(id_documento: str, texto_lore: str):
    """Guarda un fragmento de historia en la base de datos vectorial."""
    coleccion_lore.add(
        documents=[texto_lore],
        ids=[id_documento]
    )
    return f"Lore '{id_documento}' guardado correctamente."

def buscar_contexto(pregunta_usuario: str, max_resultados: int = 1):
    """Busca en el Lorebook la información más relevante a la pregunta."""
    resultados = coleccion_lore.query(
        query_texts=[pregunta_usuario],
        n_results=max_resultados
    )
    
    # Si encuentra algo, devuelve el texto. Si no, devuelve una lista vacía.
    if resultados and resultados['documents'] and resultados['documents'][0]:
        return resultados['documents'][0]
    return []