import { useState } from 'react';
import LorebookModal from './LorebookModal';

export default function PanelDerecho({
  pestañaDerecha, setPestañaDerecha,
  memoriaRol, setMemoriaRol, actualizandoMemoria, autoActualizarMemoria, escenaActiva,
  nuevaEntidad, setNuevaEntidad, registrarEntidad, entidades, convocarEntidad,
  cargarCronicas, cronicas,
  loreTitulo, setLoreTitulo, loreTexto, setLoreTexto, guardarLorebook,
  editarEntidadExistente
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ESTADOS PARA MODO EDICIÓN
  const [editandoId, setEditandoId] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({ nombre: '', tipo: '', descripcion: '' });

  const iniciarEdicion = (ent) => {
    setEditandoId(ent.id);
    setDatosEdicion({ nombre: ent.nombre, tipo: ent.tipo, descripcion: ent.descripcion });
  };

  const guardarEdicion = () => {
    editarEntidadExistente(editandoId, datosEdicion);
    setEditandoId(null);
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-300 w-full">
      
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
              className="flex-1 w-full bg-[#0a0a0a] text-emerald-400/90 border border-emerald-900/50 p-4 rounded-lg font-mono text-xs focus:ring-1 focus:ring-emerald-500 outline-none resize-none disabled:opacity-50 transition-all custom-scrollbar leading-relaxed" 
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
            <div className="flex flex-col gap-3 mb-6 bg-[#0a0a0a] p-3 rounded-lg border border-indigo-900/30">
              <input type="text" placeholder="Nombre de entidad" value={nuevaEntidad.nombre} onChange={(e) => setNuevaEntidad({...nuevaEntidad, nombre: e.target.value})} className="p-2 bg-slate-900 text-indigo-200 border border-slate-800 rounded text-xs outline-none focus:border-indigo-500/50" />
              <select value={nuevaEntidad.tipo} onChange={(e) => setNuevaEntidad({...nuevaEntidad, tipo: e.target.value})} className="p-2 bg-slate-900 text-indigo-200 border border-slate-800 rounded text-xs outline-none focus:border-indigo-500/50">
                <option value="Personaje">Personaje</option><option value="Objeto">Objeto</option><option value="Lugar">Lugar</option>
              </select>
              <textarea placeholder="Descripción breve" value={nuevaEntidad.descripcion} onChange={(e) => setNuevaEntidad({...nuevaEntidad, descripcion: e.target.value})} rows="2" className="p-2 bg-slate-900 text-indigo-200 border border-slate-800 rounded text-xs outline-none focus:border-indigo-500/50 resize-y" />
              <button onClick={registrarEntidad} className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded text-xs font-bold transition-colors">CREAR</button>
            </div>
            
            <div className="flex flex-col gap-3">
              {entidades.map(ent => (
                <div key={ent.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-800/80 flex flex-col gap-2 relative group">
                  {editandoId === ent.id ? (
                    <div className="flex flex-col gap-2 mt-2">
                       <input type="text" value={datosEdicion.nombre} onChange={e => setDatosEdicion({...datosEdicion, nombre: e.target.value})} className="p-1.5 bg-[#0a0a0a] text-indigo-300 border border-indigo-900/50 rounded text-sm font-bold outline-none" />
                       <select value={datosEdicion.tipo} onChange={e => setDatosEdicion({...datosEdicion, tipo: e.target.value})} className="p-1 bg-[#0a0a0a] text-slate-400 border border-slate-700 rounded text-[10px] outline-none">
                         <option value="Personaje">Personaje</option><option value="Objeto">Objeto</option><option value="Lugar">Lugar</option>
                       </select>
                       <textarea value={datosEdicion.descripcion} onChange={e => setDatosEdicion({...datosEdicion, descripcion: e.target.value})} rows="4" className="p-2 bg-[#0a0a0a] text-slate-300 border border-slate-700 rounded text-xs outline-none resize-y" />
                       <div className="flex gap-2">
                         <button onClick={guardarEdicion} className="flex-1 py-1.5 bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50 rounded text-xs font-bold">Guardar</button>
                         <button onClick={() => setEditandoId(null)} className="flex-1 py-1.5 bg-slate-700/50 text-slate-300 hover:bg-slate-600 rounded text-xs font-bold">Cancelar</button>
                       </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-indigo-300 text-sm">{ent.nombre}</span>
                        <button onClick={() => iniciarEdicion(ent)} className="text-slate-500 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs" title="Editar">✏️</button>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{ent.tipo}</span>
                      <span className="text-xs text-slate-400 line-clamp-3 leading-relaxed hover:line-clamp-none transition-all cursor-pointer">{ent.descripcion}</span>
                      <button onClick={() => convocarEntidad(ent)} className="mt-1 self-start px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded hover:bg-indigo-500/20 text-[10px] font-bold transition-colors">⚡ INYECTAR</button>
                    </>
                  )}
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
                <div key={c.id} className="bg-[#0a0a0a] p-4 rounded-lg border border-amber-900/30">
                  <span className="font-bold text-amber-400 text-sm block mb-2">{c.capitulo}</span>
                  <span className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-serif">{c.contenido}</span>
                </div>
              ))}
              {cronicas.length === 0 && <p className="text-xs text-slate-600 italic text-center mt-4">La historia se escribirá a medida que juegues.</p>}
            </div>
          </div>
        )}

        {pestañaDerecha === 'lore' && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5">
            <div className="w-16 h-16 bg-fuchsia-900/30 rounded-full flex items-center justify-center border border-fuchsia-500/30 shadow-[0_0_20px_rgba(217,70,239,0.15)]">
              <span className="text-3xl">🔮</span>
            </div>
            <div>
              <span className="text-sm font-bold text-fuchsia-400 uppercase tracking-wider block mb-2">El Lorebook</span>
              <p className="text-xs text-slate-400 leading-relaxed px-2">
                El conocimiento del mundo ahora reside en el espacio vectorial. Abre la biblioteca para gestionar e inyectar nuevas reglas.
              </p>
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="mt-2 w-full py-3.5 bg-gradient-to-r from-fuchsia-700 to-purple-600 hover:from-fuchsia-600 hover:to-purple-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-fuchsia-900/30 transition-all flex items-center justify-center gap-2"
            >
              <span>📖</span> ABRIR BIBLIOTECA
            </button>
          </div>
        )}
      </div>

      <LorebookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        loreTitulo={loreTitulo} 
        setLoreTitulo={setLoreTitulo} 
        loreTexto={loreTexto} 
        setLoreTexto={setLoreTexto} 
        guardarLorebook={guardarLorebook} 
      />
    </div>
  );
}