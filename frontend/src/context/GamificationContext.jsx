import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, PawPrint, Trophy } from 'lucide-react';
import api from '../services/api';
import { AuthContext } from './AuthContext';

export const LEVELS = [
  { rank: 1, min: 0, max: 49, name: 'Gateiro Iniciante', emoji: '🐾', color: '#8bbcf3', glow: '#8bbcf330' },
  { rank: 2, min: 50, max: 119, name: 'Gateiro Curioso', emoji: '🐱', color: '#fa608e', glow: '#fa608e30' },
  { rank: 3, min: 120, max: 219, name: 'Gateiro Atento', emoji: '🐈', color: '#34D399', glow: '#34D39930' },
  { rank: 4, min: 220, max: 349, name: 'Tutor de Rotina', emoji: '📘', color: '#22C55E', glow: '#22C55E30' },
  { rank: 5, min: 350, max: 519, name: 'Tutor Preventivo', emoji: '🛡️', color: '#0EA5E9', glow: '#0EA5E930' },
  { rank: 6, min: 520, max: 749, name: 'Tutor Cuidadoso', emoji: '🧡', color: '#6366F1', glow: '#6366F130' },
  { rank: 7, min: 750, max: 1049, name: 'Guardião Doméstico', emoji: '🏠', color: '#F59E0B', glow: '#F59E0B30' },
  { rank: 8, min: 1050, max: 1449, name: 'Guardião Ativo', emoji: '⚡', color: '#F97316', glow: '#F9731630' },
  { rank: 9, min: 1450, max: 1999, name: 'Guardião Preventivo', emoji: '🧭', color: '#8B5CF6', glow: '#8B5CF630' },
  { rank: 10, min: 2000, max: 2699, name: 'Mentor Felino', emoji: '🎓', color: '#EC4899', glow: '#EC489930' },
  { rank: 11, min: 2700, max: 3549, name: 'Mentor de Rotina', emoji: '📊', color: '#14B8A6', glow: '#14B8A630' },
  { rank: 12, min: 3550, max: 4549, name: 'Mentor do Bem-Estar', emoji: '🌿', color: '#06B6D4', glow: '#06B6D430' },
  { rank: 13, min: 4550, max: 5699, name: 'Estrategista Felino', emoji: '🤖', color: '#8B4AFF', glow: '#8B4AFF30' },
  { rank: 14, min: 5700, max: 6999, name: 'Estrategista de Cuidado', emoji: '🧪', color: '#10B981', glow: '#10B98130' },
  { rank: 15, min: 7000, max: 8499, name: 'Curador do Gatedo', emoji: '🏛️', color: '#F43F5E', glow: '#F43F5E30' },
  { rank: 16, min: 8500, max: 10199, name: 'Curador Preventivo', emoji: '🔮', color: '#A855F7', glow: '#A855F730' },
  { rank: 17, min: 10200, max: 12099, name: 'Protetor de Elite', emoji: '✨', color: '#EAB308', glow: '#EAB30830' },
  { rank: 18, min: 12100, max: 14199, name: 'Guardião Supremo', emoji: '👑', color: '#F59E0B', glow: '#F59E0B30' },
  { rank: 19, min: 14200, max: 16499, name: 'Lenda do Gatedo', emoji: '🌟', color: '#D946EF', glow: '#D946EF30' },
  { rank: 20, min: 16500, max: Infinity, name: 'Arquiteto da Jornada', emoji: '🐾👑', color: '#DFFF40', glow: '#DFFF4060' },
];

