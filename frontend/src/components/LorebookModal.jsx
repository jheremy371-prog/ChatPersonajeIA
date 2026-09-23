import React from 'react';

export default function LorebookModal({ 
  isOpen, 
  onClose, 
  loreTitulo, 
  setLoreTitulo, 
  loreTexto, 
  setLoreTexto, 
  guardarLorebook 
}) {
  if (!isOpen) return null;

  const handleGuardar = async () => {
    await guardarLorebook();
    onClose(); // Cerramos el modal tras guardar exitosamente
  };

  return (
    // Fondo oscuro desenfocado (Overlay)
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-opacity">
      
      {/* Contenedor principal del Modal */}
      <div className="bg-slate-900 border border-fuchsia-900/50 rounded-2xl shadow-2xl shadow-fuchsia-900/20 w-full max-w-3xl overflow-hidden flex flex-col animate-fade-in-up">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/80">
          <div>
            <h3 className="text-xl font-bold text-fuchsia-400 flex items-center gap-2">
              <span>📖</span> Biblioteca del Lorebook (ChromaDB)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Inyecta conocimiento semántico al universo. La IA lo recordará automáticamente cuando sea relevante.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors">
            ✖
          </button>
        </div>
        
        {/* Cuerpo (Formulario) */}
        <div className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm text-slate-300 font-medium mb-2">Título del Documento (Concepto Clave)</label>
            <input 
              type="text" 
              value={loreTitulo} 
              onChange={(e) => setLoreTitulo(e.target.value)} 
              placeholder="Ej: Sistema de Magia, Dragón de Obsidiana, Facción Rebelde..." 
              className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none transition-all"
            />
          </div>
          
          <div className="flex-1">
            <label className="block text-sm text-slate-300 font-medium mb-2">Contenido (Reglas y Detalles)</label>
            <textarea 
              value={loreTexto} 
              onChange={(e) => setLoreTexto(e.target.value)} 
              rows="10" 
              placeholder="Describe aquí la información secreta de forma detallada..." 
              className="w-full p-4 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent outline-none resize-none custom-scrollbar transition-all leading-relaxed"
            />
          </div>
        </div>

        {/* Pie de página (Botones) */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleGuardar} 
            disabled={!loreTitulo || !loreTexto}
            className="px-6 py-2.5 bg-gradient-to-r from-fuchsia-700 to-purple-600 hover:from-fuchsia-600 hover:to-purple-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-fuchsia-900/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            💾 Inyectar al Universo
          </button>
        </div>
        
      </div>
    </div>
  );
}   