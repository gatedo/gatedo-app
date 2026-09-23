import React, { useContext, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import api from '../../services/api';
import useSensory from '../../hooks/useSensory';
import { AuthContext } from '../../context/AuthContext';

const C = { purple: '#8B4AFF', green: '#10B981' };

// Sem foto de capa própria (protocolo), cai num degradê de marca — cicla por
// posição pra cada card do bloco ter uma identidade visual diferente.
const COVER_GRADIENTS = [
  'linear-gradient(135deg, #8B4AFF 0%, #4B2AAF 100%)',
  'linear-gradient(135deg, #FF7E33 0%, #C23FB3 100%)',
  'linear-gradient(135deg, #10B981 0%, #0E7A8F 100%)',
];

function formatPrice(cents) {
  if (cents == null) return null;
  return `R$ ${(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// Bloco 1 da Loja: "Do GATEDO" — protocolos + produtos digitais próprios.
// Quem já comprou vê "Você tem" no lugar do botão de comprar de novo.
export default function StoreGatedoBlock() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const touch = useSensory();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const impressionsFired = useRef(new Set());

  useEffect(() => {
    api.get('/products/gatedo', { params: user?.id ? { userId: user.id } : {} })
      .then((r) => setItems(Array.isArray(r.data) ? r.data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    items.forEach((item) => {
      const key = `${item.kind}-${item.id}`;
      if (impressionsFired.current.has(key)) return;
      impressionsFired.current.add(key);
      api.post('/offers/event', { surface: 'STORE_GATEDO', offerKey: key, action: 'IMPRESSION' }).catch(() => {});
    });
  }, [items]);

  if (!loading && items.length === 0) return null;

  const openItem = (item) => {
    touch();
    api.post('/offers/event', {
      surface: 'STORE_GATEDO', offerKey: `${item.kind}-${item.id}`, action: item.owned ? 'CONVERT' : 'CLICK',
    }).catch(() => {});
    if (item.ctaPath?.startsWith('/')) navigate(item.ctaPath);
    else if (item.ctaPath) window.open(item.ctaPath, '_blank', 'noopener,noreferrer');
  };

  return (
    <div id="store-section-gatedo">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={13} style={{ color: C.purple }} />
        <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Do GATEDO</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[1, 2].map((i) => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {items.map((item, index) => (
            <motion.button
              key={`${item.kind}-${item.id}`}
              whileTap={{ scale: 0.98 }}
              onClick={() => openItem(item)}
              className="text-left bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col"
            >
              <div
                className="h-16 relative overflow-hidden shrink-0"
                style={!item.image ? { background: COVER_GRADIENTS[index % COVER_GRADIENTS.length] } : undefined}
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <BookOpen size={44} className="absolute -right-1 -bottom-2 text-white/15 rotate-12" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-2.5 pt-4 pb-1.5">
                  <p className="text-[11px] font-black text-white leading-tight line-clamp-1 drop-shadow-sm">{item.title}</p>
                </div>
                {item.owned && (
                  <span className="absolute top-1.5 right-1.5 bg-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5" style={{ color: C.green }}>
                    <CheckCircle2 size={9} /> Você tem
                  </span>
                )}
              </div>

              <div className="px-2.5 py-2 flex-1 flex flex-col">
                {(item.duracaoDias || item.promessa) && (
                  <div className="flex items-center gap-2 mb-1.5">
                    {item.duracaoDias && (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-gray-400 shrink-0">
                        <Clock size={10} /> {item.duracaoDias} dias
                      </span>
                    )}
                    {item.promessa && <span className="text-[9px] font-bold text-gray-400 line-clamp-1">{item.promessa}</span>}
                  </div>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[13px] font-black text-gray-900">{formatPrice(item.precoCentavos) || 'Grátis'}</span>
                  {item.owned ? (
                    <span className="flex items-center gap-1 text-[10px] font-black" style={{ color: C.green }}>
                      Abrir <ArrowRight size={11} />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-black" style={{ color: C.purple }}>
                      Ver <ArrowRight size={11} />
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
