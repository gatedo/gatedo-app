import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wand2, Sparkles, Command,
  Palette, Camera, Heart, Download, Sticker, Type,
  CreditCard, Newspaper, Search, Video, Play, Zap,
  Lock, ChevronRight, Trophy, Star, Award, Image
} from 'lucide-react';
import useSensory from '../hooks/useSensory';

// ─── PALETA ───────────────────────────────────────────────────────────────────
const C = { purple: '#6158ca', accent: '#DFFF40', dark: '#13131f', card: '#1E1E2C' };

// ─── SISTEMA DE XP DO STUDIO ──────────────────────────────────────────────────
// Cada ação no Studio devolve XP para o sistema global de gamificação
const XP_REWARDS = {
  portrait:  { xp: 50,  label: '+50 XP', badge: 'CRIADOR_NATO'    },
  id_card:   { xp: 30,  label: '+30 XP', badge: null               },
  magazine:  { xp: 40,  label: '+40 XP', badge: null               },
  meme:      { xp: 35,  label: '+35 XP', badge: 'MEME_LORD'        },
  reel:      { xp: 60,  label: '+60 XP', badge: 'ARTISTA_GATEIRO'  },
  challenge: { xp: 80,  label: '+80 XP', badge: 'TREND_SETTER'     },
};

// ─── PACKS ────────────────────────────────────────────────────────────────────
const ASSET_PACKS = [
  { id: 1, title: 'Pack Zueira',    count: '20 Stickers', color: '#DFFF40', textColor: '#6158ca', icon: Sticker,  locked: false },
  { id: 2, title: 'Filtros VHS',    count: '5 Presets',   color: '#EC4899', textColor: 'white',   icon: Camera,   locked: false },
  { id: 3, title: 'Fontes Raiz',    count: '8 Fontes',    color: '#60A5FA', textColor: 'white',   icon: Type,     locked: false },
  { id: 4, title: 'Pack Místico',   count: '15 Stickers', color: '#8B5CF6', textColor: 'white',   icon: Sparkles, locked: true,  requiredLevel: 'Gateiro Raiz' },
  { id: 5, title: 'Filtros Cinema', count: '10 Presets',  color: '#F59E0B', textColor: 'white',   icon: Video,    locked: true,  requiredLevel: 'Felino Sábio' },
];

