import { useState, useEffect, useRef } from 'react';
import { GrupoIA, MensajeUsuario } from './components/Mensajes';
import Sidebar from './components/Sidebar';
import PanelDerecho from './components/PanelDerecho';
import { api } from './services/api';
import { useChat } from './hooks/useChat';

function App() {
  // 1. ESTADOS DE CONFIGURACIÓN DEL PERSONAJE/PARTY
  const [personaje, setPersonaje] = useState('');
  const [universo, setUniverso] = useState('');
  const [tematica, setTematica] = useState('');
  const [detallesExtra, setDetallesExtra] = useState(''); 
  const [perfilJugador, setPerfilJugador] = useState(''); 
  
  // 2. ESTADOS DE LA UI Y MEMORIA
  const [escenas, setEscenas] = useState([]);
  const [escenaActiva, setEscenaActiva] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [textoMagico, setTextoMagico] = useState('');
  const [procesandoMagia, setProcesandoMagia] = useState(false);
  const [memoriaRol, setMemoriaRol] = useState(''); 
  const [actualizandoMemoria, setActualizandoMemoria] = useState(false);
  const [entidades, setEntidades] = useState([]);
  const [nuevaEntidad, setNuevaEntidad] = useState({ nombre: '', tipo: 'Personaje', descripcion: '' });
  const [cronicas, setCronicas] = useState([]);
  const [pestañaDerecha, setPestañaDerecha] = useState('memoria'); 
  const [loreTitulo, setLoreTitulo] = useState('');
  const [loreTexto, setLoreTexto] = useState('');
  
  // NUEVOS ESTADOS DE UI INMERSIVA
  const [mostrarAjustes, setMostrarAjustes] = useState(false);
  const [orquestando, setOrquestando] = useState(false);
  const [panelDerechoAbierto, setPanelDerechoAbierto] = useState(false);

  // 3. AUTO-SCROLL INTELIGENTE
  const mensajesEndRef = useRef(null);
  const scrollToBottom = () => mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const recargarEntidadesYCronicas = (id) => {
    cargarEntidades(id);
    cargarCronicas(id);
  };

  const { mensajes, setMensajes, cargando, enviar, regenerar } = useChat(escenaActiva, recargarEntidadesYCronicas);

  useEffect(() => { scrollToBottom(); }, [mensajes]);
  useEffect(() => { cargarEscenas(); }, []);

  // --- SERVICIOS DE ESCENAS ---
  const cargarEscenas = async () => {
    try {
      const data = await api.getEscenas();
      setEscenas(data);
      if (data.length > 0 && !escenaActiva) seleccionarEscena(data[0].id);
    } catch (error) { console.error("Error cargando escenas:", error); }
  };

  const seleccionarEscena = async (id) => {
    setEscenaActiva(id);
    setMostrarAjustes(false); 
    setPanelDerechoAbierto(false); 
    try {
      const dataChat = await api.getHistorial(id);
      setMensajes(dataChat.mensajes || []);
      recargarEntidadesYCronicas(id);
      
      if (dataChat.config) {
         setPersonaje(dataChat.config.personaje || '');
         setUniverso(dataChat.config.universo || '');
         setTematica(dataChat.config.tematica || '');
         setDetallesExtra(dataChat.config.detalles_extra || '');
         setPerfilJugador(dataChat.config.perfil_jugador || '');
         setMemoriaRol(dataChat.config.memoria_rol || '');
      }
    } catch (error) { console.error("Error al seleccionar escena:", error); }
  };

  const crearNuevaEscena = async () => {
    try {
      const data = await api.crearEscena(`Aventura ${escenas.length + 1}`);
      setEscenas([...escenas, data]);
      seleccionarEscena(data.id);
    } catch (error) { alert("Error al crear la partida."); }
  };

  const eliminarEscena = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("⚠️ ¿Borrar esta aventura?")) return;
    try {
      await api.eliminarEscena(id);
      const nuevasEscenas = escenas.filter(esc => esc.id !== id);
      setEscenas(nuevasEscenas);
      if (escenaActiva === id) {
        if (nuevasEscenas.length > 0) seleccionarEscena(nuevasEscenas[0].id);
        else { setEscenaActiva(null); setMensajes([]); setEntidades([]); setCronicas([]); }
      }
    } catch (error) { alert("Error al eliminar la escena."); }
  };

  // --- SERVICIOS DE PANEL DERECHO Y LORE ---
  const cargarCronicas = async (id) => { try { const data = await api.getCronicas(id); setCronicas(Array.isArray(data) ? data : []); } catch (error) { setCronicas([]); } };
  const cargarEntidades = async (id) => { try { const data = await api.getEntidades(id); setEntidades(Array.isArray(data) ? data : []); } catch (error) { setEntidades([]); } };
  
  const registrarEntidad = async () => {
    if (!escenaActiva || !nuevaEntidad.nombre) return;
    try { await api.crearEntidad({ ...nuevaEntidad, id_escena: escenaActiva }); setNuevaEntidad({ nombre: '', tipo: 'Personaje', descripcion: '' }); cargarEntidades(escenaActiva); } catch (error) { alert("Error al registrar entidad."); }
  };

  const guardarLorebook = async () => { /* ... */ };
  const editarEntidadExistente = async (id, nuevosDatos) => { /* ... */ };

  const borrarMensaje = async (id_mensaje) => {
    if (!window.confirm("¿Eliminar este mensaje permanentemente?")) return;
    await api.borrarMensaje(id_mensaje); seleccionarEscena(escenaActiva); 
  };

  const guardarEdicion = async (id_mensaje, nuevoTexto) => {
    await api.editarMensaje(id_mensaje, nuevoTexto); seleccionarEscena(escenaActiva); 
  };

  const clonarLineaTemporal = async (id_mensaje) => { /* ... */ };

  const convocarEntidad = (entidad) => {
    setMensaje(`[ACCION DEL SISTEMA: El Director introduce a la escena a '${entidad.nombre}' (${entidad.tipo}). Detalles: ${entidad.descripcion}.] `);
  };

  // --- SERVICIOS DE IA AVANZADOS ---
  const aplicarMagiaDirector = async () => {
    if (!textoMagico.trim() || !escenaActiva) return;
    setProcesandoMagia(true);
    try {
      const data = await api.configurarDirector({ texto_crudo: textoMagico, id_escena: escenaActiva });
      if (!data.error) {
        if(data.personaje) setPersonaje(data.personaje);
        if(data.universo) setUniverso(data.universo);
        if(data.tematica) setTematica(data.tematica);
        if(data.detalles_extra) setDetallesExtra(data.detalles_extra);
        setTextoMagico(''); 
      }
    } catch (error) { alert("Error aplicando la magia del director."); } 
    finally { setProcesandoMagia(false); }
  };

  const autoActualizarMemoria = async (memoriaActualParaEnviar) => { /* ... */ };

  const subirTarjetaTavern = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const boton = e.target.previousSibling;
    if (boton) boton.innerText = "⏳ Leyendo...";
    const formData = new FormData(); formData.append('archivo', file);
    try {
      const data = await api.leerTavern(formData);
      if (!data.error) {
        if (data.nombre) setPersonaje(data.nombre);
        if (data.escenario) setUniverso(data.escenario);
        if (data.personalidad || data.descripcion) setDetallesExtra(`[PERSONALIDAD]\n${data.personalidad}\n\n[DESCRIPCIÓN]\n${data.descripcion}`);
        setMostrarAjustes(false); 
      }
    } catch (error) { alert("Error al leer la tarjeta."); } finally {
      if (boton) boton.innerText = "🎴 Subir PNG (Tavern)"; e.target.value = null;
    }
  };

  // --- ENVÍO CON SISTEMA ORQUESTADOR ---
  const payloadActual = { personaje, universo, tematica, detalles_extra: detallesExtra, memoria_rol: memoriaRol, perfil_jugador: perfilJugador };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!mensaje.trim()) return;

    const listaPersonajes = personaje.split(',').map(p => p.trim()).filter(p => p);
    let personajeElegido = personaje;

    if (listaPersonajes.length > 1) {
      setOrquestando(true);
      try {
        const orq = await api.consultarOrquestador({ id_escena: escenaActiva, mensaje: mensaje, personajes_presentes: listaPersonajes });
        if (orq.siguiente_turno) personajeElegido = orq.siguiente_turno;
      } catch (error) { console.error("Error orquestador", error); personajeElegido = listaPersonajes[0]; }
      setOrquestando(false);
    }

    const payloadGrupal = { ...payloadActual, personaje: personajeElegido };
    const mensajeAEnviar = mensaje;
    setMensaje(''); 
    await enviar(mensajeAEnviar, payloadGrupal);
  };

  const manejarRegeneracion = async (textoAnterior) => { await regenerar(textoAnterior, payloadActual); };

  // --- MODAL DE CONFIGURACIÓN AVANZADA ---
  const FormularioConfiguracion = () => (
    <div className="space-y-5 text-slate-300">
      <div className="p-4 bg-slate-800/50 rounded-lg border border-dashed border-sky-500/30 text-center relative hover:bg-slate-800 cursor-pointer transition-colors">
        <span className="text-sm font-bold text-sky-400">🎴 Subir Tarjeta PNG de Personaje (Formato Tavern)</span>
        <input type="file" accept=".png" onChange={subirTarjetaTavern} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Personaje(s) - Separa con comas para Party</label>
          <input type="text" value={personaje} onChange={(e) => setPersonaje(e.target.value)} placeholder="Ej: Batman, El Joker" className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg outline-none focus:border-sky-500 transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Tu Perfil / Rol (Jugador)</label>
          <input type="text" value={perfilJugador} onChange={(e) => setPerfilJugador(e.target.value)} placeholder="Ej: Soy Jim Gordon..." className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg outline-none focus:border-sky-500 transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Universo / Escenario</label>
          <input type="text" value={universo} onChange={(e) => setUniverso(e.target.value)} placeholder="Ej: Ciudad Gótica, Año Uno" className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg outline-none focus:border-sky-500 transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Temática</label>
          <input type="text" value={tematica} onChange={(e) => setTematica(e.target.value)} placeholder="Ej: Noir, Acción, Suspenso" className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg outline-none focus:border-sky-500 transition-colors" />
        </div>
      </div>
      
      <div>
         <label className="block text-xs text-amber-500 mb-1 font-bold">Instrucciones y Reglas Absolutas (Inmutable)</label>
         <textarea value={detallesExtra} onChange={(e) => setDetallesExtra(e.target.value)} rows="5" placeholder="Define la personalidad, restricciones, comportamiento, etc. La IA seguirá esto al pie de la letra." className="w-full p-3 bg-slate-950 border border-amber-900/50 rounded-lg text-sm text-amber-500/90 outline-none focus:border-amber-500 transition-colors" />
      </div>
    </div>
  );

  const escenaActualObj = escenas.find(e => e.id === escenaActiva);
  const nombreEscenaHeader = escenaActualObj ? escenaActualObj.nombre : `Selecciona un Chat`;
  const groupedMessages = [];
  for (let msg of mensajes) {
    if (msg.emisor === 'Jugador') groupedMessages.push({ type: 'user', id: msg.id, contenido: msg.contenido });
    else { const last = groupedMessages[groupedMessages.length - 1]; if (last && last.type === 'ai_group') last.alts.push(msg); else groupedMessages.push({ type: 'ai_group', alts: [msg] }); }
  }

  const modoPreparacion = mensajes.length === 0 && escenaActiva !== null;

  const abrirPestaña = (pestaña) => {
    if (panelDerechoAbierto && pestañaDerecha === pestaña) {
      setPanelDerechoAbierto(false); 
    } else {
      setPestañaDerecha(pestaña);
      setPanelDerechoAbierto(true);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] text-slate-200 font-sans overflow-hidden">
      
      <Sidebar escenas={escenas} escenaActiva={escenaActiva} crearNuevaEscena={crearNuevaEscena} seleccionarEscena={seleccionarEscena} eliminarEscena={eliminarEscena} />

      {/* ÁREA CENTRAL */}
      <div className="flex-1 flex flex-col relative h-full">
        
        <header className="absolute top-0 w-full p-4 flex justify-between items-center z-20 pointer-events-none">
           <div className="pointer-events-auto flex items-center gap-4">
              <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">Aventura</span>
              <span className="text-sm text-amber-500/90 bg-amber-950/30 px-3 py-1 rounded-full border border-amber-900/30">
                {nombreEscenaHeader}
              </span>
           </div>
           
           <div className="pointer-events-auto flex gap-2">
             {escenaActiva && (
               <button onClick={() => setMostrarAjustes(true)} className="p-2 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors border border-slate-800" title="Ajustes Avanzados de IA">
                 ⚙️
               </button>
             )}
           </div>
        </header>

        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 md:px-8 z-10 h-full mt-16 pb-4">
          
          {modoPreparacion && (
             <div className="flex-1 flex flex-col items-center justify-center animate-fade-in">
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mb-8 shadow-lg">✨</div>
                <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 tracking-tight">Prepara tu Aventura</h1>
                <p className="text-slate-400 text-center mb-10 max-w-lg">
                  Describe el mundo que imaginas y deja que la historia tome forma.<br/>Los detalles llegan después.
                </p>

                <div className="w-full bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6 backdrop-blur-sm focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/50 transition-all duration-300">
                  <textarea 
                    value={textoMagico} onChange={(e) => setTextoMagico(e.target.value)} 
                    placeholder='Ej: "Una partida de misterio en los años 20, con Sherlock y Watson tras un asesino..."' 
                    className="w-full h-32 bg-transparent text-slate-200 text-lg resize-none outline-none placeholder:text-slate-600 custom-scrollbar" 
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end mt-4 gap-4 border-t border-slate-800/50 pt-4">
                    <span className="text-xs text-slate-500">La IA construirá personajes, escenario y tono por ti.</span>
                    <button onClick={aplicarMagiaDirector} disabled={procesandoMagia || !textoMagico.trim()} className="w-full sm:w-auto px-6 py-2 bg-slate-100 hover:bg-white text-slate-900 font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {procesandoMagia ? '✨ Tejiendo...' : '🪄 Crear mundo'}
                    </button>
                  </div>
                </div>
             </div>
          )}

          {!modoPreparacion && (
            <div className="flex-1 overflow-y-auto rounded-xl flex flex-col gap-6 custom-scrollbar pb-4 pr-2">
              {groupedMessages.map((group, index) => {
                if (group.type === 'user') return <MensajeUsuario key={`usr_${group.id}`} msg={group} onEdit={guardarEdicion} onDelete={borrarMensaje} onClone={clonarLineaTemporal} />;
                else return <GrupoIA key={`ai_${group.alts[0].id}`} alts={group.alts} onEdit={guardarEdicion} onDelete={borrarMensaje} onRegenerate={() => manejarRegeneracion(groupedMessages[index - 1]?.contenido)} onClone={clonarLineaTemporal} />;
              })}
              {orquestando && <div className="self-start flex items-center gap-2 text-xs font-bold text-fuchsia-400 animate-pulse bg-fuchsia-900/20 px-3 py-1 rounded-full border border-fuchsia-900/50">🎬 El Director Orquestador está decidiendo quién habla...</div>}
              {cargando && !orquestando && mensajes.length > 0 && mensajes[mensajes.length - 1].emisor === 'Jugador' && <div className="self-start flex items-center gap-3 text-slate-500 text-sm mt-2 font-serif italic"><span className="animate-pulse">Escribiendo...</span></div>}
              <div ref={mensajesEndRef} />
            </div>
          )}

          <div className="relative mt-4 shrink-0">
            {!modoPreparacion && (
              <div className="absolute -top-8 left-4 flex gap-2">
                 <button onClick={() => setMensaje(prev => prev + "/orden ")} className="text-[10px] font-bold uppercase text-slate-400 hover:text-fuchsia-400 transition-colors">🎬 Orden</button>
                 <button onClick={() => setMensaje(prev => prev + "/forzar ")} className="text-[10px] font-bold uppercase text-slate-400 hover:text-amber-400 transition-colors">⚡ Forzar</button>
              </div>
            )}
            <form onSubmit={manejarEnvio} className="flex gap-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-2 backdrop-blur-md focus-within:border-slate-600 transition-colors">
              <input type="text" value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder={modoPreparacion ? "Escribe la primera escena para comenzar..." : "Tu turno..."} className="flex-1 bg-transparent px-4 text-slate-200 outline-none placeholder:text-slate-600" />
              <button type="submit" disabled={cargando || orquestando || !mensaje.trim()} className="px-6 py-3 bg-slate-200 hover:bg-white text-slate-900 font-bold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2">{modoPreparacion ? 'Comenzar ➔' : 'Enviar ➔'}</button>
            </form>
          </div>
        </div>
      </div>

      {/* 1. PANEL DERECHO DESLIZABLE (A la izquierda de la barra) */}
      {panelDerechoAbierto && (
        <div className="w-80 h-full border-l border-slate-800/50 bg-[#0a0a0a] shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.8)] relative z-30 shrink-0 animate-fade-in flex flex-col overflow-hidden">
           <PanelDerecho 
              pestañaDerecha={pestañaDerecha} setPestañaDerecha={setPestañaDerecha} memoriaRol={memoriaRol} setMemoriaRol={setMemoriaRol} actualizandoMemoria={actualizandoMemoria} autoActualizarMemoria={autoActualizarMemoria} escenaActiva={escenaActiva} nuevaEntidad={nuevaEntidad} setNuevaEntidad={setNuevaEntidad} registrarEntidad={registrarEntidad} entidades={entidades} convocarEntidad={convocarEntidad} cargarCronicas={cargarCronicas} cronicas={cronicas} loreTitulo={loreTitulo} setLoreTitulo={setLoreTitulo} loreTexto={loreTexto} setLoreTexto={setLoreTexto} guardarLorebook={guardarLorebook} editarEntidadExistente={editarEntidadExistente} 
           />
        </div>
      )}

      {/* 2. BARRA DE HERRAMIENTAS (Anclada al extremo derecho) */}
      {escenaActiva && (
        <div className="w-16 bg-[#0a0a0a] border-l border-slate-800/50 flex flex-col items-center py-6 z-40 shrink-0 justify-between">
          <div className="flex flex-col gap-4">
            <button onClick={() => abrirPestaña('memoria')} className={`p-3 rounded-xl transition-all ${panelDerechoAbierto && pestañaDerecha === 'memoria' ? 'bg-sky-900/30 text-sky-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`} title="Estado Actual"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg></button>
            <button onClick={() => abrirPestaña('entidades')} className={`p-3 rounded-xl transition-all ${panelDerechoAbierto && pestañaDerecha === 'entidades' ? 'bg-indigo-900/30 text-indigo-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`} title="Entidades (NPCs)"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></button>
            <button onClick={() => abrirPestaña('lore')} className={`p-3 rounded-xl transition-all ${panelDerechoAbierto && pestañaDerecha === 'lore' ? 'bg-amber-900/30 text-amber-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`} title="Lorebook"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></button>
            <button onClick={() => abrirPestaña('cronicas')} className={`p-3 rounded-xl transition-all ${panelDerechoAbierto && pestañaDerecha === 'cronicas' ? 'bg-emerald-900/30 text-emerald-400' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`} title="Crónicas"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></button>
          </div>
          {panelDerechoAbierto && (
            <button onClick={() => setPanelDerechoAbierto(false)} className="mt-auto p-3 text-slate-500 hover:text-white rounded-xl transition-all" title="Ocultar Panel">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      )}

      {mostrarAjustes && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0a]/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <button onClick={() => setMostrarAjustes(false)} className="absolute top-6 right-6 text-slate-400 hover:text-white text-xl">✕</button>
            <h2 className="text-2xl font-serif text-white mb-6">Ajustes de Aventura</h2>
            <FormularioConfiguracion />
            <div className="mt-8 flex justify-end">
              <button onClick={() => setMostrarAjustes(false)} className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors">Guardar y Continuar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;