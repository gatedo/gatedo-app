/**
 * GamificationContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Estado global de gamificação — XP, nível, badges, streak, toasts.
 * Wraps o app inteiro. Qualquer página chama useGamification() para
 * ganhar XP, desbloquear badge, checar nível sem prop-drilling.
 *
 * INTEGRAÇÃO:
 *   1. Em App.jsx ou main.jsx:
 *      import { GamificationProvider } from './context/GamificationContext';
 *      <GamificationProvider><App /></GamificationProvider>
 *
 *   2. Em qualquer componente:
 *      const { earnXP, unlockBadge, xp, level, badges, streak } = useGamification();
 *
 *   3. Sincronização API:
 *      O provider chama GET /gamification/me no mount e PATCH /gamification
 *      após cada mudança. Substitua os mocks de API pela sua instância.
 */

import React, {
  createContext, useContext, useState, useEffect,
  useCallback, useRef,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, Trophy, X } from 'lucide-react';
import api from '../services/api';  // sua instância axios

// ═══════════════════════════════════════════════════════════════════════════════
// DEFINIÇÕES — níveis e badges (single source of truth)
// ═══════════════════════════════════════════════════════════════════════════════

export const LEVELS = [
  { rank: 1, min: 0,    max: 149,    name: 'Filhote',          emoji: '🐾', color: '#9CA3AF', glow: '#9CA3AF30' },
  { rank: 2, min: 150,  max: 399,    name: 'Gato Curioso',     emoji: '🐱', color: '#60A5FA', glow: '#60A5FA30' },
  { rank: 3, min: 400,  max: 799,    name: 'Gateiro Raiz',     emoji: '🐈', color: '#34D399', glow: '#34D39930' },
  { rank: 4, min: 800,  max: 1499,   name: 'Felino Sábio',     emoji: '🦁', color: '#F59E0B', glow: '#F59E0B30' },
  { rank: 5, min: 1500, max: 2999,   name: 'Mestre das Patas', emoji: '👑', color: '#8B5CF6', glow: '#8B5CF630' },
  { rank: 6, min: 3000, max: Infinity,name: 'Lenda Gateira',   emoji: '⭐', color: '#DFFF40', glow: '#DFFF4060' },
];

