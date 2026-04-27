import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  PawPrint,
  Crown,
  Sparkles,
  ChevronRight,
  Trophy,
  Heart,
  Brain,
  Syringe,
  Camera,
  MessageCircle,
  Lock,
  Flame,
  Map as MapIcon,
  Coins,
  Zap,
  Star,
  TrendingUp,
  CheckCircle2,
  Clock,
  Shield,
} from 'lucide-react';
import api from '../services/api';
import { useGamification, LEVELS } from '../context/GamificationContext';

// ─── Design tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#f4f3ff',
  card: '#ffffff',
  border: '#e9e2ff',
  text: '#1f2937',
  textSoft: '#6b7280',
  textMute: '#9ca3af',
  purple: '#8B4AFF',
  accent: '#DFFF40',
  accentDim: '#b7d82f',
  gpts: '#f59e0b',   // GPTS = moeda = âmbar
  xpt: '#8B4AFF',    // XPT  = tutor = roxo
  xpg: '#10b981',    // XPG  = gato  = verde
};

// ─── RewardMatrix OFICIAL (Manual §5) ──────────────────────────────────────
export const RewardMatrix = {
  FOUNDER_UNLOCK:        { gpts: +300, xpt: +100, xpg: 0,  badge: 'FOUNDING_MEMBER' },
  FOUNDER_MONTHLY_BONUS: { gpts: +10,  xpt: 0,    xpg: 0  },
  DAILY_LOGIN:           { gpts: +1,   xpt: +2,   xpg: 0  },
  TUTOR_PROFILE_COMPLETE:{ gpts: 0,    xpt: +12,  xpg: 0,  badge: 'TUTOR_VERIFICADO' },
  CAT_REGISTERED:        { gpts: 0,    xpt: +8,   xpg: +20, badge: 'PRIMEIRO_COMPANHEIRO' },
  CAT_PROFILE_COMPLETE:  { gpts: 0,    xpt: +10,  xpg: +15, badge: 'PERFIL_COMPLETO' },
  IGENT_CONSULT:         { gpts: -20,  xpt: +10,  xpg: +8  },
  VACCINE_REGISTERED:    { gpts: 0,    xpt: +4,   xpg: +12, badge: 'VACINA_EM_DIA_PROGRESS' },
  MEDICATION_REGISTERED: { gpts: 0,    xpt: +5,   xpg: +10 },
  TREATMENT_REGISTERED:  { gpts: 0,    xpt: +6,   xpg: +12 },
  WEIGHT_LOG:            { gpts: 0,    xpt: +2,   xpg: +6  },
  WEIGHT_STREAK_3:       { gpts: 0,    xpt: +2,   xpg: +10, badge: 'PESO_MONITORADO' },
  STUDIO_IMAGE:          { gpts: -15,  xpt: +12,  xpg: +6,  badge: 'PRIMEIRA_ARTE_PROGRESS' },
  STUDIO_VIDEO:          { gpts: -30,  xpt: +25,  xpg: +12, badge: 'CRIADOR_VIDEO_PROGRESS' },
  COMMUNITY_POST:        { gpts: 0,    xpt: +6,   xpg: +6,  badge: 'PRIMEIRO_POST_PROGRESS' },
  COMMUNITY_POST_POPULAR:{ gpts: 0,    xpt: +5,   xpg: +3,  badge: 'POST_POPULAR' },
};

// ─── Level banners ─────────────────────────────────────────────────────────
const LEVEL_VISUALS = {
  1:  { banner: '/assets/gamification/levels/n1.webp',  subtitle: 'O início da vida gateira' },
  2:  { banner: '/assets/gamification/levels/n2.webp',  subtitle: 'Primeiros sinais de atenção real' },
  3:  { banner: '/assets/gamification/levels/n3.webp',  subtitle: 'Agora você já é da casa' },
  4:  { banner: '/assets/gamification/levels/n4.webp',  subtitle: 'Seu olhar está mais apurado' },
  5:  { banner: '/assets/gamification/levels/n5.webp',  subtitle: 'Proteção, rotina e presença' },
  6:  { banner: '/assets/gamification/levels/n6.webp',  subtitle: 'Você cuida com mais consciência' },
  7:  { banner: '/assets/gamification/levels/n7.webp',  subtitle: 'Seu vínculo evoluiu' },
  8:  { banner: '/assets/gamification/levels/n8.webp',  subtitle: 'Explorando o universo Gatedo' },
  9:  { banner: '/assets/gamification/levels/n9.webp',  subtitle: 'Leitura mais refinada do comportamento felino' },
  10: { banner: '/assets/gamification/levels/n10.webp', subtitle: 'Uma base sólida de experiência' },
  11: { banner: '/assets/gamification/levels/n11.webp', subtitle: 'Estratégia aplicada ao cuidado' },
  12: { banner: '/assets/gamification/levels/n12.webp', subtitle: 'Consistência e organização' },
  13: { banner: '/assets/gamification/levels/n13.webp', subtitle: 'iGent começa a jogar junto com você' },
  14: { banner: '/assets/gamification/levels/n14.webp', subtitle: 'Saúde e contexto andando juntos' },
  15: { banner: '/assets/gamification/levels/n15.webp', subtitle: 'Bem-estar construído com intenção' },
  16: { banner: '/assets/gamification/levels/n16.webp', subtitle: 'Visão ampla e repertório forte' },
  17: { banner: '/assets/gamification/levels/n17.webp', subtitle: 'Guardião de alto nível' },
  18: { banner: '/assets/gamification/levels/n18.webp', subtitle: 'Presença marcante na jornada Gatedo' },
  19: { banner: '/assets/gamification/levels/n19.webp', subtitle: 'Quase lendário' },
  20: { banner: '/assets/gamification/levels/n20.webp', subtitle: 'Você ajudou a formar esse universo' },
};

