import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, CheckCircle } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';

const THEME = {
  WARNING: { bg: '#FFFBEB', soft: '#FEF3C7', badgeBg: '#F59E0B', text: '#92400E', button: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  EVENT: { bg: '#F0FDF4', soft: '#DCFCE7', badgeBg: '#16A34A', text: '#166534', button: 'linear-gradient(135deg, #22C55E, #16A34A)' },
  UPDATE: { bg: '#F5F3FF', soft: '#EDE9FE', badgeBg: '#8B4AFF', text: '#6D28D9', button: 'linear-gradient(135deg, #8B4AFF, #8B5CF6)' },
  INFO: { bg: '#EFF6FF', soft: '#DBEAFE', badgeBg: '#2563EB', text: '#1D4ED8', button: 'linear-gradient(135deg, #3B82F6, #2563EB)' },
};

// Modal de comunicados oficiais (conteúdo novo, publicidade interna
// discreta) — mostra na Home assim que carrega, um de cada vez. Mesmo
// endpoint/dado do stack dentro do Comunigato (OfficialNoticesStack.jsx),
// só que aqui interrompe a tela em vez de ficar dentro do feed.
export default function OfficialNoticeModal() {
  const touch = useSensory();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/notices/active').then((r) => {
      if (Array.isArray(r.data) && r.data.length > 0) setQueue(r.data);
    }).catch(() => {});
  }, []);

  const current = queue[0] || null;
  if (!current) return null;

  const theme = THEME[current.type] || THEME.INFO;

  const confirm = async () => {
    touch('success');
    setLoading(true);
    try {
      await api.post(`/notices/${current.id}/read`);
    } catch {}
    setLoading(false);
    setQueue((q) => q.slice(1));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-5"
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.94, opacity: 0 }}
          className="w-full max-w-sm bg-white rounded-[28px] overflow-hidden shadow-2xl"
        >
          <div className="px-5 py-4 flex items-center gap-3" style={{ background: theme.bg }}>
            <div className="w-11 h-11 rounded-[16px] flex items-center justify-center shrink-0" style={{ background: theme.soft }}>
              <Megaphone size={20} style={{ color: theme.text }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: theme.badgeBg, color: '#fff' }}>
                  {current.type || 'INFO'}
                </span>
                <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ background: '#e1ff00', color: '#4a2166' }}>
                  Oficial
                </span>
              </div>
              <h3 className="text-sm font-black text-gray-800 leading-tight mt-1">{current.title}</h3>
            </div>
          </div>

          <div className="px-5 py-5">
            {current.imageUrl && (
              <div className="mb-4 rounded-[20px] overflow-hidden border border-gray-100 bg-gray-50">
                <img src={current.imageUrl} alt={current.title} className="w-full max-h-[220px] object-cover" />
              </div>
            )}

            <p className="text-sm text-gray-600 leading-relaxed font-medium whitespace-pre-line">
              {current.content}
            </p>

            <div className="mt-5 flex items-center justify-between gap-3">
              {current.xpReward > 0 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full" style={{ background: '#EEFDF3', border: '1px solid #86EFAC' }}>
                  <CheckCircle size={13} className="text-emerald-600" />
                  <span className="text-[11px] font-black text-emerald-700">+{current.xpReward} XP</span>
                </div>
              ) : <span />}

              <button
                onClick={confirm}
                disabled={loading}
                className="px-5 py-3 rounded-2xl font-black text-sm text-white shrink-0"
                style={{ background: loading ? '#9ca3af' : theme.button }}
              >
                {loading ? 'Aguarde...' : 'Entendi'}
              </button>
            </div>

            {queue.length > 1 && (
              <p className="text-center text-[10px] font-bold text-gray-300 mt-3">+{queue.length - 1} comunicado(s) a seguir</p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
