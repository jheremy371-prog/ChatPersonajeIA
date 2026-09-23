# 🔮 Archivista Engine

**Archivista Engine** es un motor de rol (RPG) de texto impulsado por Inteligencia Artificial y diseñado para sesiones narrativas profundas y sin límites. Combina LLMs (preparado para Ollama), Arquitectura RAG Vectorial (ChromaDB) y una interfaz reactiva con persistencia de mundos para ofrecer a los Game Masters (Directores de Juego) una plataforma definitiva de *Worldbuilding*.

![Status](https://img.shields.io/badge/Status-Beta_4.1-fuchsia) ![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi) ![React](https://img.shields.io/badge/Frontend-React_Vite-61DAFB?logo=react) ![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite)

---

## ✨ Características Principales

* **Transmisión en Tiempo Real (SSE):** Las respuestas de la IA se transmiten token por token (estilo ChatGPT), acompañadas de un *auto-scroll* inteligente para una inmersión total sin pantallas de carga.
* **Lorebook RAG (ChromaDB):** Un modal independiente permite inyectar reglas, sistemas de magia o "Biblias" narrativas. La IA recupera semánticamente este contexto automáticamente cuando detecta palabras clave en la partida, inyectándolo en su memoria a corto plazo.
* **Multiverso (Bifurcación Temporal):** ¿Te arrepientes de una decisión o quieres explorar otro camino narrativo? El botón 🔀 "Clonar Línea Temporal" en cualquier mensaje del pasado duplica la aventura entera (incluyendo el estado del mundo, entidades y crónicas) en una partida paralela independiente.
* **Comandos Slash Integrados:** Interfaz limpia con atajos invisibles. Usa `/orden`, `/forzar` o `/accion` para manipular la narrativa o ejecutar acciones físicas sin requerir botones extra ni romper la inmersión del texto.
* **Protección contra Alucinaciones (Limpieza de RAM):** El motor limpia automáticamente el caché y la memoria RAM de LangChain al modificar, borrar o retroceder mensajes, obligando a re-leer SQLite y previniendo la contaminación cruzada de historias.
* **Soporte para Tarjetas Tavern (PNG):** Importa personalidades y mundos enteros subiendo directamente imágenes PNG (estilo SillyTavern / Character Card V2) extrayendo sus metadatos ocultos.

---

## 🛠️ Arquitectura Técnica

El proyecto está dividido en un ecosistema robusto y desacoplado, ideal para despliegue híbrido:

* **Backend (Python 3.10+):** `FastAPI` maneja las rutas y el Server-Sent Events (Event-Stream). `LangChain` orquesta la memoria y los prompts estructurados. `SQLAlchemy` maneja el CRUD relacional en `SQLite`.
* **Frontend (React 18):** Empaquetado con `Vite`, estilizado con `TailwindCSS`. Arquitectura de componentes puros enfocada en la fluidez de estado.
* **Base de Datos Vectorial:** `ChromaDB` integrado de forma local (con caché LRU para latencias < 0.05ms) que maneja los *embeddings* del Lorebook.

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
* [Node.js](https://nodejs.org/) (v16+)
* [Python](https://www.python.org/) (v3.10+)
* Un motor de LLM activo (como [Ollama](https://ollama.com/) o claves API de OpenAI configuradas en el entorno).

### 1. Levantar el Backend (El Cerebro)
Abre una terminal en la raíz del proyecto y ejecuta:
```bash
cd backend
python -m venv env
source env/bin/activate  # En Windows usa: env\Scripts\activate
pip install -r requirements.txt

# Iniciar el servidor local
uvicorn app.main:app --reload