// ─── Conquistas alinhadas ao RewardMatrix (Manual §5 + §12) + Drawer ─────────
const ACHIEVEMENTS = [
  {
    id: 'first_consult', category: 'Saúde', secret: false,
    title: 'Primeira Consulta', desc: 'Realizou a primeira análise no iGentVet',
    xpt: RewardMatrix.IGENT_CONSULT.xpt, xpg: RewardMatrix.IGENT_CONSULT.xpg,
    icon: Brain, color: '#8B4AFF', bg: '#F4F3FF',
    condition: (s) => (s.consultCount || 0) >= 1,
  },
  {
    id: 'five_consults', category: 'Saúde', secret: false,
    title: 'Tutor Atento', desc: '5 consultas realizadas no iGentVet',
    xpt: 50, xpg: 0,
    icon: Brain, color: '#7C3AED', bg: '#F4F3FF',
    condition: (s) => (s.consultCount || 0) >= 5,
  },
  {
    id: 'vaccines_ok', category: 'Saúde', secret: false,
    title: 'Imunizado', desc: 'Registrou 3 ou mais vacinas',
    xpt: RewardMatrix.VACCINE_REGISTERED.xpt, xpg: RewardMatrix.VACCINE_REGISTERED.xpg,
    icon: Syringe, color: '#EC4899', bg: '#FDF2F8',
    condition: (s) => (s.vaccinesRegistered || 0) >= 3,
  },
  {
    id: 'weight_streak', category: 'Saúde', secret: false,
    title: 'Peso Monitorado', desc: '3 registros de peso consecutivos',
    xpt: RewardMatrix.WEIGHT_STREAK_3.xpt, xpg: RewardMatrix.WEIGHT_STREAK_3.xpg,
    icon: TrendingUp, color: '#0EA5E9', bg: '#F0F9FF',
    condition: (s) => (s.weightLogCount || 0) >= 3,
  },
  {
    id: 'profile_complete', category: 'Perfil', secret: false,
    title: 'Identidade Completa', desc: 'Preencheu os dados essenciais do perfil',
    xpt: RewardMatrix.TUTOR_PROFILE_COMPLETE.xpt, xpg: 0,
    icon: Shield, color: '#0EA5E9', bg: '#F0F9FF',
    condition: (s) => !!s.profileComplete || (s.petCount || 0) >= 1,
  },
  {
    id: 'cat_registered', category: 'Perfil', secret: false,
    title: 'Primeiro Companheiro', desc: 'Cadastrou seu primeiro gato no app',
    xpt: RewardMatrix.CAT_REGISTERED.xpt, xpg: RewardMatrix.CAT_REGISTERED.xpg,
    icon: PawPrint, color: '#10b981', bg: '#F0FDF4',
    condition: (s) => (s.petCount || 0) >= 1,
  },
  {
    id: 'multi_cats', category: 'Perfil', secret: false,
    title: 'Gateiro de Verdade', desc: 'Cadastrou 3 ou mais gatos',
    xpt: 30, xpg: 0,
    icon: PawPrint, color: '#8B5CF6', bg: '#F5F3FF',
    condition: (s) => (s.petCount || 0) >= 3,
  },
  {
    id: 'first_post', category: 'Comunidade', secret: false,
    title: 'Voz da Comunidade', desc: 'Publicou o primeiro post no Comunigato',
    xpt: RewardMatrix.COMMUNITY_POST.xpt, xpg: RewardMatrix.COMMUNITY_POST.xpg,
    icon: MessageCircle, color: '#0EA5E9', bg: '#F0F9FF',
    condition: (s) => (s.postCount || 0) >= 1,
  },
  {
    id: 'studio_image', category: 'Studio', secret: false,
    title: 'Fotógrafo Felino', desc: 'Criou 3 imagens no Studio IA',
    xpt: RewardMatrix.STUDIO_IMAGE.xpt, xpg: RewardMatrix.STUDIO_IMAGE.xpg,
    icon: Camera, color: '#8B5CF6', bg: '#F5F3FF',
    condition: (s) => (s.studioCount || 0) >= 3,
  },
  {
    id: 'studio_video', category: 'Studio', secret: false,
    title: 'Criador de Vídeo', desc: 'Gerou um vídeo IA no Studio',
    xpt: RewardMatrix.STUDIO_VIDEO.xpt, xpg: RewardMatrix.STUDIO_VIDEO.xpg,
    icon: Star, color: '#f59e0b', bg: '#FFFBEB',
    condition: (s) => (s.studioVideoCount || 0) >= 1,
  },
  {
    id: 'night_owl', category: 'Segredo', secret: true,
    title: '🌙 Coruja Noturna', desc: 'Explorou o app em horários improváveis',
    xpt: 35, xpg: 0,
    icon: Star, color: '#F59E0B', bg: '#FFFBEB',
    condition: (s) => !!s.nightConsult,
  },
  {
    id: 'founder_badge', category: 'Segredo', secret: true,
    title: '👑 Fundador', desc: 'Membro fundador do Gatedo — acesso vitalício',
    xpt: RewardMatrix.FOUNDER_UNLOCK.xpt, xpg: 0,
    icon: Crown, color: '#b7d82f', bg: '#F7FEE7',
    condition: (_, badges) =>
      Array.isArray(badges) &&
      badges.some((b) => {
        const val = String(b).toLowerCase();
        return val.includes('fundador') || val.includes('founding') || val.includes('founder');
      }),
  },
];

