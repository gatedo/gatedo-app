import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Sparkles, BookOpen, Gamepad2, Play,
  Wand2, Lock, Crown, PawPrint, ArrowLeft, Trophy, Flame, Star,
} from 'lucide-react';
import useSensory from '../hooks/useSensory';
import { useGamification } from '../context/GamificationContext';
import GamificationDrawer from '../components/GamificationDrawer';
import api from '../services/api';

// ─── Local image imports — mesmas usadas antes na Home ─────────────────────
import img1  from '../assets/cards-home/gatedo-img1.webp';
import img2  from '../assets/cards-home/gatedo-img2.webp';
import img3  from '../assets/cards-home/gatedo-img3.webp';
import img4  from '../assets/cards-home/gatedo-img4.webp';
import img5  from '../assets/cards-home/gatedo-img5.webp';
import img6  from '../assets/cards-home/gatedo-img6.webp';
import img9  from '../assets/cards-home/gatedo-img9.webp';
import img12 from '../assets/cards-home/gatedo-img12.webp';
import img13 from '../assets/cards-home/gatedo-img13.webp';
import img14 from '../assets/cards-home/gatedo-img14.webp';
import img15 from '../assets/cards-home/gatedo-img15.webp';

const IMG_MEMORIAL = '/assets/juju_memo.webp';

const C = { purple: '#8B4AFF', accent: '#e7ff60', accentDim: '#ebfc66' };

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
};

// ─── Studio data — movido de Home.jsx ───────────────────────────────────────
const STUDIO_SLIDER_ITEMS = [
  { id: 'cat-dance',         title: 'Dancinhas',    subtitle: 'Trends virais',        emoji: '🕺', pts: 40, badge: 'Em breve', locked: true,  gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(236,72,153,0.9) 80%,rgba(245,158,11,1) 100%)',    coverImg: img4 },
  { id: 'tutor-cat-montage', title: 'Tutor + Gato', subtitle: 'Montagem IA',          emoji: '📸', pts: 10, badge: 'Em breve', locked: true,  gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(249,115,22,0.9) 80%,rgba(236,72,153,1) 100%)',  coverImg: img5 },
  { id: 'read-cat-mind',     title: 'Mente do Gato',subtitle: 'O que ele pensa?',     emoji: '🧠', pts: 25, badge: 'Em breve', locked: true,  gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(139,74,255,0.9) 80%,rgba(75,64,198,1) 100%)',   coverImg: img6 },
  { id: 'cat-style-portrait',title: 'Estilos',       subtitle: 'Pixar, anime e mais', emoji: '🎨', pts: 8,  badge: 'Em breve', locked: true,  gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(99,102,241,0.9) 80%,rgba(139,74,255,1) 100%)',  coverImg: img2 },
  { id: 'cat-sticker',       title: 'Sticker',       subtitle: 'Rápido e viral',       emoji: '✨', pts: 3,  badge: 'Em breve', locked: true,  gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(139,74,255,0.9) 80%,rgba(236,72,153,1) 100%)', coverImg: img3 },
];
const STUDIO_ACTIVE_FALLBACK = [
  { id: 'tutor-cat-montage', title: 'Tutor + Gato', subtitle: 'Você e seu gato numa cena mágica', emoji: '📸', coinsCost: 10, gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 25%,rgba(249,115,22,0.88) 72%,rgba(236,72,153,0.96) 100%)', coverImg: img1 },
  { id: 'cat-style-portrait',title: 'Estilos',       subtitle: 'Arte, aquarela, Pixar, anime',     emoji: '🎨', coinsCost: 8,  gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 25%,rgba(99,102,241,0.88) 72%,rgba(139,74,255,0.96) 100%)',  coverImg: img2 },
  { id: 'cat-sticker',       title: 'Sticker',       subtitle: 'Seu gato vira sticker em segundos',emoji: '✨', coinsCost: 3,  gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 25%,rgba(139,74,255,0.88) 72%,rgba(236,72,153,0.96) 100%)',  coverImg: img3 },
];
const GAMES = [
  { id: 'bugs',   name: 'Bichinhos',    emoji: '🐞', desc: 'Joaninhas, abelhas e borboletas',        color: '#22c55e', img: '/assets/catgames/insetos.webp',     gradient: 'linear-gradient(90deg,rgba(13,99,47,0.69) 0%,rgba(22,163,74,0.21) 100%)',    badge: '🔥 Popular'  },
  { id: 'ocean',  name: 'Fundo do Mar', emoji: '🐠', desc: 'Peixinhos e criaturas marinhas',         color: '#0ea5e9', img: '/assets/catgames/fundo-mar.webp',   gradient: 'linear-gradient(90deg,rgba(12,61,107,0.92) 0%,rgba(2,133,199,0.18) 100%)',  badge: '🌊 Novo'     },
  { id: 'garden', name: 'Jardim',        emoji: '🌼', desc: 'Flores, folhas e lagartos no jardim',   color: '#f59e0b', img: '/assets/catgames/jardim.webp',      gradient: 'linear-gradient(90deg,rgba(74,55,40,0.92) 0%,rgba(217,119,6,0.5) 100%)',   badge: null          },
  { id: 'space',  name: 'Espaço',        emoji: '⭐', desc: 'Estrelas, cometas e OVNIs',             color: '#a78bfa', img: '/assets/catgames/gato-espaco.webp', gradient: 'linear-gradient(90deg,rgba(10,10,26,0.95) 0%,rgba(124,58,237,0.5) 100%)',  badge: '✨ Destaque' },
];
const WIKI_SLIDES = [
  { label: 'Raças',         emoji: '🐱', color: '#8B4AFF', img: img12, desc: 'Descubra raças' },
  { label: 'Curiosidades',  emoji: '💡', color: '#F59E0B', img: img13, desc: 'Fatos incríveis' },
  { label: 'Comportamento', emoji: '🧠', color: '#10B981', img: img14, desc: 'Entenda seu gato' },
  { label: 'Cultura',       emoji: '🌍', color: '#EC4899', img: img15, desc: 'Gatos no mundo' },
];

