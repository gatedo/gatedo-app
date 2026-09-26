import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import api from '../services/api';
import ClubeOfferCard from './ClubeOfferCard';

// Tela curta de paywall do Clube GATEDO — só abre quando a pessoa toca num
// recurso travado (nunca sozinha, nunca na primeira sessão, nunca na Saúde).
// A oferta em si (preço, toggle, CTA) vive em ClubeOfferCard, reaproveitada
// aqui e direto na página /clube.
export default function ClubeGate({ featureKey, onClose }) {
  const impressionFired = useRef(false);

  useEffect(() => {
    if (impressionFired.current) return;
    impressionFired.current = true;
    api.post('/offers/event', { surface: 'CLUBE_GATEDO', offerKey: featureKey, action: 'IMPRESSION' }).catch(() => {});
  }, [featureKey]);

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <div className="w-8" />
        <span className="text-[10px] font-black uppercase tracking-[3px] text-gray-300">Clube GATEDO</span>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <X size={15} className="text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10 flex flex-col items-center">
        <ClubeOfferCard origin={featureKey} />
      </div>
    </div>
  );
}
