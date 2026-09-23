import { useState, useEffect } from 'react';
import { GrupoIA, MensajeUsuario } from './components/Mensajes';
import Sidebar from './components/Sidebar';
import PanelDerecho from './components/PanelDerecho';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function App() {
  const [personaje, setPersonaje] = useState('');
  const [universo, setUniverso] = useState('');
  const [tematica, setTematica] = useState('');
  const [detallesExtra, setDetallesExtra] = useState(''); 
  const [perfilJugador, setPerfilJugador] = useState(''); 
  
  const [escenas, setEscenas] = useState([]);
  const [escenaActiva, setEscenaActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [mensaje, setMensaje] = useState('');
  
  const [textoMagico, setTextoMagico] = useState('');
  const [procesandoMagia, setProcesandoMagia] = useState(false);
  const [cargando, setCargando] = useState(false);
  
  const [memoriaRol, setMemoriaRol] = useState(''); 
  const [actualizandoMemoria, setActualizandoMemoria] = useState(false);

  const [entidades, setEntidades] = useState([]);
  const [nuevaEntidad, setNuevaEntidad] = useState({ nombre: '', tipo: 'Personaje', descripcion: '' });
  const [cronicas, setCronicas] = useState([]);
  const [pestañaDerecha, setPestañaDerecha] = useState('memoria'); 
  const [loreTitulo, setLoreTitulo] = useState('');
  const [loreTexto, setLoreTexto] = useState('');

  const cargarEscenas = async () => {
    const res = await fetch(`${API_URL}/api/escenas`);
    const data = await res.json();
    setEscenas(data);
    if (data.length > 0 && !escenaActiva) seleccionarEscena(data[0].id);
  };

  const cargarCronicas = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`${API_URL}/api/cronicas/${id}`);
      const data = await res.json();
      setCronicas(Array.isArray(data) ? data : []);
    } catch (error) { setCronicas([]); }
  };

  const seleccionarEscena = async (id) => {
    setEscenaActiva(id);
    const resChat = await fetch(`${API_URL}/api/chat/historial/${id}`);
    const dataChat = await resChat.json();
    setMensajes(dataChat.mensajes || []);
    cargarEntidades(id);
    cargarCronicas(id); 
    setMemoriaRol(''); 
  };

  const cargarEntidades = async (id) => {
    if (!id) return;
    const res = await fetch(`${API_URL}/api/entidades/${id}`);
    const data = await res.json();
    setEntidades(Array.isArray(data) ? data : []);
  };

  const crearNuevaEscena = async () => {
    const res = await fetch(`${API_URL}/api/escenas`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ nombre: `Aventura ${escenas.length + 1}` }) 
    });
    const data = await res.json();
    setEscenas([...escenas, data]);
    seleccionarEscena(data.id);
  };

  const eliminarEscena = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("⚠️ ¿Borrar esta aventura?")) return;
    try {
      await fetch(`${API_URL}/api/escenas/${id}`, { method: 'DELETE' });
      const nuevasEscenas = escenas.filter(esc => esc.id !== id);
      setEscenas(nuevasEscenas);
      if (escenaActiva === id) {
        if (nuevasEscenas.length > 0) seleccionarEscena(nuevasEscenas[0].id);
        else { setEscenaActiva(null); setMensajes([]); setEntidades([]); setCronicas([]); }
      }
    } catch (error) { console.error(error); }
  };

  const exportarAventura = async () => {
    if (!escenaActiva) return;
    try {
      const res = await fetch(`${API_URL}/api/escenas/${escenaActiva}/exportar`);
      const data = await res.json();
      if (data.error) return alert(data.error);

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `Backup_${data.aventura.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode); 
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) {
      console.error("Error al exportar:", error);
    }
  };

  const subirTarjetaTavern = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const boton = e.target.previousSibling;
    if (boton) boton.innerText = "⏳ Leyendo...";

    const formData = new FormData();
    formData.append('archivo', file);

    try {
      const res = await fetch(`${API_URL}/api/tavern/leer_tarjeta`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
        if (boton) boton.innerText = "🎴 Subir PNG (Tavern)";
        return;
      }

      if (data.nombre) setPersonaje(data.nombre);
      if (data.escenario) setUniverso(data.escenario);
      if (data.personalidad || data.descripcion) {
        setDetallesExtra(`[PERSONALIDAD]\n${data.personalidad}\n\n[DESCRIPCIÓN]\n${data.descripcion}`);
      }
      
      alert(`¡Alma de ${data.nombre} extraída con éxito!`);
      if (boton) boton.innerText = "🎴 Subir PNG (Tavern)";
      
    } catch (error) {
      console.error(error);
      alert("Error al leer la tarjeta.");
      if (boton) boton.innerText = "🎴 Subir PNG (Tavern)";
    }
    e.target.value = null;
  };

  useEffect(() => { cargarEscenas(); }, []);

  const guardarLorebook = async () => {
    if (!escenaActiva) return alert("Selecciona una partida primero.");
    if (!loreTitulo || !loreTexto) return alert("Falta título o contenido.");
    await fetch(`${API_URL}/api/lore`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ id_escena: escenaActiva, id_documento: loreTitulo, texto_lore: loreTexto }) 
    });
    alert("📖 Lore inyectado exitosamente en ESTE universo.");
    setLoreTitulo(''); setLoreTexto('');
  };

  const borrarMensaje = async (id_mensaje) => {
    if (!window.confirm("¿Eliminar este mensaje permanentemente?")) return;
    await fetch(`${API_URL}/api/mensajes/${id_mensaje}`, { method: 'DELETE' });
    seleccionarEscena(escenaActiva); 
  };

  const guardarEdicion = async (id_mensaje, nuevoTexto) => {
    await fetch(`${API_URL}/api/mensajes/${id_mensaje}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido: nuevoTexto }),
    });
    seleccionarEscena(escenaActiva); 
  };

  const guardarEdicionYReenviar = async (id_mensaje, nuevoTexto) => {
    await fetch(`${API_URL}/api/mensajes/${id_mensaje}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido: nuevoTexto }),
    });
    seleccionarEscena(escenaActiva); 
  };

  const autoActualizarMemoria = async (memoriaActualParaEnviar) => {
    if (!escenaActiva) return; 
    setActualizandoMemoria(true);
    try {
      const res = await fetch(`${API_URL}/api/sintetizar_memoria`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id_escena: escenaActiva, memoria_actual: memoriaActualParaEnviar }) 
      });
      const data = await res.json();
      if (data.nueva_memoria) setMemoriaRol(data.nueva_memoria);
    } catch (error) {} finally { setActualizandoMemoria(false); }
  };

  const aplicarMagiaDirector = async () => {
    if (!textoMagico.trim() || !escenaActiva) return;
    setProcesandoMagia(true);
    try {
      const res = await fetch(`${API_URL}/api/director_magico`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ texto_crudo: textoMagico, id_escena: escenaActiva }) 
      });
      const data = await res.json();
      if (!data.error) {
        if(data.personaje) setPersonaje(data.personaje);
        if(data.universo) setUniverso(data.universo);
        if(data.tematica) setTematica(data.tematica);
        if(data.detalles_extra) setDetallesExtra(data.detalles_extra);
        if(data.titulo_partida) {
          await fetch(`${API_URL}/api/escenas/${escenaActiva}`, { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ nombre: data.titulo_partida }) 
          });
          cargarEscenas(); 
        }
        setTextoMagico(''); 
      }
    } catch (error) {} finally { setProcesandoMagia(false); }
  };

  const registrarEntidad = async () => {
    if (!escenaActiva || !nuevaEntidad.nombre) return;
    await fetch(`${API_URL}/api/entidades`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ ...nuevaEntidad, id_escena: escenaActiva }) 
    });
    setNuevaEntidad({ nombre: '', tipo: 'Personaje', descripcion: '' });
    cargarEntidades(escenaActiva);
  };

  const convocarEntidad = (entidad) => {
    const comando = `[ACCION DEL SISTEMA: El Director introduce a la escena a '${entidad.nombre}' (${entidad.tipo}). Detalles: ${entidad.descripcion}.] `;
    setMensaje(comando);
  };


  // 👇 LÓGICA DE STREAMING INTEGRADA 👇
  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!mensaje.trim() || !escenaActiva) return;
    setCargando(true);
    const textoActual = mensaje;
    const textoVisual = textoActual.startsWith("[ACCION DEL SISTEMA") ? "*(Convoca entidad)* " + textoActual.split("] ")[1] : textoActual;
    
    // 1. Mostrar tu mensaje inmediatamente y preparar una burbuja vacía para la IA
    setMensajes((prev) => [
      ...prev, 
      { id: Date.now(), emisor: 'Jugador', contenido: textoVisual || textoActual },
      { id: 'temp-ia', emisor: 'IA', contenido: '' }
    ]);
    setMensaje('');

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: textoActual, personaje, universo, tematica, detalles_extra: detallesExtra, 
          memoria_rol: memoriaRol, perfil_jugador: perfilJugador, id_escena: escenaActiva, regenerar: false
        }),
      });
      
      if (!res.ok) {
        alert("Ocurrió un error en el servidor.");
        setMensajes((prev) => prev.slice(0, -2)); 
        setMensaje(textoActual); 
        return;
      }

      // 2. Consumir el flujo (Stream) de datos
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiText = '';
      let currentLore = null;
      let buffer = ''; // Buffer para evitar romper JSON a medias

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Guarda la última línea si está incompleta
        
        for (let line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            
            if (dataStr === '[DONE]') {
              break; 
            }
            
            try {
              const dataObj = JSON.parse(dataStr);
              if (dataObj.tipo === 'chunk') {
                aiText += dataObj.texto;
                // Escribir letra por letra actualizando el último mensaje (el de la IA)
                setMensajes(prev => {
                  const copia = [...prev];
                  const loreTag = currentLore ? `[FUENTE_LORE:${currentLore}]\n` : '';
                  copia[copia.length - 1] = { ...copia[copia.length - 1], contenido: loreTag + aiText };
                  return copia;
                });
              } else if (dataObj.tipo === 'lore') {
                currentLore = dataObj.fuente_lore; // Guardamos el nombre para dibujar la etiqueta
              } else if (dataObj.tipo === 'error') {
                alert(dataObj.mensaje);
              }
            } catch (err) {
              // Ignorar silenciosamente líneas JSON malformadas a la mitad
            }
          }
        }
      }

      // 3. Todo terminó, recargamos la escena para obtener los IDs reales guardados por SQLite
      seleccionarEscena(escenaActiva);

    } catch (error) { 
      alert("⚠️ No hay conexión con el servidor.");
      setMensajes((prev) => prev.slice(0, -2)); 
      setMensaje(textoActual);
    } finally { 
      setCargando(false); 
    }
  };

  // 👇 MISMA LÓGICA DE STREAMING PARA REGENERAR RESPUESTAS 👇
  const regenerarRespuesta = async (ultimoTextoUsuario) => {
    if (!escenaActiva) return;
    setCargando(true);
    
    // Creamos la burbuja vacía
    setMensajes((prev) => [...prev, { id: 'temp-ia-regen', emisor: 'IA', contenido: '' }]);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: ultimoTextoUsuario, personaje, universo, tematica, detalles_extra: detallesExtra, 
          memoria_rol: memoriaRol, perfil_jugador: perfilJugador, id_escena: escenaActiva, regenerar: true
        }),
      });
      
      if (!res.ok) {
        alert("Error al intentar crear una línea temporal alternativa.");
        setMensajes((prev) => prev.slice(0, -1));
        return;
      }

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
              }
            } catch (err) {}
          }
        }
      }
      
      seleccionarEscena(escenaActiva);

    } catch (error) { 
      alert("⚠️ No hay conexión con el servidor.");
      setMensajes((prev) => prev.slice(0, -1));
    } finally { 
      setCargando(false); 
    }
  };

  const cargarIdentidadAEstado = (e) => {
    e.preventDefault();
    const textoIdentidad = `\n[IDENTIDAD IA]\n- Personaje: ${personaje || 'No definido'}\n- Universo: ${universo || 'No definido'}\n`;
    setMemoriaRol(prev => prev + textoIdentidad);
    setPestañaDerecha('memoria');
  };

  const escenaActualObj = escenas.find(e => e.id === escenaActiva);
  const nombreEscenaHeader = escenaActualObj ? escenaActualObj.nombre : `Selecciona un Chat`;

  const groupedMessages = [];
  for (let msg of mensajes) {
    if (msg.emisor === 'Jugador') {
      groupedMessages.push({ type: 'user', id: msg.id, contenido: msg.contenido });
    } else {
      const last = groupedMessages[groupedMessages.length - 1];
      if (last && last.type === 'ai_group') {
        last.alts.push(msg); 
      } else {
        groupedMessages.push({ type: 'ai_group', alts: [msg] });
      }
    }
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      <Sidebar 
        escenas={escenas} 
        escenaActiva={escenaActiva} 
        crearNuevaEscena={crearNuevaEscena} 
        seleccionarEscena={seleccionarEscena} 
        eliminarEscena={eliminarEscena} 
      />

      {/* COLUMNA CENTRAL */}
      <div className="flex-1 flex flex-col bg-slate-950 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 opacity-50 pointer-events-none"></div>

        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 md:p-6 z-10 h-full">
          
          <header className="flex justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
            <div>
              <p className="text-sm text-slate-400">Hablando con <span className="text-indigo-400 font-bold">{personaje || '???'}</span></p>
              <p className="text-xs text-amber-500/80 mt-1">{nombreEscenaHeader}</p>
            </div>
            {escenaActiva && (
              <button onClick={exportarAventura} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-md text-xs font-semibold transition-colors">
                💾 Backup
              </button>
            )}
          </header>

          <div className="bg-slate-900/80 p-5 rounded-xl border border-sky-900/50 shadow-lg shadow-sky-900/10 mb-4 backdrop-blur-sm">
             <label className="block text-sm font-bold text-sky-400 mb-3 flex items-center gap-2">✨ Construcción Rápida</label>
             <div className="flex flex-col sm:flex-row gap-3">
               <textarea value={textoMagico} onChange={(e) => setTextoMagico(e.target.value)} rows="1" placeholder='Ej: "Quiero hablar con Batman..."' className="flex-1 p-3 bg-slate-950 text-slate-200 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none transition-all placeholder:text-slate-600" />
               <button onClick={aplicarMagiaDirector} disabled={procesandoMagia} className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-lg shadow-sky-900/20 transition-all whitespace-nowrap disabled:opacity-50">
                 {procesandoMagia ? 'Configurando...' : 'Configurar'}
               </button>
             </div>
          </div>

          <details className="group mb-6 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 backdrop-blur-sm transition-all open:bg-slate-900/60 open:border-slate-700">
            <summary className="cursor-pointer text-slate-400 hover:text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 select-none outline-none">
               ⚙️ Opciones Avanzadas <span className="text-slate-600 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            
            <div className="mt-5 pt-4 border-t border-slate-800/50">
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-dashed border-sky-500/30 text-center relative hover:bg-slate-800 transition-colors group/upload">
                <span className="text-sm font-bold text-sky-400 block pointer-events-none group-hover/upload:text-sky-300 transition-colors">🎴 Subir Tarjeta PNG (Tavern)</span>
                <p className="text-xs text-slate-500 mt-1 pointer-events-none">Haz clic para autocompletar lore y personalidad.</p>
                <input type="file" accept=".png" onChange={subirTarjetaTavern} title="Sube una tarjeta" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs text-slate-500 mb-1.5 font-medium">Personaje</label><input type="text" value={personaje} onChange={(e) => setPersonaje(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-300 focus:border-sky-500 outline-none" /></div>
                <div><label className="block text-xs text-slate-500 mb-1.5 font-medium">Universo</label><input type="text" value={universo} onChange={(e) => setUniverso(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-300 focus:border-sky-500 outline-none" /></div>
                <div><label className="block text-xs text-slate-500 mb-1.5 font-medium">Temática</label><input type="text" value={tematica} onChange={(e) => setTematica(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-300 focus:border-sky-500 outline-none" /></div>
              </div>

              <div className="mt-4">
                <label className="block text-xs text-slate-500 mb-1.5 font-medium">Tu Perfil (Jugador)</label>
                <input type="text" value={perfilJugador} onChange={(e) => setPerfilJugador(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-slate-300 focus:border-sky-500 outline-none" />
              </div>
              
              <div className="mt-4">
                 <label className="block text-xs text-amber-500/70 mb-1.5 font-medium">Reglas Absolutas (Desarrollador)</label>
                 <textarea value={detallesExtra} onChange={(e) => setDetallesExtra(e.target.value)} rows="2" className="w-full p-2 bg-slate-950 border border-amber-900/30 rounded-md text-sm text-amber-500/90 focus:border-amber-500/50 outline-none resize-y" />
              </div>

              <div className="flex justify-end mt-4">
                <button onClick={cargarIdentidadAEstado} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold transition-colors flex items-center gap-2">➡️ Cargar a Memoria</button>
              </div>
            </div>
          </details>

          <div className="flex-1 overflow-y-auto bg-slate-900/60 p-4 md:p-6 rounded-xl mb-2 border border-slate-800 flex flex-col gap-4 backdrop-blur-sm custom-scrollbar shadow-inner">
            {groupedMessages.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-60">
                 <span className="text-4xl mb-2">🎭</span>
                 <p>La escena está lista. Comienza la aventura.</p>
               </div>
            ) : groupedMessages.map((group, index) => {
              if (group.type === 'user') {
                return (
                  <MensajeUsuario key={`usr_${group.id}`} msg={group} onEdit={guardarEdicionYReenviar} onDelete={borrarMensaje} />
                );
              } else {
                const mensajePrevio = groupedMessages[index - 1];
                const textoQuePasoAntes = mensajePrevio && mensajePrevio.type === 'user' ? mensajePrevio.contenido : '(Continúa la escena)';
                return (
                  <GrupoIA key={`ai_${group.alts[0].id}`} alts={group.alts} onEdit={guardarEdicion} onDelete={borrarMensaje} onRegenerate={() => regenerarRespuesta(textoQuePasoAntes)} />
                );
              }
            })}
            
            {/* Animación de Pensando (Solo aparece un instante antes de que lleguen las letras) */}
            {cargando && mensajes.length > 0 && mensajes[mensajes.length - 1].emisor === 'Jugador' && (
               <div className="self-start flex items-center gap-3 bg-slate-800/50 p-3 rounded-2xl rounded-tl-sm border border-slate-700">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-xs text-sky-400">Escuchando a la IA...</span>
               </div>
            )}
          </div>

          <div className="flex gap-2 mb-2 px-1">
             <button type="button" onClick={() => setMensaje(prev => prev + "[DIRECTOR: ] ")} className="px-2 py-1 bg-fuchsia-900/40 hover:bg-fuchsia-800/60 text-fuchsia-400 border border-fuchsia-700/50 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">🎬 Orden al Sistema</button>
             <button type="button" onClick={() => setMensaje(prev => prev + "[HECHO INMUTABLE: ] ")} className="px-2 py-1 bg-amber-900/40 hover:bg-amber-800/60 text-amber-400 border border-amber-700/50 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">⚡ Forzar Evento</button>
             <button type="button" onClick={() => setMensaje(prev => prev + "* * ")} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded text-[10px] font-bold uppercase tracking-wider transition-colors">🏃 Acción</button>
          </div>

          <form onSubmit={enviarMensaje} className="flex gap-3 relative">
            <input type="text" value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escribe tu acción, diálogo o comando..." className="flex-1 p-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none shadow-lg transition-all" />
            <button type="submit" disabled={cargando} className="px-6 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">Enviar</button>
          </form>
        </div>
      </div>

      <PanelDerecho 
        pestañaDerecha={pestañaDerecha} setPestañaDerecha={setPestañaDerecha}
        memoriaRol={memoriaRol} setMemoriaRol={setMemoriaRol} actualizandoMemoria={actualizandoMemoria} autoActualizarMemoria={autoActualizarMemoria} escenaActiva={escenaActiva}
        nuevaEntidad={nuevaEntidad} setNuevaEntidad={setNuevaEntidad} registrarEntidad={registrarEntidad} entidades={entidades} convocarEntidad={convocarEntidad}
        cargarCronicas={cargarCronicas} cronicas={cronicas}
        loreTitulo={loreTitulo} setLoreTitulo={setLoreTitulo} loreTexto={loreTexto} setLoreTexto={setLoreTexto} guardarLorebook={guardarLorebook}
      />
    </div>
  );
}

export default App;