import time
from app.core.lorebook import buscar_contexto, agregar_entrada_lore, collection

def probar_rendimiento_lorebook():
    print("🔍 --- INICIANDO PRUEBA DE RENDIMIENTO DE CHROMADB ---")

    # 1. Definir datos de prueba aislados 
    # Nota: Usamos un ID de escena especial (999) para evitar cruzar o dañar datos de partidas reales.
    id_escena_prueba = 999
    texto_lore = "El Castillo Oscuro está protegido por el Dragón de Obsidiana en la cima de la montaña."
    query_prueba = "*El jugador camina hacia la montaña* ¿Cómo venzo al Dragón de Obsidiana?"

    # 2. Inserción de prueba en la base de datos vectorial
    print("\n1️⃣ Guardando entrada de prueba en el Lorebook...")
    agregar_entrada_lore("test_dragon", texto_lore, id_escena_prueba)

    # 3. Primera búsqueda (En frío)
    # Nota: Aquí se calculan los embeddings y se ejecuta la consulta real en disco/memoria por primera vez.
    print("\n2️⃣ Ejecutando 1ª búsqueda (Tiempo real de consulta a la Base Vectorial)...")
    inicio = time.perf_counter()
    resultado1 = buscar_contexto(query_prueba, id_escena=id_escena_prueba)
    fin = time.perf_counter()
    tiempo_ms1 = (fin - inicio) * 1000

    print(f"⏱️ Tiempo 1ª búsqueda: {tiempo_ms1:.2f} ms")
    print(f"📄 Documento devuelto: {resultado1}")

    # 4. Segunda búsqueda idéntica (Prueba de caché)
    # Nota: Al repetir la misma consulta, se evalúa la eficiencia del decorador @lru_cache leyendo directamente de la RAM.
    print("\n3️⃣ Ejecutando 2ª búsqueda idéntica (Prueba de Caché RAM)...")
    inicio = time.perf_counter()
    resultado2 = buscar_contexto(query_prueba, id_escena=id_escena_prueba)
    fin = time.perf_counter()
    tiempo_ms2 = (fin - inicio) * 1000

    print(f"⚡ Tiempo 2ª búsqueda (Caché): {tiempo_ms2:.2f} ms")

    # 5. Inspección directa de distancia vectorial
    # Nota: Consulta cruda a ChromaDB para verificar la cercanía y distancia matemática del resultado obtenido.
    print("\n4️⃣ Inspeccionando distancia matemática cruda...")
    raw_res = collection.query(
        query_texts=["Dragón de Obsidiana"],
        n_results=1,
        where={"id_escena": id_escena_prueba},
        include=["documents", "distances"]
    )
    distancia = raw_res['distances'][0][0] if raw_res.get('distances') else "N/A"
    print(f"📏 Distancia vectorial obtenida: {distancia}")

    # 6. Limpieza automática
    # Nota: Se eliminan los registros de prueba temporales para mantener la base de datos limpia.
    collection.delete(ids=[f"{id_escena_prueba}_test_dragon"])
    print("\n✅ Prueba finalizada y datos temporales limpios.")

if __name__ == "__main__":
    probar_rendimiento_lorebook()