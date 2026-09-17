import { useState, useEffect } from 'react';

// --- COMPONENTE: EL CARRUSEL DEL MULTIVERSO ---
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
    <div style={{ alignSelf: 'flex-start', backgroundColor: '#334155', padding: '10px 14px', borderRadius: '12px', maxWidth: '85%', fontSize: '13px', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>IA</span>
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {alts.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', padding: '2px 8px', borderRadius: '4px' }}>
              <button onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} style={{ background: 'none', border: 'none', color: idx === 0 ? '#475569' : '#38bdf8', cursor: 'pointer', fontSize: '10px', padding: 0 }}>◄</button>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>{idx + 1}/{alts.length}</span>
              <button onClick={() => setIdx(Math.min(alts.length - 1, idx + 1))} disabled={idx === alts.length - 1} style={{ background: 'none', border: 'none', color: idx === alts.length - 1 ? '#475569' : '#38bdf8', cursor: 'pointer', fontSize: '10px', padding: 0 }}>►</button>
            </div>
          )}
          <button onClick={() => { setEditando(!editando); setTextoEdicion(msg.contenido); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', opacity: 0.6 }} title="Editar esta versión">✏️</button>
          <button onClick={onRegenerate} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', opacity: 0.6 }} title="Regenerar (Crear Alternativa)">🎲</button>
          <button onClick={() => onDelete(msg.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', opacity: 0.6 }} title="Borrar para siempre">🗑️</button>
        </div>
      </div>

      {editando ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px' }}>
          <textarea value={textoEdicion} onChange={(e) => setTextoEdicion(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #38bdf8', borderRadius: '4px', fontSize: '13px', resize: 'vertical' }} rows="4" />
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditando(false)} style={{ padding: '4px 8px', backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>Cancelar</button>
            <button onClick={handleGuardar} style={{ padding: '4px 8px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Guardar</button>
          </div>
        </div>
      ) : (
        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.contenido}</div>
      )}
    </div>
  );
}

// --------------------------------------------------------

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

  // --- NUEVA FUNCIÓN: EXPORTAR BACKUP JSON ---
  const exportarAventura = async () => {
    if (!escenaActiva) return;
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/escenas/${escenaActiva}/exportar`);
      const data = await res.json();
      if (data.error) return alert(data.error);

      // Crea el archivo JSON y lo descarga automáticamente
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

  useEffect(() => { cargarEscenas(); }, []);

  const guardarLorebook = async () => {
    if (!loreTitulo || !loreTexto) return alert("Falta título o contenido.");
    await fetch('http://127.0.0.1:8000/api/lore', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_documento: loreTitulo, texto_lore: loreTexto }) });
    alert("📖 Lore inyectado exitosamente.");
    setLoreTitulo(''); setLoreTexto('');
  };

  const borrarMensaje = async (id_mensaje) => {
    if (!window.confirm("¿Eliminar este mensaje para siempre?")) return;
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
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      {/* 1. BARRA LATERAL */}
      <div style={{ width: '220px', backgroundColor: '#020617', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', padding: '15px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#38bdf8', marginBottom: '15px' }}>🔮 Partidas</h2>
        <button onClick={crearNuevaEscena} style={{ padding: '8px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', marginBottom: '15px', fontWeight: 'bold', fontSize: '13px' }}>+ Nueva Aventura</button>
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {escenas.map((e) => (
            <div key={e.id} onClick={() => seleccionarEscena(e.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderRadius: '6px', cursor: 'pointer', backgroundColor: escenaActiva === e.id ? '#1e293b' : 'transparent', border: '1px solid', borderColor: escenaActiva === e.id ? '#38bdf8' : 'transparent' }}>
              <span style={{ fontSize: '13px', fontWeight: escenaActiva === e.id ? 'bold' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.nombre}</span>
              <button onClick={(evento) => eliminarEscena(e.id, evento)} style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '0' }}>🗑️</button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. COLUMNA CENTRAL */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          <header style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '15px', color: '#94a3b8' }}>Hablando con <span style={{color: '#a78bfa', fontWeight: 'bold'}}>{personaje || '???'}</span> | <span style={{color: '#fcd34d'}}>{nombreEscenaHeader}</span></p>
            
            {/* NUEVO BOTON DE EXPORTAR */}
            {escenaActiva && (
              <button onClick={exportarAventura} style={{ padding: '6px 12px', backgroundColor: '#334155', color: '#f8fafc', border: '1px solid #475569', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                💾 Exportar Backup
              </button>
            )}
          </header>

          <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', marginBottom: '10px', border: '1px solid #334155' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#38bdf8', marginBottom: '8px', fontWeight: 'bold' }}>✨ Construcción Rápida</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <textarea value={textoMagico} onChange={(e) => setTextoMagico(e.target.value)} rows="1" placeholder='Ej: "Quiero hablar con Batman..."' style={{ flex: 1, padding: '8px', borderRadius: '4px', backgroundColor: '#0f172a', color: '#fff', border: '1px solid #475569', fontSize: '13px', resize: 'none' }} />
              <button onClick={aplicarMagiaDirector} disabled={procesandoMagia} style={{ padding: '0 15px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Configurar</button>
            </div>
          </div>

          <details style={{ marginBottom: '10px', backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #475569' }}>
            <summary style={{ cursor: 'pointer', color: '#cbd5e1', fontSize: '13px', fontWeight: 'bold' }}>⚙️ Opciones Avanzadas (Identidades)</summary>
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div><label style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Personaje</label><input type="text" value={personaje} onChange={(e) => setPersonaje(e.target.value)} style={{ width: '100%', padding: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px', borderRadius: '4px' }} /></div>
              <div><label style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Universo</label><input type="text" value={universo} onChange={(e) => setUniverso(e.target.value)} style={{ width: '100%', padding: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px', borderRadius: '4px' }} /></div>
              <div><label style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Temática</label><input type="text" value={tematica} onChange={(e) => setTematica(e.target.value)} style={{ width: '100%', padding: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px', borderRadius: '4px' }} /></div>
            </div>
            <div style={{ marginTop: '10px' }}>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>Tu Perfil (El Jugador)</label>
              <input type="text" value={perfilJugador} onChange={(e) => setPerfilJugador(e.target.value)} style={{ width: '100%', padding: '6px', backgroundColor: '#1e293b', color: '#fff', border: '1px solid #334155', fontSize: '12px', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={cargarIdentidadAEstado} style={{ padding: '6px 12px', backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>➡️ Cargar a Estado del Mundo</button>
            </div>
          </details>

          <details style={{ marginBottom: '15px', backgroundColor: '#050505', padding: '12px', borderRadius: '8px', border: '1px solid #f59e0b' }}>
            <summary style={{ cursor: 'pointer', color: '#f59e0b', fontSize: '13px', fontWeight: 'bold' }}>🛠️ Opciones de Desarrollador (Reglas Absolutas)</summary>
            <div style={{ marginTop: '12px' }}>
              <textarea value={detallesExtra} onChange={(e) => setDetallesExtra(e.target.value)} rows="2" style={{ width: '100%', padding: '8px', backgroundColor: '#1e293b', color: '#f59e0b', border: '1px solid #334155', fontSize: '12px', borderRadius: '4px' }} />
            </div>
          </details>

          <div style={{ flex: 1, minHeight: '0', overflowY: 'auto', backgroundColor: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {groupedMessages.length === 0 ? <p style={{ color: '#64748b', textAlign: 'center', marginTop: '10vh' }}>Chat vacío.</p> : groupedMessages.map((group, index) => {
              
              if (group.type === 'user') {
                return (
                  <div key={`usr_${group.id}`} style={{ alignSelf: 'flex-end', backgroundColor: '#0284c7', padding: '10px 14px', borderRadius: '12px', maxWidth: '85%', fontSize: '13px' }}>
                    <span style={{ fontSize: '10px', color: '#cbd5e1', fontWeight: 'bold' }}>Jugador</span>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{group.contenido}</div>
                  </div>
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
            {cargando && <div style={{ color: '#38bdf8', fontSize: '12px' }}>Pensando una nueva línea de tiempo...</div>}
          </div>

          <form onSubmit={enviarMensaje} style={{ display: 'flex', gap: '10px' }}>
            <input type="text" value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escribe al personaje..." style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', fontSize: '14px' }} />
            <button type="submit" disabled={cargando} style={{ padding: '0 20px', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Enviar</button>
          </form>
        </div>
      </div>

      {/* 3. PANEL LATERAL DERECHO */}
      <div style={{ width: '320px', backgroundColor: '#050505', borderLeft: '1px solid #166534', display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', backgroundColor: '#166534' }}>
          <button onClick={() => setPestañaDerecha('memoria')} style={{ flex: 1, padding: '10px', backgroundColor: pestañaDerecha === 'memoria' ? '#22c55e' : 'transparent', color: pestañaDerecha === 'memoria' ? '#050505' : '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>📜 Estado</button>
          <button onClick={() => setPestañaDerecha('entidades')} style={{ flex: 1, padding: '10px', backgroundColor: pestañaDerecha === 'entidades' ? '#22c55e' : 'transparent', color: pestañaDerecha === 'entidades' ? '#050505' : '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>🛠️ Ents</button>
          <button onClick={() => setPestañaDerecha('cronicas')} style={{ flex: 1, padding: '10px', backgroundColor: pestañaDerecha === 'cronicas' ? '#22c55e' : 'transparent', color: pestañaDerecha === 'cronicas' ? '#050505' : '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>📖 Docs</button>
          <button onClick={() => setPestañaDerecha('lore')} style={{ flex: 1, padding: '10px', backgroundColor: pestañaDerecha === 'lore' ? '#22c55e' : 'transparent', color: pestañaDerecha === 'lore' ? '#050505' : '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>📚 Lore</button>
        </div>

        <div style={{ flex: 1, padding: '15px', overflowY: 'auto', color: '#22c55e', fontFamily: '"Courier New", Courier, monospace' }}>
          
          {pestañaDerecha === 'memoria' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>// MEMORIA (MANUAL)</span>
                {actualizandoMemoria && <span style={{ fontSize: '11px', color: '#f59e0b', animation: 'pulse 1.5s infinite' }}>Actualizando...</span>}
              </div>
              <textarea 
                value={memoriaRol} 
                onChange={(e) => setMemoriaRol(e.target.value)} 
                disabled={actualizandoMemoria}
                style={{ flex: 1, width: '100%', backgroundColor: actualizandoMemoria ? 'rgba(34, 197, 94, 0.05)' : 'transparent', color: '#22c55e', border: '1px dashed #166534', padding: '10px', outline: 'none', fontFamily: '"Courier New", Courier, monospace', fontSize: '12px', resize: 'none' }} 
              />
              <button onClick={() => autoActualizarMemoria(memoriaRol)} disabled={actualizandoMemoria || !escenaActiva} style={{ marginTop: '10px', padding: '10px', backgroundColor: '#166534', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                &gt;_ FORZAR_ACTUALIZACION
              </button>
            </div>
          )}

          {pestañaDerecha === 'entidades' && (
            <div>
              <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '10px' }}>// CREAR_NUEVA_ENTIDAD:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                <input type="text" placeholder="> Nombre" value={nuevaEntidad.nombre} onChange={(e) => setNuevaEntidad({...nuevaEntidad, nombre: e.target.value})} style={{ padding: '8px', backgroundColor: '#050505', color: '#22c55e', border: '1px solid #166534', outline: 'none', fontSize: '12px' }} />
                <select value={nuevaEntidad.tipo} onChange={(e) => setNuevaEntidad({...nuevaEntidad, tipo: e.target.value})} style={{ padding: '8px', backgroundColor: '#050505', color: '#22c55e', border: '1px solid #166534', outline: 'none', fontSize: '12px' }}>
                  <option value="Personaje">Personaje</option><option value="Objeto">Objeto</option><option value="Lugar">Lugar</option>
                </select>
                <textarea placeholder="> Descripción" value={nuevaEntidad.descripcion} onChange={(e) => setNuevaEntidad({...nuevaEntidad, descripcion: e.target.value})} rows="2" style={{ padding: '8px', backgroundColor: '#050505', color: '#22c55e', border: '1px solid #166534', outline: 'none', fontSize: '12px' }} />
                <button onClick={registrarEntidad} style={{ backgroundColor: '#22c55e', color: '#050505', border: 'none', padding: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>EJECUTAR</button>
              </div>
              {entidades.map(ent => (
                <div key={ent.id} style={{ border: '1px dashed #166534', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{ent.nombre}</span>
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>{ent.descripcion}</span>
                  <button onClick={() => convocarEntidad(ent)} style={{ marginTop: '5px', backgroundColor: 'transparent', color: '#22c55e', border: '1px solid #22c55e', padding: '4px', cursor: 'pointer', fontSize: '11px' }}>&gt;_ INYECTAR</button>
                </div>
              ))}
            </div>
          )}

          {pestañaDerecha === 'cronicas' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '15px' }}>
              <button onClick={() => cargarCronicas(escenaActiva)} style={{ padding: '6px', backgroundColor: '#166534', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}>🔄 REFRESCAR</button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
                {cronicas.map(c => (
                  <div key={c.id} style={{ border: '1px solid #166534', padding: '12px', backgroundColor: '#020617' }}>
                    <span style={{ fontWeight: 'bold', color: '#38bdf8', fontSize: '13px', display: 'block', marginBottom: '8px' }}>{c.capitulo}</span>
                    <span style={{ fontSize: '12px', color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>{c.contenido}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pestañaDerecha === 'lore' && (
            <div>
              <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '10px' }}>// INYECTAR LORE MASIVO (ChromaDB)</p>
              <p style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '15px' }}>Sube manuales o reglas mágicas. La IA lo buscará automáticamente cuando hables de ello.</p>
              <input type="text" placeholder="Título (Ej: Reglas de Magia)" value={loreTitulo} onChange={(e) => setLoreTitulo(e.target.value)} style={{ width: '100%', padding: '8px', backgroundColor: '#050505', color: '#22c55e', border: '1px solid #166534', marginBottom: '10px', outline: 'none', fontSize: '12px' }} />
              <textarea placeholder="Pega aquí todo el texto gigante..." value={loreTexto} onChange={(e) => setLoreTexto(e.target.value)} rows="15" style={{ width: '100%', padding: '8px', backgroundColor: '#050505', color: '#22c55e', border: '1px solid #166534', marginBottom: '10px', outline: 'none', fontSize: '12px', resize: 'vertical' }} />
              <button onClick={guardarLorebook} style={{ width: '100%', backgroundColor: '#22c55e', color: '#050505', border: 'none', padding: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                &gt;_ VECTORIZAR EN DB
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default App;