// ─── GALERIA MOCK ─────────────────────────────────────────────────────────────
const GALLERY_ITEMS = [
  { id: 1, type: 'video', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80', title: 'POV: Fofoqueiro',   likes: '12k', author: 'Aline' },
  { id: 2, type: 'image', img: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=400&q=80', title: 'Gato Astronauta', likes: '8.5k', author: 'Marcos' },
  { id: 3, type: 'image', img: 'https://images.unsplash.com/photo-1495360019602-e001922271aa?auto=format&fit=crop&w=400&q=80', title: 'Renaissance',      likes: '5k',  author: 'Carla' },
  { id: 4, type: 'video', img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=400&q=80', title: 'Dancinha viral',    likes: '22k', author: 'Felipe' },
];

// ─── DESAFIO ATIVO ────────────────────────────────────────────────────────────
const ACTIVE_CHALLENGE = {
  emoji: '🎭', title: 'Semana do Gato Artista',
  desc: 'Crie 3 conteúdos diferentes — retratos, memes e cards.',
  xp: 300, daysLeft: 4, progress: 1, total: 3, color: '#8B5CF6',
  badge: { emoji: '✨', name: 'Artista Gateiro' },
};

// ─── XP TOAST LOCAL ───────────────────────────────────────────────────────────
function XPPopup({ reward, visible, onDone }) {
  React.useEffect(() => {
    if (visible) { const t = setTimeout(onDone, 2000); return () => clearTimeout(t); }
  }, [visible]);
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 60, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className="fixed bottom-28 left-1/2 z-[300] flex flex-col items-center gap-1 px-5 py-3 rounded-2xl pointer-events-none"
          style={{ transform: 'translateX(-50%)', background: '#DFFF40', boxShadow: '0 8px 32px #DFFF4080' }}>
          <div className="flex items-center gap-2">
            <Zap size={15} fill="#1a1a00" color="#1a1a00" />
            <span className="text-sm font-black text-[#1a1a00]">{reward?.label}</span>
          </div>
          {reward?.badge && <span className="text-[9px] font-black text-[#4a5c00]">Badge desbloqueado: {reward.badge}</span>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── TOOL CARD ────────────────────────────────────────────────────────────────
const ToolCard = ({ title, desc, icon: Icon, gradient, iconBg, iconColor, onClick, isLarge, badge, xpLabel, locked }) => (
  <motion.button
    whileHover={locked ? {} : { y: -3, scale: 1.01 }}
    whileTap={locked ? {} : { scale: 0.96 }}
    onClick={locked ? undefined : onClick}
    className={`${isLarge ? 'col-span-2' : 'col-span-1'} p-5 rounded-[28px] relative overflow-hidden shadow-lg border border-white/10 flex flex-col justify-between text-left group transition-all`}
    style={{
      background: locked ? '#1a1a2e' : gradient,
      minHeight: isLarge ? '180px' : '150px',
      opacity: locked ? 0.6 : 1,
    }}>
    <div className="flex justify-between items-start w-full">
      <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center mb-3 shadow-inner flex-shrink-0`}
        style={{ background: locked ? 'rgba(255,255,255,0.05)' : iconBg }}>
        {locked ? <Lock size={22} className="text-gray-500" /> : <Icon size={24} style={{ color: iconColor }} />}
      </div>
      <div className="flex flex-col items-end gap-1">
        {badge && <span className="bg-[#DFFF40] text-[#6158ca] text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{badge}</span>}
        {xpLabel && !locked && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(223,255,64,0.15)', color: '#DFFF40' }}>{xpLabel}</span>}
        {locked && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-gray-700/50 text-gray-400">🔒 Bloqueado</span>}
      </div>
    </div>
    <div className="relative z-10">
      <h4 className="font-black text-lg leading-tight mb-1 text-white">{title}</h4>
      <p className="text-xs font-medium text-gray-400 leading-snug">{locked ? 'Desbloqueie subindo de nível' : desc}</p>
    </div>
    <Icon size={100} className="absolute -right-4 -bottom-4 opacity-[0.04] rotate-12 text-white" />
  </motion.button>
);

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function Studio() {
  const navigate = useNavigate();
  const touch    = useSensory();
  const [activeSection, setActiveSection] = useState('criar');
  const [xpPopup, setXPPopup] = useState({ visible: false, reward: null });

  const fireXP = (toolKey) => {
    const reward = XP_REWARDS[toolKey];
    if (reward) {
      touch('success');
      setXPPopup({ visible: true, reward });
    }
  };

  const SECTIONS = [
    { id: 'criar',    label: 'Criar'     },
    { id: 'packs',    label: 'Packs'     },
    { id: 'galeria',  label: 'Galeria'   },
    { id: 'desafio',  label: 'Desafio 🔥' },
  ];

  return (
    <div className="min-h-screen pb-32 pt-6 px-5 font-sans text-white overflow-x-hidden"
      style={{ background: C.dark }}>

      <XPPopup reward={xpPopup.reward} visible={xpPopup.visible}
        onDone={() => setXPPopup(v => ({ ...v, visible: false }))} />

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => { touch(); navigate(-1); }}
          className="bg-white/10 w-10 h-10 flex items-center justify-center rounded-full border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
          <Palette size={15} style={{ color: C.accent }} />
          <h1 className="text-sm font-black tracking-wide">GATEDO <span style={{ color: C.accent }}>STUDIO</span></h1>
        </div>
        <button className="bg-white/10 w-10 h-10 flex items-center justify-center rounded-full border border-white/10" style={{ color: C.accent }}>
          <Command size={19} />
        </button>
      </div>

      {/* ── DESAFIO ATIVO (banner sempre visível) ─────────────────────────── */}
      <motion.div whileTap={{ scale: 0.98 }} onClick={() => setActiveSection('desafio')}
        className="rounded-[22px] p-4 mb-6 relative overflow-hidden cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #1C0A2E, #2D1B4E)', border: `1.5px solid ${ACTIVE_CHALLENGE.color}35` }}>
        <div className="absolute right-0 top-0 w-24 h-24 rounded-full -translate-y-10 translate-x-6"
          style={{ background: `radial-gradient(circle, ${ACTIVE_CHALLENGE.color}25, transparent 70%)` }} />
        <div className="flex items-center gap-3 relative z-10">
          <span className="text-2xl">{ACTIVE_CHALLENGE.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black uppercase tracking-widest mb-0.5" style={{ color: ACTIVE_CHALLENGE.color }}>Desafio ativo</p>
            <p className="text-sm font-black text-white truncate">{ACTIVE_CHALLENGE.title}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${(ACTIVE_CHALLENGE.progress / ACTIVE_CHALLENGE.total) * 100}%`,
                  background: `linear-gradient(90deg, ${ACTIVE_CHALLENGE.color}80, ${ACTIVE_CHALLENGE.color})`
                }} />
              </div>
              <span className="text-[8px] font-black text-gray-400">{ACTIVE_CHALLENGE.progress}/{ACTIVE_CHALLENGE.total}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-black text-yellow-400">+{ACTIVE_CHALLENGE.xp} XP</p>
            <p className="text-[8px] text-gray-500">{ACTIVE_CHALLENGE.daysLeft}d restantes</p>
          </div>
        </div>
      </motion.div>

      {/* ── SECTION TABS ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide -mx-5 px-5">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => { touch(); setActiveSection(s.id); }}
            className="px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all flex-shrink-0"
            style={activeSection === s.id
              ? { background: C.accent, color: '#1a1a00' }
              : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }
            }>
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

          {/* ── CRIAR ─────────────────────────────────────────────────────── */}
          {activeSection === 'criar' && (
            <div className="grid grid-cols-2 gap-3">
              <ToolCard
                title="Retrato IA" desc="Transforme fotos em arte 3D, Pixar, aquarela e mais."
                icon={Wand2} gradient="linear-gradient(135deg, #6158ca, #4a40a5)"
                iconBg="#DFFF40" iconColor="#6158ca" isLarge badge="Popular" xpLabel="+50 XP"
                onClick={() => { fireXP('portrait'); navigate('/studio/portrait'); }} />
              <ToolCard
                title="RG Pet" desc="Carteirinha oficial do seu gato."
                icon={CreditCard} gradient={C.card}
                iconBg="#22D3EE" iconColor="white" xpLabel="+30 XP"
                onClick={() => { fireXP('id_card'); navigate('/studio/id'); }} />
              <ToolCard
                title="Vogue Cat" desc="Seu gato na capa da revista."
                icon={Newspaper} gradient={C.card}
                iconBg="#EC4899" iconColor="white" xpLabel="+40 XP"
                onClick={() => { fireXP('magazine'); navigate('/studio/magazine'); }} />
              <ToolCard
                title="Meme Maker" desc="Crie memes gateiros épicos."
                icon={Sparkles} gradient={C.card}
                iconBg="#8B5CF6" iconColor="white" xpLabel="+35 XP"
                onClick={() => { fireXP('meme'); navigate('/studio/meme'); }} />
              <ToolCard
                title="Reel Cat" desc="Crie vídeos curtos com música."
                icon={Video} gradient={C.card}
                iconBg="#F59E0B" iconColor="white" badge="Novo" xpLabel="+60 XP"
                onClick={() => { fireXP('reel'); navigate('/studio/reel'); }} />
              <ToolCard
                title="Pack Pro" desc="Stickers exclusivos lendários."
                icon={Star} gradient={C.card}
                iconBg="#DFFF40" iconColor="#6158ca" locked />
            </div>
          )}

          {/* ── PACKS ─────────────────────────────────────────────────────── */}
          {activeSection === 'packs' && (
            <div className="space-y-3">
              {ASSET_PACKS.map(pack => (
                <motion.button key={pack.id} whileTap={pack.locked ? {} : { scale: 0.98 }}
                  className="w-full flex items-center gap-4 p-4 rounded-[22px] border transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)',
                    opacity: pack.locked ? 0.6 : 1 }}>
                  <div className="w-14 h-14 rounded-[18px] flex items-center justify-center flex-shrink-0"
                    style={{ background: pack.locked ? '#1a1a2e' : pack.color }}>
                    {pack.locked
                      ? <Lock size={22} className="text-gray-500" />
                      : <pack.icon size={28} style={{ color: pack.textColor }} />
                    }
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-black text-white">{pack.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{pack.count}</p>
                    {pack.locked && pack.requiredLevel && (
                      <p className="text-[9px] text-yellow-500 font-bold mt-0.5">🔒 Requer: {pack.requiredLevel}</p>
                    )}
                  </div>
                  {pack.locked
                    ? <span className="text-[9px] font-black px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500">Level up</span>
                    : <Download size={18} style={{ color: C.accent }} />
                  }
                </motion.button>
              ))}
              <div className="text-center py-4">
                <p className="text-[10px] text-gray-500 font-bold">Suba de nível para desbloquear mais packs exclusivos</p>
              </div>
            </div>
          )}

          {/* ── GALERIA ───────────────────────────────────────────────────── */}
          {activeSection === 'galeria' && (
            <div>
              <p className="text-xs font-black text-white/50 mb-4 flex items-center gap-2">
                <Search size={12} style={{ color: C.accent }} /> Criações da Comunidade
              </p>
              <div className="columns-2 gap-3 space-y-3">
                {GALLERY_ITEMS.map(item => (
                  <motion.div key={item.id} whileTap={{ scale: 0.98 }}
                    className="break-inside-avoid bg-white/5 rounded-[20px] overflow-hidden border border-white/10 relative group cursor-pointer">
                    <img src={item.img} className="w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-3">
                      <p className="text-white text-[10px] font-bold truncate">{item.title}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <div className="flex items-center gap-1" style={{ color: C.accent }}>
                          <Heart size={9} fill="currentColor" />
                          <span className="text-[9px] font-black">{item.likes}</span>
                        </div>
                        <span className="text-[8px] text-gray-400 font-bold">{item.author}</span>
                      </div>
                    </div>
                    {item.type === 'video' && (
                      <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full border border-white/20">
                        <Video size={9} className="text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── DESAFIO ───────────────────────────────────────────────────── */}
          {activeSection === 'desafio' && (
            <div className="space-y-4">
              <div className="rounded-[24px] p-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1C0A2E, #2D1B4E)', border: `2px solid ${ACTIVE_CHALLENGE.color}40` }}>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-20 translate-x-10"
                  style={{ background: `radial-gradient(circle, ${ACTIVE_CHALLENGE.color}20, transparent 70%)` }} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: ACTIVE_CHALLENGE.color }}>Desafio da Semana</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl">{ACTIVE_CHALLENGE.emoji}</span>
                        <h2 className="text-lg font-black text-white">{ACTIVE_CHALLENGE.title}</h2>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-yellow-400">+{ACTIVE_CHALLENGE.xp} XP</p>
                      <p className="text-[9px] text-gray-500">{ACTIVE_CHALLENGE.daysLeft} dias</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed mb-4">{ACTIVE_CHALLENGE.desc}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-white">Progresso: {ACTIVE_CHALLENGE.progress}/{ACTIVE_CHALLENGE.total}</span>
                    <span className="text-[9px] font-black" style={{ color: ACTIVE_CHALLENGE.color }}>
                      🏆 Badge: {ACTIVE_CHALLENGE.badge.emoji} {ACTIVE_CHALLENGE.badge.name}
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }}
                      animate={{ width: `${(ACTIVE_CHALLENGE.progress / ACTIVE_CHALLENGE.total) * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${ACTIVE_CHALLENGE.color}70, ${ACTIVE_CHALLENGE.color})` }} />
                  </div>
                </div>
              </div>

              {/* Steps do desafio */}
              <div className="space-y-2.5">
                {[
                  { step: 1, title: 'Retrato IA', desc: 'Crie um retrato artístico', done: true,  tool: 'portrait', xp: 50 },
                  { step: 2, title: 'Meme Gateiro', desc: 'Crie um meme com a tag do desafio', done: false, tool: 'meme', xp: 35 },
                  { step: 3, title: 'RG Pet ou Vogue', desc: 'Crie um card oficial', done: false, tool: 'id_card', xp: 40 },
                ].map(item => (
                  <motion.button key={item.step} whileTap={item.done ? {} : { scale: 0.98 }}
                    onClick={() => !item.done && navigate(`/studio/${item.tool}`)}
                    className="w-full flex items-center gap-4 p-4 rounded-[22px] border text-left"
                    style={{ background: item.done ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.04)',
                      borderColor: item.done ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.08)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm"
                      style={{ background: item.done ? '#4ADE80' : 'rgba(255,255,255,0.08)',
                        color: item.done ? 'white' : 'rgba(255,255,255,0.4)' }}>
                      {item.done ? '✓' : item.step}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-black ${item.done ? 'text-green-400' : 'text-white'}`}>{item.title}</p>
                      <p className="text-[10px] text-gray-500">{item.desc}</p>
                    </div>
                    <span className="text-[9px] font-black flex-shrink-0"
                      style={{ color: item.done ? '#4ADE80' : C.accent }}>
                      {item.done ? '✓ feito' : `+${item.xp} XP`}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}