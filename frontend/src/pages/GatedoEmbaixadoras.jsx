import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Copy,
  Crown,
  ExternalLink,
  HeartHandshake,
  Lock,
  MousePointerClick,
  PlayCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  buildAmbassadorLinks,
  getAmbassadorByToken,
  normalizeAmbassadorToken,
  setAmbassadorAttribution,
} from '../services/ambassadorProgramStore';
import influencerHero from '../../assets/influencers/influerscers_img1.webp';
import influencerDetail from '../../assets/influencers/influerscers_img2.webp';
import influencerCommunity from '../../assets/influencers/influerscers_img3.webp';
import influencerCat from '../../assets/influencers/3b8ce6b5-66db-4e7e-99d0-af0565a9a68d.webp';
import gatedoLogo from '../../assets/App_gatedo_logo1.webp';

const P = '#8B4AFF';
const A = '#ebfc66';
const DK = '#140B2E';
const PAGE_BG = '#eeeeff';
const influencerImages = [influencerHero, influencerDetail, influencerCommunity, influencerCat];

const tierMeta = {
  genese: {
    label: 'Embaixadora Genese',
    icon: Crown,
    detail: 'Primeiro grupo de criadores que ajudam o Gatedo a nascer com cultura, nao so com alcance.',
  },
  curadora: {
    label: 'Curadora Gatedo',
    icon: ShoppingBag,
    detail: 'Perfil ideal para uma vitrine propria dentro da Store, com produtos e links afiliados.',
  },
  oficial: {
    label: 'Parceira Oficial',
    icon: Star,
    detail: 'Parceria recorrente de marca, campanhas e conteudo com presenca dentro do ecossistema.',
  },
};

const fmtK = (value) => {
  const n = Number(value || 0);
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
};

const fmtMoney = (value) =>
  `R$ ${Math.round(Number(value || 0)).toLocaleString('pt-BR')}`;