// ─────────────────────────────────────────────────────────────────────────────
// StudioSlider — movido de Home.jsx. O cartão "Prioridade Fundadores" fica
// arquivado (código presente, mas oculto por padrão via showFounderCTA).
// ─────────────────────────────────────────────────────────────────────────────
function StudioSlider({ showFounderCTA = false }) {
  const navigate  = useNavigate();
  const touch     = useSensory();
  const [activeTools, setActiveTools] = useState([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    api.get('/studio/modules').then(r => {
      const mods = Array.isArray(r.data) ? r.data.filter(m => m.isActive && !m.isComingSoon && !m.isLocked) : [];
      setActiveTools(mods.length > 0 ? mods : STUDIO_SLIDER_ITEMS.filter(i => !i.locked));
    }).catch(() => setActiveTools(STUDIO_ACTIVE_FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const lockedItems = STUDIO_SLIDER_ITEMS.filter(i => i.locked).slice(0, 3);

  return (
    <motion.div variants={fadeUp}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: C.purple }} />
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Studio</h2>
        </div>
        <button onClick={() => { touch(); navigate('/studio'); }}
          className="text-[9px] font-black uppercase tracking-wider" style={{ color: C.purple }}>
          Ver Studio →
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {loading
          ? [1, 2, 3].map(i => <div key={i} className="flex-shrink-0 rounded-[22px] animate-pulse" style={{ width: 140, height: 196, background: 'rgba(139,74,255,0.08)' }} />)
          : activeTools.slice(0, 3).map((item, i) => (
          <motion.button key={item.id}
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { touch(); navigate('/studio'); }}
            className="flex-shrink-0 rounded-[22px] overflow-hidden relative text-left"
            style={{ width: 140, height: 196, boxShadow: '0 6px 20px rgba(139,74,255,0.22)' }}>
            <img src={item.coverImg} alt={item.title} className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.22)' }} />
            <div className="absolute inset-0" style={{ background: item.gradient || 'linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(139,74,255,0.9) 100%)', opacity: 0.78 }} />
            <div className="absolute top-2.5 left-2.5">
              <span className="text-[7px] font-black px-2 py-0.5 rounded-full" style={{ background: '#DFFF40', color: '#1a1a00' }}>✦ Disponível</span>
            </div>
            <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.30)' }}>
              <Wand2 size={10} className="text-white" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <span className="text-xl opacity-90">{item.emoji}</span>
              <h4 className="font-black text-white text-sm leading-tight mt-0.5 mb-0.5">{item.title}</h4>
              <p className="text-[9px] text-white/70 font-medium mb-1.5">{item.subtitle}</p>
              <div className="flex items-center gap-1 rounded-full px-2 py-0.5 w-fit" style={{ background: 'rgba(223,255,64,0.15)', border: '1px solid rgba(223,255,64,0.25)' }}>
                <PawPrint size={8} color={C.accentDim} fill={C.accentDim} />
                <span className="text-[8px] font-black" style={{ color: C.accentDim }}>{item.coinsCost || item.pts} pts</span>
              </div>
            </div>
          </motion.button>
        ))}

        {lockedItems.map((item, i) => (
          <motion.button key={item.id}
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (activeTools.length + i) * 0.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { touch(); navigate('/studio'); }}
            className="flex-shrink-0 rounded-[22px] overflow-hidden relative text-left"
            style={{ width: 140, height: 196, boxShadow: '0 6px 20px rgba(0,0,0,0.18)' }}>
            <img src={item.coverImg} alt={item.title} className="absolute inset-0 w-full h-full object-cover grayscale" />
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.52)' }} />
            <div className="absolute inset-0" style={{ background: item.gradient, opacity: 0.35 }} />
            <div className="absolute inset-0 backdrop-blur-[1px]" />
            <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
              <span className="text-[7px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>
                {item.badge}
              </span>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)' }}>
                <Lock size={10} className="text-white/70" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <span className="text-xl opacity-60">{item.emoji}</span>
              <h4 className="font-black text-white/75 text-sm leading-tight mt-0.5 mb-0.5">{item.title}</h4>
              <p className="text-[9px] text-white/45 font-medium mb-1.5">{item.subtitle}</p>
              <div className="flex items-center gap-1 rounded-full px-2 py-0.5 w-fit" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <Lock size={7} className="text-white/40" />
                <span className="text-[8px] font-black text-white/40">Em breve</span>
              </div>
            </div>
          </motion.button>
        ))}

        {/* Arquivado — cartão de "Prioridade Fundadores" (o app é gratuito hoje) */}
        {showFounderCTA && (
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => { touch(); navigate('/clube'); }}
            className="flex-shrink-0 rounded-[22px] border-2 border-dashed flex flex-col items-center justify-center gap-2"
            style={{ width: 110, height: 196, borderColor: `${C.purple}30`, background: `${C.purple}06` }}>
            <div className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: `${C.purple}40` }}>
              <Crown size={16} style={{ color: C.purple }} />
            </div>
            <p className="text-[8px] font-black uppercase tracking-wide text-center px-2" style={{ color: C.purple }}>Prioridade Fundadores</p>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EntertainmentCard — movido de Home.jsx, sem alteração de lógica