export const CAT_LEVELS = [
  { rank: 1, min: 0, max: 19, name: 'Filhote de Jornada', emoji: '🐾', color: '#8bbcf3', glow: '#8bbcf330' },
  { rank: 2, min: 20, max: 59, name: 'Patinha Curiosa', emoji: '🐱', color: '#fa608e', glow: '#fa608e30' },
  { rank: 3, min: 60, max: 119, name: 'Ronrom Inicial', emoji: '😺', color: '#34D399', glow: '#34D39930' },
  { rank: 4, min: 120, max: 199, name: 'Explorador Doméstico', emoji: '🏠', color: '#22C55E', glow: '#22C55E30' },
  { rank: 5, min: 200, max: 319, name: 'Guardião da Casa', emoji: '🛡️', color: '#0EA5E9', glow: '#0EA5E930' },
  { rank: 6, min: 320, max: 479, name: 'Miado Atento', emoji: '👀', color: '#6366F1', glow: '#6366F130' },
  { rank: 7, min: 480, max: 699, name: 'Vigilante Felino', emoji: '🐈', color: '#F59E0B', glow: '#F59E0B30' },
  { rank: 8, min: 700, max: 999, name: 'Companheiro Evolutivo', emoji: '💫', color: '#F97316', glow: '#F9731630' },
  { rank: 9, min: 1000, max: 1399, name: 'Alma da Casa', emoji: '🏡', color: '#8B5CF6', glow: '#8B5CF630' },
  { rank: 10, min: 1400, max: 1899, name: 'Gato de Rotina', emoji: '📘', color: '#EC4899', glow: '#EC489930' },
  { rank: 11, min: 1900, max: 2499, name: 'Guardião de Sofá', emoji: '🛋️', color: '#14B8A6', glow: '#14B8A630' },
  { rank: 12, min: 2500, max: 3199, name: 'Veterano Felino', emoji: '🎖️', color: '#06B6D4', glow: '#06B6D430' },
  { rank: 13, min: 3200, max: 3999, name: 'Olhar Experiente', emoji: '👁️', color: '#8B4AFF', glow: '#8B4AFF30' },
  { rank: 14, min: 4000, max: 4899, name: 'Mestre do Ronrom', emoji: '🎼', color: '#10B981', glow: '#10B98130' },
  { rank: 15, min: 4900, max: 5899, name: 'Guardião Nobre', emoji: '👑', color: '#F43F5E', glow: '#F43F5E30' },
  { rank: 16, min: 5900, max: 6999, name: 'Oráculo do Lar', emoji: '🔮', color: '#A855F7', glow: '#A855F730' },
  { rank: 17, min: 7000, max: 8199, name: 'Lenda Felina', emoji: '🌟', color: '#EAB308', glow: '#EAB30830' },
  { rank: 18, min: 8200, max: 9499, name: 'Espírito da Casa', emoji: '✨', color: '#F59E0B', glow: '#F59E0B30' },
  { rank: 19, min: 9500, max: 10999, name: 'Soberano do Gatedo', emoji: '🐾👑', color: '#D946EF', glow: '#D946EF30' },
  { rank: 20, min: 11000, max: Infinity, name: 'Mito Felino', emoji: '💎', color: '#DFFF40', glow: '#DFFF4060' },
];

export const BADGES = {};

export const RARITY_STYLES = {
  common: { border: '#E5E7EB', bg: '#F9FAFB', shadow: 'none', label: 'Comum' },
  uncommon: { border: '#A7F3D0', bg: '#F0FDF4', shadow: '0 0 10px #34D39928', label: 'Incomum' },
  rare: { border: '#BFDBFE', bg: '#EFF6FF', shadow: '0 0 14px #60A5FA30', label: 'Raro' },
  epic: { border: '#DDD6FE', bg: '#F5F3FF', shadow: '0 0 18px #8B5CF638', label: 'Épico' },
  legendary: { border: '#FDE68A', bg: '#FFFBEB', shadow: '0 0 24px #F59E0B50', label: 'Lendário' },
  limited: { border: '#DFFF40', bg: '#F7FEE7', shadow: '0 0 28px #DFFF4060', label: 'Limitado' },
  founder: { border: '#DFFF40', bg: '#F7FEE7', shadow: '0 0 28px #DFFF4060', label: 'Fundador' },
};

export const getLevel = (xpt = 0) =>
  LEVELS.find((l) => xpt >= l.min && xpt <= l.max) || LEVELS[0];

export const getLevelProgress = (xpt = 0) => {
  const lvl = getLevel(xpt);
  if (lvl.rank === LEVELS.length) return 100;
  const range = lvl.max - lvl.min + 1;
  return Math.max(0, Math.min(100, Math.round(((xpt - lvl.min) / range) * 100)));
};

