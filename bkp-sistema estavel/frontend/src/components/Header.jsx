import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Edit, LogOut, Lightbulb, AlertCircle, Info, Trophy, CheckCircle, Zap, Pill, Syringe, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import useNotifications from '../hooks/useNotifications';
import NotificationCenter from './NotificationCenter';
import GamificationDrawer from './GamificationDrawer';


// ─── SISTEMA DE SELOS ─────────────────────────────────────────────────────────
// Adicione novas badges aqui conforme necessário
// A lógica checa user.badges (String[] do schema) ou user.plan
const getBadge = (user) => {
  if (!user) return null;

  const badges = user.badges || [];
  const plan   = user.plan   || 'FREE';

  if (badges.includes('FOUNDER') || plan === 'FOUNDER') {
    return {
      emoji: '👑',
      label: 'Fundador',
      bg:    'bg-[#ebfc66]',
      text:  'text-[#6158ca]',
      ring:  'ring-[#ebfc66]',
    };
  }
  if (plan === 'PREMIUM' || badges.includes('PREMIUM')) {
    return {
      emoji: '⭐',
      label: 'Premium',
      bg:    'bg-amber-400',
      text:  'text-white',
      ring:  'ring-amber-400',
    };
  }
  if (badges.includes('VET_FRIEND')) {
    return {
      emoji: '🩺',
      label: 'Vet',
      bg:    'bg-blue-500',
      text:  'text-white',
      ring:  'ring-blue-400',
    };
  }
  return null; // usuário FREE sem badge
};

const CORES = { primary: "#6158ca", accent: "#ebfc66" };

