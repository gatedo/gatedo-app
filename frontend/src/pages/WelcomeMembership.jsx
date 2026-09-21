import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Crown, HeartHandshake, ShieldCheck, Sparkles, Star, Zap } from 'lucide-react';
import { brandAssets } from '../brand/assets';

const WELCOME_VARIANTS = {
  founder: {
    badge: '/assets/badges/badge-genese.webp',
    eyebrow: 'Fundador Gatedo',
    title: 'Seu acesso fundador está ativo',
    lead: 'Você entrou antes de todo mundo e agora faz parte da base que ajuda a construir o futuro do cuidado felino.',
    accent: '#EBFC46',
    glow: '#10BDF2',
    chip: 'Selo vitalício de fundador',
    cta: 'Entrar no Gatedo',
    benefits: [
      ['Plano fundador aplicado', 'Condição especial preservada no seu perfil.', Crown],
      ['Acesso antecipado', 'Novas evoluções chegam primeiro para você.', Sparkles],
      ['Selo especial no app', 'Sua presença fica marcada na história do Gatedo.', ShieldCheck],
    ],
  },
  prime: {
    badge: '/assets/badges/badge-prime.webp',
    eyebrow: 'Tutor Prime',
    title: 'Bem-vindo ao Gatedo Prime',
    lead: 'Seu acesso está pronto para organizar a vida do seu gato com prontuário, rotina, documentos e iGentVet em um só lugar.',
    accent: '#EBFC46',
    glow: '#8B4AFF',
    chip: 'Plano Prime ativo',
    cta: 'Começar agora',
    benefits: [
      ['Perfil felino completo', 'Cadastre seus gatos e centralize tudo em um prontuário vivo.', HeartHandshake],
      ['iGentVet no cuidado diário', 'Use a IA para triagem educativa, contexto e organização.', Sparkles],
      ['Documentos e lembretes', 'Vacinas, consultas, laudos e registros ficam no lugar certo.', ShieldCheck],
    ],
  },
  vip: {
    badge: '/assets/badges/badge-vip.webp',
    eyebrow: 'Tutor VIP',
    title: 'Seu acesso VIP está liberado',
    lead: 'Você entrou em uma camada especial de testes e prioridade, ajudando o Gatedo a evoluir com feedback real.',
    accent: '#EBFC46',
    glow: '#38D9C7',
    chip: 'Acesso VIP aplicado',
    cta: 'Entrar como VIP',
    benefits: [
      ['Prioridade em novidades', 'Você acompanha recursos novos antes da abertura ampla.', Zap],
      ['Perfil com selo VIP', 'Sua participação aparece com uma marca especial no app.', Star],
      ['Feedback que constrói', 'Sua experiência ajuda a lapidar o ecossistema Gatedo.', HeartHandshake],
    ],
  },
};

const FOUNDER_PHASE_WELCOME = {
  1: {
    badge: '/assets/badges/badge-genese.webp',
    eyebrow: 'Tutor Genese',
    glow: '#10BDF2',
    chip: 'Selo vitalicio Tutor Genese',
  },
  2: {
    badge: '/assets/badges/badge-raiz.webp',
    eyebrow: 'Tutor Raiz',
    glow: '#18C9A5',
    chip: 'Selo vitalicio Tutor Raiz',
  },
  3: {
    badge: '/assets/badges/badge-cerne.webp',
    eyebrow: 'Tutor Cerne',
    glow: '#FF7A3D',
    chip: 'Selo vitalicio Tutor Cerne',
  },
  4: {
    badge: '/assets/badges/badge-prime.webp',
    eyebrow: 'Tutor Prime',
    glow: '#8B4AFF',
    chip: 'Selo Tutor Prime ativo',
  },
};

export default function WelcomeMembership({ variant = 'prime' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name') || 'Tutor';
  const phase = Number(searchParams.get('phase') || 1);
  const baseData = WELCOME_VARIANTS[variant] || WELCOME_VARIANTS.prime;
  const data =
    variant === 'founder'
      ? { ...baseData, ...(FOUNDER_PHASE_WELCOME[phase] || FOUNDER_PHASE_WELCOME[4]) }
      : baseData;

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden px-5 py-8 text-white"
      style={{
        background:
          `radial-gradient(circle at 50% 10%, ${data.glow}44, transparent 34%), linear-gradient(155deg, #130629 0%, #39116D 44%, #8B4AFF 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0">
        <img
          src={brandAssets.gatedoWatermark}
          alt=""
          className="absolute -bottom-32 -left-40 w-[760px] max-w-none opacity-100"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
        <div className="absolute -right-32 top-16 h-[420px] w-[420px] rounded-full blur-3xl" style={{ background: `${data.glow}30` }} />
      </div>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-[920px] flex-col items-center justify-center gap-8">
        <motion.img
          src={brandAssets.gatedoYellow}
          alt="Gatedo"
          className="h-9 w-auto object-contain opacity-95"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        />

        <motion.div
          className="mt-12 w-full max-w-[420px] rounded-[34px] border border-white/[0.06] px-6 pb-6 pt-[84px] text-center shadow-[0_24px_70px_rgba(18,6,46,0.34)] backdrop-blur-xl"
          style={{
            background:
              'linear-gradient(180deg, rgba(80,42,166,0.46), rgba(42,18,92,0.58))',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 24px 70px rgba(18,6,46,0.34)',
            WebkitBackdropFilter: 'blur(22px) saturate(1.22)',
            backdropFilter: 'blur(22px) saturate(1.22)',
          }}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
        >
          <img
            src={data.badge}
            alt={data.eyebrow}
            className="absolute left-1/2 top-0 h-[136px] w-[136px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.32)]"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />

          <div
            className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[9px] font-black uppercase tracking-[0.18em]"
            style={{ borderColor: `${data.accent}66`, background: 'rgba(255,255,255,0.08)', color: data.accent }}
          >
            <Star size={11} fill={data.accent} />
            {data.eyebrow}{variant === 'founder' && phase ? ` · Fase ${phase}` : ''}
          </div>

          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">Olá, {name}</p>
          <h1 className="mt-2 text-[24px] font-black leading-tight text-white md:text-[26px]">{data.title}</h1>
          <p className="mx-auto mt-3 max-w-[320px] text-sm font-semibold leading-relaxed text-white/68">{data.lead}</p>

          <div className="mt-6 space-y-3 text-left">
            {data.benefits.map(([title, desc, Icon]) => (
              <div key={title} className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/90 p-4 text-[#22223b]">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${data.glow}18`, color: data.glow }}>
                  <Icon size={19} />
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tight">{title}</p>
                  <p className="mt-0.5 text-[10px] font-bold leading-snug text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[20px] border border-white/12 bg-white/10 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em]" style={{ color: data.accent }}>{data.chip}</p>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => navigate('/home')}
            className="mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-[26px] px-5 py-4 text-sm font-black uppercase tracking-widest text-[#4B2BB8] shadow-[0_14px_34px_rgba(235,252,70,0.22)]"
            style={{ background: data.accent }}
          >
            {data.cta} <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </section>
    </main>
  );
}
