export default function Sidebar({ escenas, escenaActiva, crearNuevaEscena, seleccionarEscena, eliminarEscena }) {
  return (
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
  );
}