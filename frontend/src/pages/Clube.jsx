import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Crown,
  PawPrint,
  Sparkles,
  Zap,
  WalletCards,
} from 'lucide-react';
import api from '../services/api';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import { formatDateBR, getMembershipMeta } from '../utils/membershipMeta';

// ── Kiwify checkout URLs (from dashboard) ─────────────────────────────────
const PLANS = [
  {
    key: 'plus_sem',
    label: 'Tutor Plus',
    cycle: 'Semestral',
    cycleShort: '6 meses',
    price: 69.0,
    url: 'https://pay.kiwify.com.br/npkn7yO',
    points: 100,
    badge: null,
    gradient: 'from-[#FFB347] via-[#FF8C42] to-[#FF6B2B]',
    accentColor: '#FF7C42',
    bgLight: '#FFF5EF',
    borderLight: '#FFD8C6',
    textAccent: 'text-orange-600',
    benefits: [
      'Até 3 gatos ativos no catálogo',
      '100 GPTS incluídos no semestre',
      'Consultas com IA sob consumo de GPTS',
      'Studio e recursos premium sob demanda',
      'Renovação semestral alinhada à compra',
    ],
  },
  {
    key: 'plus_anual',
    label: 'Tutor Plus',
    cycle: 'Anual',
    cycleShort: '12 meses',
    price: 119.0,
    url: 'https://pay.kiwify.com.br/2Q3STCO',
    points: 300,
    badge: 'MAIS POPULAR',
    badgeBg: '#FF7C42',
    gradient: 'from-[#FF8C00] via-[#FF6020] to-[#E84E00]',
    accentColor: '#E84E00',
    bgLight: '#FFF0E6',
    borderLight: '#FFBF94',
    textAccent: 'text-orange-700',
    benefits: [
      'Até 3 gatos ativos no catálogo',
      '300 GPTS incluídos no ano',
      'Consultas com IA sob consumo de GPTS',
      'Studio e recursos premium sob demanda',
      'Renovação anual — melhor custo-benefício',
    ],
  },
  {
    key: 'master_sem',
    label: 'Tutor Master',
    cycle: 'Semestral',
    cycleShort: '6 meses',
    price: 129.9,
    url: 'https://pay.kiwify.com.br/69qbREx',
    points: 100,
    badge: null,
    gradient: 'from-[#9B6DFF] via-[#7A4CFF] to-[#5E2DDB]',
    accentColor: '#8B4AFF',
    bgLight: '#F5F1FF',
    borderLight: '#DDD6FE',
    textAccent: 'text-violet-600',
    benefits: [
      'Gatos ilimitados no catálogo',
      '100 GPTS incluídos no semestre',
      'Memorial sem consumir vaga do plano',
      'Consultas com IA e Studio premium',
      'Renovação semestral alinhada à compra',
    ],
  },
  {
    key: 'master_anual',
    label: 'Tutor Master',
    cycle: 'Anual',
    cycleShort: '12 meses',
    price: 199.9,
    url: 'https://pay.kiwify.com.br/E8xCuGi',
    points: 300,
    badge: 'MELHOR OFERTA',
    badgeBg: '#5E2DDB',
    gradient: 'from-[#7A35FF] via-[#5E2DDB] to-[#3D0FBB]',
    accentColor: '#5E2DDB',
    bgLight: '#EDE9FF',
    borderLight: '#C4B5FD',
    textAccent: 'text-violet-700',
    benefits: [
      'Gatos ilimitados no catálogo',
      '300 GPTS incluídos no ano',
      'Memorial sem consumir vaga do plano',
      'Consultas com IA e Studio premium',
      'Renovação anual — máximo custo-benefício',
    ],
  },
];