export const getCatLevel = (xpg = 0) =>
  CAT_LEVELS.find((l) => xpg >= l.min && xpg <= l.max) || CAT_LEVELS[0];

export const getCatLevelProgress = (xpg = 0) => {
  const lvl = getCatLevel(xpg);
  if (lvl.rank === CAT_LEVELS.length) return 100;
  const range = lvl.max - lvl.min + 1;
  return Math.max(0, Math.min(100, Math.round(((xpg - lvl.min) / range) * 100)));
};

function XPToast({ item, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.85 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -50, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="flex items-center gap-2.5 px-5 py-3 rounded-full font-black text-sm pointer-events-none"
      style={{ background: '#DFFF40', color: '#1a1a00', boxShadow: '0 8px 32px #DFFF4080' }}
    >
      <Zap size={15} fill="#1a1a00" />
      <span>+{item.xp} XPT</span>
      {item.label && <span className="text-[10px] font-bold opacity-60">· {item.label}</span>}
      <Sparkles size={13} />
    </motion.div>
  );
}

function PointsToast({ item, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.85 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -50, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="flex items-center gap-2.5 px-5 py-3 rounded-full font-black text-sm pointer-events-none"
      style={{ background: '#8B4AFF', color: 'white', boxShadow: '0 8px 32px #8B4AFF60' }}
    >
      <PawPrint size={15} fill="white" />
      <span>{item.pts >= 0 ? '+' : ''}{item.pts} GPTS</span>
      {item.label && <span className="text-[10px] font-bold opacity-70">· {item.label}</span>}
    </motion.div>
  );
}

function PetXPToast({ item, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ y: 80, opacity: 0, scale: 0.85 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -50, opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className="flex items-center gap-2.5 px-5 py-3 rounded-full font-black text-sm pointer-events-none"
      style={{ background: '#ffffff', color: '#111827', boxShadow: '0 8px 32px rgba(17,24,39,0.14)' }}
    >
      <Trophy size={15} />
      <span>{item.petName || 'Seu gato'} +{item.xpg} XPG</span>
      {item.label && <span className="text-[10px] font-bold opacity-60">· {item.label}</span>}
    </motion.div>
  );
}

function ToastManager({ queue, onDismiss }) {
  const current = queue[0];
  if (!current) return null;

  return (
    <div className="fixed bottom-28 left-0 right-0 flex justify-center z-[500] pointer-events-none px-4">
      <AnimatePresence mode="wait">
        {current.type === 'xp' && (
          <XPToast key={current.id} item={current} onDone={() => onDismiss(current.id)} />
        )}
        {current.type === 'pts' && (
          <PointsToast key={current.id} item={current} onDone={() => onDismiss(current.id)} />
        )}
        {current.type === 'pet_xp' && (
          <PetXPToast key={current.id} item={current} onDone={() => onDismiss(current.id)} />
        )}
      </AnimatePresence>
    </div>
  );
}

const GamificationContext = createContext(null);

const defaultState = {
  tutor: {
    id: null,
    name: '',
    xpt: 0,
    gpts: 0,
    level: 1,
    levelMeta: LEVELS[0],
    progress: 0,
    nextLevel: LEVELS[1] || null,
    badges: [],
    achievements: [],
  },
  cats: [],
  petMap: {},
  streak: 0,
  recentEvents: [],
  stats: {
    consultCount: 0,
    postCount: 0,
    studioCount: 0,
    petCount: 0,
    diaryCount: 0,
    vaccinesRegistered: 0,
    profileComplete: false,
  },
  loaded: false,
};

function normalizeTutor(input = {}) {
  const xpt = Number(
    input?.xpt ??
    input?.xp ??
    input?.totalEarned ??
    input?.tutorPoints?.totalEarned ??
    input?.tutorPoints?.points ??
    input?.summary?.xp ??
    0
  );

  const gpts = Number(
    input?.gpts ??
    input?.points ??
    input?.balance ??
    input?.walletBalance ??
    input?.wallet ??
    input?.credits ??
    input?.userCredits?.balance ??
    input?.summary?.points ??
    0
  );

  const levelMeta = input?.levelMeta || getLevel(xpt);
  const nextLevel = LEVELS.find((l) => l.rank === levelMeta.rank + 1) || null;

  return {
    id: input?.id || null,
    name: input?.name || '',
    xpt,
    gpts,
    level: Number(input?.level || levelMeta.rank || 1),
    levelMeta,
    progress: typeof input?.progress === 'number' ? input.progress : getLevelProgress(xpt),
    nextLevel,
    badges: Array.isArray(input?.badges) ? input.badges : [],
    achievements: Array.isArray(input?.achievements) ? input.achievements : [],
  };
}