// ─── Sensory sound helper ───────────────────────────────────────────────────
function useTick() {
  return () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } catch (_) {}
  };
}

// ─── Animated number counter ───────────────────────────────────────────────
function AnimatedCount({ value, duration = 800, suffix = '' }) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const startVal = useRef(0);

  useEffect(() => {
    startVal.current = display;
    const start = performance.now();
    startRef.current = start;

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal.current + (value - startVal.current) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{display.toLocaleString('pt-BR')}{suffix}</>;
}

// ─── Barra de progresso reutilizável ───────────────────────────────────────
function ProgressBar({ pct, color, height = 8, delay = 0, glow = false }) {
  return (
    <div
      className="rounded-full overflow-hidden"
      style={{ height, background: 'rgba(0,0,0,0.08)' }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, delay, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          height: '100%',
          background: color,
          borderRadius: 99,
          boxShadow: glow ? `0 0 8px ${color}88` : 'none',
        }}
      />
    </div>
  );
}

// ─── Card de recurso (GPTS / XPT / XPG) ────────────────────────────────────
function ResourceCard({ label, value, subtitle, color, icon: Icon, pulse = false }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="rounded-[24px] p-4 border cursor-default select-none"
      style={{
        background: hovered ? `${color}08` : C.card,
        borderColor: hovered ? `${color}50` : C.border,
        boxShadow: hovered
          ? `0 8px 24px ${color}20`
          : '0 4px 18px rgba(139,74,255,0.06)',
        transition: 'background 0.2s, border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: `${color}16` }}
        >
          <Icon size={12} style={{ color }} />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[2px]" style={{ color }}>
          {label}
        </p>
        {pulse && (
          <span
            className="ml-auto w-2 h-2 rounded-full animate-pulse"
            style={{ background: color }}
          />
        )}
      </div>

      <p className="text-xl font-black" style={{ color: C.text }}>
        <AnimatedCount value={value} />
      </p>

      <p className="text-[10px] font-bold mt-1" style={{ color: C.textSoft }}>
        {subtitle}
      </p>
    </motion.div>
  );
}

// ─── Card de conquista (grid 2 colunas, estilo Drawer) ──────────────────────
function AchievementItem({ achievement, unlocked }) {
  const [hovered, setHovered] = useState(false);
  const Icon = achievement.icon;
  const isSecret = achievement.secret && !unlocked;

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={unlocked ? { scale: 1.02, y: -2 } : {}}
      className="rounded-[22px] p-4 border transition-all"
      style={{
        background: unlocked
          ? hovered ? (achievement.bg || '#F4F3FF') : (achievement.bg || '#F9FAFB')
          : '#F9FAFB',
        borderColor: unlocked
          ? hovered ? `${achievement.color}50` : `${achievement.color}28`
          : '#F3F4F6',
        opacity: unlocked ? 1 : 0.62,
        boxShadow: hovered && unlocked ? `0 6px 20px ${achievement.color}20` : 'none',
        transition: 'all 0.2s',
      }}
    >
      {/* Ícone */}
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: unlocked ? `${achievement.color}18` : '#E5E7EB' }}
      >
        {unlocked
          ? <Icon size={18} style={{ color: achievement.color }} />
          : <Lock size={14} className="text-gray-400" />
        }
      </div>

      {/* Título */}
      <p className="text-[11px] font-black leading-tight mb-0.5"
        style={{ color: unlocked ? C.text : C.textMute }}>
        {isSecret ? '???' : achievement.title}
      </p>

      {/* Desc */}
      <p className="text-[9px] leading-snug mb-2.5"
        style={{ color: C.textSoft }}>
        {isSecret ? 'Conquista secreta' : achievement.desc}
      </p>

      {/* Badges XPT / XPG */}
      <div className="flex flex-wrap gap-1">
        {achievement.xpt > 0 && (
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
            style={{
              background: unlocked ? `${C.xpt}15` : '#F3F4F6',
              color: unlocked ? C.xpt : C.textMute,
            }}>
            +{achievement.xpt} XPT
          </span>
        )}
        {achievement.xpg > 0 && (
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
            style={{
              background: unlocked ? `${C.xpg}15` : '#F3F4F6',
              color: unlocked ? C.xpg : C.textMute,
            }}>
            +{achievement.xpg} XPG
          </span>
        )}
        {unlocked && (
          <CheckCircle2 size={11} style={{ color: achievement.color, marginLeft: 'auto', marginTop: 1 }} />
        )}
      </div>
    </motion.div>
  );
}

