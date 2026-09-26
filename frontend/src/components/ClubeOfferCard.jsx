import React, { useContext, useEffect, useRef, useState } from 'react';
import { Check, Crown, Package } from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import { track } from '../utils/track';

const C = { purple: '#8B4AFF', purpleDark: '#4B2AAF', dark: '#181120' };

const BENEFITS = [
  '100 perguntas por mês ao iGentVet',
  'Explica seus exames em linguagem simples (10 por mês)',
  'Destaque no Comunigato e na galeria',
  'Ranking, grupos e comunidade exclusivos',
  'Selo exclusivo do Clube',
];

function formatPrice(centavos) {
  const value = Number(centavos || 0);
  if (!value) return null;
  return `R$ ${(value / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// Oferta do Clube GATEDO — usado direto na /clube (sempre visível) e dentro
// do ClubeGate (paywall de recurso travado). `origin` identifica de onde
// veio, pro funil (clube_viewed/clube_checkout_click).
export default function ClubeOfferCard({ origin = 'CLUBE_PAGE' }) {
  const { user } = useContext(AuthContext);
  const touch = useSensory();
  const [settings, setSettings] = useState(null);
  const [billing, setBilling] = useState('anual');
  const [waitlisted, setWaitlisted] = useState(false);
  const viewedFired = useRef(false);

  useEffect(() => {
    api.get('/settings/public').then((r) => setSettings(r.data || {})).catch(() => setSettings({}));
  }, []);

  useEffect(() => {
    if (viewedFired.current) return;
    viewedFired.current = true;
    track('clube_viewed', { origem: origin });
  }, [origin]);

  if (!settings) {
    return <div className="h-64 rounded-[28px] bg-gray-100 animate-pulse" />;
  }

  const vendasAbertas = settings.CLUBE_VENDAS_ABERTAS !== 'false';
  const monthlyPrice = settings.CLUBE_MONTHLY_PRICE_CENTAVOS ? Number(settings.CLUBE_MONTHLY_PRICE_CENTAVOS) : null;
  const annualPrice = settings.CLUBE_ANNUAL_PRICE_CENTAVOS ? Number(settings.CLUBE_ANNUAL_PRICE_CENTAVOS) : null;
  const checkoutUrl = billing === 'mensal' ? settings.CLUBE_MONTHLY_KIWIFY_URL : settings.CLUBE_ANNUAL_KIWIFY_URL;
  const priceLabel = formatPrice(billing === 'mensal' ? monthlyPrice : annualPrice);

  const savingsPercent =
    monthlyPrice && annualPrice ? Math.round((1 - annualPrice / (monthlyPrice * 12)) * 100) : null;
  const annualMonthlyEquivalent = annualPrice ? formatPrice(Math.round(annualPrice / 12)) : null;

  const packPrice = formatPrice(settings.PACOTE_IA_PRICE_CENTAVOS || 990);
  const packUrl = settings.PACOTE_IA_KIWIFY_URL;

  const goCheckout = () => {
    touch();
    track('clube_checkout_click', { plan: billing });
    if (!checkoutUrl) return;
    const url = new URL(checkoutUrl);
    url.searchParams.set('utm_content', origin);
    if (user?.email) url.searchParams.set('email', user.email);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  const joinWaitlist = async () => {
    touch();
    await api.post('/clube/waitlist', { plan: billing }).catch(() => {});
    setWaitlisted(true);
  };

  const goPackCheckout = () => {
    touch();
    track('pack_checkout_click');
    if (!packUrl) return;
    const url = new URL(packUrl);
    if (user?.email) url.searchParams.set('email', user.email);
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="w-full flex flex-col items-center text-center">
      <div
        className="w-16 h-16 rounded-[22px] flex items-center justify-center mb-4 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${C.dark} 0%, ${C.purpleDark} 55%, ${C.purple} 150%)` }}
      >
        <Crown size={26} className="text-[#ebfc66]" />
      </div>

      <h2 className="text-lg font-black text-gray-900 mb-1.5">Assine o Clube GATEDO</h2>
      <p className="text-[13px] font-medium text-gray-500 leading-relaxed max-w-xs mb-6">
        Mais perguntas ao iGentVet, explicação de exames e destaque na comunidade.
      </p>

      <div className="w-full max-w-xs bg-gray-50 rounded-2xl p-1 flex gap-1 mb-5">
        {['mensal', 'anual'].map((option) => (
          <button
            key={option}
            onClick={() => { touch('light'); setBilling(option); }}
            className={`relative flex-1 py-2 rounded-xl text-[11px] font-black capitalize transition-all ${
              billing === option ? 'bg-white shadow text-gray-900' : 'text-gray-400'
            }`}
          >
            {option}
            {option === 'anual' && savingsPercent > 0 && (
              <span className="absolute -top-2.5 -right-1.5 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#ebfc66] text-[#4a2166]">
                -{savingsPercent}%
              </span>
            )}
          </button>
        ))}
      </div>

      {priceLabel ? (
        <>
          <p className="text-3xl font-black text-gray-900 mb-1">
            {priceLabel}
            <span className="text-[12px] font-bold text-gray-400">{billing === 'mensal' ? '/mês' : '/ano'}</span>
          </p>
          {billing === 'anual' && annualMonthlyEquivalent && (
            <p className="text-[11px] font-bold text-gray-400 mb-1">equivale a {annualMonthlyEquivalent}/mês</p>
          )}
        </>
      ) : (
        <p className="text-[12px] font-bold text-gray-400 mb-1">Em breve</p>
      )}

      <ul className="w-full max-w-xs text-left mt-6 space-y-2.5">
        {BENEFITS.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[12px] font-bold text-gray-600">
            <Check size={14} className="text-[#8B4AFF] shrink-0 mt-0.5" />
            {item}
          </li>
        ))}
      </ul>

      <div className="w-full max-w-xs mt-4 mb-6 rounded-2xl px-4 py-2.5 bg-emerald-50 border border-emerald-100">
        <p className="text-[11px] font-black text-emerald-700">Tudo o que é grátis continua grátis.</p>
      </div>

      {vendasAbertas ? (
        <button
          onClick={goCheckout}
          disabled={!checkoutUrl}
          className="w-full max-w-xs px-5 py-3.5 rounded-2xl font-black text-white text-sm"
          style={{ background: checkoutUrl ? `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` : '#9ca3af' }}
        >
          {checkoutUrl ? 'Assinar o Clube' : 'Em breve'}
        </button>
      ) : waitlisted ? (
        <div className="w-full max-w-xs px-5 py-3.5 rounded-2xl font-black text-emerald-700 text-sm bg-emerald-50 border border-emerald-100">
          Combinado! Te avisamos assim que abrir 🐾
        </div>
      ) : (
        <button
          onClick={joinWaitlist}
          className="w-full max-w-xs px-5 py-3.5 rounded-2xl font-black text-white text-sm"
          style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
        >
          Me avise quando abrir
        </button>
      )}

      <p className="text-[10px] font-medium text-gray-400 mt-4 max-w-xs leading-relaxed">
        O iGentVet organiza e explica. Não substitui a consulta com o veterinário.<br />
        Cancele quando quiser.
      </p>

      {(vendasAbertas && packUrl) && (
        <div className="w-full max-w-xs mt-6 rounded-2xl p-4 border border-gray-100 bg-gray-50 text-left">
          <div className="flex items-center gap-2 mb-1.5">
            <Package size={14} className="text-gray-500" />
            <p className="text-[12px] font-black text-gray-700">Só precisa de mais algumas perguntas?</p>
          </div>
          <p className="text-[11px] font-medium text-gray-500 mb-3">
            Pacote com 30 perguntas por {packPrice || 'R$ 9,90'}, sem assinatura.
          </p>
          <button
            onClick={goPackCheckout}
            className="w-full py-2.5 rounded-xl font-black text-[11px] text-gray-700 bg-white border border-gray-200"
          >
            Comprar pacote avulso
          </button>
        </div>
      )}
    </div>
  );
}