function normalizeCats(list = []) {
  return (Array.isArray(list) ? list : []).map((cat) => {
    const xpg = Number(cat?.xpg ?? cat?.xp ?? 0);
    const levelMeta = cat?.levelMeta || getCatLevel(xpg);
    const nextLevel = CAT_LEVELS.find((l) => l.rank === levelMeta.rank + 1) || null;

    return {
      ...cat,
      xpg,
      level: Number(cat?.level || levelMeta.rank || 1),
      levelMeta,
      progress: typeof cat?.progress === 'number' ? cat.progress : getCatLevelProgress(xpg),
      nextLevel,
      badges: Array.isArray(cat?.badges) ? cat.badges : [],
      achievements: Array.isArray(cat?.achievements) ? cat.achievements : [],
    };
  });
}

function buildPetMap(cats = []) {
  return cats.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});
}

function countEvents(events = [], action) {
  return events.filter((e) => e?.action === action).length;
}

function deriveStats(payload) {
  const apiStats = payload?.stats || {};
  const tutor = payload?.tutor || {};
  const recentEvents = Array.isArray(payload?.recentEvents) ? payload.recentEvents : [];
  const cats = Array.isArray(payload?.cats) ? payload.cats : [];

  return {
    consultCount: apiStats?.consultCount ?? countEvents(recentEvents, 'IGENT_CONSULT'),
    postCount: apiStats?.postCount ?? countEvents(recentEvents, 'COMMUNITY_POST'),
    studioCount:
      apiStats?.studioCount ??
      countEvents(recentEvents, 'STUDIO_IMAGE') + countEvents(recentEvents, 'STUDIO_VIDEO'),
    petCount: apiStats?.petCount ?? cats.length,
    diaryCount: apiStats?.diaryCount ?? 0,
    vaccinesRegistered: countEvents(recentEvents, 'VACCINE_REGISTERED'),
    profileComplete:
      Array.isArray(tutor?.badges) &&
      tutor.badges.some((b) => String(b).toLowerCase().includes('verificado')),
  };
}

function parseGamificationPayload(data) {
  const payload = data || {};

  if (!payload?.tutor) {
    const xpt =
      payload?.xpt ??
      payload?.xp ??
      payload?.totalEarned ??
      payload?.tutorPoints?.totalEarned ??
      payload?.stats?.xpt ??
      payload?.stats?.xp ??
      payload?.summary?.xp ??
      0;

    const gpts =
      payload?.gpts ??
      payload?.points ??
      payload?.balance ??
      payload?.walletBalance ??
      payload?.wallet ??
      payload?.credits ??
      payload?.userCredits?.balance ??
      payload?.stats?.points ??
      payload?.summary?.points ??
      0;

    const tutor = normalizeTutor({
      id: payload?.id || null,
      name: payload?.name || '',
      xpt,
      gpts,
      badges: payload?.badges || [],
      achievements: payload?.achievements || [],
      progress: payload?.progress,
    });

    return {
      tutor,
      cats: [],
      petMap: {},
      streak: Number(payload?.streak || 0),
      recentEvents: Array.isArray(payload?.recentEvents) ? payload.recentEvents : [],
      stats: payload?.stats || defaultState.stats,
      loaded: true,
    };
  }

  const tutor = normalizeTutor({
    ...payload.tutor,
    xpt:
      payload?.tutor?.xpt ??
      payload?.tutor?.xp ??
      payload?.xpt ??
      payload?.xp ??
      payload?.totalEarned ??
      payload?.tutorPoints?.totalEarned,
    gpts:
      payload?.tutor?.gpts ??
      payload?.tutor?.points ??
      payload?.tutor?.balance ??
      payload?.gpts ??
      payload?.points ??
      payload?.balance ??
      payload?.walletBalance ??
      payload?.wallet ??
      payload?.credits ??
      payload?.userCredits?.balance,
    progress:
      payload?.tutor?.progress ??
      payload?.progress,
  });

  const cats = normalizeCats(payload.cats || []);
  const petMap = buildPetMap(cats);

  return {
    tutor,
    cats,
    petMap,
    streak: Number(payload?.streak || 0),
    recentEvents: Array.isArray(payload?.recentEvents) ? payload.recentEvents : [],
    stats: deriveStats(payload),
    loaded: true,
  };
}

