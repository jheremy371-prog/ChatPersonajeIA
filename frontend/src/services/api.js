// frontend/src/services/api.js

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const api = {
  // --- ESCENAS Y PARTIDAS ---
  getEscenas: async () => fetch(`${API_URL}/api/escenas`).then(r => r.json()),
  
  crearEscena: async (nombre) => fetch(`${API_URL}/api/escenas`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ nombre }) 
  }).then(r => r.json()),
  
  eliminarEscena: async (id) => fetch(`${API_URL}/api/escenas/${id}`, { method: 'DELETE' }),
  
  exportarEscena: async (id) => fetch(`${API_URL}/api/escenas/${id}/exportar`).then(r => r.json()),
  
  clonarEscena: async (idEscena, idMensaje) => fetch(`${API_URL}/api/escenas/${idEscena}/clonar/${idMensaje}`, { 
    method: 'POST' 
  }).then(r => r.json()),

  // --- HISTORIAL Y MENSAJES ---
  getHistorial: async (idEscena) => fetch(`${API_URL}/api/chat/historial/${idEscena}`).then(r => r.json()),
  
  borrarMensaje: async (id) => fetch(`${API_URL}/api/mensajes/${id}`, { method: 'DELETE' }),
  
  editarMensaje: async (id, contenido) => fetch(`${API_URL}/api/mensajes/${id}`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ contenido }) 
  }),

  // --- LORE, ENTIDADES Y CRÓNICAS ---
  getCronicas: async (idEscena) => fetch(`${API_URL}/api/cronicas/${idEscena}`).then(r => r.json()),
  
  getEntidades: async (idEscena) => fetch(`${API_URL}/api/entidades/${idEscena}`).then(r => r.json()),
  
  crearEntidad: async (datos) => fetch(`${API_URL}/api/entidades`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(datos) 
  }),
  
  guardarLore: async (datos) => fetch(`${API_URL}/api/lore`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(datos) 
  }),

  editarEntidad: async (id, datos) => fetch(`${API_URL}/api/entidades/${id}`, { 
    method: 'PUT', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(datos) 
  }).then(r => r.json()),

  extraerEntidades: async (datos) => fetch(`${API_URL}/api/extraer_entidades`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(datos) 
  }).then(r => r.json()),

  // --- IA Y AGENTES AUXILIARES ---
  configurarDirector: async (datos) => fetch(`${API_URL}/api/director_magico`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(datos) 
  }).then(r => r.json()),
  
  sintetizarMemoria: async (datos) => fetch(`${API_URL}/api/sintetizar_memoria`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(datos) 
  }).then(r => r.json()),

  consultarOrquestador: async (datos) => fetch(`${API_URL}/api/orquestador`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(datos) 
  }).then(r => r.json()),
  
  leerTavern: async (formData) => fetch(`${API_URL}/api/tavern/leer_tarjeta`, { 
    method: 'POST', 
    body: formData 
  }).then(r => r.json()),
};