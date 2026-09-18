import { useState, useEffect } from 'react';

// --- COMPONENTE 1: EL CARRUSEL DEL MULTIVERSO (IA) ---
function GrupoIA({ alts, onEdit, onDelete, onRegenerate }) {
  const [idx, setIdx] = useState(alts.length - 1);
  const [editando, setEditando] = useState(false);
  const [textoEdicion, setTextoEdicion] = useState('');

  useEffect(() => { setIdx(alts.length - 1); }, [alts.length]);

  const msg = alts[idx];
  if (!msg) return null;

  const handleGuardar = async () => {
    await onEdit(msg.id, textoEdicion);
    setEditando(false);
  };

  return (
    <div className="self-start bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl rounded-tl-sm shadow-md max-w-[85%] border border-slate-700 transition-all">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-sky-400 font-bold uppercase tracking-wider">IA</span>
        <div className="flex gap-3 items-center">
          {alts.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-700/50">
              <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} className={`text-xs p-1 hover:text-sky-400 transition-colors ${idx === 0 ? 'text-slate-600' : 'text-slate-400'}`}>◄</button>
              <span className="text-[10px] text-slate-400 font-medium">{idx + 1}/{alts.length}</span>
              <button onClick={() => setIdx(Math.min(alts.length - 1, idx + 1))} disabled={idx === alts.length - 1} className={`text-xs p-1 hover:text-sky-400 transition-colors ${idx === alts.length - 1 ? 'text-slate-600' : 'text-slate-400'}`}>►</button>
            </div>
          )}
          <div className="flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
            <button onClick={() => { setEditando(!editando); setTextoEdicion(msg.contenido); }} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Editar">✏️</button>
            <button onClick={onRegenerate} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Regenerar">🎲</button>
            <button onClick={() => onDelete(msg.id)} className="p-1 hover:bg-red-900/50 rounded text-slate-400 hover:text-red-400 transition-colors" title="Borrar">🗑️</button>
          </div>
        </div>
      </div>
      {editando ? (
        <div className="flex flex-col gap-2 mt-2">
          <textarea value={textoEdicion} onChange={(e) => setTextoEdicion(e.target.value)} className="w-full p-3 bg-slate-900 text-slate-100 border border-sky-500/50 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-y" rows="4" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditando(false)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-md text-xs transition-colors">Cancelar</button>
            <button onClick={handleGuardar} className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-xs font-semibold shadow-lg shadow-sky-900/20 transition-colors">Guardar</button>
          </div>
        </div>
      ) : (
        <div className="text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap">{msg.contenido}</div>
      )}
    </div>
  );
}

// --- COMPONENTE 2: EDICIÓN DE MENSAJES DEL JUGADOR ---
function MensajeUsuario({ msg, onEdit, onDelete }) {
  const [editando, setEditando] = useState(false);
  const [textoEdicion, setTextoEdicion] = useState(msg.contenido);

  const handleGuardar = async () => {
    await onEdit(msg.id, textoEdicion);
    setEditando(false);
  };

  return (
    <div className="self-end bg-sky-600/90 backdrop-blur-sm p-3 md:p-4 rounded-2xl rounded-tr-sm max-w-[85%] text-white text-[15px] shadow-md shadow-sky-900/20 flex flex-col group">
      <div className="flex justify-between items-center mb-1 gap-4">
        <span className="text-[10px] text-sky-200 font-bold uppercase tracking-wider">Tú</span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setEditando(!editando); setTextoEdicion(msg.contenido); }} className="text-xs hover:text-white text-sky-200 transition-colors" title="Editar mi mensaje">✏️</button>
          <button onClick={() => onDelete(msg.id)} className="text-xs hover:text-red-300 text-sky-200 transition-colors" title="Borrar mensaje">🗑️</button>
        </div>
      </div>
      {editando ? (
        <div className="flex flex-col gap-2 mt-1">
          <textarea value={textoEdicion} onChange={(e) => setTextoEdicion(e.target.value)} className="w-full p-2 bg-slate-900/50 text-white border border-sky-300/30 rounded-lg text-sm focus:ring-1 focus:ring-white outline-none resize-y" rows="3" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditando(false)} className="px-2 py-1 bg-sky-800 hover:bg-sky-700 text-sky-100 rounded text-xs transition-colors">Cancelar</button>
            <button onClick={handleGuardar} className="px-2 py-1 bg-white hover:bg-slate-200 text-sky-700 rounded text-xs font-bold transition-colors">Actualizar</button>
          </div>
        </div>
      ) : (
        <div className="whitespace-pre-wrap leading-relaxed">{msg.contenido}</div>
      )}
    </div>
  );
}

