import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';

// Sempre que existe um alerta de saúde ativo, ele toma o lugar da oferta —
// nunca os dois juntos (regra dura: oferta nunca sobrepõe alerta de saúde).
export default function HealthAlertCard({ alert }) {
  const navigate = useNavigate();
  if (!alert) return null;

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/cat/${alert.catId}`, { state: { restoreTab: 'SAUDE' } })}
      className="w-full flex items-center gap-3 rounded-[20px] px-4 py-3 text-left"
      style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
    >
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: '#FEE2E2' }}>
        <AlertTriangle size={18} className="text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black uppercase tracking-wide text-red-500">{alert.catName}</p>
        <p className="text-[12px] font-black text-gray-800 truncate">{alert.message}</p>
      </div>
      <ChevronRight size={16} className="text-red-300 shrink-0" />
    </motion.button>
  );
}
