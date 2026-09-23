import pytest
from fastapi.testclient import TestClient
from app.main import app

# Creamos un cliente de prueba para la API de FastAPI
client = TestClient(app)

def test_read_escenas():
    """Verifica que el endpoint de listar escenas responda HTTP 200 y devuelva una lista."""
    response = client.get("/api/escenas")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_crear_y_eliminar_escena():
    """Prueba el flujo completo de ciclo de vida de una escena (Crear -> Verificar -> Eliminar)."""
    # 1. Crear una escena de prueba
    res_crear = client.post("/api/escenas", json={"nombre": "Aventura de Prueba Pytest"})
    assert res_crear.status_code == 200
    data_escena = res_crear.json()
    assert "id" in data_escena
    # Verificamos la clave que retorna tu router de escenas
    assert data_escena["nombre"] == "Aventura de Prueba Pytest"

    escena_id = data_escena["id"]

    # 2. Verificar el historial vacío de la nueva escena
    res_historial = client.get(f"/api/chat/historial/{escena_id}")
    assert res_historial.status_code == 200
    assert res_historial.json()["mensajes"] == []

    # 3. Eliminar la escena creada
    res_borrar = client.delete(f"/api/escenas/{escena_id}")
    assert res_borrar.status_code == 200

def test_director_magico_validacion():
    """Valida que el Director Mágico maneje correctamente textos de prueba."""
    payload = {
        "texto_crudo": "Quiero hablar con Batman en Gotham por la noche.",
        "id_escena": 1
    }
    response = client.post("/api/director_magico", json=payload)
    # Debe responder 200 y estructurar la ficha del personaje en formato JSON
    assert response.status_code == 200
    data = response.json()
    assert "personaje" in data
    assert "universo" in data

def test_entidades_crud():
    """Prueba la creación de una entidad (Personaje/Lugar/Objeto)."""
    payload = {
        "nombre": "Espada de Fuego",
        "tipo": "Objeto",
        "descripcion": "Una espada imbuida en llamas mágicas.",
        "id_escena": 1
    }
    response = client.post("/api/entidades", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["estado"] == "éxito" # Validamos la respuesta JSON estandarizada de tu API