import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, PawPrint, MessageCircle } from 'lucide-react';
import api from '../../services/api';
import useSensory from '../../hooks/useSensory';

// Camada de navegação no topo da Loja — a base (categorias/busca/grade de
// achadinhos) continua exatamente como é hoje; estes 3 banners só apontam
// pra cada seção específica, na ordem pedida.
const BANNERS = [
  { id: 'gatedo', label: 'Do GATEDO', icon: Sparkles, color: '#5B21D6', bg: '#DED0FF', target: 'store-section-gatedo' },
  { id: 'recomendados', label: 'Pro seu gato', icon: PawPrint, color: '#F59E0B', bg: '#FFFBEB', target: 'store-section-recomendados' },
  { id: 'whatsapp', label: 'Achadinhos no Zap', icon: MessageCircle, color: '#10B981', bg: '#ECFDF5', target: 'store-section-whatsapp' },
];

export default function StoreSectionBanners() {
  const touch = useSensory();

  const go = (b) => {
    touch();
    api.post('/offers/event', { surface: 'STORE_BANNERS', offerKey: b.id, action: 'CLICK' }).catch(() => {});
    document.getElementById(b.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {BANNERS.map((b) => (
        <motion.button
          key={b.id}
          whileTap={{ scale: 0.96 }}
          onClick={() => go(b)}
          className="rounded-[18px] p-3 flex flex-col items-center gap-1.5 text-center border border-black/[0.04] shadow-[0_4px_14px_rgba(20,11,46,0.08)]"
          style={{ background: b.bg }}
        >
          <b.icon size={18} style={{ color: b.color }} />
          <span className="text-[9px] font-black leading-tight" style={{ color: b.color }}>{b.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
