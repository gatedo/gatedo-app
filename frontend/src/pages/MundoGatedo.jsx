/**
 * MundoGatedo.jsx — /mundo-gatedo
 * Página "zero ruído" sobre o propósito, fases e construção colaborativa do GATEDO.
 * ─ Manifesto + Fases do produto
 * ─ Caixa de sugestões (POST /feedback → admin recebe no painel)
 * ─ Padrão visual do app: fundo claro, cards brancos, acento roxo
 */
import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Globe2, Send, Check, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import useSensory from '../hooks/useSensory';
import FeedbackForm from '../components/FeedbackForm';

const C = {
  purple: '#8B4AFF',
  purpleDark: '#4B40C6',
  accentDim: '#ebfc66',
};

// ─── FASES DO PRODUTO ─────────────────────────────────────────────────────────
const PHASES = [
  {
    n: 1, label: 'Early Bird', status: 'active',
    title: 'Base & Comunidade',
    desc: 'Perfis de gatos, saúde, gamificação, IA veterinária e a rede social dos tutores felinos.',
    features: ['Perfis completos dos gatos', 'iGentVet — IA veterinária', 'ComuniGato — rede social', 'Gamificação & XP', 'Gatedo Studio (MVP)'],
    color: '#EF4444',
  },
  {
    n: 2, label: 'Fundador', status: 'upcoming',
    title: 'Studio & Moedas',
    desc: 'Expansão do Studio com todas as ferramentas criativas, Gatedo Points e integrações com parceiros.',
    features: ['Studio completo (6+ ferramentas)', 'Gatedo Points — loja de créditos', 'Cupons em petshops parceiros', 'Rede Vet conveniada', 'Desafios semanais de criação'],
    color: '#f59e0b',
  },
  {
    n: 3, label: 'Acesso Final', status: 'upcoming',
    title: 'Escala & Entretenimento',
    desc: 'Joguinhos para gatos, marketplace, app nativo iOS/Android e inteligência preditiva de saúde.',
    features: ['App nativo iOS & Android', 'Entretenimento interativo para gatos', 'Marketplace de produtos felinos', 'IA preditiva de saúde', 'Histórias animadas & Voz do Gato'],
    color: '#8B4AFF',
  },
];

// ─── VALORES ──────────────────────────────────────────────────────────────────
const VALUES = [
  { emoji: '🐾', title: 'Amor pelos Gatos', desc: 'Cada decisão começa com: isso é bom para os gatos e seus tutores?' },
  { emoji: '🔬', title: 'Tecnologia com Alma', desc: 'IA como ferramenta de cuidado, não substituição do vínculo humano-felino.' },
  { emoji: '🤝', title: 'Construído Junto', desc: 'Fundadores moldam o produto. Suas sugestões chegam direto no nosso painel.' },
  { emoji: '🌱', title: 'Crescimento Real', desc: 'Lançamos devagar, testamos com cuidado, evoluímos com responsabilidade.' },
];

