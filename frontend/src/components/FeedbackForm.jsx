import React, { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, Loader } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import useSensory from '../hooks/useSensory';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6' };

const CATEGORIES = [
  { id: 'FEATURE', label: '💡 Ideia' },
  { id: 'BUG', label: '🐛 Bug' },
  { id: 'DESIGN', label: '🎨 Visual' },
  { id: 'MESSAGE', label: '💬 Mensagem' },
  { id: 'OTHER', label: '✨ Outro' },
];

// Formulário compartilhado — usado dentro do Mundo Gatedo (caixa de
// sugestões) e no modal "Fale com a gente" do Perfil. Mesmo endpoint
// (POST /feedback), diferenciado só pelo `source` que o admin vê no painel.
export default function FeedbackForm({ source, defaultCategory = 'FEATURE', placeholder, onSent }) {
  const { user } = useContext(AuthContext);
  const touch = useSensory();

  const [category, setCategory] = useState(defaultCategory);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    touch();
    setSending(true);
    setError('');
    try {
      await api.post('/feedback', { category, source, text: text.trim() });
      setSent(true);
      setText('');
      onSent?.();
    } catch {
      setError('Não foi possível enviar. Tente de novo em instantes.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-2">Categoria</p>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { touch('light'); setCategory(cat.id); }}
              className="px-3 py-1.5 rounded-full text-[11px] font-black"
              style={
                category === cat.id
                  ? { background: C.purple, color: '#fff' }
                  : { background: '#F4F3FF', color: '#6b7280' }
              }
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setSent(false); setError(''); }}
          placeholder={placeholder || 'Conta pra gente: o que sente falta? O que adoraria ver no GATEDO?'}
          maxLength={2000}
          rows={4}
          className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-100 outline-none resize-none"
        />
        <div className="flex justify-end mt-1">
          <span className="text-[10px] text-gray-300 font-bold">{text.length}/2000</span>
        </div>
      </div>

      {error && <p className="text-[11px] text-red-500 font-bold">{error}</p>}

      <AnimatePresence mode="wait">
        {sent ? (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 bg-emerald-50 border border-emerald-100"
          >
            <CheckCircle size={16} className="text-emerald-600" />
            <span className="text-sm font-black text-emerald-700">Enviado! Obrigado 🐾</span>
          </motion.div>
        ) : (
          <motion.button
            key="send"
            whileTap={{ scale: 0.98 }}
            disabled={!text.trim() || sending}
            onClick={handleSend}
            className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
            style={{
              background: !text.trim() ? '#F3F4F6' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)`,
              color: !text.trim() ? '#9CA3AF' : '#fff',
            }}
          >
            {sending ? <><Loader size={15} className="animate-spin" /> Enviando...</> : <><Send size={15} /> Enviar</>}
          </motion.button>
        )}
      </AnimatePresence>

      <p className="text-center text-[11px] text-gray-400 font-bold">
        {user?.name ? `Enviando como ${user.name}` : 'Faça login para enviar com seu perfil'}
      </p>
    </div>
  );
}
