import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import api from '../../services/api';

const TYPE_STYLE = {
  PROTOCOL:          { bg: '#F4F3FF', accent: '#8B4AFF', icon: '🛡️' },
  CONTINUE_PROTOCOL: { bg: '#F0FDF4', accent: '#10B981', icon: '📅' },
  PRODUCT:           { bg: '#FFFBEB', accent: '#F59E0B', icon: '🛍️' },
  GPTS:              { bg: '#EEF2FF', accent: '#6366F1', icon: '⚡' },
  GUIDE:             { bg: '#F0F9FF', accent: '#0EA5E9', icon: '📖' },
};

// Card leve e único — nunca modal. Registra impressão sozinho ao aparecer,
// clique ao navegar, dispensa se fechado. Toda tela que usa isso só recebeu
// a oferta do módulo único (GET /offers/decide) — não decide nada aqui.
export default function OfferCard({ offer, surface, petId, onDismiss, dismissible = true, className = '' }) {
  const navigate = useNavigate();
  const fired = useRef(false);

  useEffect(() => {
    if (!offer || fired.current) return;
    fired.current = true;
    api.post('/offers/event', { surface, petId, offerKey: offer.offerKey, action: 'IMPRESSION' }).catch(() => {});
  }, [offer, surface, petId]);

  if (!offer) return null;
  const style = TYPE_STYLE[offer.type] || TYPE_STYLE.GUIDE;

  const handleClick = () => {
    api.post('/offers/event', { surface, petId, offerKey: offer.offerKey, action: 'CLICK' }).catch(() => {});
    navigate(offer.ctaPath, { state: { offerContext: { offerKey: offer.offerKey, surface } } });
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    api.post('/offers/event', { surface, petId, offerKey: offer.offerKey, action: 'DISMISS' }).catch(() => {});
    onDismiss?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      onClick={handleClick}
      className={`w-full flex items-center gap-3 rounded-[20px] px-4 py-3 cursor-pointer ${className}`}
      style={{ background: style.bg, border: `1px solid ${style.accent}22` }}
    >
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0" style={{ background: `${style.accent}16` }}>
        {style.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black text-gray-800 truncate">{offer.title}</p>
        <p className="text-[10px] font-medium text-gray-500 truncate">{offer.description}</p>
        {offer.reason && (
          <p className="text-[9px] font-bold mt-0.5" style={{ color: style.accent }}>{offer.reason}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="text-[9px] font-black uppercase" style={{ color: style.accent }}>{offer.ctaLabel}</span>
        <ChevronRight size={14} style={{ color: style.accent }} />
      </div>
      {dismissible && (
        <button type="button" onClick={handleDismiss} aria-label="Dispensar" className="shrink-0 ml-1">
          <X size={14} className="text-gray-300" />
        </button>
      )}
    </motion.div>
  );
}