const STATUS_CONFIG = {
  active: { label: 'Em andamento', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  upcoming: { label: 'Em breve', color: '#8B4AFF', bg: '#F5F3FF', border: '#DDD6FE' },
  done: { label: 'Concluído', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
};

// ─── COMPONENTE ───────────────────────────────────────────────────────────────
export default function MundoGatedo() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user } = useContext(AuthContext);

  const isFounder =
    user?.plan === 'FOUNDER_EARLY' ||
    user?.plan === 'FOUNDER' ||
    user?.badges?.includes('FOUNDER_EARLY') ||
    user?.badges?.includes('FOUNDER');

  return (
    <div className="min-h-screen pb-20" style={{ background: 'var(--gatedo-light-bg)' }}>

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-20 px-4 pt-6 pb-4 flex items-center gap-3 bg-[var(--gatedo-light-bg)]">
        <button
          onClick={() => { touch(); navigate(-1); }}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0"
        >
          <ArrowLeft size={18} className="text-gray-700" />
        </button>
        <div className="flex items-center gap-2">
          <Globe2 size={18} style={{ color: C.purple }} />
          <span className="font-black text-base tracking-wide text-gray-800">
            MUNDO <span style={{ color: C.purple }}>GATEDO</span>
          </span>
        </div>
        {isFounder && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: '#FFF7E6', border: '1px solid #FDE68A' }}>
            <Crown size={12} color="#D97706" fill="#D97706" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Fundador</span>
          </div>
        )}
      </div>

      <div className="px-4 space-y-6 pt-2 max-w-[560px] mx-auto">

        {/* ── HERO ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="pt-4 text-center space-y-4">
          <motion.div
            animate={{ boxShadow: ['0 8px 24px rgba(139,74,255,0.25)', '0 8px 34px rgba(139,74,255,0.4)', '0 8px 24px rgba(139,74,255,0.25)'] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
          >
            <img src="/assets/App_gatedo_logo1.webp" className="w-14 h-14 object-contain" alt="Gatedo" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </motion.div>

          <div>
            <p className="text-[11px] font-black uppercase tracking-[3px] mb-2" style={{ color: C.purple }}>
              Para tutores que amam gatos
            </p>
            <h1 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">
              Estamos construindo o<br />
              <span style={{ color: C.purple }}>GATEDO</span> com você
            </h1>
          </div>

          <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-[300px] mx-auto">
            Pessoas que amam gatos enxergam o mundo de forma diferente. Você chegou cedo — e isso importa.
          </p>
        </motion.div>

        {/* ── MANIFESTO ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-[28px] p-6 bg-white border border-gray-100 shadow-sm"
        >
          <p className="text-[11px] font-black uppercase tracking-[2.5px] mb-3" style={{ color: C.purple }}>
            Nosso propósito
          </p>
          <p className="text-sm text-gray-600 font-medium leading-relaxed">
            O GATEDO nasce da crença de que tecnologia pode aprofundar — não substituir — o vínculo entre tutores e seus gatos.
            Cada funcionalidade que construímos começa com uma pergunta simples:{' '}
            <span className="text-gray-900 font-black">isso cuida melhor?</span>
          </p>
        </motion.div>

        {/* ── VALORES ── */}
        <div>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[2.5px] mb-3">O que nos guia</p>
          <div className="grid grid-cols-2 gap-3">
            {VALUES.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 + i * 0.07 }}
                className="rounded-[22px] p-4 bg-white border border-gray-100 shadow-sm"
              >
                <span className="text-2xl mb-2 block">{v.emoji}</span>
                <p className="text-sm font-black text-gray-800 mb-1">{v.title}</p>
                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── FASES ── */}
        <div>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[2.5px] mb-3">Roadmap das Fases</p>
          <div className="space-y-3">
            {PHASES.map((phase, i) => {
              const sc = STATUS_CONFIG[phase.status];
              return (
                <motion.div
                  key={phase.n}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                  className="rounded-[24px] overflow-hidden bg-white border border-gray-100 shadow-sm"
                >
                  <div className="px-5 py-4 flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg"
                      style={{ background: `${phase.color}14`, border: `1.5px solid ${phase.color}40`, color: phase.color }}
                    >
                      {phase.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-black text-gray-800">{phase.label} · {phase.title}</p>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium leading-tight">{phase.desc}</p>
                    </div>
                  </div>

                  <div className="px-5 pb-4 space-y-1.5">
                    {phase.features.map((f, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center" style={{ background: `${phase.color}14`, border: `1px solid ${phase.color}30` }}>
                          <Check size={11} style={{ color: phase.color }} strokeWidth={3} />
                        </div>
                        <p className="text-[12px] text-gray-600 font-medium">{f}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ── CAIXA DE SUGESTÕES ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-[28px] overflow-hidden bg-white border border-gray-100 shadow-sm"
        >
          <div className="px-5 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#F5F1FF' }}>
                <Send size={17} style={{ color: C.purple }} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-800">Sua Sugestão</p>
                <p className="text-[11px] text-gray-400 font-bold">O admin recebe em tempo real no painel</p>
              </div>
            </div>
            <p className="text-[12px] text-gray-500 font-medium leading-relaxed">
              Fundadores moldam o GATEDO. Sua ideia pode virar feature na próxima fase.
            </p>
          </div>

          <div className="p-5">
            <FeedbackForm source="MUNDO_GATEDO" defaultCategory="FEATURE" />
          </div>
        </motion.div>

        {/* ── CTA FUNDADOR ── */}
        {!isFounder && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { touch(); navigate('/clube'); }}
            className="w-full rounded-[24px] p-5 flex items-center gap-4"
            style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)`, boxShadow: '0 8px 24px rgba(139,74,255,0.3)' }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Crown size={22} color={C.accentDim} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Clube GATEDO</p>
              <p className="font-black text-white text-sm">Conheça os benefícios</p>
              <p className="text-[11px] text-white/60">Selo, comunidade e mais</p>
            </div>
            <ChevronRight size={18} className="text-white/50 shrink-0" />
          </motion.button>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