export function GamificationProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [state, setState] = useState(defaultState);
  const [toastQueue, setToastQueue] = useState([]);
  const toastCounter = useRef(0);

  const isAdmin =
    user?.role === 'ADMIN' ||
    user?.email === 'diegobocktavares@gmail.com';

  const pushToast = useCallback((toast) => {
    const id = ++toastCounter.current;
    setToastQueue((q) => [...q, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToastQueue((q) => q.filter((t) => t.id !== id));
  }, []);

  const refreshGamification = useCallback(async () => {
    if (!localStorage.getItem('gatedo_token')) {
      setState((prev) => ({ ...prev, loaded: true }));
      return null;
    }

    try {
      const res = await api.get('/gamification/me');
      const parsed = parseGamificationPayload(res.data);
      setState(parsed);
      window.dispatchEvent(new CustomEvent('gatedo-gamification-refreshed', { detail: parsed }));
      return parsed;
    } catch {
      setState((prev) => ({ ...prev, loaded: true }));
      return null;
    }
  }, []);

  useEffect(() => {
    refreshGamification();
  }, [refreshGamification]);

  useEffect(() => {
    const handler = () => {
      refreshGamification();
    };

    window.addEventListener('gatedo-gamification-refresh', handler);
    window.addEventListener('gatedo:xp-updated', handler);
    window.addEventListener('comunigato:new_post', handler);

    return () => {
      window.removeEventListener('gatedo-gamification-refresh', handler);
      window.removeEventListener('gatedo:xp-updated', handler);
      window.removeEventListener('comunigato:new_post', handler);
    };
  }, [refreshGamification]);

  useEffect(() => {
    if (!user?.id) return;

    const founderSync = setTimeout(() => {
      refreshGamification();
    }, 1200);

    return () => clearTimeout(founderSync);
  }, [user?.id, refreshGamification]);

  const earnXP = useCallback((amount, label = '') => {
    if (!amount || amount <= 0) return;
    pushToast({ type: 'xp', xp: amount, label });
    window.dispatchEvent(new CustomEvent('gatedo-gamification-refresh'));
  }, [pushToast]);

  const earnPoints = useCallback((amount, label = '') => {
    if (!amount) return;
    pushToast({ type: 'pts', pts: amount, label });
    window.dispatchEvent(new CustomEvent('gatedo-gamification-refresh'));
  }, [pushToast]);

  const earnPetXP = useCallback((petName, amount, label = '') => {
    if (!amount || amount <= 0) return;
    pushToast({ type: 'pet_xp', petName, xpg: amount, label });
    window.dispatchEvent(new CustomEvent('gatedo-gamification-refresh'));
  }, [pushToast]);

  const spendPoints = useCallback(async (amount, label = '') => {
    if (!amount || amount <= 0) return true;
    if (isAdmin) return true;

    try {
      await api.post('/gamification/spend', { amount });
      pushToast({ type: 'pts', pts: -amount, label: label || 'Consumo' });
      await refreshGamification();
      return true;
    } catch {
      return false;
    }
  }, [isAdmin, pushToast, refreshGamification]);

  const incrementStat = useCallback((statKey, by = 1) => {
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [statKey]: (prev.stats?.[statKey] || 0) + by,
      },
    }));
  }, []);

  const unlockBadge = useCallback(async () => {
    await refreshGamification();
  }, [refreshGamification]);

  const getPetById = useCallback((petId) => {
    if (!petId) return null;
    return state.petMap?.[petId] || null;
  }, [state.petMap]);

  const getPetLevelById = useCallback((petId) => {
    const pet = getPetById(petId);
    return pet?.levelMeta || null;
  }, [getPetById]);

  const getPetProgressById = useCallback((petId) => {
    const pet = getPetById(petId);
    return pet?.progress ?? 0;
  }, [getPetById]);

  const effectiveTutor = useMemo(() => {
    if (!isAdmin) return state.tutor;

    const xpt = 999999;
    const levelMeta = getLevel(xpt);

    return {
      ...state.tutor,
      xpt,
      gpts: 999999,
      level: 20,
      levelMeta,
      progress: 100,
      nextLevel: null,
    };
  }, [isAdmin, state.tutor]);

  const effectiveStats = useMemo(() => {
    if (!isAdmin) return state.stats;

    return {
      ...state.stats,
      consultCount: Math.max(state.stats.consultCount || 0, 999),
      postCount: Math.max(state.stats.postCount || 0, 999),
      studioCount: Math.max(state.stats.studioCount || 0, 999),
      petCount: Math.max(state.stats.petCount || 0, state.cats.length || 1),
      diaryCount: Math.max(state.stats.diaryCount || 0, 999),
    };
  }, [isAdmin, state.stats, state.cats.length]);

  const value = {
    tutor: effectiveTutor,
    cats: state.cats,
    petMap: state.petMap,
    recentEvents: state.recentEvents,
    streak: isAdmin ? 999 : state.streak,
    stats: effectiveStats,
    loaded: state.loaded,

    xp: effectiveTutor.xpt,
    xpt: effectiveTutor.xpt,
    points: effectiveTutor.gpts,
    gpts: effectiveTutor.gpts,
    badges: effectiveTutor.badges,
    level: effectiveTutor.levelMeta,
    progress: effectiveTutor.progress,
    nextLevel: effectiveTutor.nextLevel,

    hasBadge: (code) =>
      Array.isArray(effectiveTutor.badges) &&
      effectiveTutor.badges.some((b) => String(b).toLowerCase() === String(code).toLowerCase()),

    getPetById,
    getPetLevel: getPetLevelById,
    getPetProgress: getPetProgressById,

    refreshGamification,
    earnXP,
    earnPoints,
    earnPetXP,
    spendPoints,
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

export function PointsChip({ onClick }) {
  const { gpts } = useGamification();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
      style={{ background: '#8B4AFF12', border: '1.5px solid #8B4AFF25' }}
    >
      <PawPrint size={11} style={{ color: '#8B4AFF' }} fill="#8B4AFF" />
      <span className="text-[10px] font-black" style={{ color: '#8B4AFF' }}>
        {Number(gpts || 0).toLocaleString('pt-BR')} GPTS
      </span>
    </motion.button>
  );
}