// ─── Card de jornada do gato (XPG individual) ───────────────────────────────
function PetJourneyCard({ pet, onClick }) {
  const [hovered, setHovered] = useState(false);
  const petXp    = Number(pet?.xpg || pet?.xp || 0);
  const petLevel = Number(pet?.level || 1);

  // Barra de XPG: 100 XPG por nível (ajustar conforme LevelCurveCat)
  const xpgPerLevel = 100;
  const xpgInLevel  = petXp % xpgPerLevel;
  const xpgPct      = Math.min(100, Math.round((xpgInLevel / xpgPerLevel) * 100));

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.015, x: 2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="rounded-[24px] overflow-hidden border cursor-pointer"
      style={{
        background: hovered ? '#f7f3ff' : C.card,
        borderColor: hovered ? `${C.purple}45` : C.border,
        boxShadow: hovered
          ? '0 8px 24px rgba(139,74,255,0.12)'
          : '0 4px 18px rgba(139,74,255,0.05)',
        transition: 'all 0.2s',
      }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-14 h-14 rounded-2xl overflow-hidden bg-[#f8f7ff] border shrink-0"
            style={{ borderColor: C.border }}
          >
            {pet?.photoUrl
              ? <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-xl">🐱</div>
            }
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-black truncate" style={{ color: C.text }}>
              {pet?.name}
            </p>
            <p className="text-[10px] font-bold truncate" style={{ color: C.textSoft }}>
              {pet?.breed || 'SRD'}
            </p>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: `${C.xpg}16`, color: C.xpg }}
              >
                XPG <AnimatedCount value={petXp} />
              </span>
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(223,255,64,0.25)', color: '#738d1d' }}
              >
                Nível {petLevel}
              </span>
            </div>
          </div>

          <ChevronRight
            size={14}
            style={{ color: hovered ? C.purple : C.textMute, transition: 'color 0.2s' }}
            className="shrink-0"
          />
        </div>

        {/* Barra de XPG individual */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: C.xpg }}>
              Evolução do gato
            </span>
            <span className="text-[9px] font-black" style={{ color: C.textSoft }}>
              {xpgPct}%
            </span>
          </div>
          <ProgressBar pct={xpgPct} color={C.xpg} height={6} glow />
          <p className="text-[9px] font-bold mt-1" style={{ color: C.textMute }}>
            Faltam {xpgPerLevel - xpgInLevel} XPG para nível {petLevel + 1}
          </p>
        </div>
      </div>
    </motion.div>
  );
}


