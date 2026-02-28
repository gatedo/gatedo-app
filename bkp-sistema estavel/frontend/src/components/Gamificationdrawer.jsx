import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trophy, Star, Zap, Shield, Brain, Heart,
  Syringe, Camera, MessageCircle, PawPrint,
  ChevronRight, Lock, CheckCircle, Sparkles, Crown
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

// ─── NÍVEIS ───────────────────────────────────────────────────────────────────
const LEVELS = [
  { min: 0,    label: 'Gateiro Curioso',   emoji: '🐾', color: '#9CA3AF', bg: '#F9FAFB' },
  { min: 100,  label: 'Gateiro Raiz',      emoji: '😺', color: '#6158ca', bg: '#F4F3FF' },
  { min: 300,  label: 'Guardião Felino',   emoji: '🛡️', color: '#0EA5E9', bg: '#F0F9FF' },
  { min: 600,  label: 'Especialista IA',   emoji: '🤖', color: '#8B5CF6', bg: '#F5F3FF' },
  { min: 1000, label: 'Embaixador Gatedo', emoji: '👑', color: '#F59E0B', bg: '#FFFBEB' },
  { min: 2000, label: 'Lenda Felina',      emoji: '✨', color: '#EC4899', bg: '#FDF2F8' },
];

const getLevel = (pts) => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (pts >= LEVELS[i].min) return { ...LEVELS[i], index: i };
  }
  return { ...LEVELS[0], index: 0 };
};

const getNextLevel = (pts) => {
  const idx = LEVELS.findIndex((l, i) =>
    pts >= l.min && (i === LEVELS.length - 1 || pts < LEVELS[i + 1].min)
  );
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
};

// ─── CATÁLOGO DE CONQUISTAS ───────────────────────────────────────────────────
const ACHIEVEMENTS = [
  // SAÚDE
  {
    id: 'first_consult',    category: 'Saúde',
    icon: Brain,            color: '#6158ca',  bg: '#F4F3FF',
    title: 'Primeira Consulta',
    desc: 'Realizou a primeira análise no iGentVet',
    points: 30,             condition: (s) => s.igentConsults >= 1,
    secret: false,
  },
  {
    id: 'five_consults',    category: 'Saúde',
    icon: Brain,            color: '#6158ca',  bg: '#F4F3FF',
    title: 'Tutor Atento',
    desc: '5 consultas realizadas no iGentVet',
    points: 50,             condition: (s) => s.igentConsults >= 5,
    secret: false,
  },
  {
    id: 'vaccines_ok',      category: 'Saúde',
    icon: Syringe,          color: '#EC4899',  bg: '#FDF2F8',
    title: 'Imunizado',
    desc: 'Registrou 3 ou mais vacinas',
    points: 25,             condition: (s) => s.vaccinesRegistered >= 3,
    secret: false,
  },
  {
    id: 'no_overdue',       category: 'Saúde',
    icon: Shield,           color: '#16A34A',  bg: '#F0FDF4',
    title: 'Sem Atrasos',
    desc: 'Todas as vacinas em dia',
    points: 40,             condition: (s) => s.overdueVaccines === 0 && s.vaccinesRegistered > 0,
    secret: false,
  },
  {
    id: 'med_controlled',   category: 'Saúde',
    icon: Heart,            color: '#D97706',  bg: '#FFFBEB',
    title: 'Cuidado Total',
    desc: 'Registrou medicação controlada com lembrete',
    points: 20,             condition: (s) => s.controlledMeds >= 1,
    secret: false,
  },
  {
    id: 'health_streak',    category: 'Saúde',
    icon: Zap,              color: '#F59E0B',  bg: '#FFFBEB',
    title: 'Sequência Saudável',
    desc: '30 dias consecutivos com registros de saúde',
    points: 75,             condition: (s) => s.healthStreak >= 30,
    secret: false,
  },

  // PERFIL
  {
    id: 'profile_complete', category: 'Perfil',
    icon: PawPrint,         color: '#0EA5E9',  bg: '#F0F9FF',
    title: 'Identidade Completa',
    desc: 'Preencheu perfil completo do gato (foto, raça, peso, bio)',
    points: 25,             condition: (s) => s.profileComplete,
    secret: false,
  },
  {
    id: 'multi_cats',       category: 'Perfil',
    icon: PawPrint,         color: '#8B5CF6',  bg: '#F5F3FF',
    title: 'Gateiro de Verdade',
    desc: 'Cadastrou 3 ou mais gatos',
    points: 30,             condition: (s) => s.totalCats >= 3,
    secret: false,
  },
  {
    id: 'memorial',         category: 'Perfil',
    icon: Heart,            color: '#EC4899',  bg: '#FDF2F8',
    title: 'Memória Eterna',
    desc: 'Registrou a causa mortis de um gatinho (contribui para a IA preditiva)',
    points: 15,             condition: (s) => s.memorialRegistered,
    secret: false,
  },

  // COMUNIDADE
  {
    id: 'first_post',       category: 'Comunidade',
    icon: MessageCircle,    color: '#0EA5E9',  bg: '#F0F9FF',
    title: 'Voz da Comunidade',
    desc: 'Publicou o primeiro post no Comunigato',
    points: 15,             condition: (s) => s.posts >= 1,
    secret: false,
  },
  {
    id: 'igent_tip_shared', category: 'Comunidade',
    icon: Brain,            color: '#6158ca',  bg: '#F4F3FF',
    title: 'Compartilhou Saber',
    desc: 'Compartilhou uma dica do iGentVet na comunidade',
    points: 20,             condition: (s) => s.igentTipsShared >= 1,
    secret: false,
  },
  {
    id: 'photo_master',     category: 'Studio',
    icon: Camera,           color: '#8B5CF6',  bg: '#F5F3FF',
    title: 'Fotógrafo Felino',
    desc: 'Criou 3 retratos no Studio',
    points: 20,             condition: (s) => s.studioCreations >= 3,
    secret: false,
  },

  // SECRETAS
  {
    id: 'night_owl',        category: 'Segredo',
    icon: Star,             color: '#F59E0B',  bg: '#FFFBEB',
    title: '🌙 Coruja Noturna',
    desc: 'Realizou uma consulta entre meia-noite e 4h da manhã',
    points: 35,             condition: (s) => s.nightConsult,
    secret: true,
  },
  {
    id: 'founder_badge',    category: 'Segredo',
    icon: Crown,            color: '#F59E0B',  bg: '#FFFBEB',
    title: '👑 Fundador',
    desc: 'Membro fundador do Gatedo',
    points: 100,            condition: (s) => s.isFounder,
    secret: true,
  },
];

