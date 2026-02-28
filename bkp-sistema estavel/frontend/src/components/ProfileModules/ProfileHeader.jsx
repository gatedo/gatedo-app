import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Edit3, Palette, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileHeader({ cat, id, onEdit }) { // Recebe onEdit
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="flex justify-between items-center mb-6 relative z-[100]">
      <button 
        onClick={() => navigate(-1)} 
        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90 ${cat?.isMemorial ? 'bg-white/10 text-white' : 'bg-white text-gray-600'}`}
      >
        <ArrowLeft size={20} />
      </button>

      <div className="relative">
        <button 
          onClick={() => setShowMenu(!showMenu)} 
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all ${cat?.isMemorial ? 'bg-white/10 text-white' : 'bg-white text-gray-600'}`}
        >
          <MoreVertical size={20} />
        </button>
        
        <AnimatePresence>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.9 }} 
                className="absolute right-0 top-12 bg-white rounded-2xl shadow-2xl p-2 w-48 z-50 border border-gray-100 origin-top-right"
              >
                <button 
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(); // Dispara o modal mestre
                  }} 
                  className="flex items-center gap-2 p-3 text-xs font-black text-gray-600 hover:bg-gray-50 rounded-xl w-full text-left transition-colors uppercase tracking-tighter"
                >
                  <Edit3 size={16} className="text-indigo-500" /> Editar Perfil
                </button>

                {/* ... outros botões ... */}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}