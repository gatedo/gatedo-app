import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trophy,
  Star,
  Zap,
  Brain,
  Heart,
  Syringe,
  Camera,
  MessageCircle,
  PawPrint,
  ChevronRight,
  Lock,
  CheckCircle,
  Sparkles,
  Crown,
  Flame,
  Map,
  Activity,
  ShieldCheck,
  Clock3,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  useGamification,
  LEVELS,
  CAT_LEVELS,
  getCatLevel,
  getCatLevelProgress,
} from '../context/GamificationContext';
import api from '../services/api';

const getLevel = (xpt) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xpt >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
};

const getNextLevel = (xpt) => {
  const idx = LEVELS.findIndex((l, i) =>
    xpt >= l.min && (i === LEVELS.length - 1 || xpt < LEVELS[i + 1].min)
  );
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
};

const LEVEL_VISUALS = {
  1: { banner: '/assets/gamification/levels/n1.webp', subtitle: 'O início da vida gateira' },
  2: { banner: '/assets/gamification/levels/n2.webp', subtitle: 'Primeiros sinais de atenção real' },
  3: { banner: '/assets/gamification/levels/n3.webp', subtitle: 'Agora você já é da casa' },
  4: { banner: '/assets/gamification/levels/n4.webp', subtitle: 'Seu olhar está mais apurado' },
  5: { banner: '/assets/gamification/levels/n5.webp', subtitle: 'Proteção, rotina e presença' },
  6: { banner: '/assets/gamification/levels/n6.webp', subtitle: 'Você cuida com mais consciência' },
  7: { banner: '/assets/gamification/levels/n7.webp', subtitle: 'Seu vínculo evoluiu' },
  8: { banner: '/assets/gamification/levels/n8.webp', subtitle: 'Explorando o universo Gatedo' },
  9: { banner: '/assets/gamification/levels/n9.webp', subtitle: 'Leitura mais refinada do comportamento felino' },
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

const ACHIEVEMENTS = [
  {
    id: 'first_consult',
    category: 'Saúde',
    icon: Brain,
    color: '#8B4AFF',
    bg: '#F4F3FF',
    title: 'Primeira Consulta',
    desc: 'Realizou a primeira análise no iGentVet',
    xpReward: 30,
    condition: (s) => (s.consultCount || 0) >= 1,
    secret: false,
  },
  {
    id: 'five_consults',
    category: 'Saúde',
    icon: Brain,
    color: '#8B4AFF',
    bg: '#F4F3FF',
    title: 'Tutor Atento',
    desc: '5 consultas realizadas no iGentVet',
    xpReward: 50,
    condition: (s) => (s.consultCount || 0) >= 5,
    secret: false,
  },
  {
    id: 'vaccines_ok',
    category: 'Saúde',
    icon: Syringe,
    color: '#EC4899',
    bg: '#FDF2F8',
    title: 'Imunizado',
    desc: 'Registrou 3 ou mais vacinas',
    xpReward: 25,
    condition: (s) => (s.vaccinesRegistered || 0) >= 3,
    secret: false,
  },
  {
    id: 'profile_complete',
    category: 'Perfil',
    icon: PawPrint,
    color: '#0EA5E9',
    bg: '#F0F9FF',
    title: 'Identidade Completa',
    desc: 'Preencheu o perfil do gato com os dados essenciais',
    xpReward: 25,
    condition: (s) => !!s.profileComplete || (s.petCount || 0) >= 1,
    secret: false,
  },
  {
    id: 'multi_cats',
    category: 'Perfil',
    icon: PawPrint,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    title: 'Gateiro de Verdade',
    desc: 'Cadastrou 3 ou mais gatos',
    xpReward: 30,
    condition: (s) => (s.petCount || 0) >= 3,
    secret: false,
  },
  {
    id: 'first_post',
    category: 'Comunidade',
    icon: MessageCircle,
    color: '#0EA5E9',
    bg: '#F0F9FF',
    title: 'Voz da Comunidade',
    desc: 'Publicou o primeiro post no Comunigato',
    xpReward: 15,
    condition: (s) => (s.postCount || 0) >= 1,
    secret: false,
  },
  {
    id: 'photo_master',
    category: 'Studio',
    icon: Camera,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    title: 'Fotógrafo Felino',
    desc: 'Criou 3 conteúdos no Studio',
    xpReward: 20,
    condition: (s) => (s.studioCount || 0) >= 3,
    secret: false,
  },
  {
    id: 'night_owl',
    category: 'Segredo',
    icon: Star,
    color: '#F59E0B',
    bg: '#FFFBEB',
    title: '🌙 Coruja Noturna',
    desc: 'Explorou o app em horários improváveis',
    xpReward: 35,
    condition: (s) => !!s.nightConsult,
    secret: true,
  },
  {
    id: 'founder_badge',
    category: 'Segredo',
    icon: Crown,
    color: '#DFFF40',
    bg: '#F7FEE7',
    title: '👑 Fundador',
    desc: 'Membro fundador do Gatedo',
    xpReward: 100,
    condition: (s, badges) =>
      Array.isArray(badges) &&
      badges.some((b) => {
        const val = String(b).toLowerCase();
        return val.includes('fundador') || val.includes('founding') || val.includes('founder');
      }),
    secret: true,
  },
];

const EVENT_META = {
  IGENT_CONSULT: {
    title: 'Consulta iGentVet',
    icon: Brain,
    color: '#8B4AFF',
    bg: '#F4F3FF',
  },
  VACCINE_REGISTERED: {
    title: 'Vacina registrada',
    icon: Syringe,
    color: '#EC4899',
    bg: '#FDF2F8',
  },
  WEIGHT_LOG: {
    title: 'Peso registrado',
    icon: Activity,
    color: '#10B981',
    bg: '#F0FDF4',
  },
  STUDIO_IMAGE: {
    title: 'Criação de imagem',
    icon: Camera,
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  STUDIO_VIDEO: {
    title: 'Criação de vídeo',
    icon: Camera,
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  COMMUNITY_POST: {
    title: 'Post publicado',
    icon: MessageCircle,
    color: '#0EA5E9',
    bg: '#F0F9FF',
  },
  FOUNDER_UNLOCK: {
    title: 'Status fundador',
    icon: Crown,
    color: '#738d1d',
    bg: '#F7FEE7',
  },
};

function timeAgo(iso) {
  if (!iso) return 'agora';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Agora';
  if (m < 60) return `${m}min`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

function AchievementCard({ achievement, unlocked }) {
  const Icon = achievement.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-[22px] p-4 border transition-all"
      style={{
        background: unlocked ? achievement.bg : '#F9FAFB',
        borderColor: unlocked ? `${achievement.color}30` : '#F3F4F6',
        opacity: unlocked ? 1 : 0.62,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: unlocked ? `${achievement.color}18` : '#E5E7EB' }}
        >
          {unlocked ? (
            <Icon size={20} style={{ color: achievement.color }} />
          ) : (
            <Lock size={16} className="text-gray-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-black leading-tight ${unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                {achievement.secret && !unlocked ? '???' : achievement.title}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                {achievement.secret && !unlocked
                  ? 'Conquista secreta — continue explorando'
                  : achievement.desc}
              </p>
            </div>
            <div className="flex flex-col items-end flex-shrink-0">
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{
                  background: unlocked ? `${achievement.color}15` : '#F3F4F6',
                  color: unlocked ? achievement.color : '#9CA3AF',
                }}
              >
                +{achievement.xpReward} XPT
              </span>
              {unlocked && (
                <CheckCircle size={12} style={{ color: achievement.color }} className="mt-1" />
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, subtitle, accent = '#8B4AFF', bg = '#F5F3FF', icon: Icon = null }) {
  return (
    <div className="px-4 py-4 rounded-[22px] border" style={{ background: bg, borderColor: `${accent}18` }}>
      <div className="flex items-center gap-2 mb-1">
        {Icon ? <Icon size={12} style={{ color: accent }} /> : null}
        <p className="text-[9px] font-black uppercase tracking-[2px]" style={{ color: accent }}>
          {title}
        </p>
      </div>
      <p className="text-[14px] font-black mt-1 text-gray-800">{value}</p>
      <p className="text-[10px] mt-1 font-bold text-gray-400">{subtitle}</p>
    </div>
  );
}

function PetJourneyCard({ pet }) {
  const levelMeta = pet?.levelMeta || getCatLevel(Number(pet?.xpg || 0));
  const progress = typeof pet?.progress === 'number'
    ? pet.progress
    : getCatLevelProgress(Number(pet?.xpg || 0));
  const nextLevel = pet?.nextLevel || CAT_LEVELS.find((l) => l.rank === levelMeta.rank + 1) || null;

  return (
    <div
      className="rounded-[24px] overflow-hidden border"
      style={{
        background: '#fff',
        borderColor: '#E9D5FF',
        boxShadow: '0 4px 18px rgba(139,74,255,0.05)',
      }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[#f8f7ff] border shrink-0" style={{ borderColor: '#E9D5FF' }}>
            {pet?.photoUrl ? (
              <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🐱</div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-black truncate text-gray-800">{pet?.name}</p>
            <p className="text-[10px] font-bold truncate text-gray-400">{pet?.breed || 'Jornada individual'}</p>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(139,74,255,0.14)', color: '#8B4AFF' }}
              >
                XPG {Number(pet?.xpg || 0).toLocaleString('pt-BR')}
              </span>

              <span
                className="text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(223,255,64,0.25)', color: '#738d1d' }}
              >
                Nível {pet?.level || levelMeta.rank}
              </span>
            </div>
          </div>

          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: `${levelMeta.color}14`,
              border: `1.5px solid ${levelMeta.color}30`,
              color: levelMeta.color,
            }}
          >
            {levelMeta.emoji}
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-[10px] font-black text-gray-500">
              {levelMeta.name}
            </p>
            <p className="text-[9px] font-black text-gray-400">{progress}%</p>
          </div>

          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(4, progress)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${levelMeta.color}80, ${levelMeta.color})` }}
            />
          </div>

          {nextLevel ? (
            <p className="text-[9px] text-gray-400 font-bold mt-1.5">
              Faltam {(nextLevel.min - Number(pet?.xpg || 0)).toLocaleString('pt-BR')} XPG para {nextLevel.name}
            </p>
          ) : (
            <p className="text-[9px] text-emerald-600 font-bold mt-1.5">Nível máximo do gato atingido.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, petMap }) {
  const meta = EVENT_META[event?.action] || {
    title: event?.action || 'Evento',
    icon: Trophy,
    color: '#8B4AFF',
    bg: '#F4F3FF',
  };

  const Icon = meta.icon;
  const pet = event?.petId ? petMap?.[event.petId] : null;

  return (
    <div
      className="rounded-[20px] border p-3.5"
      style={{ background: '#fff', borderColor: `${meta.color}18` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: meta.bg }}
        >
          <Icon size={16} style={{ color: meta.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-black text-gray-800 leading-tight">{meta.title}</p>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                {pet ? `🐾 ${pet.name} · ` : ''}{timeAgo(event?.createdAt)}
              </p>
            </div>

            {event?.badgeGranted ? (
              <span
                className="text-[8px] font-black px-2 py-0.5 rounded-full"
                style={{ background: `${meta.color}14`, color: meta.color }}
              >
                Badge
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {Number(event?.xptDelta || 0) > 0 && (
              <span className="text-[9px] font-black px-2 py-1 rounded-full bg-[#F7FEE7] text-[#738d1d]">
                +{event.xptDelta} XPT
              </span>
            )}

            {Number(event?.gptsDelta || 0) !== 0 && (
              <span className="text-[9px] font-black px-2 py-1 rounded-full bg-[#F5F3FF] text-[#8B4AFF]">
                {event.gptsDelta > 0 ? '+' : ''}{event.gptsDelta} GPTS
              </span>
            )}

            {Number(event?.xpgDelta || 0) > 0 && (
              <span className="text-[9px] font-black px-2 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB]">
                +{event.xpgDelta} XPG
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GamificationDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const {
    tutor,
    cats,
    petMap,
    recentEvents,
    badges,
    streak,
    stats,
    xpt,
    gpts,
    refreshGamification,
  } = useGamification();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    setLoading(true);
    Promise.resolve(refreshGamification?.())
      .finally(() => setLoading(false));
  }, [isOpen, user?.id, refreshGamification]);

  const level = tutor?.levelMeta || getLevel(xpt);
  const nextLevel = tutor?.nextLevel || getNextLevel(xpt);
  const progressPct = typeof tutor?.progress === 'number'
    ? tutor.progress
    : nextLevel
      ? Math.min(100, Math.round(((xpt - level.min) / (nextLevel.min - level.min)) * 100))
      : 100;

  const levelVisual = LEVEL_VISUALS[level.rank] || LEVEL_VISUALS[1];

  const unlockedIds = useMemo(() => {
    return ACHIEVEMENTS
      .filter((a) => a.condition(stats || {}, badges || []))
      .map((a) => a.id);
  }, [stats, badges]);

  const highlighted = ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id)).slice(0, 4);
  const unlockedCount = unlockedIds.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-[800px] mx-auto rounded-t-[34px] bg-white overflow-hidden"
            style={{ maxHeight: '92vh' }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex items-center justify-between px-5 pt-2 pb-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[2px] text-gray-400">Seu progresso</p>
                <p className="text-sm font-black text-gray-800">Gamificação Gatedo</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onClose?.();
                    navigate('/jornada-gatedo');
                  }}
                  className="px-3 py-2 rounded-full text-[10px] font-black border flex items-center gap-1.5"
                  style={{ borderColor: '#E9D5FF', color: '#8B4AFF', background: '#F5F3FF' }}
                >
                  <Map size={12} />
                  Sobre a Jornada
                </button>

                <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            </div>

            <div
              className="mx-4 mt-1 mb-4 rounded-[28px] p-5 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${level.color} 0%, ${level.color}CC 100%)`,
                minHeight: 190,
              }}
            >
              {levelVisual?.banner && (
                <img
                  src={levelVisual.banner}
                  alt={level.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-[0.16]"
                />
              )}

              <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-20 bg-white" />
              <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full opacity-10 bg-white" />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[9px] font-black text-white/65 uppercase tracking-[3px] mb-1">
                      Nível do tutor
                    </p>
                    <p className="text-[26px] font-black text-white leading-none mb-1">
                      {level.emoji} {level.name}
                    </p>
                    <p className="text-white/80 text-xs font-bold">
                      {Number(xpt || 0).toLocaleString('pt-BR')} XPT acumulado
                    </p>
                    <p className="text-white/70 text-[10px] font-bold mt-1">
                      {levelVisual?.subtitle}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-black text-white/65 uppercase tracking-[2px] mb-1">
                      Conquistas
                    </p>
                    <p className="text-2xl font-black text-white">{unlockedCount}</p>
                    <p className="text-[9px] text-white/60 font-bold">desbloqueadas</p>
                  </div>
                </div>

                {nextLevel ? (
                  <>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-[9px] font-bold text-white/70">
                        Próximo: {nextLevel.emoji} {nextLevel.name}
                      </p>
                      <p className="text-[9px] font-black text-white">{progressPct}%</p>
                    </div>

                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPct}%` }}
                        transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                        className="h-full bg-white rounded-full"
                      />
                    </div>

                    <p className="text-[9px] text-white/60 font-bold mt-1.5">
                      Faltam {(nextLevel.min - Number(xpt || 0)).toLocaleString('pt-BR')} XPT para {nextLevel.name}
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <Sparkles size={12} className="text-white" />
                    <p className="text-xs font-black text-white">Nível máximo atingido!</p>
                  </div>
                )}
              </div>
            </div>

            <div
              className="overflow-y-auto px-4 pb-[140px]"
              style={{
                maxHeight: 'calc(92vh - 285px)',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard
                  title="XPT"
                  value={Number(xpt || 0).toLocaleString('pt-BR')}
                  subtitle="Experiência do tutor"
                  accent="#8B4AFF"
                  bg="#F5F3FF"
                  icon={Zap}
                />
                <StatCard
                  title="GPTS"
                  value={Number(gpts || 0).toLocaleString('pt-BR')}
                  subtitle="Moeda do ecossistema"
                  accent="#8B4AFF"
                  bg="#F8F7FF"
                  icon={Trophy}
                />
                <StatCard
                  title="Streak"
                  value={`${streak} dias`}
                  subtitle="Sequência atual"
                  accent="#F59E0B"
                  bg="#FFFBEB"
                  icon={Flame}
                />
                <StatCard
                  title="Badges"
                  value={`${unlockedCount}`}
                  subtitle="Conquistas desbloqueadas"
                  accent="#10B981"
                  bg="#F0FDF4"
                  icon={ShieldCheck}
                />
              </div>

              <div className="rounded-[24px] p-4 bg-gray-50 border border-gray-100 mb-4">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px] mb-3">
                  Economia Gatedo
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Consulta iGentVet', val: '-20 GPTS · +10 XPT · +8 XPG', icon: '🤖' },
                    { label: 'Vacina registrada', val: '+4 XPT · +12 XPG', icon: '💉' },
                    { label: 'Studio imagem', val: '-15 GPTS · +12 XPT · +6 XPG', icon: '🎨' },
                    { label: 'Post na comunidade', val: '+6 XPT · +6 XPG', icon: '💬' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2 px-3 py-2.5 bg-white rounded-2xl border border-gray-100">
                      <span className="text-sm">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-gray-700 truncate">{item.label}</p>
                        <p className="text-[9px] font-black text-[#8B4AFF] truncate">{item.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {cats?.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">
                      Jornada dos seus gatos
                    </p>
                    <span className="text-[10px] font-black text-gray-400">
                      {cats.length} perfil{cats.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {cats.map((pet) => (
                      <PetJourneyCard key={pet.id} pet={pet} />
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">
                    Eventos recentes
                  </p>
                  <button
                    onClick={() => {
                      onClose?.();
                      navigate('/jornada-gatedo');
                    }}
                    className="text-[10px] font-black"
                    style={{ color: '#8B4AFF' }}
                  >
                    ver tudo →
                  </button>
                </div>

                {Array.isArray(recentEvents) && recentEvents.length > 0 ? (
                  <div className="space-y-2.5">
                    {recentEvents.slice(0, 5).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        petMap={petMap}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[22px] p-4 border border-gray-100 bg-gray-50">
                    <p className="text-sm font-black text-gray-700">Sem eventos recentes</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">
                      As recompensas reais do tutor e dos gatos vão aparecer aqui.
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Destaques da jornada</p>
                  <button
                    onClick={() => {
                      onClose?.();
                      navigate('/jornada-gatedo');
                    }}
                    className="text-[10px] font-black"
                    style={{ color: '#8B4AFF' }}
                  >
                    ver tudo →
                  </button>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-gray-100 rounded-[20px] animate-pulse" />
                    ))}
                  </div>
                ) : highlighted.length > 0 ? (
                  <div className="space-y-2.5">
                    {highlighted.map((a) => (
                      <AchievementCard key={a.id} achievement={a} unlocked={true} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[22px] p-4 border border-gray-100 bg-gray-50">
                    <p className="text-sm font-black text-gray-700">Sua jornada começou agora</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">
                      As primeiras conquistas vão aparecer aqui conforme você cuida melhor.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  onClose?.();
                  navigate('/jornada-gatedo');
                }}
                className="w-full py-4 rounded-[20px] font-black text-sm flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg,#8B4AFF 0%,#682ADB 100%)',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(139,74,255,0.22)',
                }}
              >
                <Map size={15} />
                Abrir Jornada Gatedo
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}