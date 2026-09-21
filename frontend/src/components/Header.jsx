import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  User,
  Edit,
  LogOut,
  AlertCircle,
  Info,
  Trophy,
  Zap,
  Pill,
  Syringe,
  Star,
  ShieldAlert,
  Clock3,
  Sparkles,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import api from '../services/api';
import useNotifications from '../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import GamificationDrawer from './GamificationDrawer';
import { getPrimaryTutorBadge } from '../utils/membershipMeta';
import { brandAssets } from '../brand/assets';

const VACCINE_ALERT_WINDOW_DAYS = 30;

const getBadge = (user) => {
  if (!user) return null;

  const badges = user.badges || [];
  const plan = String(user.plan || 'FREE').toUpperCase();
  const primaryBadge = getPrimaryTutorBadge(user);

  if (primaryBadge) {
    return primaryBadge;
  }

  if (
    badges.includes('FOUNDER_EARLY') ||
    badges.includes('FOUNDER') ||
    badges.includes('FOUNDING_MEMBER') ||
    plan === 'FOUNDER_EARLY' ||
    plan === 'FOUNDER'
  ) {
    return {
      emoji: '👑',
      label: 'Founder Early',
      bg: 'bg-[#73ffb2]',
      text: 'text-[#8b4dff]',
      ring: 'ring-[#edff61]',
    };
  }

  if (
    plan === 'TESTER_FRIENDLY' ||
    plan === 'PREMIUM' ||
    badges.includes('TESTER_FRIENDLY') ||
    badges.includes('VIP') ||
    badges.includes('PREMIUM')
  ) {
    return {
      emoji: '⭐',
      label: 'Tester Friendly',
      bg: 'bg-[#edff61]',
      text: 'text-[#8b4dff]',
      ring: 'ring-[#edff61]',
    };
  }

  if (plan === 'TUTOR_MASTER' || badges.includes('TUTOR_MASTER')) {
    return {
      emoji: '💎',
      label: 'Tutor Master',
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      ring: 'ring-emerald-200',
    };
  }

  if (plan === 'TUTOR_PLUS' || badges.includes('TUTOR_PLUS')) {
    return {
      emoji: '✨',
      label: 'Tutor Plus',
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      ring: 'ring-amber-200',
    };
  }

  if (badges.includes('VET_FRIEND')) {
    return {
      emoji: '🩺',
      label: 'Vet',
      bg: 'bg-[#8b4dff]',
      text: 'text-white',
      ring: 'ring-[#8b4dff]',
    };
  }

  return null;
};

const CORES = { primary: '#8B4AFF', accent: '#edff61' };