const POINTS_PACKS = [
  {
    key: 'p50',
    icon: '⭐',
    amount: 50,
    price: 9.9,
    url: 'https://pay.kiwify.com.br/Am5VkSM',
    badge: null,
    isHighlight: false,
    rowBg: 'bg-white',
    rowBorder: 'border-gray-100',
    labelColor: 'text-gray-900',
    priceColor: 'text-gray-900',
    chevronColor: 'text-gray-400',
    btnGradient: 'from-[#8B4AFF] to-[#5E2DDB]',
  },
  {
    key: 'p100',
    icon: '⚡',
    amount: 100,
    price: 17.9,
    url: 'https://pay.kiwify.com.br/Nsx0xGL',
    badge: null,
    isHighlight: false,
    rowBg: 'bg-white',
    rowBorder: 'border-gray-100',
    labelColor: 'text-gray-900',
    priceColor: 'text-gray-900',
    chevronColor: 'text-gray-400',
    btnGradient: 'from-[#FF8C00] to-[#E84E00]',
  },
  {
    key: 'p500',
    icon: '🔥',
    amount: 500,
    price: 59.9,
    url: 'https://pay.kiwify.com.br/BEPLhRX',
    badge: 'MUITO POPULAR',
    badgeBg: '#FF7C42',
    isHighlight: true,
    rowBg: 'bg-gradient-to-r from-[#8B4AFF] via-[#7A4CFF] to-[#5E2DDB]',
    rowBorder: 'border-purple-400',
    labelColor: 'text-white',
    priceColor: 'text-white',
    chevronColor: 'text-white/60',
    btnGradient: 'from-[#FF8C00] to-[#FF5500]',
  },
  {
    key: 'p1000',
    icon: '👑',
    amount: 1000,
    price: 99.9,
    url: 'https://pay.kiwify.com.br/dbY6ffd',
    badge: 'MELHOR OFERTA',
    badgeBg: '#D4A017',
    isHighlight: false,
    rowBg: 'bg-[#FFFDE8]',
    rowBorder: 'border-yellow-200',
    labelColor: 'text-yellow-900',
    priceColor: 'text-yellow-800',
    chevronColor: 'text-yellow-500',
    btnGradient: 'from-[#F5A800] to-[#D48000]',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────

function openKiwify(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function fmtPrice(price) {
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
}

// ── PlanAccordionRow ──────────────────────────────────────────────────────

function PlanAccordionRow({ plan, isOpen, onToggle }) {
  return (
    <div
      className="rounded-[22px] overflow-hidden shadow-sm transition-all duration-300"
      style={{ border: `1.5px solid ${isOpen ? plan.borderLight : '#F0EFF5'}` }}
    >
      {/* ── Header (always visible) ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-0 text-left focus:outline-none"
      >
        {/* Gradient left stripe */}
        <div
          className={`w-1.5 self-stretch bg-gradient-to-b ${plan.gradient} shrink-0`}
        />

        <div className="flex-1 flex items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            {plan.badge && (
              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[2px] text-white mb-1.5"
                style={{ backgroundColor: plan.badgeBg }}
              >
                {plan.badge}
              </span>
            )}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[15px] font-black text-gray-900 leading-none">
                {plan.label}
              </span>
              <span
                className={`text-[11px] font-bold uppercase tracking-[2px] ${plan.textAccent}`}
              >
                {plan.cycle}
              </span>
            </div>
            <p className="text-[11px] font-semibold text-gray-400 mt-1">
              {plan.points} GPTS · {plan.cycleShort}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-[18px] font-black text-gray-900">
              {fmtPrice(plan.price)}
            </span>
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              style={{ backgroundColor: plan.bgLight }}
            >
              <ChevronDown size={15} style={{ color: plan.accentColor }} />
            </div>
          </div>
        </div>
      </button>

      {/* ── Expandable body ── */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen ? 400 : 0 }}
      >
        <div
          className="px-5 pt-4 pb-5"
          style={{ backgroundColor: plan.bgLight, borderTop: `1px solid ${plan.borderLight}` }}
        >
          <ul className="space-y-2.5">
            {plan.benefits.map((b) => (
              <li key={b} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Check size={11} className="text-green-600" />
                </div>
                <span className="text-[13px] font-semibold text-gray-700">{b}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => openKiwify(plan.url)}
            className={`mt-5 w-full rounded-[18px] py-3.5 font-black text-[11px] uppercase tracking-[2px] text-white bg-gradient-to-r ${plan.gradient} shadow-lg active:scale-[0.98] transition-transform`}
          >
            Assinar agora
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PointsAccordionRow ────────────────────────────────────────────────────

function PointsAccordionRow({ pack, isOpen, onToggle }) {
  const perPoint = pack.price / pack.amount;

  return (
    <div
      className={`rounded-[22px] overflow-hidden shadow-sm border ${pack.rowBorder} transition-all duration-300`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center gap-3.5 px-4 py-4 text-left focus:outline-none ${pack.rowBg}`}
      >
        <span className="text-[26px] leading-none shrink-0">{pack.icon}</span>

        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
          <div>
            {pack.badge && (
              <span
                className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[2px] text-white mb-1"
                style={{ backgroundColor: pack.badgeBg }}
              >
                {pack.badge}
              </span>
            )}
            <p className={`font-black text-[15px] leading-tight ${pack.labelColor}`}>
              {pack.amount} Gatedo Points
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className={`text-[18px] font-black ${pack.priceColor}`}>
              {fmtPrice(pack.price)}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${pack.chevronColor}`}
            />
          </div>
        </div>
      </button>

      {/* Expandable */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen ? 220 : 0 }}
      >
        <div className="px-5 pt-4 pb-5 bg-white border-t border-gray-100">
          <p className="text-[13px] font-medium text-gray-600 leading-relaxed">
            {pack.amount} GPTS para usar em consultas com IA, Studio e recursos premium sob demanda. Sem expiração enquanto o plano estiver ativo.
          </p>
          <p className="text-[11px] font-bold text-gray-400 mt-2">
            ≈ R$ {perPoint.toFixed(3).replace('.', ',')} por point
          </p>
          <button
            type="button"
            onClick={() => openKiwify(pack.url)}
            className={`mt-4 w-full rounded-[18px] py-3.5 font-black text-[11px] uppercase tracking-[2px] text-white bg-gradient-to-r ${pack.btnGradient} shadow-lg active:scale-[0.98] transition-transform`}
          >
            Comprar {pack.amount} points
          </button>
        </div>
      </div>
    </div>
  );
}

// ── FlowCard ──────────────────────────────────────────────────────────────

function FlowCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[22px] border border-gray-100 bg-[#FAFAFD] p-4">
      <div className="w-10 h-10 rounded-2xl bg-[#F5F1FF] text-[#8B4AFF] flex items-center justify-center mb-3">
        <Icon size={18} />
      </div>
      <h3 className="text-[13px] font-black text-gray-900">{title}</h3>
      <p className="text-[12px] font-medium text-gray-500 mt-1.5 leading-relaxed">{text}</p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────

export default function Clube() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();

  const [profile, setProfile] = useState(null);
  const [openPlan, setOpenPlan] = useState(null);
  const [openPack, setOpenPack] = useState(null);

  const highlightPoints = searchParams.get('reason') === 'points';

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/users/${user.id}/profile`)
      .then((r) => setProfile(r.data || null))
      .catch(() => {});
  }, [user?.id]);

  const membership = useMemo(
    () => getMembershipMeta(profile || user || {}),
    [profile, user],
  );

  function togglePlan(key) {
    setOpenPlan((prev) => (prev === key ? null : key));
  }

  function togglePack(key) {
    setOpenPack((prev) => (prev === key ? null : key));
  }

  return (
    <div className="min-h-screen bg-[var(--gatedo-light-bg)] pb-28">

      {/* ── Top nav ── */}
      <div className="px-5 pt-8 pb-1">
        <button
          type="button"
          onClick={() => { touch(); navigate(-1); }}
          className="w-11 h-11 rounded-full bg-white border border-gray-100 flex items-center justify-center shadow-sm text-[#8B4AFF]"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      <div className="px-5 pt-4 space-y-4">

        {/* ── Hero banner ── */}
        <div className="rounded-[32px] overflow-hidden bg-gradient-to-br from-[#8B4AFF] via-[#7A4CFF] to-[#5E2DDB] p-6 text-white relative">
          {/* Decorative bg logo */}
          <img
            src="/assets/logo-fundo1.svg"
            alt=""
            aria-hidden="true"
            className="absolute -right-10 -bottom-10 w-44 opacity-100 pointer-events-none select-none"
          />

          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[4px] text-white/50">
              Gatedo Plus
            </p>
            <h1 className="text-[30px] leading-[1.1] font-black mt-3">
              Assinatura &amp;<br />Gatedo Points
            </h1>
            <p className="text-[13px] font-medium text-white/70 mt-3 leading-relaxed">
              Escolha seu plano e reponha points sempre que precisar.
              A ativação é automática.
            </p>

            {user && (
              <div className="mt-5 inline-flex flex-wrap items-center gap-2.5 rounded-[20px] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <Crown size={14} className="text-[#edff61]" />
                <span className="text-[11px] font-black uppercase tracking-[2px] text-white/70">
                  Plano atual
                </span>
                <span className="text-[13px] font-black text-[#edff61]">
                  {membership.label}
                </span>
                {profile?.subscription?.expiresAt && (
                  <span className="text-[12px] font-semibold text-white/60">
                    · expira {formatDateBR(profile.subscription.expiresAt)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Planos ── */}
        <div className="bg-white rounded-[32px] p-5 border border-gray-100 shadow-sm">
          {/* Section header */}
          <div className="mb-5">
            <p className="text-[10px] font-black uppercase tracking-[4px] text-[#FF7C42]">
              Planos
            </p>
            <h2 className="text-[24px] leading-none font-black text-gray-900 mt-2">
              Tutor Plus &amp; Tutor Master
            </h2>
            <p className="text-[13px] font-medium text-gray-500 mt-2 leading-relaxed">
              Toque em um plano para ver os benefícios e assinar.
            </p>
          </div>

          {/* Plan rows */}
          <div className="space-y-3">
            {PLANS.map((plan) => (
              <PlanAccordionRow
                key={plan.key}
                plan={plan}
                isOpen={openPlan === plan.key}
                onToggle={() => togglePlan(plan.key)}
              />
            ))}
          </div>

          {/* Info chip row */}
          <div className="mt-5 rounded-[20px] bg-[#FFF5EF] border border-[#FFD8C6] p-4 flex flex-wrap gap-3 items-center">
            <PawPrint size={16} className="text-[#FF7C42]" />
            <p className="text-[12px] font-semibold text-gray-600 leading-snug flex-1 min-w-0">
              <span className="font-black text-gray-800">Tutor Plus</span> — até 3 gatos ativos.
              {' '}<span className="font-black text-gray-800">Tutor Master</span> — gatos ilimitados + memorial sem consumir vaga.
            </p>
          </div>
        </div>

        {/* ── Gatedo Points ── */}
        <div
          className={`bg-white rounded-[32px] p-5 border shadow-sm ${highlightPoints ? 'border-[#edff61]' : 'border-gray-100'}`}
        >
          {/* Section header with coin visual */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[4px] text-[#8B4AFF]">
                Gatedo Points
              </p>
              <h2 className="text-[24px] leading-none font-black text-gray-900 mt-2">
                Ganhe mais<br />com GPTS
              </h2>
              <p className="text-[13px] font-medium text-gray-500 mt-2 leading-relaxed">
                Reponha quando precisar. IA, Studio e recursos premium consomem GPTS sob demanda.
              </p>
            </div>
            {/* Decorative coin stack */}
            <div className="shrink-0 ml-3 relative w-16 h-16">
              <div
                className="absolute inset-0 rounded-full opacity-20 blur-lg"
                style={{ background: 'radial-gradient(circle, #FFD700, #FF8C00)' }}
              />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFE066] to-[#FF9900] flex items-center justify-center shadow-lg shadow-yellow-200">
                <PawPrint size={24} className="text-white drop-shadow" />
              </div>
            </div>
          </div>

          {/* Points rows */}
          <div className="space-y-3">
            {POINTS_PACKS.map((pack) => (
              <PointsAccordionRow
                key={pack.key}
                pack={pack}
                isOpen={openPack === pack.key}
                onToggle={() => togglePack(pack.key)}
              />
            ))}
          </div>
        </div>

        {/* ── Como funciona ── */}
        <div className="bg-white rounded-[32px] p-5 border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[4px] text-[#8B4AFF] mb-1">
            Como funciona
          </p>
          <h2 className="text-[22px] leading-none font-black text-gray-900 mb-5">
            Ativação automática
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <FlowCard
              icon={WalletCards}
              title="Compra aprovada"
              text="Validada via webhook da Kiwify em tempo real."
            />
            <FlowCard
              icon={Sparkles}
              title="Plano ativado"
              text="Badge, plano e GPTS são concedidos na hora."
            />
            <FlowCard
              icon={CalendarDays}
              title="Expiração visível"
              text="Data de compra e vencimento no seu perfil."
            />
            <FlowCard
              icon={Zap}
              title="Uso sob demanda"
              text="IA e Studio consomem GPTS conforme o uso."
            />
          </div>
        </div>
      </div>
    </div>
  );
}