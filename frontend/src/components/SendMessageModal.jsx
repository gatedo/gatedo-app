import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquareText, X } from 'lucide-react';
import FeedbackForm from './FeedbackForm';

const C = { purple: '#8B4AFF' };

export default function SendMessageModal({ onClose }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/40 flex items-end sm:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-[28px] p-6 relative max-h-[85vh] overflow-y-auto"
        >
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={14} className="text-gray-500" />
          </button>

          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: '#F5F1FF' }}
          >
            <MessageSquareText size={20} style={{ color: C.purple }} />
          </div>

          <h2 className="text-lg font-black text-gray-900 mb-1">Fale com a gente</h2>
          <p className="text-[13px] font-medium text-gray-500 mb-5 leading-relaxed">
            Ideias, problemas, dúvidas — sua mensagem vai direto pra equipe do Gatedo.
          </p>

          <FeedbackForm source="PROFILE" defaultCategory="MESSAGE" placeholder="Escreva sua mensagem..." onSent={() => setTimeout(onClose, 1600)} />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