export default function Header() {
  const navigate = useNavigate();
  const touch = useSensory();
  const { user, setUser, signOut } = useContext(AuthContext);

  const {
    tutor,
    xpt,
    gpts,
    level,
    nextLevel,
    progress,
    stats,
    refreshGamification,
  } = useGamification();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [smartTips, setSmartTips] = useState([]);
  const [smartLoaded, setSmartLoaded] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isGamifOpen, setIsGamifOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const [tipDismissed, setTipDismissedState] = useState(() => {
    try { return sessionStorage.getItem('gatedo_tip_dismissed_day') === todayKey; } catch { return false; }
  });
  const setTipDismissed = (value) => {
    setTipDismissedState(value);
    try { if (value) sessionStorage.setItem('gatedo_tip_dismissed_day', todayKey); } catch {}
  };
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');

  const badge = getBadge(user);

  const {
    notifications,
    grouped,
    unreadCount,
    urgentCount,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications(user?.id, { pollInterval: 30000 });

  const firstName = user?.name?.split(' ')[0] || 'Tutor';

  const STATIC_TIPS = [
    {
      text: `Troque a água fresca do seu gato agora, ${firstName}!`,
      icon: AlertCircle,
      urgent: false,
      cta: null,
    },
    {
      text: 'Gatos escondem dor naturalmente — fique atento a mudanças de comportamento.',
      icon: Info,
      urgent: false,
      cta: null,
    },
    {
      text: 'Brincar 15 minutos por dia reduz ansiedade felina e melhora o bem-estar.',
      icon: Star,
      urgent: false,
      cta: null,
    },
  ];

  const healthNotifications = useMemo(
    () =>
      notifications.filter((n) =>
        ['MED_REMINDER', 'VACCINE_DUE', 'VACCINE_OVERDUE', 'IGENT_ALERT', 'IGENT_PREDICTIVE'].includes(n.type)
      ),
    [notifications]
  );

  useEffect(() => {
    if (!user?.id || smartLoaded) return;

    const buildSmartTips = async () => {
      const tips = [];

      try {
        const petsRes = await api.get('/pets');
        const pets = Array.isArray(petsRes.data)
          ? petsRes.data.filter((p) => !p.isMemorial && !p.isArchived)
          : [];

        for (const pet of pets.slice(0, 4)) {
          try {
            const tRes = await api.get(`/treatments?petId=${pet.id}`);
            const active = (tRes.data || []).filter((s) => s.active);

            for (const sched of active.slice(0, 2)) {
              const overdue = sched.overdueCount || 0;

              if (overdue > 0) {
                tips.push({
                  text: `${pet.name} tem ${overdue} dose${overdue > 1 ? 's' : ''} atrasada${overdue > 1 ? 's' : ''} de ${sched.title}.`,
                  icon: Pill,
                  urgent: true,
                  cta: { label: 'Ver tratamento', path: `/cat/${pet.id}?tab=SAUDE` },
                });
              } else if (sched.nextDose) {
                const nextAt = new Date(sched.nextDose.scheduledAt);
                const diffMin = Math.floor((nextAt - Date.now()) / 60000);

                if (diffMin >= 0 && diffMin <= 120) {
                  tips.push({
                    text: `${pet.name} tem próxima dose de ${sched.title} em ${diffMin < 60 ? `${diffMin}min` : `${Math.ceil(diffMin / 60)}h`}.`,
                    icon: Clock3,
                    urgent: false,
                    cta: { label: 'Abrir saúde', path: `/cat/${pet.id}?tab=SAUDE` },
                  });
                }
              }
            }
          } catch {}

          try {
            const hrRes = await api.get(`/health-records?petId=${pet.id}`);
            const vaccines = (hrRes.data || []).filter((r) => r.type === 'VACCINE' && r.nextDueDate);

            const now = new Date();

            for (const v of vaccines) {
              const due = new Date(v.nextDueDate);
              const diffDays = Math.ceil((due - now) / 86400000);

              if (diffDays < 0) {
                tips.push({
                  text: `A vacina ${v.title || 'registrada'} de ${pet.name} está vencida há ${Math.abs(diffDays)} dia(s).`,
                  icon: Syringe,
                  urgent: true,
                  cta: { label: 'Ver vacinas', path: `/cat/${pet.id}?tab=IMUNIZANTES` },
                });
              } else if (diffDays <= VACCINE_ALERT_WINDOW_DAYS) {
                tips.push({
                  text: `${pet.name} tem vacina prevista para os próximos ${diffDays} dia(s).`,
                  icon: Syringe,
                  urgent: false,
                  cta: { label: 'Abrir vacinas', path: `/cat/${pet.id}?tab=IMUNIZANTES` },
                });
              }
            }
          } catch {}
        }

        const targetXpt = nextLevel?.min ?? null;
        if (targetXpt) {
          const remaining = Math.max(0, targetXpt - Number(xpt || 0));
          if (remaining > 0 && remaining <= 50) {
            tips.push({
              text: `Faltam só ${remaining} XPT para você chegar ao próximo nível: ${nextLevel.name}.`,
              icon: Trophy,
              urgent: false,
              cta: { label: 'Ver progresso', action: 'gamif' },
            });
          }
        }

        if ((stats?.consultCount || 0) > 0) {
          tips.push({
            text: `Você já realizou ${stats.consultCount} consulta${stats.consultCount > 1 ? 's' : ''} no iGentVet. Continue registrando sinais para evoluir mais rápido.`,
            icon: Sparkles,
            urgent: false,
            cta: { label: 'Abrir iGentVet', path: '/igentvet' },
          });
        }
      } catch {}

      const urgentTips = tips.filter((t) => t.urgent);
      const normalTips = tips.filter((t) => !t.urgent);

      const finalTips = [...urgentTips, ...normalTips, ...STATIC_TIPS].slice(0, 8);
      setSmartTips(finalTips.length > 0 ? finalTips : STATIC_TIPS);
      setSmartLoaded(true);
    };

    buildSmartTips();
    const interval = setInterval(buildSmartTips, 2 * 60000);
    return () => clearInterval(interval);
  }, [user?.id, smartLoaded, firstName, xpt, nextLevel, stats?.consultCount]);

  const TIPS = smartTips.length > 0 ? smartTips : STATIC_TIPS;

  useEffect(() => {
    if (!TIPS.length) return;
    const id = setInterval(() => setTipIndex((p) => (p + 1) % TIPS.length), 6000);
    return () => clearInterval(id);
  }, [TIPS.length]);

  useEffect(() => {
    if (!user?.id) return;

    api.get(`/users/${user.id}/profile`)
      .then((res) => {
        if (res.data?.photoUrl) {
          setPhotoUrl(res.data.photoUrl);
          setUser((prev) => ({ ...prev, photoUrl: res.data.photoUrl }));
        }
      })
      .catch(() => {});
  }, [user?.id, setUser]);

  useEffect(() => {
    const handler = () => setIsGamifOpen(true);
    window.addEventListener('open-gamif-drawer', handler);
    return () => window.removeEventListener('open-gamif-drawer', handler);
  }, []);

  useEffect(() => {
    const refreshHandler = async () => {
      await refreshGamification?.();
    };

    window.addEventListener('gatedo-gamification-refresh', refreshHandler);
    return () => window.removeEventListener('gatedo-gamification-refresh', refreshHandler);
  }, [refreshGamification]);

  useEffect(() => {
    if (user?.photoUrl) setPhotoUrl(user.photoUrl);
  }, [user?.photoUrl]);

  const menuItems = [
    { label: 'Perfil', icon: User, color: 'text-blue-500', path: '/tutor-profile' },
    { label: 'Editar', icon: Edit, color: 'text-gray-500', path: '/profile/edit' },
    {
      label: 'Sair',
      icon: LogOut,
      color: 'text-red-500',
      action: () => {
        setIsMenuOpen(false);
        signOut();
        navigate('/login');
      },
    },
  ];

  return (
    <>
      <div className="relative mb-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-16"
          style={{
            background: 'linear-gradient(180deg, rgb(130, 63, 255) 0%, rgba(130, 63, 255, 0.83) 10%, rgba(140, 74, 255, 0.33) 50%, rgba(139,74,255,0) 100%)',
          }}
        />
        <div className="relative z-50 px-4 pt-4">
          <div
            className="h-20 rounded-[60px] flex justify-between items-center px-4 shadow-lg border-t-4 border-[#8b4dff] relative"
            style={{ backgroundColor: CORES.accent }}
          >
            <div className="w-32 h-8 relative flex items-center">
              <img src={brandAssets.gatedoFull} alt="Gatedo" className="w-full h-full object-contain object-left" />
            </div>

            <div className="flex gap-2 items-center">
              <motion.button
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  touch('success');
                  setIsGamifOpen(true);
                  setIsMenuOpen(false);
                  setIsNotifOpen(false);
                }}
                className="p-2 rounded-full bg-white/40 text-[#8b4dff] hover:bg-white/70 backdrop-blur-sm transition-colors relative"
                title={`${Number(gpts || 0).toLocaleString('pt-BR')} GPTS · ${Number(xpt || 0).toLocaleString('pt-BR')} XPT`}
              >
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2.8, repeat: Infinity, ease: 'linear' }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)',
                  }}
                />

                <Trophy size={20} className="relative z-10" />

                {Number(gpts || 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 text-[7px] font-black bg-[#c78bff] text-[#fff] px-1 py-0.5 rounded-full leading-none border border-[#8b4dff]">
                    {gpts >= 1000 ? `${Math.floor(gpts / 1000)}k` : gpts}
                  </span>
                )}

                {Number(progress || 0) > 0 && (
                  <span
                    className="absolute left-1 right-1 bottom-0.5 h-[3px] rounded-full overflow-hidden"
                    style={{ background: 'rgba(99, 15, 255, 0.18)' }}
                  >
                    <motion.span
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(6, progress)}%` }}
                      transition={{ duration: 0.9, ease: 'easeOut' }}
                      className="block h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg,#8B4AFF,#DFFF40)' }}
                    />
                  </span>
                )}
              </motion.button>

              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    touch('success');
                    setIsNotifOpen((v) => !v);
                    setIsMenuOpen(false);
                    setIsGamifOpen(false);
                  }}
                  className={`p-2 rounded-full backdrop-blur-sm transition-colors relative ${
                    isNotifOpen ? 'bg-white text-[#8b4dff]' : 'bg-white/70 text-[#8b4dff] hover:bg-white/60'
                  }`}
                >
                  <Bell size={20} className={isNotifOpen ? 'fill-current' : ''} />

                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[8px] font-black text-white border-2 border-[#8b4dff] px-0.5"
                      style={{ background: urgentCount > 0 ? '#ff0559' : '#8b4dff' }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}

                  {healthNotifications.length > 0 && (
                    <span className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 rounded-full bg-amber-400 border border-[#8b4dff] flex items-center justify-center">
                      <ShieldAlert size={8} className="text-[#5A3A00]" />
                    </span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {isNotifOpen && (
                    <NotificationCenter
                      notifications={notifications}
                      grouped={grouped}
                      unreadCount={unreadCount}
                      urgentCount={urgentCount}
                      userPoints={Number(gpts || 0)}
                      userLevel={level}
                      onClose={() => setIsNotifOpen(false)}
                      onMarkAsRead={markAsRead}
                      onMarkAllAsRead={markAllAsRead}
                      onDismiss={dismiss}
                    />
                  )}
                </AnimatePresence>
              </div>

              <div className="relative">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    touch();
                    setIsMenuOpen((v) => !v);
                  }}
                  className={`rounded-full shadow-sm transition-all border-2 relative overflow-hidden flex items-center justify-center ${
                    photoUrl
                      ? `w-10 h-10 p-0 border-[#8B4AFF] ${badge ? `ring-2 ring-offset-1 ${badge.ring}` : ''}`
                      : 'p-2 bg-[#8b4dff] text-[#ebfc66] border-transparent'
                  }`}
                >
                  {photoUrl ? (
                    <img src={photoUrl} alt={user?.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User size={20} />
                  )}
                </motion.button>

                {badge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    title={badge.label}
                    className={`absolute -bottom-1 -right-1 ${badge.bg} rounded-full w-5 h-5 flex items-center justify-center shadow-md border-2 border-[#8b4dff] z-50 pointer-events-none text-[10px] leading-none`}
                  >
                    {badge.emoji}
                  </motion.div>
                )}

                <AnimatePresence>
                  {isMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[60]"
                    >
                      {user && (
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                            {photoUrl ? (
                              <img src={photoUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <User size={18} className="text-gray-400 m-auto mt-1.5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-0.5">
                              Olá,
                            </p>
                            <p className="text-sm font-black text-[#8b4dff] truncate">{user.name}</p>

                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {badge && (
                                <span className={`text-[8px] ${badge.bg} ${badge.text} px-1.5 py-0.5 rounded-full font-black uppercase`}>
                                  {badge.emoji} {badge.label}
                                </span>
                              )}

                              <span
                                className="text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                                style={{ background: '#DFFF4030', color: '#5A7000' }}
                              >
                                <Zap size={7} />
                                {Number(xpt || 0).toLocaleString('pt-BR')} XPT
                              </span>

                              <span
                                className="text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                                style={{ background: '#8B4AFF14', color: '#8B4AFF' }}
                              >
                                <Trophy size={7} />
                                {Number(gpts || 0).toLocaleString('pt-BR')} GPTS
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-1">
                        {menuItems.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              touch();
                              setIsMenuOpen(false);
                              item.path ? navigate(item.path) : item.action?.();
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                          >
                            <div className={`p-1.5 rounded-full bg-gray-50 ${item.color}`}>
                              <item.icon size={16} />
                            </div>
                            <span className="text-xs font-bold text-gray-700">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {!tipDismissed && TIPS[tipIndex] && (
            <div className="mx-4 mt-3 relative z-10">
              <motion.div
                key={tipIndex}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="rounded-[22px] px-4 py-3 text-white shadow-lg flex items-start gap-2.5"
                style={{ backgroundColor: TIPS[tipIndex]?.urgent ? '#B91C1C' : CORES.primary }}
              >
                <div className="bg-white/20 p-1.5 rounded-full flex-shrink-0 mt-0.5">
                  {React.createElement(TIPS[tipIndex].icon, { size: 13, className: 'text-[#edff61]' })}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold leading-snug">
                    {firstName ? <span className="opacity-70">Oi, {firstName} — </span> : null}
                    {TIPS[tipIndex]?.text}
                  </p>

                  {TIPS[tipIndex]?.cta && (
                    <button
                      onClick={() => {
                        touch();
                        const cta = TIPS[tipIndex].cta;
                        if (cta.action === 'gamif') setIsGamifOpen(true);
                        else if (cta.path) navigate(cta.path);
                      }}
                      className="mt-1.5 text-[10px] font-black px-2.5 py-1 rounded-full inline-block"
                      style={{ background: 'rgba(255,255,255,0.2)', color: '#edff61' }}
                    >
                      {TIPS[tipIndex].cta.label}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    touch();
                    setTipDismissed(true);
                  }}
                  aria-label="Dispensar"
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.16)' }}
                >
                  <X size={11} className="text-white/80" />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <GamificationDrawer isOpen={isGamifOpen} onClose={() => setIsGamifOpen(false)} />
    </>
  );
}
