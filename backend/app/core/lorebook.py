import chromadb
from app.core.config import settings

chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
collection = chroma_client.get_or_create_collection(name="lorebook")

def agregar_entrada_lore(id_documento: str, texto_lore: str, id_escena: int):
    try:
        collection.add(
            documents=[texto_lore],
            metadatas=[{"id_escena": id_escena}],
            ids=[f"{id_escena}_{id_documento}"]
        )
        return "Lore guardado correctamente."
    except Exception as e:
        print(f"Error al guardar en ChromaDB: {e}")
        return "Error al guardar el lore."

def buscar_contexto(query: str, id_escena: int):
    try:
        resultados = collection.query(
            query_texts=[query],
            n_results=1,
            where={"id_escena": id_escena}
        )
        
        if resultados and resultados['documents'] and resultados['documents'][0]:
            return resultados['documents'][0]
        return []
    except Exception as e:
        print(f"Error al buscar en ChromaDB: {e}")
        return []