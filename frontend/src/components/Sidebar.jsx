import React from 'react';

export default function Sidebar({ escenas, escenaActiva, crearNuevaEscena, seleccionarEscena, eliminarEscena }) {
  return (
    <div className="w-64 bg-[#0a0a0a] border-r border-slate-800/50 flex flex-col h-full shrink-0 z-20">
      
      {/* HEADER LOGO */}
      <div className="p-5 flex items-center gap-3 mb-2">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20">
          A
        </div>
        <span className="font-bold text-lg text-white tracking-wide">Archivista</span>
      </div>

      {/* BOTÓN NUEVA AVENTURA */}
      <div className="px-4 mb-6">
        <button
          onClick={crearNuevaEscena}
          className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-900/20 text-sm flex items-center justify-center gap-2"
        >
          <span className="text-lg leading-none">+</span> Nueva Aventura
        </button>
      </div>

      {/* LISTA DE AVENTURAS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 flex flex-col gap-1 pb-4">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 mb-2">Tus Aventuras</span>
        
        {escenas.map((esc) => (
          <div
            key={esc.id}
            onClick={() => seleccionarEscena(esc.id)}
            className={`group cursor-pointer p-3 rounded-xl flex justify-between items-center transition-all ${
              escenaActiva === esc.id
                ? 'bg-slate-800/40 border border-slate-700/50 text-white shadow-sm'
                : 'border border-transparent text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
            }`}
          >
            <span className="text-sm font-medium truncate pr-2">{esc.nombre}</span>
            <button
              onClick={(e) => eliminarEscena(esc.id, e)}
              className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-rose-950/30"
              title="Eliminar Aventura"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}