// ─── Carrossel de níveis N1…N20 ────────────────────────────────────────────
function LevelCarousel({ levels, currentLevel, xp }) {
  const [activeIdx, setActiveIdx] = useState(() =>
    Math.max(0, levels.findIndex(l => l.rank === currentLevel.rank))
  );
  const containerRef = React.useRef(null);

  // Auto-foca no nível atual na montagem
  useEffect(() => {
    const idx = levels.findIndex(l => l.rank === currentLevel.rank);
    if (idx >= 0) setActiveIdx(idx);
  }, [currentLevel.rank]);

  const item    = levels[activeIdx] || levels[0];
  const visual  = LEVEL_VISUALS[item.rank] || {};
  const isActive = item.rank === currentLevel.rank;
  const unlocked = xp >= item.min;
  const nextMin  = levels[activeIdx + 1]?.min || item.min + 999;
  const pct      = isActive
    ? Math.min(100, Math.round(((xp - item.min) / (nextMin - item.min)) * 100))
    : unlocked ? 100 : 0;

  return (
    <div className="rounded-[32px] overflow-hidden border"
      style={{ borderColor: `${item.color || C.purple}30`, boxShadow: '0 8px 26px rgba(139,74,255,0.10)' }}>

      {/* ── Slide principal ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIdx}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.28, ease: [0.4,0,0.2,1] }}
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${item.color || C.purple} 0%, ${item.color || C.purple}BB 100%)`,
            minHeight: 200,
          }}
        >
          {/* Banner art */}
          {visual.banner && (
            <img src={visual.banner} alt={item.name}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ opacity: unlocked ? 0.18 : 0.06 }} />
          )}
          <div className="absolute inset-0 bg-white/5" />

          {/* Conteúdo */}
          <div className="relative z-10 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[8px] font-black uppercase tracking-[3px] text-white/60">
                    Nível
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>
                    N{item.rank}
                  </span>
                  {isActive && (
                    <span className="text-[8px] font-black px-2 py-0.5 rounded-full"
                      style={{ background: C.accent, color: '#1a1a00' }}>
                      Atual
                    </span>
                  )}
                  {unlocked && !isActive && (
                    <CheckCircle2 size={12} className="text-white/70" />
                  )}
                  {!unlocked && (
                    <Lock size={11} className="text-white/50" />
                  )}
                </div>
                <h2 className="text-[26px] font-black text-white leading-none mb-1">
                  {item.emoji} {item.name}
                </h2>
                <p className="text-white/70 text-[11px] font-bold">{visual.subtitle}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[8px] text-white/50 font-black uppercase tracking-wider">min XPT</p>
                <p className="text-xl font-black text-white mt-0.5">
                  {item.min.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Barra de progresso deste nível */}
            <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: [0.34,1.56,0.64,1] }}
                className="h-full rounded-full bg-white"
                style={{ boxShadow: '0 0 8px rgba(255,255,255,0.6)' }}
              />
            </div>
            <p className="text-[9px] text-white/60 font-bold">{pct}% concluído</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── Pills N1…N20 ── */}
      <div className="px-4 py-3 overflow-x-auto flex gap-1.5 no-scrollbar"
        style={{ background: 'rgba(0,0,0,0.04)' }}>
        {levels.map((l, i) => {
          const isCurr = l.rank === currentLevel.rank;
          const isUnlk = xp >= l.min;
          const isSel  = i === activeIdx;
          return (
            <motion.button
              key={l.rank}
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveIdx(i)}
              className="shrink-0 rounded-full text-[8px] font-black transition-all"
              style={{
                padding: '4px 8px',
                background: isSel
                  ? (l.color || C.purple)
                  : isUnlk ? `${l.color || C.purple}20` : 'rgba(0,0,0,0.05)',
                color: isSel ? '#fff' : isUnlk ? (l.color || C.purple) : C.textMute,
                border: isCurr && !isSel ? `1.5px solid ${l.color || C.purple}` : '1.5px solid transparent',
                opacity: isUnlk || isSel ? 1 : 0.4,
              }}
            >
              N{l.rank}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Card de nível na linha dos 20 ─────────────────────────────────────────
function LevelRow({ item, unlocked, active, xp }) {
  const [hovered, setHovered] = useState(false);
  const visual  = LEVEL_VISUALS[item.rank] || {};
  // progresso dentro deste nível
  const nextMin = item.nextMin || item.min + 100;
  const rowPct  = active
    ? Math.min(100, Math.round(((xp - item.min) / (nextMin - item.min)) * 100))
    : unlocked ? 100 : 0;

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={unlocked ? { scale: 1.01, x: 2 } : {}}
      className="rounded-[22px] overflow-hidden border"
      style={{
        background: active
          ? `linear-gradient(135deg, ${item.color}22 0%, ${item.color}0a 100%)`
          : unlocked
            ? hovered ? `${item.color}10` : '#ffffff'
            : '#fafafa',
        borderColor: active
          ? `${item.color}55`
          : hovered && unlocked ? `${item.color}45` : C.border,
        opacity: unlocked ? 1 : 0.42,
        boxShadow: active
          ? `0 4px 20px ${item.color}22`
          : hovered && unlocked ? `0 4px 16px ${item.color}15` : 'none',
        transition: 'all 0.2s',
      }}
    >
      <div className="relative p-4">
        {/* Overlay de cor do nível no background */}
        {unlocked && (
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${item.color}14 0%, transparent 60%)`,
            }} />
        )}
        {visual.banner && (
          <img
            src={visual.banner}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: active ? 0.10 : unlocked ? 0.05 : 0.03 }}
          />
        )}

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0"
                style={{
                  background: active ? `${item.color}18` : '#f3f4f6',
                  border: `1px solid ${active ? `${item.color}45` : C.border}`,
                }}
              >
                {item.emoji}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black truncate" style={{ color: active ? C.text : C.textSoft }}>
                  N{item.rank} · {item.name}
                </p>
                <p className="text-[10px] font-bold truncate" style={{ color: C.textMute }}>
                  {visual.subtitle}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="text-[10px] font-black" style={{ color: active ? C.purple : C.textSoft }}>
                {item.min.toLocaleString('pt-BR')} XPT
              </p>
              {active && (
                <p className="text-[9px] font-black mt-0.5" style={{ color: C.purple }}>
                  nível atual
                </p>
              )}
              {unlocked && !active && (
                <CheckCircle2 size={12} style={{ color: C.xpg, marginLeft: 'auto' }} />
              )}
            </div>
          </div>

          {/* Barra de progresso por linha de nível */}
          {(active || unlocked) && (
            <ProgressBar pct={rowPct} color={item.color || C.purple} height={4} delay={0.1} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Seção de eventos recentes (RewardEvent timeline) ─────────────────────
function RewardTimeline({ events = [] }) {
  const iconMap = {
    IGENT_CONSULT: Brain,
    VACCINE_REGISTERED: Syringe,
    STUDIO_IMAGE: Camera,
    STUDIO_VIDEO: Camera,
    COMMUNITY_POST: MessageCircle,
    DAILY_LOGIN: Zap,
    WEIGHT_LOG: TrendingUp,
    CAT_REGISTERED: PawPrint,
    FOUNDER_UNLOCK: Crown,
  };

  if (!events.length) return null;

  return (
    <div
      className="rounded-[28px] p-5 border"
      style={{
        background: C.card,
        borderColor: C.border,
        boxShadow: '0 4px 18px rgba(139,74,255,0.05)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Clock size={14} color={C.purple} />
        <h2 className="text-[10px] font-black uppercase tracking-[3px]" style={{ color: C.purple }}>
          Últimas recompensas
        </h2>
      </div>

      <div className="space-y-2">
        {events.slice(0, 6).map((ev, i) => {
          const Icon = iconMap[ev.action] || Sparkles;
          return (
            <motion.div
              key={ev.id || i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-[18px]"
              style={{ background: '#faf9ff', border: `1px solid ${C.border}` }}
            >
              <div
                className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: `${C.purple}14` }}
              >
                <Icon size={13} style={{ color: C.purple }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black truncate" style={{ color: C.text }}>
                  {ev.action?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </p>
                {ev.catId && (
                  <p className="text-[9px]" style={{ color: C.textMute }}>
                    Gato vinculado
                  </p>
                )}
              </div>

              {/* Deltas com terminologia oficial */}
              <div className="flex gap-1.5 shrink-0">
                {ev.xptDelta > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: `${C.xpt}14`, color: C.xpt }}>
                    +{ev.xptDelta} XPT
                  </span>
                )}
                {ev.xpgDelta > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: `${C.xpg}14`, color: C.xpg }}>
                    +{ev.xpgDelta} XPG
                  </span>
                )}
                {ev.gptsDelta !== 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                    style={{
                      background: `${C.gpts}14`,
                      color: ev.gptsDelta > 0 ? C.gpts : '#ef4444',
                    }}>
                    {ev.gptsDelta > 0 ? '+' : ''}{ev.gptsDelta} GPTS
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ───────────────────────────────────────────────────
export default function JornadaGatedo() {
  const navigate  = useNavigate();
  const tick      = useTick();
  const { xp, points, badges, streak, level, cats, stats: ctxStats } = useGamification();

  // points aqui = GPTS (moeda transacional, Manual §2.1)
  const gpts = points;

  // stats do contexto (mesma fonte do GamificationDrawer) + fallback do fetch
  const [stats, setStats]     = useState(ctxStats || {});
  const [pets, setPets]       = useState(cats || []);
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);

  const nextLevel = useMemo(() => {
    const idx = LEVELS.findIndex((l, i) =>
      xp >= l.min && (i === LEVELS.length - 1 || xp < LEVELS[i + 1].min)
    );
    return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  }, [xp]);

  const progressPct = nextLevel
    ? Math.min(100, Math.round(((xp - level.min) / (nextLevel.min - level.min)) * 100))
    : 100;

  const levelVisual = LEVEL_VISUALS[level.rank] || LEVEL_VISUALS[1];

  const unlockedIds = useMemo(
    () => ACHIEVEMENTS.filter((a) => a.condition(stats || {}, badges || [])).map((a) => a.id),
    [stats, badges]
  );

  const groupedAchievements = useMemo(() => {
    const g = {};
    ACHIEVEMENTS.forEach((a) => {
      if (!g[a.category]) g[a.category] = [];
      g[a.category].push(a);
    });
    return g;
  }, []);

  // Contexto como fonte primária; /pets como fallback se contexto ainda não hidratou
  useEffect(() => {
    if (Array.isArray(cats) && cats.length > 0) setPets(cats);
  }, [cats]);

  // Sync stats do contexto → state local (igual ao GamificationDrawer)
  useEffect(() => {
    if (ctxStats && Object.keys(ctxStats).length > 0) setStats(ctxStats);
  }, [ctxStats]);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      api.get('/gamification/me').catch(() => ({ data: {} })),
      api.get('/gamification/events').catch(() => ({ data: [] })),
      api.get('/pets').catch(() => ({ data: [] })),          // fallback garantido
    ]).then(([gRes, eRes, pRes]) => {
      if (!mounted) return;
      // Só usa o fetch se o contexto ainda não forneceu stats
      const fetchedStats = gRes.data?.stats || {};
      setStats((prev) =>
        Object.keys(prev).length > 0 ? prev : fetchedStats
      );
      setEvents(Array.isArray(eRes.data) ? eRes.data : []);

      // Só usa o fetch se o contexto ainda não forneceu gatos
      const fetched = Array.isArray(pRes.data) ? pRes.data : [];
      setPets((prev) => (prev.length > 0 ? prev : fetched));

      setLoading(false);
    });

    return () => { mounted = false; };
  }, []);

  // Enriquecer LEVELS com nextMin para barras de progresso
  const levelsEnriched = useMemo(() =>
    LEVELS.map((l, i) => ({
      ...l,
      nextMin: i < LEVELS.length - 1 ? LEVELS[i + 1].min : l.min + 999,
    })), []
  );

  return (
    <div className="min-h-screen pb-[140px] px-5 pt-6" style={{ background: C.bg }}>
      <div className="max-w-[900px] mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { tick(); navigate(-1); }}
            className="w-10 h-10 rounded-full border flex items-center justify-center"
            style={{ background: '#ffffff', borderColor: C.border, color: C.text }}
          >
            <ArrowLeft size={18} />
          </motion.button>

          <div
            className="px-4 py-2 rounded-full border text-sm font-black"
            style={{ background: '#ffffff', borderColor: C.border, color: C.text, boxShadow: '0 4px 18px rgba(139,74,255,0.05)' }}
          >
            Jornada <span style={{ color: C.purple }}>Gatedo</span>
          </div>

          {/* GPTS no header — moeda transacional */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border text-[10px] font-black"
            style={{ background: `${C.gpts}12`, borderColor: `${C.gpts}35`, color: C.gpts }}
          >
            <Coins size={12} />
            <AnimatedCount value={gpts} /> GPTS
          </motion.div>
        </div>

        {/* ── Hero: carrossel N1…N20 ── */}
        <LevelCarousel levels={levelsEnriched} currentLevel={level} xp={xp} />

        {/* ── Cards GPTS / XPT / XPG total / Badges ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ResourceCard
            label="GPTS"
            value={gpts}
            subtitle="Moeda transacional"
            color={C.gpts}
            icon={Coins}
          />
          <ResourceCard
            label="XPT"
            value={xp}
            subtitle="Experiência do tutor"
            color={C.xpt}
            icon={Zap}
            pulse
          />
          <ResourceCard
            label="Streak"
            value={streak}
            subtitle={streak === 1 ? 'dia ativo' : 'dias ativos'}
            color="#F59E0B"
            icon={Flame}
          />
          <ResourceCard
            label="Conquistas"
            value={unlockedIds.length}
            subtitle="Badges desbloqueadas"
            color="#10B981"
            icon={Trophy}
          />
        </div>

        {/* ── Timeline de recompensas recentes ── */}
        {events.length > 0 && <RewardTimeline events={events} />}

        {/* ── Linha dos 20 níveis com barras individuais ── */}
        <div
          className="rounded-[28px] p-5 border"
          style={{ background: C.card, borderColor: C.border, boxShadow: '0 4px 18px rgba(139,74,255,0.05)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <MapIcon size={14} color={C.purple} />
            <h2 className="text-[10px] font-black uppercase tracking-[3px]" style={{ color: C.purple }}>
              Linha dos 20 níveis
            </h2>
          </div>

          <div className="space-y-2.5">
            {levelsEnriched.map((item) => (
              <LevelRow
                key={item.rank}
                item={item}
                unlocked={xp >= item.min}
                active={item.rank === level.rank}
                xp={xp}
              />
            ))}
          </div>
        </div>

        {/* ── Conquistas do tutor (XPT + XPG por item) ── */}
        <div
          className="rounded-[28px] p-5 border"
          style={{ background: C.card, borderColor: C.border, boxShadow: '0 4px 18px rgba(139,74,255,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={14} color={C.purple} />
              <h2 className="text-[10px] font-black uppercase tracking-[3px]" style={{ color: C.purple }}>
                Conquistas do tutor
              </h2>
            </div>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${C.purple}14`, color: C.purple }}>
              {unlockedIds.length}/{ACHIEVEMENTS.length}
            </span>
          </div>

          <div className="space-y-5">
            {Object.entries(groupedAchievements).map(([category, items]) => (
              <div key={category}>
                <p className="text-[10px] font-black uppercase tracking-[2px] mb-2.5" style={{ color: C.textSoft }}>
                  {category}
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {items.map((item) => (
                    <AchievementItem
                      key={item.id}
                      achievement={item}
                      unlocked={unlockedIds.includes(item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Jornada de cada gato (XPG individual, Manual §2.3) ── */}
        <div
          className="rounded-[28px] p-5 border"
          style={{ background: C.card, borderColor: C.border, boxShadow: '0 4px 18px rgba(139,74,255,0.05)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Heart size={14} color={C.xpg} />
            <h2 className="text-[10px] font-black uppercase tracking-[3px]" style={{ color: C.xpg }}>
              Jornada de cada gato · XPG
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-[20px] bg-[#f8f7ff] animate-pulse" />
              ))}
            </div>
          ) : Array.isArray(pets) && pets.length > 0 ? (
            <div className="space-y-3">
              {pets.map((pet) => (
                <PetJourneyCard
                  key={pet.id}
                  pet={pet}
                  onClick={() => navigate(`/gato/${pet.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] p-4 border bg-[#faf9ff]" style={{ borderColor: C.border }}>
              <p className="text-sm font-black" style={{ color: C.text }}>Nenhum gato cadastrado ainda</p>
              <p className="text-[10px] font-bold mt-1" style={{ color: C.textSoft }}>
                Quando você cadastrar seus gatos, a evolução de XPG individual aparece aqui.
              </p>
            </div>
          )}
        </div>

        {/* ── Próximos objetivos ── */}
        <div
          className="rounded-[28px] p-5 border"
          style={{ background: '#fbfff0', borderColor: '#e4efb5', boxShadow: '0 4px 18px rgba(180,216,47,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Flame size={14} color="#738d1d" />
            <h2 className="text-[10px] font-black uppercase tracking-[3px]" style={{ color: '#738d1d' }}>
              Próximos objetivos
            </h2>
          </div>

          <div className="space-y-2.5">
            {nextLevel && (
              <motion.div
                whileHover={{ scale: 1.01, x: 2 }}
                className="rounded-[20px] p-4 border bg-white"
                style={{ borderColor: '#e4efb5' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black" style={{ color: C.text }}>
                      Subir para {nextLevel.name}
                    </p>
                    <p className="text-[10px] font-bold mt-1" style={{ color: C.textSoft }}>
                      Faltam {(nextLevel.min - xp).toLocaleString('pt-BR')} XPT
                    </p>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${C.xpt}14`, color: C.xpt }}>
                    XPT
                  </span>
                </div>
                <div className="mt-3">
                  <ProgressBar pct={progressPct} color={C.purple} height={5} delay={0.2} glow />
                </div>
              </motion.div>
            )}

            {[
              {
                title: 'Continuar usando o iGentVet',
                desc: `Cada consulta gera +${RewardMatrix.IGENT_CONSULT.xpt} XPT e +${RewardMatrix.IGENT_CONSULT.xpg} XPG para o gato.`,
                tag: `−${Math.abs(RewardMatrix.IGENT_CONSULT.gpts)} GPTS`,
                tagColor: C.gpts,
              },
              {
                title: 'Registrar vacinas',
                desc: `Vacinas geram +${RewardMatrix.VACCINE_REGISTERED.xpt} XPT e +${RewardMatrix.VACCINE_REGISTERED.xpg} XPG.`,
                tag: 'Saúde preventiva',
                tagColor: '#10b981',
              },
              {
                title: 'Manter login diário',
                desc: `Cada dia ativo gera +${RewardMatrix.DAILY_LOGIN.gpts} GPTS e +${RewardMatrix.DAILY_LOGIN.xpt} XPT.`,
                tag: 'Streak',
                tagColor: '#f59e0b',
              },
            ].map((obj, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.01, x: 2 }}
                className="rounded-[20px] p-4 border bg-white"
                style={{ borderColor: '#e4efb5' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black" style={{ color: C.text }}>{obj.title}</p>
                    <p className="text-[10px] font-bold mt-1" style={{ color: C.textSoft }}>{obj.desc}</p>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0"
                    style={{ background: `${obj.tagColor}14`, color: obj.tagColor }}>
                    {obj.tag}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}