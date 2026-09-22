export default function PanelDerecho({
  pestañaDerecha, setPestañaDerecha,
  memoriaRol, setMemoriaRol, actualizandoMemoria, autoActualizarMemoria, escenaActiva,
  nuevaEntidad, setNuevaEntidad, registrarEntidad, entidades, convocarEntidad,
  cargarCronicas, cronicas,
  loreTitulo, setLoreTitulo, loreTexto, setLoreTexto, guardarLorebook
}) {
  return (
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
  );
}