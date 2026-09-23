import { useState, useEffect } from 'react';

export function GrupoIA({ alts, onEdit, onDelete, onRegenerate, onClone }) {
  const [idx, setIdx] = useState(alts.length - 1);
  const [editando, setEditando] = useState(false);
  const [textoEdicion, setTextoEdicion] = useState('');

  useEffect(() => { setIdx(alts.length - 1); }, [alts.length]);

  const msg = alts[idx];
  if (!msg) return null;

  // Extractor de etiquetas RAG
  let contenidoCrudo = msg.contenido;
  let fuenteLore = null;
  let textoVisual = contenidoCrudo;

  if (contenidoCrudo.startsWith("[FUENTE_LORE:")) {
    const finEtiqueta = contenidoCrudo.indexOf("]\n");
    if (finEtiqueta !== -1) {
      fuenteLore = contenidoCrudo.substring(13, finEtiqueta);
      textoVisual = contenidoCrudo.substring(finEtiqueta + 2);
    }
  }

  const handleGuardar = async () => {
    const textoA_Guardar = fuenteLore ? `[FUENTE_LORE:${fuenteLore}]\n${textoEdicion}` : textoEdicion;
    await onEdit(msg.id, textoA_Guardar);
    setEditando(false);
  };

  return (
    <div className="relative self-start bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl rounded-tl-sm shadow-md max-w-[85%] border border-slate-700 transition-all mt-2">
      {fuenteLore && (
        <div className="absolute -top-3 -right-2 bg-gradient-to-r from-fuchsia-600 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg shadow-fuchsia-900/50 border border-fuchsia-400 flex items-center gap-1 z-10">
          <span className="text-xs">📖</span> Lore: {fuenteLore}
        </div>
      )}

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
            <button onClick={() => { setEditando(!editando); setTextoEdicion(textoVisual); }} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Editar">✏️</button>
            <button onClick={onRegenerate} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Regenerar">🎲</button>
            {/* 👇 BOTÓN DE BIFURCACIÓN AÑADIDO AQUÍ 👇 */}
            <button onClick={() => onClone(msg.id)} className="p-1 hover:bg-emerald-900/50 rounded text-slate-400 hover:text-emerald-400 transition-colors" title="Bifurcar Línea Temporal (Clonar)">🔀</button>
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
        <div className="text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap">{textoVisual}</div>
      )}
    </div>
  );
}

export function MensajeUsuario({ msg, onEdit, onDelete, onClone }) {
  const [editando, setEditando] = useState(false);
  const [textoEdicion, setTextoEdicion] = useState(msg.contenido);

  const handleGuardar = async () => {
    await onEdit(msg.id, textoEdicion);
    setEditando(false);
  };

  return (
    <div className="self-end bg-sky-950/70 border border-sky-800/40 p-4 rounded-2xl rounded-tr-sm shadow-md max-w-[85%] group transition-all">
      <div className="flex justify-between items-center mb-1 gap-4">
        <span className="text-[11px] text-sky-400 font-bold uppercase tracking-wider">Tú</span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => { setEditando(!editando); setTextoEdicion(msg.contenido); }} className="p-1 hover:bg-sky-900/50 rounded text-slate-400 hover:text-white transition-colors" title="Editar y Reenviar">✏️</button>
          {/* 👇 BOTÓN DE BIFURCACIÓN AÑADIDO AQUÍ 👇 */}
          <button onClick={() => onClone(msg.id)} className="p-1 hover:bg-emerald-900/50 rounded text-slate-400 hover:text-emerald-400 transition-colors" title="Bifurcar Línea Temporal (Clonar)">🔀</button>
          <button onClick={() => onDelete(msg.id)} className="p-1 hover:bg-red-900/50 rounded text-slate-400 hover:text-red-400 transition-colors" title="Borrar">🗑️</button>
        </div>
      </div>

      {editando ? (
        <div className="flex flex-col gap-2 mt-2">
          <textarea value={textoEdicion} onChange={(e) => setTextoEdicion(e.target.value)} className="w-full p-2 bg-slate-900 text-slate-100 border border-sky-500/50 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 outline-none resize-y" rows="3" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditando(false)} className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-xs transition-colors">Cancelar</button>
            <button onClick={handleGuardar} className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold transition-colors">Guardar y reenviar</button>
          </div>
        </div>
      ) : (
        <div className="text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap">{msg.contenido}</div>
      )}
    </div>
  );
}