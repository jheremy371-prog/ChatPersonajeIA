import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export function useChat(escenaActiva, recargarEscena) {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Lógica centralizada para procesar el Streaming token por token
  const procesarStream = async (res) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let aiText = '';
    let currentLore = null;
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (let line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ')) {
          const dataStr = line.slice(6).trim();
          if (dataStr === '[DONE]') break;

          try {
            const dataObj = JSON.parse(dataStr);
            if (dataObj.tipo === 'chunk') {
              aiText += dataObj.texto;
              setMensajes(prev => {
                const copia = [...prev];
                const loreTag = currentLore ? `[FUENTE_LORE:${currentLore}]\n` : '';
                copia[copia.length - 1] = { ...copia[copia.length - 1], contenido: loreTag + aiText };
                return copia;
              });
            } else if (dataObj.tipo === 'lore') {
              currentLore = dataObj.fuente_lore;
            } else if (dataObj.tipo === 'error') {
              alert(dataObj.mensaje);
            }
          } catch (err) {}
        }
      }
    }
    // Cuando termina de hablar, actualizamos entidades y crónicas desde App.jsx
    if (recargarEscena) recargarEscena(escenaActiva);
  };

  const enviar = async (textoCrudo, payloadParams) => {
    if (!textoCrudo.trim() || !escenaActiva) return;
    setCargando(true);

    // Interceptor de Comandos Slash
    let textoAEnviar = textoCrudo.trim();
    const cmdCheck = textoAEnviar.toLowerCase();
    
    if (cmdCheck.startsWith('/orden ')) textoAEnviar = `[DIRECTOR: ] ${textoAEnviar.substring(7).trim()}`;
    else if (cmdCheck.startsWith('/forzar ')) textoAEnviar = `[HECHO INMUTABLE: ] ${textoAEnviar.substring(8).trim()}`;
    else if (cmdCheck.startsWith('/accion ')) textoAEnviar = `*${textoAEnviar.substring(8).trim()}*`;

    const textoVisual = textoAEnviar.startsWith("[ACCION DEL SISTEMA") 
      ? "*(Convoca entidad)* " + textoAEnviar.split("] ")[1] 
      : textoAEnviar;

    // Agregamos visualmente el mensaje del jugador y el placeholder de la IA
    setMensajes(prev => [
      ...prev, 
      { id: Date.now(), emisor: 'Jugador', contenido: textoVisual },
      { id: 'temp-ia', emisor: 'IA', contenido: '' }
    ]);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: textoAEnviar, 
          ...payloadParams, // Inyectamos personaje, universo, memoria, etc.
          id_escena: escenaActiva, 
          regenerar: false
        }),
      });

      if (!res.ok) throw new Error("Error en servidor");
      await procesarStream(res);
      
    } catch (error) {
      alert("⚠️ No hay conexión con el servidor.");
      setMensajes(prev => prev.slice(0, -2)); // Revertimos si hay error
    } finally {
      setCargando(false);
    }
  };

  const regenerar = async (ultimoTextoUsuario, payloadParams) => {
    if (!escenaActiva) return;
    setCargando(true);
    
    setMensajes(prev => [...prev, { id: 'temp-ia-regen', emisor: 'IA', contenido: '' }]);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: ultimoTextoUsuario, 
          ...payloadParams,
          id_escena: escenaActiva, 
          regenerar: true
        }),
      });
      
      if (!res.ok) throw new Error("Error en servidor");
      await procesarStream(res);
      
    } catch (error) {
      alert("⚠️ No hay conexión con el servidor.");
      setMensajes(prev => prev.slice(0, -1)); // Revertimos si hay error
    } finally {
      setCargando(false);
    }
  };

  return { mensajes, setMensajes, cargando, enviar, regenerar };
}