function LoginScreen({ onSubmit, error }) {
  const [token, setToken] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10" style={{ background: DK }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: A }}>
            <HeartHandshake size={26} color={P} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em]" style={{ color: A }}>
            Gatedo Influencers
          </p>
          <h1 className="text-3xl font-black text-white mt-2">Portal de Embaixadores</h1>
          <p className="text-sm text-white/45 mt-2">
            Digite o token recebido para ver a proposta preparada para voce.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
          <label className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
            Token de acesso
          </label>
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && onSubmit(token)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-white outline-none focus:border-[#ebfc66]"
            placeholder="EX: EMBAIXADORA-CAROL"
          />
          {error && <p className="mt-2 text-xs font-bold text-red-300">{error}</p>}
          <button
            onClick={() => onSubmit(token)}
            className="mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black text-white flex items-center justify-center gap-2"
            style={{ background: P }}
          >
            Acessar proposta <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white/[0.07] border border-white/10 p-4">
      <Icon size={16} className="text-white/55 mb-2" />
      <p className="text-2xl font-black text-white leading-none">{value}</p>
      <p className="text-[10px] font-bold text-white/40 mt-1">{label}</p>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="h-10 px-3 rounded-xl border border-gray-100 text-xs font-black text-gray-500 flex items-center gap-2 hover:bg-gray-50"
    >
      {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function ImpactCard({ icon: Icon, label, value, detail, color }) {
  return (
    <div className="rounded-[24px] bg-white border border-gray-100 p-5 shadow-sm relative overflow-hidden min-h-[184px]">
      <div className="flex items-start justify-between gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${color}12`, color }}>
          <Icon size={18} />
        </div>
        <span className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-300">simulacao</span>
      </div>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400 mt-5">{label}</p>
      <p className="text-2xl md:text-[28px] font-black text-gray-950 mt-1 leading-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{detail}</p>
    </div>
  );
}

function RangeField({ label, value, min, max, step = 1, suffix = '', color = P, onChange }) {
  const pct = ((Number(value) - min) / (max - min)) * 100;
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">{label}</span>
        <span className="text-sm font-black text-gray-900">{value}{suffix}</span>
      </div>
      <div className="relative">
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </label>
  );
}

function CommissionSimulator({ profile }) {
  const [audience, setAudience] = useState(Math.max(1000, Number(profile.audience || 10000)));
  const [reach, setReach] = useState(18);
  const [conversion, setConversion] = useState(3);
  const [ticket, setTicket] = useState(197);

  const clicks = Math.round(audience * (reach / 100));
  const sales = Math.max(1, Math.round(clicks * (conversion / 100)));
  const revenue = sales * ticket;
  const commission = Math.round(revenue * (Number(profile.commissionPercent || 20) / 100));
  const annualProjection = commission * 3;
  const planOptions = [
    { label: 'Tutor Prime anual', value: 127 },
    { label: 'Tutor Prime Plus anual', value: 197 },
  ];
  const bars = [
    { label: 'Conservador', value: Math.round(commission * 0.55), color: '#94a3b8' },
    { label: 'Realista', value: commission, color: profile.color || P },
    { label: 'Otimista', value: Math.round(commission * 2), color: '#ff7a33' },
  ];
  const maxBar = Math.max(...bars.map((bar) => bar.value), 1);
  const scenarioCards = [
    { title: 'Conservador', pct: '1% da audiencia', monthly: Math.round(audience * 0.01 * ticket * (profile.commissionPercent / 100)), subscribers: Math.round(audience * 0.01), color: '#64748b' },
    { title: 'Realista', pct: '2,5% da audiencia', monthly: Math.round(audience * 0.025 * ticket * (profile.commissionPercent / 100)), subscribers: Math.round(audience * 0.025), color: profile.color || P },
    { title: 'Otimista', pct: '5% da audiencia', monthly: Math.round(audience * 0.05 * ticket * (profile.commissionPercent / 100)), subscribers: Math.round(audience * 0.05), color: '#ff7a33' },
  ];

  return (
    <section className="rounded-[32px] bg-white border border-gray-100 shadow-sm overflow-hidden">
      <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
        <div className="p-5 md:p-6 border-b lg:border-b-0 lg:border-r border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${profile.color}14`, color: profile.color }}>
              <Calculator size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Simulador</p>
              <h2 className="text-xl font-black text-gray-950">Quanto sua indicacao pode gerar</h2>
              <p className="text-sm font-black mt-1" style={{ color: profile.color }}>Seus ganhos</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {planOptions.map((plan) => (
              <button
                key={plan.value}
                type="button"
                onClick={() => setTicket(plan.value)}
                className={`rounded-2xl border-2 px-3 py-3 text-center transition-all ${ticket === plan.value ? 'bg-[#f4efff]' : 'bg-white'}`}
                style={{ borderColor: ticket === plan.value ? profile.color : '#e5e7eb' }}
              >
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-gray-400">{plan.label}</p>
                <p className="text-base font-black mt-1" style={{ color: ticket === plan.value ? profile.color : '#94a3b8' }}>
                  R$ {plan.value}/ano
                </p>
              </button>
            ))}
          </div>

          <div className="space-y-5">
            <RangeField label="Audiencia estimada" value={audience} min={1000} max={100000} step={500} color={profile.color || P} onChange={setAudience} />
            <RangeField label="Alcance no post/story" value={reach} min={3} max={60} suffix="%" color="#7c3aed" onChange={setReach} />
            <RangeField label="Conversao dos cliques" value={conversion} min={1} max={12} suffix="%" color="#10b981" onChange={setConversion} />
          </div>
        </div>

        <div className="p-5 md:p-6 bg-gray-50/60">
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            <ImpactCard icon={MousePointerClick} label="Cliques" value={clicks.toLocaleString('pt-BR')} detail={`${reach}% da audiencia`} color={profile.color} />
            <ImpactCard icon={Users} label="Assinantes" value={sales.toLocaleString('pt-BR')} detail={`${conversion}% dos cliques`} color="#10b981" />
            <ImpactCard icon={TrendingUp} label="Comissao" value={fmtMoney(commission)} detail={`${profile.commissionPercent}% sobre vendas`} color="#f97316" />
          </div>

          <div className="rounded-[24px] bg-white border border-gray-100 p-5">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">Cenarios de campanha</p>
                <p className="text-sm font-black text-gray-900">Projecao por janela de divulgacao</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400">3 campanhas</p>
                <p className="text-xl font-black" style={{ color: profile.color }}>{fmtMoney(annualProjection)}</p>
              </div>
            </div>
            <div className="space-y-3">
              {bars.map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-[11px] font-black text-gray-500 mb-1">
                    <span>{bar.label}</span>
                    <span>{fmtMoney(bar.value)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(8, (bar.value / maxBar) * 100)}%`, background: bar.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-6 border-t border-gray-100">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Seus ganhos</p>
            <h3 className="text-xl font-black text-gray-950">Simulacao de cenarios</h3>
          </div>
          <p className="text-xs font-bold text-gray-400">Modelo recorrente · assinatura anual</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {scenarioCards.map((scenario) => (
            <div key={scenario.title} className="rounded-[24px] border bg-white p-5 shadow-sm" style={{ borderColor: `${scenario.color}35` }}>
              <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: scenario.color }}>{scenario.title}</p>
              <p className="text-xs text-gray-400 mt-1">{scenario.pct}</p>
              <p className="text-2xl font-black mt-4" style={{ color: scenario.color }}>{fmtMoney(scenario.monthly)}</p>
              <p className="text-xs text-gray-500">por campanha</p>
              <div className="mt-3 rounded-2xl bg-gray-50 px-3 py-2">
                <p className="text-[11px] font-black" style={{ color: scenario.color }}>{fmtMoney(scenario.monthly * 12)}/ano</p>
              </div>
              <p className="text-[10px] text-gray-400 mt-3">{scenario.subscribers.toLocaleString('pt-BR')} assinantes ativos</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function VideoPitch({ profile }) {
  const [playing, setPlaying] = useState(false);
  const hasVideo = Boolean(profile.videoUrl);
  return (
    <section className="rounded-[32px] bg-[#140B2E] text-white overflow-hidden shadow-[0_24px_60px_rgba(20,11,46,0.22)]">
      <div className="grid lg:grid-cols-[1fr_0.85fr]">
        <button
          onClick={() => setPlaying((prev) => !prev)}
          className="relative min-h-[280px] text-left overflow-hidden group"
        >
          {hasVideo && playing ? (
            <iframe
              src={profile.videoUrl}
              title={`VSL ${profile.name}`}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <img src={influencerHero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#140B2E] via-[#140B2E]/30 to-transparent" />
            </>
          )}
          {!playing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/18 border border-white/25 backdrop-blur-md flex items-center justify-center">
                <PlayCircle size={42} className="text-[#ebfc66]" fill="rgba(235,252,102,0.18)" />
              </div>
            </div>
          )}
          <div className="absolute left-5 right-5 bottom-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#ebfc66]">VSL privada</p>
            <h2 className="text-2xl font-black mt-1">{hasVideo ? 'Assista sua proposta personalizada' : 'Mensagem para entender o programa em 3 minutos'}</h2>
          </div>
        </button>
        <div className="p-6 md:p-7 flex flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#ebfc66] mb-3">Resumo da proposta</p>
          <h3 className="text-2xl font-black leading-tight">Nao e uma publi. E uma prateleira sua dentro do ecossistema Gatedo.</h3>
          <p className="text-sm text-white/55 leading-relaxed mt-4">
            {playing
              ? `${profile.name}, pense no seu link como uma carteira. Cada tutor que chega por voce cria historico, receita e contexto para sua futura vitrine.`
              : 'Clique no player para simular a VSL: aqui pode entrar um video seu explicando o convite, uma demo do app ou uma gravacao curta do Diego.'}
          </p>
          <div className="grid grid-cols-3 gap-2 mt-6">
            {[
              { label: 'Link rastreavel', icon: MousePointerClick, color: '#ff7a33' },
              { label: 'Carteira', icon: ShieldCheck, color: '#ff4faf' },
              { label: 'Vitrine', icon: Store, color: '#ebfc66' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border bg-white/[0.06] p-3" style={{ borderColor: `${item.color}75` }}>
                <item.icon size={14} style={{ color: item.color }} />
                <p className="text-[11px] font-black mt-2">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function GatedoEmbaixadoras() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialToken = params.token || searchParams.get('token') || searchParams.get('amb') || '';
  const [manualToken, setManualToken] = useState(initialToken);
  const [error, setError] = useState('');

  const profile = useMemo(() => getAmbassadorByToken(manualToken), [manualToken]);
  const links = useMemo(() => buildAmbassadorLinks(profile?.token), [profile?.token]);

  useEffect(() => {
    if (profile) setAmbassadorAttribution(profile);
  }, [profile]);

  const submitToken = (value) => {
    const normalized = normalizeAmbassadorToken(value);
    if (!getAmbassadorByToken(normalized)) {
      setError('Token nao encontrado ou inativo. Confira o codigo recebido.');
      return;
    }
    setError('');
    setManualToken(normalized);
    navigate(`/embaixadoras/${normalized}`, { replace: true });
  };

  if (!profile) return <LoginScreen onSubmit={submitToken} error={error} />;

  const TierIcon = tierMeta[profile.tier]?.icon || Sparkles;
  const firstName = profile.name.split(' ')[0] || profile.name;
  return (
    <div className="min-h-screen bg-[#eeeeff] pb-10 font-sans">
      <section className="px-5 pt-7 pb-20 text-white relative overflow-hidden" style={{ background: `linear-gradient(180deg, #241044 0%, #7a3fe5 48%, ${PAGE_BG} 100%)` }}>
        <img src={influencerHero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-45" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(20,11,46,0.84) 0%, rgba(111,54,218,0.72) 48%, ${PAGE_BG} 100%)` }} />
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex items-center justify-between gap-3 mb-8">
            <div className="flex items-center gap-2">
              <img src={gatedoLogo} alt="Gatedo" className="w-11 h-11 rounded-2xl object-contain bg-white/92 p-1.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em]" style={{ color: A }}>Gatedo</p>
                <p className="text-sm font-black text-white">programa de embaixadoras</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
              Token {profile.token}
            </span>
          </div>

          <div className="max-w-2xl">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 mb-4">
                <TierIcon size={14} style={{ color: profile.color }} />
                <span className="text-[10px] font-black uppercase tracking-[0.14em]">{tierMeta[profile.tier]?.label || profile.tier}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black leading-[1.02] max-w-3xl">
                {firstName}, seu nome pode virar uma porta de entrada para o Gatedo.
              </h1>
              <p className="text-white/58 text-sm md:text-base mt-5 max-w-2xl leading-relaxed">
                {profile.headline}
              </p>
            </div>

            <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.16] p-5 backdrop-blur-md shadow-[0_24px_60px_rgba(20,11,46,0.24)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-lg font-black text-white" style={{ background: profile.color }}>
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full rounded-3xl object-cover" />
                  ) : (
                    profile.initials
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-black truncate">{profile.name}</p>
                  <p className="text-sm text-white/45">{profile.handle || 'Criadora Gatedo'} · {profile.city}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Stat icon={Users} label="audiencia" value={fmtK(profile.audience)} />
                <Stat icon={TrendingUp} label="comissao" value={`${profile.commissionPercent}%`} />
                <Stat icon={Store} label="vitrine" value="sim" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 h-28 mt-3">
              {influencerImages.map((image, index) => (
                <div key={image} className={`rounded-2xl overflow-hidden border border-white/10 bg-white/5 ${index === 0 ? 'col-span-2' : ''}`}>
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-5 -mt-12 relative z-20 space-y-5">
        <VideoPitch profile={profile} />

        <section className="rounded-[28px] bg-white border border-gray-100 p-5 md:p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-3">Convite nominal</p>
          <div className="space-y-3 text-sm leading-relaxed text-gray-600">
            <p>{profile.customMessage}</p>
            <p>
              O plano e simples: voce divulga com um link rastreavel, o Gatedo associa os cadastros a sua carteira de embaixadora
              e, conforme a Store evoluir, quem vier pelo seu link passa a ver uma experiencia com a sua curadoria primeiro.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mt-5">
            {profile.highlights.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black" style={{ background: `${profile.color}12`, color: profile.color }}>
                <CheckCircle2 size={13} /> {item}
              </span>
            ))}
          </div>
        </section>

        <CommissionSimulator profile={profile} />

        <section className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Carteira de indicacoes', text: 'Cada clique e cadastro iniciado pelo seu link fica marcado com seu token.', icon: Lock },
            { title: 'Vitrine propria', text: 'A Store ja reconhece seu token e prepara a experiencia para sua curadoria.', icon: ShoppingBag },
            { title: 'Conteudo com contexto', text: 'Nao e publi solta: e uma parceria com mensagem, proposta e identidade nominal.', icon: Sparkles },
          ].map((item) => (
            <div key={item.title} className="rounded-[24px] bg-white border border-gray-100 p-5 shadow-sm">
              <item.icon size={18} style={{ color: profile.color }} />
              <p className="text-sm font-black text-gray-900 mt-3">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[28px] bg-white border border-gray-100 p-5 md:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Seus links</p>
              <h2 className="text-xl font-black text-gray-900">Divulgacao, cadastro e vitrine</h2>
            </div>
            <button
              onClick={() => window.open(links.store, '_blank', 'noopener,noreferrer')}
              className="h-11 px-4 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2"
              style={{ background: profile.color }}
            >
              Abrir minha vitrine <ExternalLink size={15} />
            </button>
          </div>

          {[
            ['Portal da proposta', links.portal],
            ['Link para a Store/Vitrine', links.store],
            ['Cadastro com atribuicao', links.register],
          ].map(([label, url]) => (
            <div key={label} className="flex items-center gap-3 py-3 border-t border-gray-100">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-gray-700">{label}</p>
                <p className="text-[11px] text-gray-400 truncate">{url}</p>
              </div>
              <CopyButton text={url} />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
