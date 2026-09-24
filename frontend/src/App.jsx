import { useState, useEffect, useRef } from 'react';
import { GrupoIA, MensajeUsuario } from './components/Mensajes';
import Sidebar from './components/Sidebar';
import PanelDerecho from './components/PanelDerecho';
import { api } from './services/api';
import { useChat } from './hooks/useChat';

function App() {
  // 1. ESTADOS DE CONFIGURACIÓN DEL PERSONAJE
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

  // 3. AUTO-SCROLL INTELIGENTE
  const mensajesEndRef = useRef(null);
  const scrollToBottom = () => mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // 4. FUNCIONES AUXILIARES PARA EL HOOK DE CHAT
  const recargarEntidadesYCronicas = (id) => {
    cargarEntidades(id);
    cargarCronicas(id);
  };

  // 👇 INYECCIÓN DEL CUSTOM HOOK DE STREAMING 👇
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

  const exportarAventura = async () => {
    if (!escenaActiva) return;
    try {
      const data = await api.exportarEscena(escenaActiva);
      if (data.error) return alert(data.error);

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `Backup_${data.aventura.replace(/\s+/g, '_')}.json`);
      document.body.appendChild(downloadAnchorNode); 
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    } catch (error) { alert("Error al exportar."); }
  };

  // --- SERVICIOS DE PANEL DERECHO Y LORE ---
  const cargarCronicas = async (id) => {
    if (!id) return;
    try {
      const data = await api.getCronicas(id);
      setCronicas(Array.isArray(data) ? data : []);
    } catch (error) { setCronicas([]); }
  };

  const cargarEntidades = async (id) => {
    if (!id) return;
    try {
      const data = await api.getEntidades(id);
      setEntidades(Array.isArray(data) ? data : []);
    } catch (error) { setEntidades([]); }
  };

  const registrarEntidad = async () => {
    if (!escenaActiva || !nuevaEntidad.nombre) return;
    try {
      await api.crearEntidad({ ...nuevaEntidad, id_escena: escenaActiva });
      setNuevaEntidad({ nombre: '', tipo: 'Personaje', descripcion: '' });
      cargarEntidades(escenaActiva);
    } catch (error) { alert("Error al registrar entidad."); }
  };

  const guardarLorebook = async () => {
    if (!escenaActiva) return alert("Selecciona una partida primero.");
    if (!loreTitulo || !loreTexto) return alert("Falta título o contenido.");
    try {
      await api.guardarLore({ id_escena: escenaActiva, id_documento: loreTitulo, texto_lore: loreTexto });
      alert("📖 Lore inyectado exitosamente en ESTE universo.");
      setLoreTitulo(''); setLoreTexto('');
    } catch (error) { alert("Error al guardar Lore."); }
  };

  // --- SERVICIOS DE CHAT Y MULTIVERSO ---
  const borrarMensaje = async (id_mensaje) => {
    if (!window.confirm("¿Eliminar este mensaje permanentemente?")) return;
    await api.borrarMensaje(id_mensaje);
    seleccionarEscena(escenaActiva); 
  };

  const guardarEdicion = async (id_mensaje, nuevoTexto) => {
    await api.editarMensaje(id_mensaje, nuevoTexto);
    seleccionarEscena(escenaActiva); 
  };

  const clonarLineaTemporal = async (id_mensaje) => {
    if (!window.confirm("🌌 ¿Crear una línea temporal alternativa desde este punto?")) return;
    try {
      const data = await api.clonarEscena(escenaActiva, id_mensaje);
      if (data.nueva_escena_id) {
        await cargarEscenas(); 
        seleccionarEscena(data.nueva_escena_id); 
      }
    } catch (error) { alert("Error al bifurcar la línea temporal."); }
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
        if(data.titulo_partida) {
          await api.editarMensaje(escenaActiva, data.titulo_partida); // Reutilizamos lógica si es necesario, o recargamos
          cargarEscenas(); 
        }
        setTextoMagico(''); 
      }
    } catch (error) { alert("Error aplicando la magia del director."); } 
    finally { setProcesandoMagia(false); }
  };

  const autoActualizarMemoria = async (memoriaActualParaEnviar) => {
    if (!escenaActiva) return; 
    setActualizandoMemoria(true);
    try {
      const data = await api.sintetizarMemoria({ id_escena: escenaActiva, memoria_actual: memoriaActualParaEnviar });
      if (data.nueva_memoria) setMemoriaRol(data.nueva_memoria);
    } catch (error) { alert("Error al actualizar memoria."); } 
    finally { setActualizandoMemoria(false); }
  };

  const subirTarjetaTavern = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const boton = e.target.previousSibling;
    if (boton) boton.innerText = "⏳ Leyendo...";

    const formData = new FormData();
    formData.append('archivo', file);

    try {
      const data = await api.leerTavern(formData);
      if (data.error) {
        alert(data.error);
      } else {
        if (data.nombre) setPersonaje(data.nombre);
        if (data.escenario) setUniverso(data.escenario);
        if (data.personalidad || data.descripcion) {
          setDetallesExtra(`[PERSONALIDAD]\n${data.personalidad}\n\n[DESCRIPCIÓN]\n${data.descripcion}`);
        }
        alert(`¡Alma de ${data.nombre} extraída con éxito!`);
      }
    } catch (error) {
      alert("Error al leer la tarjeta.");
    } finally {
      if (boton) boton.innerText = "🎴 Subir PNG (Tavern)";
      e.target.value = null;
    }
  };

  // --- ENVOLTURAS PARA EL HOOK DE CHAT ---
  const payloadActual = { personaje, universo, tematica, detalles_extra: detallesExtra, memoria_rol: memoriaRol, perfil_jugador: perfilJugador };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    await enviar(mensaje, payloadActual);
    setMensaje(''); 
  };

  const manejarRegeneracion = async (textoAnterior) => {
    await regenerar(textoAnterior, payloadActual);
  };

  // --- HELPERS UI ---
  const convocarEntidad = (entidad) => setMensaje(`[ACCION DEL SISTEMA: El Director introduce a la escena a '${entidad.nombre}' (${entidad.tipo}). Detalles: ${entidad.descripcion}.] `);
  const cargarIdentidadAEstado = (e) => {
    e.preventDefault();
    setMemoriaRol(prev => prev + `\n[IDENTIDAD IA]\n- Personaje: ${personaje || 'No definido'}\n- Universo: ${universo || 'No definido'}\n`);
    setPestañaDerecha('memoria');
  };

  // AGRUPACIÓN VISUAL DE MENSAJES
  const escenaActualObj = escenas.find(e => e.id === escenaActiva);
  const nombreEscenaHeader = escenaActualObj ? escenaActualObj.nombre : `Selecciona un Chat`;
  
  const groupedMessages = [];
  for (let msg of mensajes) {
    if (msg.emisor === 'Jugador') {
      groupedMessages.push({ type: 'user', id: msg.id, contenido: msg.contenido });
    } else {
      const last = groupedMessages[groupedMessages.length - 1];
      if (last && last.type === 'ai_group') last.alts.push(msg); 
      else groupedMessages.push({ type: 'ai_group', alts: [msg] });
    }
  }

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      <Sidebar 
        escenas={escenas} escenaActiva={escenaActiva} 
        crearNuevaEscena={crearNuevaEscena} seleccionarEscena={seleccionarEscena} eliminarEscena={eliminarEscena} 
      />

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

          {/* Construcción Rápida */}
          <div className="bg-slate-900/80 p-5 rounded-xl border border-sky-900/50 shadow-lg shadow-sky-900/10 mb-4 backdrop-blur-sm">
             <label className="block text-sm font-bold text-sky-400 mb-3 flex items-center gap-2">✨ Construcción Rápida</label>
             <div className="flex flex-col sm:flex-row gap-3">
               <textarea value={textoMagico} onChange={(e) => setTextoMagico(e.target.value)} rows="1" placeholder='Ej: "Quiero hablar con Batman..."' className="flex-1 p-3 bg-slate-950 text-slate-200 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-none transition-all placeholder:text-slate-600" />
               <button onClick={aplicarMagiaDirector} disabled={procesandoMagia} className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg shadow-lg shadow-sky-900/20 transition-all whitespace-nowrap disabled:opacity-50">
                 {procesandoMagia ? 'Configurando...' : 'Configurar'}
               </button>
             </div>
          </div>

          {/* Opciones Avanzadas */}
          <details className="group mb-6 bg-slate-900/40 p-4 rounded-xl border border-slate-800/50 backdrop-blur-sm transition-all open:bg-slate-900/60 open:border-slate-700">
            <summary className="cursor-pointer text-slate-400 hover:text-slate-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 select-none outline-none">
               ⚙️ Opciones Avanzadas <span className="text-slate-600 group-open:rotate-180 transition-transform">▼</span>
            </summary>
            
            <div className="mt-5 pt-4 border-t border-slate-800/50">
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-dashed border-sky-500/30 text-center relative hover:bg-slate-800 transition-colors group/upload">
                <span className="text-sm font-bold text-sky-400 block pointer-events-none group-hover/upload:text-sky-300 transition-colors">🎴 Subir Tarjeta PNG (Tavern)</span>
                <input type="file" accept=".png" onChange={subirTarjetaTavern} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-xs text-slate-500 mb-1.5">Personaje</label><input type="text" value={personaje} onChange={(e) => setPersonaje(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-md text-sm outline-none" /></div>
                <div><label className="block text-xs text-slate-500 mb-1.5">Universo</label><input type="text" value={universo} onChange={(e) => setUniverso(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-md text-sm outline-none" /></div>
                <div><label className="block text-xs text-slate-500 mb-1.5">Temática</label><input type="text" value={tematica} onChange={(e) => setTematica(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-md text-sm outline-none" /></div>
              </div>

              <div className="mt-4">
                <label className="block text-xs text-slate-500 mb-1.5">Tu Perfil (Jugador)</label>
                <input type="text" value={perfilJugador} onChange={(e) => setPerfilJugador(e.target.value)} className="w-full p-2 bg-slate-950 border border-slate-800 rounded-md text-sm outline-none" />
              </div>
              <div className="mt-4">
                 <label className="block text-xs text-amber-500/70 mb-1.5">Reglas Absolutas</label>
                 <textarea value={detallesExtra} onChange={(e) => setDetallesExtra(e.target.value)} rows="2" className="w-full p-2 bg-slate-950 border border-amber-900/30 rounded-md text-sm text-amber-500/90 outline-none" />
              </div>

              <div className="flex justify-end mt-4">
                <button onClick={cargarIdentidadAEstado} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-semibold">➡️ Cargar a Memoria</button>
              </div>
            </div>
          </details>

          {/* Área de Chat */}
          <div className="flex-1 overflow-y-auto bg-slate-900/60 p-4 md:p-6 rounded-xl mb-2 border border-slate-800 flex flex-col gap-4 backdrop-blur-sm custom-scrollbar shadow-inner">
            {groupedMessages.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-60">
                 <span className="text-4xl mb-2">🎭</span>
                 <p>La escena está lista. Comienza la aventura.</p>
               </div>
            ) : groupedMessages.map((group, index) => {
              if (group.type === 'user') {
                return <MensajeUsuario key={`usr_${group.id}`} msg={group} onEdit={guardarEdicion} onDelete={borrarMensaje} onClone={clonarLineaTemporal} />;
              } else {
                const mensajePrevio = groupedMessages[index - 1];
                const textoAnterior = mensajePrevio && mensajePrevio.type === 'user' ? mensajePrevio.contenido : '(Continúa)';
                return <GrupoIA key={`ai_${group.alts[0].id}`} alts={group.alts} onEdit={guardarEdicion} onDelete={borrarMensaje} onRegenerate={() => manejarRegeneracion(textoAnterior)} onClone={clonarLineaTemporal} />;
              }
            })}
            
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
            <div ref={mensajesEndRef} />
          </div>

          {/* Comandos Rápidos */}
          <div className="flex gap-2 mb-2 px-1">
             <button type="button" onClick={() => setMensaje(prev => prev + "/orden ")} className="px-2 py-1 bg-fuchsia-900/40 text-fuchsia-400 border border-fuchsia-700/50 rounded text-[10px] font-bold uppercase">🎬 Orden</button>
             <button type="button" onClick={() => setMensaje(prev => prev + "/forzar ")} className="px-2 py-1 bg-amber-900/40 text-amber-400 border border-amber-700/50 rounded text-[10px] font-bold uppercase">⚡ Forzar</button>
             <button type="button" onClick={() => setMensaje(prev => prev + "/accion ")} className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-600 rounded text-[10px] font-bold uppercase">🏃 Acción</button>
          </div>

          <form onSubmit={manejarEnvio} className="flex gap-3 relative">
            <input type="text" value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escribe un diálogo o usa /accion, /orden..." className="flex-1 p-4 bg-slate-900 border border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-sky-500" />
            <button type="submit" disabled={cargando} className="px-6 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl disabled:opacity-50">Enviar</button>
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