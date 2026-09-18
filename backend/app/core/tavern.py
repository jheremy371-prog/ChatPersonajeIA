import json
import base64
from PIL import Image

def extraer_datos_personaje(ruta_imagen: str):
    """
    Lee un archivo PNG de Character/SillyTavern y extrae el JSON oculto
    con el prompt, personalidad y primer mensaje del personaje.
    """
    try:
        img = Image.open(ruta_imagen)
        img.load()
        
        # Las tarjetas PNG guardan los datos en un bloque de texto llamado 'chara'
        if 'chara' in img.info:
            data_codificada = img.info['chara']
            # Descodificamos de Base64 a texto normal
            data_decodificada = base64.b64decode(data_codificada).decode('utf-8')
            datos_personaje = json.loads(data_decodificada)
            
            return {
                "nombre": datos_personaje.get("name", "Desconocido"),
                "descripcion": datos_personaje.get("description", ""),
                "mensaje_inicial": datos_personaje.get("first_mes", ""),
                "personalidad": datos_personaje.get("personality", ""),
                "escenario": datos_personaje.get("scenario", "")
            }
        else:
            return {"error": "La imagen no contiene metadatos de personaje de Tavern."}
            
    except Exception as e:
        return {"error": f"Fallo al leer la imagen: {str(e)}"}