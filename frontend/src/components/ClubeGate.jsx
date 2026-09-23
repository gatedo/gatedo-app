import React, { useContext, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Crown, Check } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';

const C = { purple: '#8B4AFF', purpleDark: '#4B2AAF', dark: '#181120' };

function formatPrice(centavos) {
  const value = Number(centavos || 0);
  if (!value) return null;
  return `R$ ${(value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// Tela curta de paywall do Clube GATEDO — só abre quando a pessoa toca num
// recurso travado (nunca sozinha, nunca na primeira sessão, nunca na Saúde).
// Reaproveita o /offers/event já existente pra registrar impressão e clique,
// com offerKey = qual recurso disparou a tela.
export default function ClubeGate({ featureKey, title, description, onClose }) {
  const { user } = useContext(AuthContext);
  const touch = useSensory();
  const [pricing, setPricing] = useState(null);
  const [billing, setBilling] = useState('anual');
  const impressionFired = useRef(false);

  useEffect(() => {
    api.get('/settings/public').then((r) => {
      setPricing({
        monthlyPrice: r.data?.CLUBE_MONTHLY_PRICE_CENTAVOS ? Number(r.data.CLUBE_MONTHLY_PRICE_CENTAVOS) : null,
        annualPrice: r.data?.CLUBE_ANNUAL_PRICE_CENTAVOS ? Number(r.data.CLUBE_ANNUAL_PRICE_CENTAVOS) : null,
        monthlyUrl: r.data?.CLUBE_MONTHLY_KIWIFY_URL || null,
        annualUrl: r.data?.CLUBE_ANNUAL_KIWIFY_URL || null,
      });
    }).catch(() => setPricing({}));
  }, []);

  useEffect(() => {
    if (impressionFired.current) return;
    impressionFired.current = true;
    api.post('/offers/event', { surface: 'CLUBE_GATEDO', offerKey: featureKey, action: 'IMPRESSION' }).catch(() => {});
  }, [featureKey]);

  if (!pricing) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-[#8B4AFF] rounded-full animate-spin" />
      </div>
    );
  }

  const checkoutUrl = billing === 'mensal' ? pricing.monthlyUrl : pricing.annualUrl;
  const priceLabel = formatPrice(billing === 'mensal' ? pricing.monthlyPrice : pricing.annualPrice);

  const subscribe = () => {
    touch();
    api.post('/offers/event', { surface: 'CLUBE_GATEDO', offerKey: featureKey, action: 'CLICK' }).catch(() => {});
    if (!checkoutUrl) return;
    const url = new URL(checkoutUrl);
    url.searchParams.set('utm_content', featureKey);
    if (user?.email) url.searchParams.set('email', user.email);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-2 shrink-0">
        <div className="w-8" />
        <span className="text-[10px] font-black uppercase tracking-[3px] text-gray-300">Clube GATEDO</span>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <X size={15} className="text-gray-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-10 flex flex-col items-center text-center">
        <div
          className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-4 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${C.purpleDark} 55%, ${C.purple} 150%)` }}
        >
          <Crown size={26} className="text-[#ebfc66]" />
        </div>

        <h2 className="text-lg font-black text-gray-900 mb-1.5">{title}</h2>
        <p className="text-[13px] font-medium text-gray-500 leading-relaxed max-w-xs mb-6">{description}</p>

        <div className="w-full max-w-xs bg-gray-50 rounded-2xl p-1 flex gap-1 mb-5">
          {['mensal', 'anual'].map((option) => (
            <button
              key={option}
              onClick={() => setBilling(option)}
              className={`flex-1 py-2 rounded-xl text-[11px] font-black capitalize transition-all ${
                billing === option ? 'bg-white shadow text-gray-900' : 'text-gray-400'
              }`}
            >
              {option === 'anual' ? 'Anual · desconto' : 'Mensal'}
            </button>
          ))}
        </div>

        {priceLabel ? (
          <p className="text-3xl font-black text-gray-900 mb-1">
            {priceLabel}
            <span className="text-[12px] font-bold text-gray-400">{billing === 'mensal' ? '/mês' : '/ano'}</span>
          </p>
        ) : (
          <p className="text-[12px] font-bold text-gray-400 mb-1">Em breve</p>
        )}

        <ul className="w-full max-w-xs text-left mt-6 space-y-2.5 mb-8">
          {['iGentVet ampliado + leitura de exames', 'Destaque no Comunigato e na galeria', 'Grupos e comunidade exclusivos', 'Selo exclusivo do Clube'].map((item) => (
            <li key={item} className="flex items-start gap-2 text-[12px] font-bold text-gray-600">
              <Check size={14} className="text-[#8B4AFF] shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>

        <button
          onClick={subscribe}
          disabled={!checkoutUrl}
          className="w-full max-w-xs px-5 py-3.5 rounded-2xl font-black text-white text-sm"
          style={{ background: checkoutUrl ? `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` : '#9ca3af' }}
        >
          {checkoutUrl ? 'Assinar o Clube' : 'Em breve'}
        </button>
      </div>
    </div>
  );
}
