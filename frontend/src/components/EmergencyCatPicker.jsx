import React from 'react';
import { motion } from 'framer-motion';
import { AlertOctagon, X } from 'lucide-react';

// Modal simples de "qual gato está estranho?" — usado tanto pelo ícone de
// emergência da bottom nav quanto pela aba Saúde.
export default function EmergencyCatPicker({ cats, onPick, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl relative"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4"
          aria-label="Fechar"
        >
          <X size={18} className="text-gray-300" />
        </button>

        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FEF2F2' }}>
            <AlertOctagon size={22} style={{ color: '#DC2626' }} />
          </div>
          <div>
            <p className="font-black text-gray-900 text-[15px] leading-tight">Qual gato está estranho?</p>
            <p className="text-[12px] font-medium text-gray-500 mt-1">Escolha para continuar.</p>
          </div>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-gray-100 text-left"
            >
              <img
                src={c.photoUrl || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&q=60'}
                alt=""
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <span className="text-[13px] font-black text-gray-800">{c.name}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