export function XPBar({ onClick }) {
  const { tutor, streak } = useGamification();
  const { xpt, gpts, levelMeta, progress, nextLevel } = tutor;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-[20px] border w-full"
      style={{ background: `${levelMeta.color}08`, borderColor: `${levelMeta.color}25` }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
        style={{
          background: `${levelMeta.color}18`,
          border: `2px solid ${levelMeta.color}60`,
          boxShadow: levelMeta.glow,
        }}
      >
        {levelMeta.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] font-black" style={{ color: levelMeta.color }}>
            {levelMeta.name}
          </span>
          <span className="text-[9px] font-bold text-gray-400">
            {Number(xpt || 0).toLocaleString('pt-BR')}
            {nextLevel ? `/${Number(nextLevel.min).toLocaleString('pt-BR')}` : ''} XPT
          </span>
        </div>

        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${levelMeta.color}80, ${levelMeta.color})` }}
          />
        </div>
      </div>

      <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
        <div className="flex items-center gap-1">
          <PawPrint size={9} style={{ color: '#8B4AFF' }} fill="#8B4AFF" />
          <span className="text-[9px] font-black" style={{ color: '#8B4AFF' }}>
            {Number(gpts || 0).toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm">🔥</span>
          <span className="text-[9px] font-black text-orange-500 leading-none">
            {streak}d
          </span>
        </div>
      </div>
    </motion.button>
  );
}