// ─────────────────────────────────────────────────────────────────────────────
function EntertainmentCard() {
  const navigate = useNavigate();
  const touch    = useSensory();
  return (
    <motion.div variants={fadeUp}
      className="rounded-[28px] overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)', border: '1px solid rgba(99,102,241,0.2)' }}>
      {[...Array(4)].map((_, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          animate={{ opacity: [0.08, 0.3, 0.08], y: [0, -4, 0] }}
          transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, delay: i * 0.4 }}
          style={{ width: (i % 2 + 1) * 3, height: (i % 2 + 1) * 3, background: i % 2 === 0 ? '#6366f1' : C.accentDim, top: `${15 + (i * 27) % 60}%`, left: `${10 + (i * 19) % 80}%` }} />
      ))}
      <div className="relative z-10 pt-4 pb-5">
        <div className="flex items-center justify-between px-5 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <Gamepad2 size={15} color="#818cf8" />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Entretenimento Felino</p>
              <p className="text-sm font-black text-white tracking-tight">Joguinhos para Gatos</p>
            </div>
          </div>
          <span className="text-xl opacity-40">🎮</span>
        </div>
        <p className="text-[10px] text-white/40 font-medium px-5 mb-4 leading-relaxed">
          Coloque na frente do seu gato e deixe ele caçar! Toque para começar.
        </p>
        <div className="grid grid-cols-2 gap-3 px-5">
          {GAMES.map((game, i) => (
            <motion.button key={game.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { touch(); navigate('/cat-game', { state: { theme: game.id } }); }}
              className="relative rounded-[20px] overflow-hidden text-left"
              style={{ height: 110, boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
              <img src={game.img} alt={game.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />
              <div className="absolute inset-0" style={{ background: game.gradient }} />
              {game.badge && (
                <div className="absolute top-2 left-2">
                  <span className="text-[7px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    {game.badge}
                  </span>
                </div>
              )}
              <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play size={10} fill={game.color} color={game.color} className="ml-0.5" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-lg drop-shadow-lg">{game.emoji}</span>
                  <p className="font-black text-white text-sm leading-none drop-shadow">{game.name}</p>
                </div>
                <p className="text-[8px] text-white/55 font-medium leading-tight line-clamp-1">{game.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
        <div className="mx-5 mt-4 rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <span className="text-lg">🐾</span>
          <p className="text-[9px] text-indigo-300 font-bold leading-relaxed flex-1">
            Coloque o celular no chão ou mesa e deixe seu gato interagir com a tela!
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WikiMiniSlider — movido de Home.jsx, sem alteração de lógica
// ─────────────────────────────────────────────────────────────────────────────
function WikiMiniSlider({ onNavigate }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setCurrent((p) => (p + 1) % WIKI_SLIDES.length), 2600);
    return () => clearInterval(id);
  }, []);

  const slide = WIKI_SLIDES[current] || WIKI_SLIDES[0];
  const slideColor = slide?.color || '#8B4AFF';

  return (
    <motion.button
      onClick={onNavigate}
      whileTap={{ scale: 0.97 }}
      className="relative overflow-hidden rounded-[24px] text-left"
      style={{ flex: 2, height: 120 }}
    >
      {WIKI_SLIDES.map((s, i) => (
        <motion.div key={s.label} animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }} className="absolute inset-0">
          <img src={s.img} alt={s.label} className="w-full h-full object-cover" />
        </motion.div>
      ))}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(10,8,30,0.78) 0%,rgba(30,22,60,0.55) 100%)' }} />
      <motion.div className="absolute inset-0"
        animate={{ background: `linear-gradient(180deg, transparent 30%, ${slideColor}60 100%)` }}
        transition={{ duration: 0.35, ease: 'easeOut' }} />
      <div className="relative z-10 h-full flex flex-col justify-between p-3">
        <div className="flex items-center gap-1">
          <Sparkles size={9} className="text-white/60" />
          <p className="text-[7px] font-black text-white/60 uppercase tracking-widest">Mini Tour</p>
        </div>
        <div>
          <AnimatePresence mode="wait">
            <motion.div key={current} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22, ease: 'easeOut' }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xl">{slide?.emoji}</span>
                <p className="font-black text-white text-sm leading-none">{slide?.label}</p>
              </div>
              <p className="text-[8px] text-white/55 font-bold">{slide?.desc}</p>
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-1 mt-2">
            {WIKI_SLIDES.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className="rounded-full transition-all"
                style={{ width: i === current ? 14 : 5, height: 5, background: i === current ? slideColor : 'rgba(255,255,255,0.3)' }} />
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GatedopediaSection — extraído da antiga DiscoveryGrid (linha 2: gatedopedia + mini slider)
// ─────────────────────────────────────────────────────────────────────────────
function GatedopediaSection() {
  const navigate = useNavigate();
  const touch    = useSensory();

  return (
    <motion.div variants={fadeUp} className="flex gap-3">
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22 }}
        onClick={() => { touch(); navigate('/wiki'); }}
        className="relative overflow-hidden rounded-[24px] text-left group"
        style={{ flex: 3, height: 120 }}>
        <img src={img9} alt="Gatedopedia" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg,rgba(249,115,22,0.88) 0%,rgba(234,88,12,0.8) 50%,rgba(60,20,0,0.92) 100%)' }} />
        <div className="relative z-10 h-full flex flex-col justify-between p-4">
          <motion.div whileHover={{ scale: 1.15 }}
            className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm"
            style={{ border: '1.5px solid rgba(255,255,255,0.3)' }}>
            <BookOpen size={16} className="text-white" />
          </motion.div>
          <div>
            <h3 className="font-black text-white text-lg leading-none tracking-tight drop-shadow">gatedopedia</h3>
            <p className="text-[9px] text-orange-200/80 font-bold mt-0.5">tudo sobre gatos</p>
          </div>
        </div>
      </motion.button>

      <WikiMiniSlider onNavigate={() => { touch(); navigate('/wiki'); }} />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// JornadaSection — nível, XP, streak, selos e conquistas.
// Reaproveita o GamificationDrawer que já existe (streak/badges/conquistas
// prontos) em vez de reconstruir essa UI — só abre o drawer daqui.
// ─────────────────────────────────────────────────────────────────────────────
function JornadaSection({ onOpen }) {
  const { level, streak, tutor } = useGamification();
  const badgeCount = Array.isArray(tutor?.badges) ? tutor.badges.length : 0;

  return (
    <motion.button
      variants={fadeUp}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="w-full rounded-[28px] p-5 text-left relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgb(105 72 193) 0%, rgb(126 107 204) 56%, rgb(164 149 217) 100%)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.16)' }}>
          <Trophy size={16} className="text-white" />
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-widest text-white/55">Sua jornada</p>
          <p className="text-sm font-black text-white">{level?.abbr || 'N1'} · {level?.label || level?.name || 'Gateiro Curioso'}</p>
        </div>
        <ChevronRight size={16} className="text-white/60 ml-auto shrink-0" />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <Flame size={14} className="mx-auto mb-1 text-orange-300" />
          <p className="text-sm font-black text-white">{streak || 0}d</p>
          <p className="text-[7px] font-black uppercase tracking-wide text-white/50">Streak</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <Star size={14} className="mx-auto mb-1" style={{ color: C.accentDim }} />
          <p className="text-sm font-black text-white">{badgeCount}</p>
          <p className="text-[7px] font-black uppercase tracking-wide text-white/50">Selos</p>
        </div>
        <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.12)' }}>
          <Trophy size={14} className="mx-auto mb-1 text-yellow-300" />
          <p className="text-sm font-black text-white">Ver</p>
          <p className="text-[7px] font-black uppercase tracking-wide text-white/50">Conquistas</p>
        </div>
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Das Estrelinhas — memorial
// ─────────────────────────────────────────────────────────────────────────────
function MemorialCard() {
  const navigate = useNavigate();
  const touch    = useSensory();

  return (
    <motion.button
      variants={fadeUp}
      whileTap={{ scale: 0.98 }}
      onClick={() => { touch(); navigate('/memorial'); }}
      className="relative overflow-hidden rounded-[24px] text-left w-full"
      style={{ height: 88 }}
    >
      <img src={IMG_MEMORIAL} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(26,26,46,0.92) 30%, rgba(22,33,62,0.55) 100%)' }} />
      <div className="relative z-10 h-full flex items-center gap-4 px-5">
        <div className="w-11 h-11 rounded-[16px] flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)' }}>
          <Star size={22} color="#C8DDFF" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[2.5px] text-white/45 mb-0.5">Memorial</p>
          <h4 className="font-black text-[18px] leading-none text-white">Das Estrelinhas</h4>
        </div>
        <ChevronRight size={16} className="text-white/50 shrink-0" />
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal — GATEDOLAND
// ─────────────────────────────────────────────────────────────────────────────
export default function Gatedoland() {
  const navigate = useNavigate();
  const touch    = useSensory();
  const [gamifOpen, setGamifOpen] = useState(false);

  useEffect(() => {
    const handler = () => setGamifOpen(true);
    window.addEventListener('open-gamif-drawer', handler);
    return () => window.removeEventListener('open-gamif-drawer', handler);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="pb-28 min-h-screen"
      style={{ background: 'var(--gatedo-light-bg)', fontFamily: "'Nunito', sans-serif" }}>

      <div className="flex items-center gap-3 px-4 pt-5 mb-1">
        <button onClick={() => { touch(); navigate(-1); }}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Diversão e conteúdo</p>
          <h1 className="text-xl font-black text-gray-800 tracking-tighter leading-none">GATEDOLAND</h1>
        </div>
      </div>

      <motion.div className="px-4 pt-4 space-y-5 max-w-[920px] mx-auto"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }} initial="hidden" animate="visible">
        <JornadaSection onOpen={() => { touch(); setGamifOpen(true); }} />
        <StudioSlider />
        <GatedopediaSection />
        <EntertainmentCard />
        <MemorialCard />
      </motion.div>

      <GamificationDrawer isOpen={gamifOpen} onClose={() => setGamifOpen(false)} />
    </motion.div>
  );
}