const CATEGORIES = ['Todos', 'Saúde', 'Perfil', 'Comunidade', 'Studio', 'Segredo'];

// ─── CARD DE CONQUISTA ────────────────────────────────────────────────────────
function AchievementCard({ achievement, unlocked, points }) {
  const Icon = achievement.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative rounded-[20px] p-4 border transition-all"
      style={{
        background: unlocked ? achievement.bg : '#F9FAFB',
        borderColor: unlocked ? `${achievement.color}30` : '#F3F4F6',
        opacity: unlocked ? 1 : 0.6,
      }}
    >
      {/* Ícone */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: unlocked ? `${achievement.color}20` : '#E5E7EB' }}
        >
          {unlocked
            ? <Icon size={20} style={{ color: achievement.color }} />
            : <Lock size={16} className="text-gray-400" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={`text-sm font-black leading-tight ${unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                {achievement.secret && !unlocked ? '???' : achievement.title}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
                {achievement.secret && !unlocked ? 'Conquista secreta — continue explorando' : achievement.desc}
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
                +{achievement.points} pts
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

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function GamificationDrawer({ isOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const [points, setPoints]   = useState(0);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Todos');

  useEffect(() => {
    if (!isOpen || !user?.id) return;
    setLoading(true);

    Promise.all([
      api.get(`/gamification/points/${user.id}`).catch(() => ({ data: { points: 0 } })),
      api.get(`/gamification/stats/${user.id}`).catch(() => ({ data: null })),
    ]).then(([ptRes, stRes]) => {
      setPoints(ptRes.data?.points || 0);
      setStats(stRes.data);
      setLoading(false);
    });
  }, [isOpen, user?.id]);

  const level     = getLevel(points);
  const nextLevel = getNextLevel(points);
  const progressPct = nextLevel
    ? Math.min(100, Math.round(((points - level.min) / (nextLevel.min - level.min)) * 100))
    : 100;

  // Calcula quais conquistas estão desbloqueadas
  const unlockedIds = stats
    ? ACHIEVEMENTS.filter((a) => a.condition(stats)).map((a) => a.id)
    : [];

  const filtered = activeTab === 'Todos'
    ? ACHIEVEMENTS
    : ACHIEVEMENTS.filter((a) => a.category === activeTab);

  const unlockedCount = unlockedIds.length;
  const totalCount    = ACHIEVEMENTS.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Gaveta */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-[800px] mx-auto rounded-t-[32px] bg-white overflow-hidden"
            style={{ maxHeight: '90vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* ── HERO — Nível atual ── */}
            <div
              className="mx-4 mt-2 mb-4 rounded-[24px] p-5 relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${level.color} 0%, ${level.color}CC 100%)` }}
            >
              {/* Orb decorativo */}
              <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full opacity-20 bg-white" />
              <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full opacity-10 bg-white" />

              <div className="relative z-10 flex items-center justify-between mb-4">
                <div>
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mb-1">
                    Seu nível
                  </p>
                  <p className="text-xl font-black text-white leading-tight">
                    {level.emoji} {level.label}
                  </p>
                  <p className="text-white/70 text-xs font-bold mt-0.5">
                    {points.toLocaleString('pt-BR')} pontos totais
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-white/60 uppercase tracking-wider mb-1">
                    Conquistas
                  </p>
                  <p className="text-2xl font-black text-white">{unlockedCount}</p>
                  <p className="text-[9px] text-white/60 font-bold">de {totalCount}</p>
                </div>
              </div>

              {/* Barra de progresso */}
              {nextLevel && (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-[9px] font-bold text-white/60">Próximo: {nextLevel.emoji} {nextLevel.label}</p>
                    <p className="text-[9px] font-black text-white">{progressPct}%</p>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-white rounded-full"
                    />
                  </div>
                  <p className="text-[9px] text-white/50 font-bold mt-1">
                    Faltam {(nextLevel.min - points).toLocaleString('pt-BR')} pts para {nextLevel.label}
                  </p>
                </div>
              )}

              {!nextLevel && (
                <div className="flex items-center gap-2 mt-2">
                  <Sparkles size={12} className="text-white" />
                  <p className="text-xs font-black text-white">Nível máximo atingido!</p>
                </div>
              )}
            </div>

            {/* ── Como ganhar pontos ── */}
            <div className="mx-4 mb-4 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-2">Como ganhar pontos</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Consulta iGentVet', pts: '+10', icon: '🤖' },
                  { label: 'Vacina registrada', pts: '+5',  icon: '💉' },
                  { label: 'Post na comunidade', pts: '+15', icon: '💬' },
                  { label: 'Dica de IA compartilhada', pts: '+20', icon: '🧠' },
                ].map((item) => (
                  <div key={item.label}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl border border-gray-100">
                    <span className="text-sm">{item.icon}</span>
                    <span className="text-[9px] font-bold text-gray-600">{item.label}</span>
                    <span className="text-[9px] font-black text-[#6158ca]">{item.pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Tabs de categoria ── */}
            <div className="flex gap-1.5 px-4 mb-3 overflow-x-auto scrollbar-hide pb-1">
              {CATEGORIES.map((cat) => {
                const catCount = cat === 'Todos'
                  ? unlockedIds.length
                  : ACHIEVEMENTS.filter((a) => a.category === cat && unlockedIds.includes(a.id)).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveTab(cat)}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black transition-all"
                    style={activeTab === cat
                      ? { background: '#6158ca', color: 'white' }
                      : { background: '#F4F3FF', color: '#6B7280' }
                    }
                  >
                    {cat}
                    {catCount > 0 && (
                      <span className="text-[7px] px-1 py-0.5 rounded-full"
                        style={{ background: activeTab === cat ? 'rgba(255,255,255,0.25)' : '#6158ca20', color: activeTab === cat ? 'white' : '#6158ca' }}>
                        {catCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── Lista de conquistas ── */}
            <div className="overflow-y-auto px-4 pb-10" style={{ maxHeight: '40vh' }}>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-[20px] animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Desbloqueadas primeiro */}
                  {filtered
                    .filter((a) => unlockedIds.includes(a.id))
                    .map((a) => (
                      <AchievementCard key={a.id} achievement={a} unlocked={true} points={points} />
                    ))
                  }
                  {/* Bloqueadas depois */}
                  {filtered
                    .filter((a) => !unlockedIds.includes(a.id))
                    .map((a) => (
                      <AchievementCard key={a.id} achievement={a} unlocked={false} points={points} />
                    ))
                  }
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}