export const BADGES = {
  // 🧠 Inteligência
  IGENT_PIONEER:   { axis: 'intel',  emoji: '🧠', name: 'Pioneer iGent',     desc: '1ª consulta iGentVet',             xp: 50,   rarity: 'common'    },
  IGENT_ANALISTA:  { axis: 'intel',  emoji: '🔬', name: 'Tutor Analítico',   desc: '5 consultas registradas',           xp: 150,  rarity: 'uncommon'  },
  IGENT_MASTER:    { axis: 'intel',  emoji: '🤖', name: 'Mestre iGent',      desc: '25 consultas — IA preditiva ativa', xp: 400,  rarity: 'epic'      },
  DIAGNOSE_PRO:    { axis: 'intel',  emoji: '✅', name: 'Diagnóstico Certo', desc: '3 outcomes confirmados',            xp: 200,  rarity: 'rare'      },
  HEALTH_GUARDIAN: { axis: 'intel',  emoji: '🛡️', name: 'Guardião da Saúde', desc: 'Perfil de saúde 100% completo',    xp: 100,  rarity: 'uncommon'  },
  PREDICTIVE:      { axis: 'intel',  emoji: '🔮', name: 'Tutor Preditivo',   desc: 'Histórico preditivo desbloqueado',  xp: 500,  rarity: 'legendary' },
  // 🌍 Comunidade
  FIRST_MIADO:     { axis: 'social', emoji: '📣', name: 'Primeiro Miado',    desc: '1º post na comunidade',            xp: 30,   rarity: 'common'    },
  VIRAL_GATEIRO:   { axis: 'social', emoji: '🔥', name: 'Viral Gateiro',     desc: 'Post com 100+ curtidas',           xp: 300,  rarity: 'rare'      },
  MEME_LORD:       { axis: 'social', emoji: '😂', name: 'Lord do Meme',      desc: '5 posts de humor',                 xp: 150,  rarity: 'uncommon'  },
  GUARDIAO_Q:      { axis: 'social', emoji: '💜', name: 'Coração Gateiro',   desc: 'Respondeu 10 dúvidas',             xp: 200,  rarity: 'uncommon'  },
  TREND_SETTER:    { axis: 'social', emoji: '📈', name: 'Trend Setter',      desc: '3 desafios virais completos',       xp: 250,  rarity: 'rare'      },
  EMBAIXADOR:      { axis: 'social', emoji: '🌟', name: 'Embaixador Gatedo', desc: 'Convidou 5 amigos',                xp: 500,  rarity: 'epic'      },
  // 🎨 Criação
  CRIADOR_NATO:    { axis: 'create', emoji: '🎨', name: 'Criador Nato',      desc: '1ª criação no Studio',             xp: 50,   rarity: 'common'    },
  ARTISTA_GATEIRO: { axis: 'create', emoji: '✨', name: 'Artista Gateiro',   desc: '3 ferramentas do Studio usadas',   xp: 150,  rarity: 'uncommon'  },
  STUDIO_LEGEND:   { axis: 'create', emoji: '🏆', name: 'Studio Legend',     desc: 'Todas as ferramentas usadas',      xp: 400,  rarity: 'epic'      },
  VIRAL_STUDIO:    { axis: 'create', emoji: '💫', name: 'Viral do Studio',   desc: 'Criação com 50+ curtidas',         xp: 300,  rarity: 'rare'      },
  // ⚡ Consistência
  STREAK_7:        { axis: 'streak', emoji: '🔥', name: '7 Dias de Fogo',    desc: 'Streak de 7 dias',                 xp: 100,  rarity: 'uncommon'  },
  STREAK_30:       { axis: 'streak', emoji: '⚡', name: 'Guardião Gatedo',   desc: 'Streak épico de 30 dias',          xp: 500,  rarity: 'legendary' },
  STREAK_365:      { axis: 'streak', emoji: '🌟', name: 'Lenda Viva',        desc: '365 dias consecutivos',            xp: 2000, rarity: 'legendary' },
  GATEDO_OG:       { axis: 'streak', emoji: '👑', name: 'Gatedo OG',         desc: '1 ano na plataforma',              xp: 1000, rarity: 'legendary' },
  COLECIONADOR:    { axis: 'streak', emoji: '💎', name: 'Colecionador',      desc: '10 badges conquistados',           xp: 200,  rarity: 'rare'      },
};

export const RARITY_STYLES = {
  common:    { border: '#E5E7EB', bg: '#F9FAFB', shadow: 'none',                 label: 'Comum'    },
  uncommon:  { border: '#A7F3D0', bg: '#F0FDF4', shadow: '0 0 10px #34D39928',   label: 'Incomum'  },
  rare:      { border: '#BFDBFE', bg: '#EFF6FF', shadow: '0 0 14px #60A5FA30',   label: 'Raro'     },
  epic:      { border: '#DDD6FE', bg: '#F5F3FF', shadow: '0 0 18px #8B5CF638',   label: 'Épico'    },
  legendary: { border: '#FDE68A', bg: '#FFFBEB', shadow: '0 0 24px #F59E0B50',   label: 'Lendário' },
};

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────
export const getLevel = (xp) =>
  LEVELS.find(l => xp >= l.min && xp <= l.max) || LEVELS[0];

export const getLevelProgress = (xp) => {
  const lvl = getLevel(xp);
  if (lvl.rank === LEVELS.length) return 100;
  return Math.round(((xp - lvl.min) / (lvl.max - lvl.min)) * 100);
};

