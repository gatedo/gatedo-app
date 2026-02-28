import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Edit2, Heart, Award,
  ChevronRight, LogOut, Crown, LifeBuoy, User,
  MapPin, Phone, Trophy, Zap, Sparkles, ChevronUp, PawPrint
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import useSensory from '../hooks/useSensory';
import api from '../services/api';
import GamificationDrawer from '../components/GamificationDrawer';

// ─── NÍVEIS DO TUTOR ──────────────────────────────────────────────────────────
const TUTOR_LEVELS = [
  { min: 0,    label: 'Gateiro Curioso',   emoji: '🐾', color: '#9CA3AF' },
  { min: 100,  label: 'Gateiro Raiz',      emoji: '😺', color: '#6158ca' },
  { min: 300,  label: 'Guardião Felino',   emoji: '🛡️', color: '#0EA5E9' },
  { min: 600,  label: 'Especialista IA',   emoji: '🤖', color: '#8B5CF6' },
  { min: 1000, label: 'Embaixador Gatedo', emoji: '👑', color: '#F59E0B' },
  { min: 2000, label: 'Lenda Felina',      emoji: '✨', color: '#EC4899' },
];

// ─── NÍVEIS DO GATO ───────────────────────────────────────────────────────────
const CAT_LEVELS = [
  { min: 0,   label: 'Filhote',     emoji: '🐱', color: '#9CA3AF' },
  { min: 50,  label: 'Explorador',  emoji: '🐈', color: '#6158ca' },
  { min: 150, label: 'Aventureiro', emoji: '⚡', color: '#0EA5E9' },
  { min: 300, label: 'Veterano',    emoji: '🛡️', color: '#16A34A' },
  { min: 500, label: 'Lendário',    emoji: '👑', color: '#F59E0B' },
];

const getTutorLevel = (pts = 0) => {
  for (let i = TUTOR_LEVELS.length - 1; i >= 0; i--)
    if (pts >= TUTOR_LEVELS[i].min) return { ...TUTOR_LEVELS[i], index: i };
  return { ...TUTOR_LEVELS[0], index: 0 };
};

const getNextTutorLevel = (pts = 0) => {
  const idx = TUTOR_LEVELS.findIndex((l, i) =>
    pts >= l.min && (i === TUTOR_LEVELS.length - 1 || pts < TUTOR_LEVELS[i + 1].min)
  );
  return idx < TUTOR_LEVELS.length - 1 ? TUTOR_LEVELS[idx + 1] : null;
};

const getCatLevel = (xp = 0) => {
  for (let i = CAT_LEVELS.length - 1; i >= 0; i--)
    if (xp >= CAT_LEVELS[i].min) return CAT_LEVELS[i];
  return CAT_LEVELS[0];
};