// --- COMPONENTE PRINCIPAL (MOTOR ARCHIVISTA) ---
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
    const res = await fetch('http://127.0.0.1:8000/api/escenas');
    const data = await res.json();
    setEscenas(data);
    if (data.length > 0 && !escenaActiva) seleccionarEscena(data[0].id);
  };

  const cargarCronicas = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/cronicas/${id}`);
      const data = await res.json();
      setCronicas(Array.isArray(data) ? data : []);
    } catch (error) { setCronicas([]); }
  };

  const seleccionarEscena = async (id) => {
    setEscenaActiva(id);
    const resChat = await fetch(`http://127.0.0.1:8000/api/chat/historial/${id}`);
    const dataChat = await resChat.json();
    setMensajes(dataChat.mensajes || []);
    cargarEntidades(id);
    cargarCronicas(id); 
    setMemoriaRol(''); 
  };

  const cargarEntidades = async (id) => {
    if (!id) return;
    const res = await fetch(`http://127.0.0.1:8000/api/entidades/${id}`);
    const data = await res.json();
    setEntidades(Array.isArray(data) ? data : []);
  };

  const crearNuevaEscena = async () => {
    const res = await fetch('http://127.0.0.1:8000/api/escenas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: `Aventura ${escenas.length + 1}` }) });
    const data = await res.json();
    setEscenas([...escenas, data]);
    seleccionarEscena(data.id);
  };

  const eliminarEscena = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("⚠️ ¿Borrar esta aventura?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/api/escenas/${id}`, { method: 'DELETE' });
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
      const res = await fetch(`http://127.0.0.1:8000/api/escenas/${escenaActiva}/exportar`);
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
      const res = await fetch('http://127.0.0.1:8000/api/tavern/leer_tarjeta', {
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
    await fetch('http://127.0.0.1:8000/api/lore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_escena: escenaActiva, id_documento: loreTitulo, texto_lore: loreTexto }) });
    alert("📖 Lore inyectado exitosamente en ESTE universo.");
    setLoreTitulo(''); setLoreTexto('');
  };

  const borrarMensaje = async (id_mensaje) => {
    if (!window.confirm("¿Eliminar este mensaje permanentemente?")) return;
    await fetch(`http://127.0.0.1:8000/api/mensajes/${id_mensaje}`, { method: 'DELETE' });
    seleccionarEscena(escenaActiva); 
  };

  const guardarEdicion = async (id_mensaje, nuevoTexto) => {
    await fetch(`http://127.0.0.1:8000/api/mensajes/${id_mensaje}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contenido: nuevoTexto }),
    });
    seleccionarEscena(escenaActiva); 
  };

  const guardarEdicionYReenviar = async (id_mensaje, nuevoTexto) => {
    await fetch(`http://127.0.0.1:8000/api/mensajes/${id_mensaje}`, {
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
      const res = await fetch('http://127.0.0.1:8000/api/sintetizar_memoria', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_escena: escenaActiva, memoria_actual: memoriaActualParaEnviar }) });
      const data = await res.json();
      if (data.nueva_memoria) setMemoriaRol(data.nueva_memoria);
    } catch (error) {} finally { setActualizandoMemoria(false); }
  };

  const aplicarMagiaDirector = async () => {
    if (!textoMagico.trim() || !escenaActiva) return;
    setProcesandoMagia(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/director_magico', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texto_crudo: textoMagico, id_escena: escenaActiva }) });
      const data = await res.json();
      if (!data.error) {
        if(data.personaje) setPersonaje(data.personaje);
        if(data.universo) setUniverso(data.universo);
        if(data.tematica) setTematica(data.tematica);
        if(data.detalles_extra) setDetallesExtra(data.detalles_extra);
        if(data.titulo_partida) {
          await fetch(`http://127.0.0.1:8000/api/escenas/${escenaActiva}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: data.titulo_partida }) });
          cargarEscenas(); 
        }
        setTextoMagico(''); 
      }
    } catch (error) {} finally { setProcesandoMagia(false); }
  };

  const registrarEntidad = async () => {
    if (!escenaActiva || !nuevaEntidad.nombre) return;
    await fetch('http://127.0.0.1:8000/api/entidades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...nuevaEntidad, id_escena: escenaActiva }) });
    setNuevaEntidad({ nombre: '', tipo: 'Personaje', descripcion: '' });
    cargarEntidades(escenaActiva);
  };

  const convocarEntidad = (entidad) => {
    const comando = `[ACCION DEL SISTEMA: El Director introduce a la escena a '${entidad.nombre}' (${entidad.tipo}). Detalles: ${entidad.descripcion}.] `;
    setMensaje(comando);
  };

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!mensaje.trim() || !escenaActiva) return;
    setCargando(true);
    const textoActual = mensaje;
    const textoVisual = textoActual.startsWith("[ACCION DEL SISTEMA") ? "*(Convoca entidad)* " + textoActual.split("] ")[1] : textoActual;
    
    setMensajes((prev) => [...prev, { emisor: 'Jugador', contenido: textoVisual || textoActual }]);
    setMensaje('');

    try {
      await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: textoActual, personaje, universo, tematica, detalles_extra: detallesExtra, 
          memoria_rol: memoriaRol, perfil_jugador: perfilJugador, id_escena: escenaActiva, regenerar: false
        }),
      });
      seleccionarEscena(escenaActiva); 
    } catch (error) {} finally { setCargando(false); }
  };

  const regenerarRespuesta = async (ultimoTextoUsuario) => {
    if (!escenaActiva) return;
    setCargando(true);
    try {
      await fetch('http://127.0.0.1:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          mensaje: ultimoTextoUsuario, personaje, universo, tematica, detalles_extra: detallesExtra, 
          memoria_rol: memoriaRol, perfil_jugador: perfilJugador, id_escena: escenaActiva, regenerar: true
        }),
      });
      seleccionarEscena(escenaActiva); 
    } catch (error) {} finally { setCargando(false); }
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
      
      {/* 1. BARRA LATERAL (PARTIDAS) */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-4 shadow-xl z-10">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-900/40">🔮</div>
          <h2 className="text-lg font-bold text-slate-100 tracking-wide">Archivista</h2>
        </div>
        
        <button onClick={crearNuevaEscena} className="mb-6 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-lg shadow-sky-900/20 transition-all flex items-center justify-center gap-2">
          <span>+</span> Nueva Aventura
        </button>

        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
          {escenas.map((e) => (
            <div key={e.id} onClick={() => seleccionarEscena(e.id)} className={`group flex justify-between items-center p-3 rounded-lg cursor-pointer transition-all border ${escenaActiva === e.id ? 'bg-slate-800 border-sky-500 shadow-md shadow-sky-900/20' : 'bg-transparent border-transparent hover:bg-slate-800/50'}`}>
              <span className={`text-sm truncate pr-2 ${escenaActiva === e.id ? 'font-semibold text-sky-100' : 'text-slate-400 group-hover:text-slate-200'}`}>{e.nombre}</span>
              <button onClick={(evento) => eliminarEscena(e.id, evento)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1">🗑️</button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. COLUMNA CENTRAL (CHAT Y CONFIGURACIÓN) */}
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
                  <MensajeUsuario 
                    key={`usr_${group.id}`} 
                    msg={group} 
                    onEdit={guardarEdicionYReenviar} 
                    onDelete={borrarMensaje} 
                  />
                );
              } else {
                const mensajePrevio = groupedMessages[index - 1];
                const textoQuePasoAntes = mensajePrevio && mensajePrevio.type === 'user' ? mensajePrevio.contenido : '(Continúa la escena)';
                return (
                  <GrupoIA 
                    key={`ai_${group.alts[0].id}`} 
                    alts={group.alts} 
                    onEdit={guardarEdicion} 
                    onDelete={borrarMensaje} 
                    onRegenerate={() => regenerarRespuesta(textoQuePasoAntes)} 
                  />
                );
              }
            })}
            {cargando && (
               <div className="self-start flex items-center gap-3 bg-slate-800/50 p-3 rounded-2xl rounded-tl-sm border border-slate-700">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-xs text-sky-400">Pensando...</span>
               </div>
            )}
          </div>

          {/* BARRA DE MACROS */}
          <div className="flex gap-2 mb-2 px-1">
             <button type="button" onClick={() => setMensaje(prev => prev + "[DIRECTOR: ] ")} className="px-2 py-1 bg-fuchsia-900/40 hover:bg-fuchsia-800/60 text-fuchsia-400 border border-fuchsia-700/50 rounded text-[10px] font-bold uppercase tracking-wider transition-colors" title="Inserta una instrucción absoluta que la IA debe obedecer">🎬 Orden al Sistema</button>
             <button type="button" onClick={() => setMensaje(prev => prev + "[HECHO INMUTABLE: ] ")} className="px-2 py-1 bg-amber-900/40 hover:bg-amber-800/60 text-amber-400 border border-amber-700/50 rounded text-[10px] font-bold uppercase tracking-wider transition-colors" title="Fuerza un evento en el mundo que el personaje no puede cambiar">⚡ Forzar Evento</button>
             <button type="button" onClick={() => setMensaje(prev => prev + "* * ")} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 rounded text-[10px] font-bold uppercase tracking-wider transition-colors" title="Acción física (Asteriscos)">🏃 Acción</button>
          </div>

          {/* Input de Mensaje */}
          <form onSubmit={enviarMensaje} className="flex gap-3 relative">
            <input 
              type="text" 
              value={mensaje} 
              onChange={(e) => setMensaje(e.target.value)} 
              placeholder="Escribe tu acción, diálogo o comando..." 
              className="flex-1 p-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none shadow-lg transition-all" 
            />
            <button type="submit" disabled={cargando} className="px-6 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg shadow-sky-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                 <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
               </svg>
            </button>
          </form>
        </div>
      </div>

      {/* 3. PANEL LATERAL DERECHO (ESTADO Y LORE) */}
      <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shadow-xl z-10">
        
        <div className="flex bg-slate-950 p-2 gap-1 border-b border-slate-800">
          <button onClick={() => setPestañaDerecha('memoria')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${pestañaDerecha === 'memoria' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>📜 Estado</button>
          <button onClick={() => setPestañaDerecha('entidades')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${pestañaDerecha === 'entidades' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>🛠️ Ents</button>
          <button onClick={() => setPestañaDerecha('cronicas')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${pestañaDerecha === 'cronicas' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>📖 Docs</button>
          <button onClick={() => setPestañaDerecha('lore')} className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${pestañaDerecha === 'lore' ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30' : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'}`}>📚 Lore</button>
        </div>

        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
          
          {pestañaDerecha === 'memoria' && (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">// Estado Actual</span>
                {actualizandoMemoria && <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded animate-pulse">Generando...</span>}
              </div>
              <textarea 
                value={memoriaRol} 
                onChange={(e) => setMemoriaRol(e.target.value)} 
                disabled={actualizandoMemoria}
                className="flex-1 w-full bg-slate-950 text-emerald-400/90 border border-emerald-900/50 p-4 rounded-lg font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none disabled:opacity-50 transition-all custom-scrollbar leading-relaxed" 
                placeholder="Estado del mundo, inventario, etc..."
              />
              <button onClick={() => autoActualizarMemoria(memoriaRol)} disabled={actualizandoMemoria || !escenaActiva} className="mt-4 w-full py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 rounded-lg text-xs font-bold transition-all disabled:opacity-50">
                &gt;_ AUTO-SINTETIZAR
              </button>
            </div>
          )}

          {pestañaDerecha === 'entidades' && (
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-4">// Compendio</span>
              <div className="flex flex-col gap-3 mb-6 bg-slate-950 p-3 rounded-lg border border-indigo-900/30">
                <input type="text" placeholder="Nombre de entidad" value={nuevaEntidad.nombre} onChange={(e) => setNuevaEntidad({...nuevaEntidad, nombre: e.target.value})} className="p-2 bg-slate-900 text-indigo-200 border border-slate-800 rounded text-xs outline-none focus:border-indigo-500/50" />
                <select value={nuevaEntidad.tipo} onChange={(e) => setNuevaEntidad({...nuevaEntidad, tipo: e.target.value})} className="p-2 bg-slate-900 text-indigo-200 border border-slate-800 rounded text-xs outline-none focus:border-indigo-500/50">
                  <option value="Personaje">Personaje</option><option value="Objeto">Objeto</option><option value="Lugar">Lugar</option>
                </select>
                <textarea placeholder="Descripción breve" value={nuevaEntidad.descripcion} onChange={(e) => setNuevaEntidad({...nuevaEntidad, descripcion: e.target.value})} rows="2" className="p-2 bg-slate-900 text-indigo-200 border border-slate-800 rounded text-xs outline-none focus:border-indigo-500/50 resize-y" />
                <button onClick={registrarEntidad} className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-xs font-bold transition-colors">CREAR</button>
              </div>
              <div className="flex flex-col gap-3">
                {entidades.map(ent => (
                  <div key={ent.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 flex flex-col gap-2">
                    <span className="font-bold text-indigo-300 text-sm">{ent.nombre}</span>
                    <span className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{ent.descripcion}</span>
                    <button onClick={() => convocarEntidad(ent)} className="mt-1 self-start px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded hover:bg-indigo-500/20 text-[10px] font-bold transition-colors">⚡ INYECTAR</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pestañaDerecha === 'cronicas' && (
            <div className="flex flex-col h-full gap-4">
              <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">// Diario de Rol</span>
                 <button onClick={() => cargarCronicas(escenaActiva)} className="px-2 py-1 bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 border border-amber-500/30 rounded text-[10px] font-bold transition-colors">🔄 REFRESCAR</button>
              </div>
              <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
                {cronicas.map(c => (
                  <div key={c.id} className="bg-slate-950 p-4 rounded-lg border border-amber-900/30">
                    <span className="font-bold text-amber-400 text-sm block mb-2">{c.capitulo}</span>
                    <span className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-serif">{c.contenido}</span>
                  </div>
                ))}
                {cronicas.length === 0 && <p className="text-xs text-slate-600 italic text-center mt-4">La historia se escribirá a medida que juegues.</p>}
              </div>
            </div>
          )}

          {pestañaDerecha === 'lore' && (
            <div className="flex flex-col h-full">
              <span className="text-xs font-bold text-fuchsia-500 uppercase tracking-wider block mb-2">// Inyección Vectorial</span>
              <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">Añade reglas del universo, manuales o historia antigua. La IA buscará estos datos automáticamente cuando se mencionen.</p>
              
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="Concepto (Ej: Sistema de Magia)" value={loreTitulo} onChange={(e) => setLoreTitulo(e.target.value)} className="w-full p-2.5 bg-slate-950 text-fuchsia-200 border border-fuchsia-900/30 rounded-lg text-xs focus:ring-1 focus:ring-fuchsia-500 outline-none" />
                <textarea placeholder="Pega aquí el contenido extenso..." value={loreTexto} onChange={(e) => setLoreTexto(e.target.value)} rows="12" className="w-full p-3 bg-slate-950 text-fuchsia-200 border border-fuchsia-900/30 rounded-lg text-xs focus:ring-1 focus:ring-fuchsia-500 outline-none resize-y leading-relaxed" />
                <button onClick={guardarLorebook} className="w-full py-2.5 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 text-fuchsia-400 border border-fuchsia-500/50 rounded-lg text-xs font-bold transition-all shadow-md">
                  &gt;_ VECTORIZAR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;