// ─── LÓGICA DE BADGES AUTOMÁTICOS ────────────────────────────────────────────
// Retorna lista de badge keys que devem ser desbloqueados dado o estado atual
function computeAutoUnlocks(state) {
  const unlocks = [];
  const owned = new Set(state.badges);
  const { consultCount, postCount, studioCount, streak, totalBadges } = state.stats;

  const check = (key, condition) => {
    if (condition && !owned.has(key)) unlocks.push(key);
  };

  check('IGENT_PIONEER',   consultCount >= 1);
  check('IGENT_ANALISTA',  consultCount >= 5);
  check('IGENT_MASTER',    consultCount >= 25);
  check('FIRST_MIADO',     postCount >= 1);
  check('MEME_LORD',       state.stats.memeCount >= 5);
  check('CRIADOR_NATO',    studioCount >= 1);
  check('ARTISTA_GATEIRO', studioCount >= 3);
  check('STREAK_7',        streak >= 7);
  check('STREAK_30',       streak >= 30);
  check('STREAK_365',      streak >= 365);
  check('COLECIONADOR',    totalBadges >= 10);

  return unlocks;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOASTS GLOBAIS
// ═══════════════════════════════════════════════════════════════════════════════

function XPToast({ item, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.85 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -50, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="flex items-center gap-2.5 px-5 py-3 rounded-full font-black text-sm pointer-events-none"
      style={{ background: '#DFFF40', color: '#1a1a00', boxShadow: '0 8px 32px #DFFF4080' }}>
      <Zap size={15} fill="#1a1a00" />
      <span>+{item.xp} XP</span>
      {item.label && <span className="text-[10px] font-bold opacity-60">· {item.label}</span>}
      <Sparkles size={13} />
    </motion.div>
  );
}

function BadgeToast({ badge, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, []);

  const r = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.85 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -50, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 360, damping: 26 }}
      className="flex items-center gap-3 px-5 py-4 rounded-2xl pointer-events-none"
      style={{ background: r.bg, border: `2px solid ${r.border}`, boxShadow: r.shadow, maxWidth: 300 }}>
      <div className="text-2xl">{badge.emoji}</div>
      <div>
        <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
          Badge desbloqueado · {r.label}
        </p>
        <p className="text-sm font-black text-gray-800">{badge.name}</p>
        <p className="text-[10px] text-gray-500 font-medium">{badge.desc}</p>
      </div>
      <Trophy size={18} className="text-yellow-500 flex-shrink-0 ml-1" />
    </motion.div>
  );
}

function LevelUpToast({ level, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -60, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="flex flex-col items-center gap-2 px-8 py-5 rounded-3xl pointer-events-none text-center"
      style={{ background: `linear-gradient(135deg, ${level.color}22, ${level.color}44)`,
        border: `2px solid ${level.color}60`, boxShadow: `0 12px 48px ${level.color}60` }}>
      <motion.div
        animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-4xl">{level.emoji}</motion.div>
      <div>
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: level.color }}>
          Nível alcançado!
        </p>
        <p className="text-xl font-black text-white mt-0.5">{level.name}</p>
      </div>
    </motion.div>
  );
}

// ─── TOAST MANAGER ────────────────────────────────────────────────────────────
function ToastManager({ queue, onDismiss }) {
  const current = queue[0];
  if (!current) return null;

  return (
    <div className="fixed bottom-28 left-0 right-0 flex justify-center z-[500] pointer-events-none px-4">
      <AnimatePresence mode="wait">
        {current.type === 'xp'      && <XPToast      key={current.id} item={current}   onDone={() => onDismiss(current.id)} />}
        {current.type === 'badge'   && <BadgeToast   key={current.id} badge={current}  onDone={() => onDismiss(current.id)} />}
        {current.type === 'levelup' && <LevelUpToast key={current.id} level={current}  onDone={() => onDismiss(current.id)} />}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT + PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

const GamificationContext = createContext(null);

const STORAGE_KEY = 'gatedo_gamification_v2';

const defaultState = {
  xp: 0,
  badges: [],   // array de badge keys já conquistados
  streak: 0,
  lastActiveDate: null,
  stats: {
    consultCount: 0,
    postCount: 0,
    studioCount: 0,
    memeCount: 0,
    totalBadges: 0,
  },
};

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    return defaultState;
  }
}