// ─── MINI CAT XP CARD ────────────────────────────────────────────────────────
function CatXPCard({ cat }) {
  const xp  = cat.xp || 0;
  const lvl = getCatLevel(xp);
  const next = CAT_LEVELS.find(l => l.min > xp);
  const pct  = next
    ? Math.min(100, Math.round(((xp - lvl.min) / (next.min - lvl.min)) * 100))
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[20px] p-3.5 border border-gray-100 shadow-sm flex items-center gap-3"
    >
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 border-2"
          style={{ borderColor: `${lvl.color}40` }}>
          {cat.photoUrl
            ? <img src={cat.photoUrl} className="w-full h-full object-cover" alt={cat.name} />
            : <PawPrint size={20} className="text-gray-300 m-3" />}
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
          style={{ background: lvl.color }}>
          <span className="text-white text-[7px] font-black">{cat.level || 1}</span>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-black text-gray-800 truncate">{cat.name}</p>
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0 ml-1"
            style={{ background: `${lvl.color}15`, color: lvl.color }}>
            {lvl.emoji} {lvl.label}
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${lvl.color}, ${lvl.color}99)` }}
          />
        </div>
        <p className="text-[8px] text-gray-400 font-bold mt-0.5">
          {xp} XP {next ? `· faltam ${next.min - xp} para ${next.emoji} ${next.label}` : '· Nível máximo!'}
        </p>
      </div>
    </motion.div>
  );
}

// ─── MENU ITEM ────────────────────────────────────────────────────────────────
function MenuButton({ icon: Icon, title, subtitle, path, color = "bg-blue-50 text-blue-500", onClick }) {
  const navigate = useNavigate();
  const touch = useSensory();
  return (
    <button
      onClick={() => { touch(); onClick ? onClick() : navigate(path); }}
      className="w-full bg-white p-5 rounded-[30px] flex items-center justify-between shadow-sm border border-gray-50 active:scale-[0.98] transition-all mb-3"
    >
      <div className="flex items-center gap-4 text-left">
        <div className={`p-3 rounded-2xl ${color}`}><Icon size={20} /></div>
        <div>
          <span className="block font-black text-gray-800 text-sm uppercase tracking-tight">{title}</span>
          <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">{subtitle}</span>
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-300" />
    </button>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function TutorProfile() {
  const { user, setUser, signOut } = useContext(AuthContext);
  const navigate  = useNavigate();
  const touch     = useSensory();

  const [profile, setProfile]         = useState({ photoUrl: '', name: '', city: '', phone: '', cats: [], isFounder: false });
  const [gamif, setGamif]             = useState({ points: 0, level: TUTOR_LEVELS[0], nextLevel: TUTOR_LEVELS[1], progressPct: 0, achievements: 0 });
  const [showGamifDrawer, setShowGamifDrawer] = useState(false);
  const [showCats, setShowCats]       = useState(false);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      api.get(`/users/${user.id}/profile`),
      api.get(`/gamification/points/${user.id}`).catch(() => ({ data: { points: 0 } })),
      api.get(`/gamification/stats/${user.id}`).catch(() => ({ data: null })),
      api.get(`/pets?ownerId=${user.id}`).catch(() => ({ data: [] })),
    ]).then(([profRes, ptsRes, statsRes, petsRes]) => {
      const d    = profRes.data;
      const pts  = ptsRes.data?.points || 0;
      const lvl  = getTutorLevel(pts);
      const next = getNextTutorLevel(pts);
      const pct  = next ? Math.min(100, Math.round(((pts - lvl.min) / (next.min - lvl.min)) * 100)) : 100;

      // Conta conquistas desbloqueadas
      const s = statsRes.data;
      const unlocked = s ? [
        s.igentConsults >= 1, s.igentConsults >= 5,
        s.vaccinesRegistered >= 3,
        s.overdueVaccines === 0 && s.vaccinesRegistered > 0,
        s.controlledMeds >= 1, s.healthStreak >= 30,
        s.profileComplete, s.totalCats >= 3,
        s.memorialRegistered, s.posts >= 1,
        s.igentTipsShared >= 1, s.studioCreations >= 3,
        s.nightConsult, s.isFounder,
      ].filter(Boolean).length : 0;

      setProfile({
        photoUrl:  d.photoUrl  || user?.photoUrl || '',
        name:      d.name      || user?.name     || '',
        city:      d.city      || '',
        phone:     d.phone     || '',
        cats:      petsRes.data || [],
        isFounder: user?.plan === 'FOUNDER' || user?.badges?.includes('FOUNDER'),
      });

      setGamif({ points: pts, level: lvl, nextLevel: next, progressPct: pct, achievements: unlocked });
      setUser(prev => ({ ...prev, photoUrl: d.photoUrl || prev.photoUrl }));
    }).finally(() => setLoading(false));
  }, [user?.id]);

  const activeCats   = profile.cats.filter(c => !c.isMemorial && !c.isArchived);
  const memorialCats = profile.cats.filter(c => c.isMemorial);

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-32">

      {/* Header roxo */}
      <div className="bg-[#6158ca] h-56 rounded-b-[60px] relative overflow-hidden">
        <img src="/assets/logo-fundo1.svg" alt="" className="absolute -top-20 -right-20 w-[350px] opacity-15 pointer-events-none rotate-12" />
      </div>

      {/* Card do Tutor */}
      <div className="px-6 -mt-24 relative">
        <div className="absolute left-1/2 -translate-x-1/2 -top-16 z-20">
          <div className="w-32 h-32 rounded-[40px] border-8 border-[#F8F9FE] shadow-2xl overflow-hidden bg-gray-100 flex items-center justify-center">
            {profile.photoUrl
              ? <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              : <User size={40} className="text-gray-300" />}
          </div>
        </div>

        <div className="rounded-[45px] p-8 pt-20 shadow-xl border border-gray-50 flex flex-col items-center bg-gradient-to-t from-[#F0F2F9] to-white">

          <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter mt-2">
            {profile.name || 'Tutor'}
          </h2>

          {profile.city && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={11} className="text-gray-400" />
              <span className="text-[11px] font-bold text-gray-400">{profile.city}</span>
            </div>
          )}

          {/* Badge de nível — abre gaveta */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowGamifDrawer(true)}
            className="flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full shadow-md"
            style={{ background: `linear-gradient(135deg, ${gamif.level.color}, ${gamif.level.color}BB)` }}
          >
            <Trophy size={14} className="text-white" />
            <span className="text-[11px] font-black text-white uppercase tracking-wider">
              {gamif.level.emoji} {gamif.level.label}
            </span>
            <span className="text-[9px] font-black text-white/70 ml-1">
              {gamif.points.toLocaleString('pt-BR')} pts
            </span>
          </motion.button>

          {/* Barra de progresso */}
          {gamif.nextLevel && (
            <div className="w-full mt-3 px-2">
              <div className="flex justify-between mb-1">
                <span className="text-[8px] font-bold text-gray-400">
                  → {gamif.nextLevel.emoji} {gamif.nextLevel.label}
                </span>
                <span className="text-[8px] font-black" style={{ color: gamif.level.color }}>
                  {gamif.progressPct}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${gamif.progressPct}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${gamif.level.color}, #8B5CF6)` }}
                />
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-3 w-full mt-6">
            <div className="bg-white p-4 rounded-[24px] shadow-md flex flex-col items-center flex-1 border border-gray-50">
              <Heart size={18} className="text-red-400 mb-1" />
              <span className="text-lg font-black text-gray-800">{String(profile.cats.filter(c => !c.isMemorial).length).padStart(2,'0')}</span>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Gatinhos</span>
            </div>

            <button onClick={() => setShowGamifDrawer(true)}
              className="bg-white p-4 rounded-[24px] shadow-md flex flex-col items-center flex-1 border border-gray-50 active:scale-95 transition-all">
              <Trophy size={18} className="text-amber-400 mb-1" />
              <span className="text-lg font-black text-gray-800">{gamif.achievements}</span>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Conquistas</span>
            </button>

            <div className="bg-white p-4 rounded-[24px] shadow-md flex flex-col items-center flex-1 border border-gray-50">
              <Zap size={18} className="text-[#6158ca] mb-1" />
              <span className="text-lg font-black text-gray-800">
                {gamif.points >= 1000 ? `${(gamif.points/1000).toFixed(1)}k` : gamif.points}
              </span>
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Pontos</span>
            </div>
          </div>

          {profile.isFounder && (
            <div className="flex items-center gap-2 mt-4 bg-[#ebfc66] px-5 py-2 rounded-full shadow-sm">
              <Award size={14} className="text-[#6158ca]" fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-[1.5px] text-[#6158ca]">Gateiro Fundador</span>
            </div>
          )}
        </div>
      </div>

      {/* ── GATINHOS COM XP ── */}
      {profile.cats.length > 0 && (
        <div className="px-6 mt-5">
          <button onClick={() => setShowCats(s => !s)}
            className="w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <PawPrint size={13} className="text-[#6158ca]" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Meus Gatinhos</span>
              <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-[#F4F3FF] text-[#6158ca]">
                {activeCats.length}
              </span>
            </div>
            <motion.div animate={{ rotate: showCats ? 180 : 0 }}>
              <ChevronUp size={16} className="text-gray-300" />
            </motion.div>
          </button>

          <AnimatePresence>
            {showCats && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-2 mb-2">
                {activeCats.map(cat => <CatXPCard key={cat.id} cat={cat} />)}

                {memorialCats.length > 0 && (
                  <div className="pt-1 opacity-50">
                    <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-2 px-1">In Memoriam</p>
                    {memorialCats.map(cat => <CatXPCard key={cat.id} cat={cat} />)}
                  </div>
                )}

                {/* Como ganham XP */}
                <div className="bg-[#F4F3FF] rounded-[20px] px-4 py-3 border border-[#6158ca10] mt-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles size={10} className="text-[#6158ca]" />
                    <p className="text-[9px] font-black text-[#6158ca] uppercase tracking-wider">Como ganham XP</p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Consulta iGentVet', xp: '+10 XP', emoji: '🤖' },
                      { label: 'Vacina registrada', xp: '+5 XP',  emoji: '💉' },
                      { label: 'Medicação',         xp: '+5 XP',  emoji: '💊' },
                      { label: 'Exame registrado',  xp: '+3 XP',  emoji: '🔬' },
                    ].map(item => (
                      <div key={item.label}
                        className="flex items-center gap-1.5 bg-white rounded-xl px-2 py-1.5 border border-[#6158ca10]">
                        <span className="text-xs">{item.emoji}</span>
                        <span className="text-[8px] font-bold text-gray-500 flex-1 truncate">{item.label}</span>
                        <span className="text-[8px] font-black text-[#6158ca]">{item.xp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── MENU ── */}
      <div className="p-6 mt-2">
        <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[4px] mb-4 px-2">Minha Conta</h3>
        <MenuButton icon={Edit2}   title="Editar Perfil"  subtitle="Dados pessoais e localização" path="/profile/edit" />
        <MenuButton icon={Trophy}  title="Conquistas"     subtitle="Nível, badges e pontos"
          color="bg-amber-50 text-amber-500" onClick={() => setShowGamifDrawer(true)} />
        <MenuButton icon={Crown}   title="Gatedo Plus"    subtitle="Assinatura e benefícios"  path="/comunigato" color="bg-amber-50 text-amber-500" />

        <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[4px] mt-8 mb-4 px-2">App & Suporte</h3>
        <MenuButton icon={Settings} title="Configurações" subtitle="Sons, cache e avisos"  path="/settings"  color="bg-purple-50 text-purple-500" />
        <MenuButton icon={LifeBuoy} title="Ajuda & Suporte" subtitle="FAQ e contato direto" path="/support"  color="bg-indigo-50 text-indigo-500" />

        <button onClick={() => { touch(); signOut(); navigate('/login'); }}
          className="w-full mt-8 p-5 rounded-[30px] bg-white border border-gray-100 text-red-500 font-black uppercase text-[10px] tracking-[2px] flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all">
          <LogOut size={16} /> Sair da Conta
        </button>
      </div>

      <GamificationDrawer isOpen={showGamifDrawer} onClose={() => setShowGamifDrawer(false)} />
    </div>
  );
}