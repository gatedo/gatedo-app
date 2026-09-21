import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import api from '../../services/api';
import useSensory from '../../hooks/useSensory';

const C = { purple: '#8B4AFF' };

function formatCurrency(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// Recomendação por perfil do gato — modo lista (não é "uma oferta", é a
// natureza de vitrine da Loja), mas ainda pergunta pro módulo único de
// decisão em vez de decidir sozinha. Cada item carrega o "por que apareceu".
export default function StoreRecommendations() {
  const touch = useSensory();
  const [cats, setCats] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const firedImpressions = useRef(new Set());

  const active = cats.filter((c) => !c.isMemorial && !c.isArchived);

  useEffect(() => {
    api.get('/pets').then((r) => setCats(Array.isArray(r.data) ? r.data : [])).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    if (!selectedCatId && active.length > 0) setSelectedCatId(active[0].id);
  }, [active, selectedCatId]);

  useEffect(() => {
    if (!selectedCatId) return;
    setLoading(true);
    api.get('/offers/recommend-products', { params: { petId: selectedCatId } })
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [selectedCatId]);

  useEffect(() => {
    items.forEach((item) => {
      const key = `${selectedCatId}-${item.id}`;
      if (firedImpressions.current.has(key)) return;
      firedImpressions.current.add(key);
      api.post('/offers/event', {
        surface: 'STORE', petId: selectedCatId, offerKey: `product-${item.id}`, action: 'IMPRESSION',
      }).catch(() => {});
    });
  }, [items, selectedCatId]);

  if (active.length === 0) return null;
  if (!loading && items.length === 0) return null;

  const handleClick = (item) => {
    touch();
    api.post('/offers/event', {
      surface: 'STORE', petId: selectedCatId, offerKey: `product-${item.id}`, action: 'CLICK',
    }).catch(() => {});
    if (item.externalLink) window.open(item.externalLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={13} style={{ color: C.purple }} />
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
          Pra {active.find((c) => c.id === selectedCatId)?.name || 'seu gato'}
        </h2>
      </div>

      {active.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {active.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { touch(); setSelectedCatId(cat.id); }}
              className="px-3 py-1.5 rounded-full text-[10px] font-black shrink-0"
              style={cat.id === selectedCatId
                ? { background: C.purple, color: '#fff' }
                : { background: '#F4F3FF', color: C.purple }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {[1, 2].map((i) => (
            <div key={i} className="flex-shrink-0 rounded-[22px] animate-pulse" style={{ width: 148, height: 188, background: 'rgba(139,74,255,0.06)' }} />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
          {items.map((item, i) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleClick(item)}
              className="flex-shrink-0 rounded-[22px] overflow-hidden relative text-left"
              style={{ width: 148, height: 208, boxShadow: '0 4px 16px rgba(0,0,0,0.14)' }}
            >
              {item.images?.[0]
                ? <img src={item.images[0]} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                : <div className="absolute inset-0 flex items-center justify-center text-4xl" style={{ background: 'rgba(139,74,255,0.08)' }}>🐱</div>}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,transparent 35%,rgba(0,0,0,0.75) 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-black text-white text-sm leading-tight mb-1 line-clamp-2">{item.name}</p>
                <p className="font-black text-white text-sm mb-1.5">{formatCurrency(item.promoPrice || item.price)}</p>
                {item.reason && (
                  <p className="text-[9px] text-white/70 font-bold leading-snug line-clamp-2">{item.reason}</p>
                )}
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