function saveLocal(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function GamificationProvider({ children }) {
  const [state, setState] = useState(loadLocal);
  const [toastQueue, setToastQueue] = useState([]);
  const toastCounter = useRef(0);
  const syncing = useRef(false);

  // ── Persistência local ──
  useEffect(() => { saveLocal(state); }, [state]);

  // ── Sync API no mount — só se usuário estiver logado (token presente) ──
  useEffect(() => {
    const token = localStorage.getItem('gatedo_token');
    if (!token) return; // usuário não logado: usa estado local, não chama API
    
    api.get('/gamification/me')
      .then(r => {
        if (r.data) {
          setState(prev => ({
            ...prev,
            xp:     r.data.xp     ?? prev.xp,
            badges: r.data.badges ?? prev.badges,
            streak: r.data.streak ?? prev.streak,
            stats:  r.data.stats  ?? prev.stats,
          }));
        }
      })
      .catch(() => {}); // offline-first: usa local se falhar
  }, []);

  // ── Atualiza streak diário ──
  useEffect(() => {
    const today = new Date().toDateString();
    if (state.lastActiveDate === today) return;

    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const newStreak = state.lastActiveDate === yesterday ? state.streak + 1 : 1;

    setState(prev => ({ ...prev, streak: newStreak, lastActiveDate: today }));
  }, []);

  // ── Push toast ──────────────────────────────────────────────────────────────
  const pushToast = useCallback((toast) => {
    const id = ++toastCounter.current;
    setToastQueue(q => [...q, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToastQueue(q => q.filter(t => t.id !== id));
  }, []);

  // ── EARN XP ─────────────────────────────────────────────────────────────────
  const earnXP = useCallback((amount, label = '') => {
    if (!amount || amount <= 0) return;

    setState(prev => {
      const oldLvl = getLevel(prev.xp);
      const newXP  = prev.xp + amount;
      const newLvl = getLevel(newXP);

      // Check auto-badge unlocks
      const autoUnlocks = computeAutoUnlocks({ ...prev, xp: newXP });

      // XP toast
      pushToast({ type: 'xp', xp: amount, label });

      // Badge toasts
      autoUnlocks.forEach((key, i) => {
        const badge = BADGES[key];
        if (badge) {
          setTimeout(() => pushToast({ type: 'badge', ...badge }), 400 + i * 300);
        }
      });

      // Level-up toast
      if (newLvl.rank > oldLvl.rank) {
        setTimeout(() => pushToast({ type: 'levelup', ...newLvl }), 800);
      }

      const newState = {
        ...prev,
        xp: newXP,
        badges: [...new Set([...prev.badges, ...autoUnlocks])],
        stats: {
          ...prev.stats,
          totalBadges: prev.badges.length + autoUnlocks.length,
        },
      };

      // Sync to API (non-blocking)
      if (!syncing.current) {
        syncing.current = true;
        if (localStorage.getItem('gatedo_token'))
          if (localStorage.getItem('gatedo_token'))
          api.patch('/gamification', { xp: newXP, badges: newState.badges, streak: prev.streak })
          .catch(() => {})
          .finally(() => { syncing.current = false; });
      }

      return newState;
    });
  }, [pushToast]);

  // ── UNLOCK BADGE ────────────────────────────────────────────────────────────
  const unlockBadge = useCallback((key) => {
    const badge = BADGES[key];
    if (!badge) return;

    setState(prev => {
      if (prev.badges.includes(key)) return prev; // já tem

      pushToast({ type: 'badge', ...badge });

      const xpBonus = badge.xp || 0;
      const newXP   = prev.xp + xpBonus;
      if (xpBonus > 0) {
        setTimeout(() => pushToast({ type: 'xp', xp: xpBonus, label: badge.name }), 500);
      }

      const newState = {
        ...prev,
        xp: newXP,
        badges: [...prev.badges, key],
        stats: { ...prev.stats, totalBadges: prev.badges.length + 1 },
      };

      if (localStorage.getItem('gatedo_token'))
        if (localStorage.getItem('gatedo_token'))
        api.patch('/gamification', { xp: newXP, badges: newState.badges }).catch(() => {});
      return newState;
    });
  }, [pushToast]);

  // ── INCREMENT STAT ───────────────────────────────────────────────────────────
  // Chame após cada ação: incrementStat('consultCount') → verifica badges automáticos
  const incrementStat = useCallback((statKey, by = 1) => {
    setState(prev => {
      const newStats = { ...prev.stats, [statKey]: (prev.stats[statKey] || 0) + by };
      const autoUnlocks = computeAutoUnlocks({ ...prev, stats: newStats });
      autoUnlocks.forEach((key, i) => {
        const badge = BADGES[key];
        if (badge) setTimeout(() => pushToast({ type: 'badge', ...badge }), i * 300);
      });
      return {
        ...prev,
        badges: [...new Set([...prev.badges, ...autoUnlocks])],
        stats: newStats,
      };
    });
  }, [pushToast]);

  // ── COMPUTED ─────────────────────────────────────────────────────────────────
  const level    = getLevel(state.xp);
  const progress = getLevelProgress(state.xp);
  const nextLevel= LEVELS.find(l => l.rank === level.rank + 1) || null;

  const value = {
    // State
    xp:         state.xp,
    badges:     state.badges,
    streak:     state.streak,
    stats:      state.stats,
    // Computed
    level,
    progress,
    nextLevel,
    hasBadge:   (key) => state.badges.includes(key),
    // Actions
    earnXP,
    unlockBadge,
    incrementStat,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
      <ToastManager queue={toastQueue} onDismiss={dismissToast} />
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const ctx = useContext(GamificationContext);
  if (!ctx) throw new Error('useGamification must be used inside <GamificationProvider>');
  return ctx;
}

// ─── COMPONENTES REUTILIZÁVEIS EXPORTADOS ────────────────────────────────────

export function LevelBadge({ xp, size = 'md', showBar = false }) {
  const lvl  = getLevel(xp);
  const prog = getLevelProgress(xp);
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizes[size]} rounded-full flex items-center justify-center font-black flex-shrink-0`}
        style={{ background: `${lvl.color}20`, border: `2px solid ${lvl.color}70`, boxShadow: lvl.glow }}>
        {lvl.emoji}
      </div>
      <div>
        <p className="text-[10px] font-black leading-none" style={{ color: lvl.color }}>{lvl.name}</p>
        <p className="text-[8px] text-gray-400 font-bold">{xp.toLocaleString()} XP</p>
      </div>
      {showBar && (
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden ml-1 min-w-[60px]">
          <motion.div initial={{ width: 0 }} animate={{ width: `${prog}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${lvl.color}80, ${lvl.color})` }} />
        </div>
      )}
    </div>
  );
}

export function BadgeChip({ badgeKey, size = 'sm' }) {
  const b = BADGES[badgeKey];
  if (!b) return null;
  const r = RARITY_STYLES[b.rarity] || RARITY_STYLES.common;
  return (
    <div className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
      style={{ border: `1.5px solid ${r.border}`, background: r.bg, boxShadow: r.shadow }}>
      <span className={size === 'lg' ? 'text-base' : 'text-sm'}>{b.emoji}</span>
      <div>
        <p className="text-[9px] font-black leading-none" style={{ color: BADGES[badgeKey]?.color || '#6B7280' }}>
          {b.name}
        </p>
        {size === 'lg' && <p className="text-[8px] text-gray-400 mt-0.5">{b.desc}</p>}
      </div>
      {size === 'lg' && (
        <span className="text-[7px] font-black px-1 py-0.5 rounded uppercase tracking-wider ml-0.5"
          style={{ background: `${BADGES[badgeKey]?.color || '#6B7280'}15`, color: BADGES[badgeKey]?.color || '#6B7280' }}>
          {r.label}
        </span>
      )}
    </div>
  );
}

/**
 * XPBar — barra de progresso inline usada no header de qualquer página
 * Clicável → navega para /ranking ou abre modal de gamificação
 */
export function XPBar({ onClick }) {
  const { xp, streak, level, progress, nextLevel } = useGamification();
  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-[20px] border w-full"
      style={{ background: `${level.color}08`, borderColor: `${level.color}25` }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
        style={{ background: `${level.color}18`, border: `2px solid ${level.color}60`, boxShadow: level.glow }}>
        {level.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-black" style={{ color: level.color }}>{level.name}</span>
          <span className="text-[9px] font-bold text-gray-400">
            {xp.toLocaleString()}{nextLevel ? `/${nextLevel.min.toLocaleString()}` : ''} XP
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${level.color}80, ${level.color})` }} />
        </div>
      </div>
      <div className="flex flex-col items-center flex-shrink-0">
        <span className="text-sm">🔥</span>
        <span className="text-[9px] font-black text-orange-500 leading-none">{streak}d</span>
      </div>
    </motion.button>
  );
}