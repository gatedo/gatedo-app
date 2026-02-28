import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, 
  ShieldCheck, 
  Minimize2, 
  Maximize2, 
  FileText, 
  X, 
  ZoomIn, 
  Book, 
  ChevronRight, 
  Sparkles, 
  ReceiptText, 
  Activity,
  Stethoscope
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DocumentModule({ cat }) {
  const navigate = useNavigate();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const isSRD = cat?.breed?.toUpperCase() === 'SRD' || !cat?.breed;

  return (
    <div className="space-y-8 pb-40 px-2 pt-4">
      
      {/* 1. PEDIGREE OFICIAL (VISUALIZADOR) */}
      {!isSRD && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none font-sans">Pedigree Oficial</h3>
            <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 bg-white rounded-xl shadow-sm text-gray-400">
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </button>
          </div>

          <AnimatePresence>
            {!isMinimized && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="px-2">
                <div className="w-full aspect-[3/2] cursor-pointer select-none relative" style={{ perspective: '2000px' }} onClick={() => setIsFlipped(!isFlipped)}>
                  <motion.div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d' }} animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.7, ease: "easeInOut" }}>
                    
                    {/* FRENTE */}
                    <div className="absolute inset-0 rounded-[32px] overflow-hidden bg-white shadow-2xl border-4 border-white" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', zIndex: isFlipped ? 0 : 1 }}>
                      {cat.pedigreeFrontUrl ? (
                        <div className="relative w-full h-full group">
                          <img src={cat.pedigreeFrontUrl} className="w-full h-full object-cover" alt="Frente" />
                          <button onClick={(e) => { e.stopPropagation(); setShowModal(true); }} className="absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl">
                            <ZoomIn size={20} className="text-gray-800" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300">
                           <FileText size={32} className="opacity-10" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Aguardando Imagem</span>
                        </div>
                      )}
                    </div>

                    {/* VERSO */}
                    <div className="absolute inset-0 rounded-[32px] overflow-hidden bg-gray-100 shadow-2xl border-4 border-white" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', zIndex: isFlipped ? 1 : 0 }}>
                       {cat.pedigreeBackUrl ? (
                         <img src={cat.pedigreeBackUrl} className="w-full h-full object-cover" alt="Verso" />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center bg-[#6158ca]/5 text-[#6158ca]/20">
                            <ShieldCheck size={32} className="opacity-10" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Verso Vazio</span>
                         </div>
                       )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 2. BANNER CADERNO DE ANOTAÇÕES */}
      <div className="px-2">
        <button 
          onClick={() => navigate(`/cat/${cat.id}/diary`)}
          className="w-full relative overflow-hidden bg-gradient-to-r from-[#6158ca] to-[#8c84df] p-6 rounded-[32px] shadow-xl shadow-indigo-100 flex items-center gap-4 group active:scale-[0.98] transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
            <Sparkles size={80} />
          </div>
          
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
            <Book size={28} />
          </div>
          
          <div className="flex-1 text-left z-10">
            <h4 className="text-white font-black uppercase tracking-tight text-sm leading-none font-sans">Caderno do Gatedo</h4>
            <p className="text-white/70 font-bold uppercase text-[9px] tracking-widest mt-1 font-sans">Registros de rotina e humor</p>
          </div>
          
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white">
            <ChevronRight size={18} />
          </div>
        </button>
      </div>

      {/* 3. CAIXINHA DO GATEDO - PASTAS COLORIDAS */}
      <div className="space-y-4 px-2">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 leading-none font-sans">Pasta de Arquivos</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Saúde', id: 'saude', color: 'bg-rose-500', icon: Stethoscope },
            { label: 'Exames', id: 'exames', color: 'bg-blue-500', icon: Activity },
            { label: 'Contratos', id: 'contratos', color: 'bg-emerald-500', icon: ReceiptText },
            { label: 'Outros', id: 'outros', color: 'bg-amber-500', icon: FolderOpen }
          ].map((pasta) => (
            <button 
              key={pasta.id} 
              onClick={() => navigate(`/cat/${cat.id}/folder/${pasta.id}`)}
              className="bg-white p-6 rounded-[35px] border border-gray-50 shadow-sm flex flex-col items-center group active:scale-95 transition-all"
            >
              <div className={`w-14 h-14 ${pasta.color} rounded-[22px] flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <pasta.icon size={24} />
              </div>
              <p className="text-[11px] font-black text-gray-800 uppercase tracking-tighter font-sans">{pasta.label}</p>
              <span className="text-[8px] font-bold text-gray-300 uppercase mt-1 tracking-widest font-sans">Abrir Pasta</span>
            </button>
          ))}
        </div>
      </div>

      {/* MODAL ZOOM */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <button className="absolute top-10 right-6 text-white p-2 bg-white/10 rounded-full"><X size={32} /></button>
            <motion.img 
              initial={{ scale: 0.8 }} 
              animate={{ scale: 1 }} 
              src={isFlipped ? (cat.pedigreeBackUrl || cat.pedigreeFrontUrl) : cat.pedigreeFrontUrl} 
              className="max-w-full max-h-[85vh] rounded-2xl object-contain" 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}