export default function Header() {
  const navigate = useNavigate();
  const touch    = useSensory();
  const { user, setUser, signOut } = useContext(AuthContext);

  const [isMenuOpen,    setIsMenuOpen]    = useState(false);
  const [smartTips,   setSmartTips]   = useState([]);
  const [smartLoaded, setSmartLoaded] = useState(false);
  const [isNotifOpen,   setIsNotifOpen]   = useState(false);
  const [isGamifOpen,   setIsGamifOpen]   = useState(false);
  const [tipIndex,    setTipIndex]    = useState(0);
  const [photoUrl,    setPhotoUrl]    = useState(user?.photoUrl || '');
  const [userPoints,  setUserPoints]  = useState(0);
  const [userLevel,   setUserLevel]   = useState(null);

  const badge = getBadge(user);

  // Hook de notificações reais
  const {
    notifications,
    grouped,
    unreadCount,
    urgentCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    addLocal,
  } = useNotifications(user?.id, { pollInterval: 30000 });

  // ─── DICAS DINÂMICAS — baseadas nos dados reais do tutor ────────────────────
  const firstName = user?.name?.split(' ')[0] || 'Tutor';

  // Dicas de fallback (estáticas) usadas enquanto dados não carregam
  const STATIC_TIPS = [
    { text: `Troque a água fresca do seu gato agora, ${firstName}!`, icon: AlertCircle, color: '#6158ca' },
    { text: 'Gatos bebem mais água em fontes correntes — considere uma bebedouro!', icon: Lightbulb, color: '#D97706' },
    { text: 'Brincar 15 minutos por dia reduz ansiedade felina em até 60%.', icon: Star, color: '#16A34A' },
    { text: 'Gatos escondem dor naturalmente — fique atento a mudanças de comportamento.', icon: Info, color: '#6158ca' },
  ];

  // Busca dicas inteligentes vinculadas ao perfil
  useEffect(() => {
    if (!user?.id || smartLoaded) return;

    const buildSmartTips = async () => {
      const tips = [];
      try {
        // 1. Tratamentos ativos
        const petsRes = await api.get('/pets');
        const pets = Array.isArray(petsRes.data) ? petsRes.data.filter(p => !p.isMemorial && !p.isArchived) : [];

        for (const pet of pets.slice(0, 3)) {
          try {
            const tRes = await api.get(`/treatments?petId=${pet.id}`);
            const active = (tRes.data || []).filter(s => s.active);
            for (const sched of active.slice(0, 2)) {
              const overdue = sched.overdueCount || 0;
              if (overdue > 0) {
                tips.push({
                  text: `⚠️ ${overdue} dose${overdue > 1 ? 's' : ''} atrasada${overdue > 1 ? 's' : ''} de ${sched.title} para ${pet.name}`,
                  icon: Pill, color: '#DC2626', urgent: true,
                  cta: { label: 'Ver tratamento', path: `/cat/${pet.id}` },
                });
              } else if (sched.nextDose) {
                const nextAt = new Date(sched.nextDose.scheduledAt);
                const diffMin = Math.floor((nextAt - Date.now()) / 60000);
                if (diffMin >= 0 && diffMin <= 120) {
                  tips.push({
                    text: `💊 Próxima dose de ${sched.title} para ${pet.name} em ${diffMin < 60 ? diffMin + 'min' : Math.ceil(diffMin/60) + 'h'}`,
                    icon: Pill, color: '#6158ca',
                    cta: { label: 'Ver', path: `/cat/${pet.id}` },
                  });
                }
              }
            }
          } catch {}

          // 2. Vacinas — via health-records
          try {
            const hrRes = await api.get(`/health-records?petId=${pet.id}`);
            const vaccines = (hrRes.data || []).filter(r => r.type === 'VACCINE' && r.nextDueDate);
            const now = new Date();
            for (const v of vaccines) {
              const due = new Date(v.nextDueDate);
              const diffDays = Math.ceil((due - now) / 86400000);
              if (diffDays < 0) {
                tips.push({
                  text: `🔴 Vacina ${v.title || ''} de ${pet.name} está VENCIDA há ${Math.abs(diffDays)} dias`,
                  icon: Syringe, color: '#DC2626', urgent: true,
                  cta: { label: 'Registrar', path: `/cat/${pet.id}/health-new` },
                });
              } else if (diffDays <= 14) {
                tips.push({
                  text: `💉 Vacina de ${pet.name} vence em ${diffDays} dia${diffDays !== 1 ? 's' : ''}`,
                  icon: Syringe, color: '#D97706',
                  cta: { label: 'Agendar', path: `/cat/${pet.id}/health-new` },
                });
              }
            }
          } catch {}
        }

        // 3. Gamificação — próximo nível
        try {
          const gRes = await api.get(`/gamification/points/${user.id}`);
          const pts = gRes.data?.points || 0;
          const level = gRes.data?.level;
          if (level?.nextMin) {
            const remaining = level.nextMin - pts;
            if (remaining <= 30 && remaining > 0) {
              tips.push({
                text: `🏆 Faltam só ${remaining} pts para você virar ${level.nextLabel}!`,
                icon: Trophy, color: '#F59E0B',
                cta: { label: 'Ver progresso', path: null, action: 'gamif' },
              });
            }
          }
          if (pts > 0 && tips.length === 0) {
            tips.push({
              text: `⚡ Você tem ${pts} pts! Registre uma consulta iGentVet e ganhe mais 10 pts.`,
              icon: Zap, color: '#6158ca',
              cta: { label: 'Consultar', path: '/igentvet' },
            });
          }
        } catch {}

      } catch {}

      // Mescla dicas dinâmicas com estáticas (urgentes primeiro)
      const urgentTips = tips.filter(t => t.urgent);
      const normalTips = tips.filter(t => !t.urgent);
      const finalTips = [...urgentTips, ...normalTips, ...STATIC_TIPS].slice(0, 8);
      setSmartTips(finalTips.length > 0 ? finalTips : STATIC_TIPS);
      setSmartLoaded(true);
    };

    buildSmartTips();
    // Recarrega a cada 2 minutos
    const interval = setInterval(buildSmartTips, 2 * 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const TIPS = smartTips.length > 0 ? smartTips : STATIC_TIPS;

  // Rotação de dicas
  useEffect(() => {
    const id = setInterval(() => setTipIndex(p => (p + 1) % TIPS.length), 6000);
    return () => clearInterval(id);
  }, [TIPS.length]);

  // Mantém foto atualizada se o usuário vier do ProfileEdit
  useEffect(() => {
    if (!user?.id) return;
    api.get(`/users/${user.id}/profile`)
      .then(res => {
        if (res.data?.photoUrl) {
          setPhotoUrl(res.data.photoUrl);
          setUser(prev => ({ ...prev, photoUrl: res.data.photoUrl }));
        }
      })
      .catch(() => {});
  }, [user?.id]);

  // Ouve evento do NotificationCenter para abrir gaveta de gamificação
  useEffect(() => {
    const handler = () => setIsGamifOpen(true);
    window.addEventListener('open-gamif-drawer', handler);
    return () => window.removeEventListener('open-gamif-drawer', handler);
  }, []);

  // Busca pontos e nível de gamificação
  useEffect(() => {
    if (!user?.id) return;
    api.get(`/gamification/points/${user.id}`)
      .then(res => {
        setUserPoints(res.data?.points || 0);
        setUserLevel(res.data?.level || null);
      })
      .catch(() => {}); // silencioso — gamificação é progressiva
  }, [user?.id]);

  // Sincroniza quando o contexto muda (ex: volta do ProfileEdit)
  useEffect(() => {
    if (user?.photoUrl) setPhotoUrl(user.photoUrl);
  }, [user?.photoUrl]);

  const menuItems = [
    { label: "Perfil", icon: User,   color: "text-blue-500", path: "/tutor-profile" },
    { label: "Editar", icon: Edit,   color: "text-gray-500", path: "/profile/edit"  },
    { label: "Sair",   icon: LogOut, color: "text-red-500",
      action: () => { setIsMenuOpen(false); signOut(); navigate('/login'); }
    },
  ];

  return (
    <>
    <div className="relative mb-6">
      <div className="relative z-50 px-4 pt-4">

        {/* ── BARRA AMARELA ── */}
        <div className="h-20 rounded-[60px] flex justify-between items-center px-8 shadow-lg border-t-4 border-[#B8A8E8] relative"
          style={{ backgroundColor: CORES.accent }}>

          {/* Logo */}
          <div className="w-32 h-10 relative flex items-center">
            <img src="/logo-full.png" alt="Gatedo" className="w-full h-full object-contain object-left" />
          </div>

          <div className="flex gap-3 items-center">

            {/* ── GAMIFICAÇÃO ── */}
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => { touch(); setIsGamifOpen(true); setIsMenuOpen(false); setIsNotifOpen(false); }}
              className="p-2 rounded-full bg-white/40 text-[#6158ca] hover:bg-white/60 backdrop-blur-sm transition-colors relative">
              <Trophy size={20} />
              {userPoints > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[7px] font-black bg-[#DFFF40] text-[#5A7000] px-1 py-0.5 rounded-full leading-none border border-[#ebfc66]">
                  {userPoints >= 1000 ? `${Math.floor(userPoints/1000)}k` : userPoints}
                </span>
              )}
            </motion.button>

            {/* ── NOTIFICAÇÕES ── */}
            <div className="relative">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => { touch('success'); setIsNotifOpen(v => !v); }}
                className={`p-2 rounded-full backdrop-blur-sm transition-colors relative ${isNotifOpen ? 'bg-white text-[#6158ca]' : 'bg-white/40 text-[#6158ca] hover:bg-white/60'}`}>
                <Bell size={20} className={isNotifOpen ? 'fill-current' : ''} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[8px] font-black text-white border-2 border-[#ebfc66] px-0.5"
                    style={{ background: urgentCount > 0 ? '#DC2626' : '#6158ca' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
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
                    userPoints={userPoints}
                    userLevel={userLevel}
                    onClose={() => setIsNotifOpen(false)}
                    onMarkAsRead={markAsRead}
                    onMarkAllAsRead={markAllAsRead}
                    onDismiss={dismiss}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* ── AVATAR + BADGE + MENU ── */}
            <div className="relative">
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={e => { e.stopPropagation(); touch(); setIsMenuOpen(v => !v); }}
                className={`rounded-full shadow-sm transition-all border-2 relative overflow-hidden flex items-center justify-center
                  ${photoUrl ? `w-10 h-10 p-0 border-[#6158ca] ${badge ? `ring-2 ring-offset-1 ${badge.ring}` : ''}` 
                             : 'p-2 bg-[#6158ca] text-[#ebfc66] border-transparent'}`}
              >
                {photoUrl
                  ? <img src={photoUrl} alt={user?.name} className="w-full h-full object-cover rounded-full" />
                  : <User size={20} />}
              </motion.button>

              {/* Selo de badge — só exibe se o usuário tiver badge */}
              {badge && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  title={badge.label}
                  className={`absolute -bottom-1 -right-1 ${badge.bg} rounded-full w-5 h-5 flex items-center justify-center shadow-md border-2 border-[#ebfc66] z-50 pointer-events-none text-[10px] leading-none`}
                >
                  {badge.emoji}
                </motion.div>
              )}

              {/* Menu dropdown */}
              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-14 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[60]">

                    {/* Cabeçalho com avatar e badge */}
                    {user && (
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0">
                          {photoUrl
                            ? <img src={photoUrl} className="w-full h-full object-cover" />
                            : <User size={18} className="text-gray-400 m-auto mt-1.5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-0.5">Olá,</p>
                          <p className="text-sm font-black text-[#6158ca] truncate">{user.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {badge && (
                              <span className={`text-[8px] ${badge.bg} ${badge.text} px-1.5 py-0.5 rounded-full font-black uppercase`}>
                                {badge.emoji} {badge.label}
                              </span>
                            )}
                            {userPoints > 0 && (
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                                style={{ background: '#DFFF4030', color: '#5A7000' }}>
                                <Zap size={7} />
                                {userPoints.toLocaleString('pt-BR')} pts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="p-1">
                      {menuItems.map((item, idx) => (
                        <button key={idx}
                          onClick={() => { touch(); setIsMenuOpen(false); item.path ? navigate(item.path) : item.action?.(); }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left">
                          <div className={`p-1.5 rounded-full bg-gray-50 ${item.color}`}><item.icon size={16} /></div>
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

      {/* ── CARD DE DICAS DINÂMICO ── */}
      <div className="mx-4 -mt-8 relative z-10">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="rounded-[35px] px-6 pb-5 pt-12 text-white shadow-lg relative overflow-hidden"
          style={{ backgroundColor: TIPS[tipIndex]?.urgent ? '#B91C1C' : CORES.primary }}>
          <div className="relative z-10">
            <AnimatePresence mode="wait">
              <motion.div key={tipIndex}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-3">
                <div className="bg-white/20 p-2 rounded-full mt-0.5 flex-shrink-0">
                  {React.createElement(TIPS[tipIndex].icon, { size: 18, className: "text-[#ebfc66]" })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-wider mb-0.5">
                    {TIPS[tipIndex]?.urgent ? '⚠ Alerta' : 'Dica do Momento'}
                  </p>
                  <p className="text-sm font-bold leading-tight">{TIPS[tipIndex]?.text}</p>
                  
                  {/* CTA contextual */}
                  {TIPS[tipIndex]?.cta && (
                    <motion.button
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                      onClick={() => {
                        touch();
                        const cta = TIPS[tipIndex].cta;
                        if (cta.action === 'gamif') { setIsGamifOpen(true); }
                        else if (cta.path) { navigate(cta.path); }
                      }}
                      className="mt-2.5 text-[10px] font-black px-3 py-1.5 rounded-full inline-flex items-center gap-1"
                      style={{ background: 'rgba(255,255,255,0.2)', color: '#DFFF40', backdropFilter: 'blur(4px)' }}>
                      {TIPS[tipIndex].cta.label} →
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Indicadores de slide (dots) */}
            {TIPS.length > 1 && (
              <div className="flex gap-1 mt-4 justify-end">
                {TIPS.slice(0, Math.min(TIPS.length, 6)).map((_, i) => (
                  <button key={i} onClick={() => setTipIndex(i)}
                    className="rounded-full transition-all"
                    style={{
                      width: i === tipIndex % Math.min(TIPS.length, 6) ? 16 : 5,
                      height: 5,
                      background: i === tipIndex % Math.min(TIPS.length, 6) ? '#DFFF40' : 'rgba(255,255,255,0.3)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 w-32 h-32 bg-contain bg-no-repeat bg-bottom pointer-events-none"
            style={{ backgroundImage: 'url(/cat-pattern.png)' }} />
        </motion.div>
      </div>
    </div>

      {/* Gaveta de Gamificação */}
      <GamificationDrawer isOpen={isGamifOpen} onClose={() => setIsGamifOpen(false)} />
    </>
  );
}