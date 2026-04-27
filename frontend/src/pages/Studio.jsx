import React, { useState, useEffect, useContext, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Zap, PawPrint, ChevronRight,
  X, Bell, Play, Sparkles, Crown, Lock, Clock, Trophy,
  Target, Flame, Globe2, Plus,
} from 'lucide-react';
import useSensory from '../hooks/useSensory';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';
import StudioGallery from '../components/Studiogallery';

const C = {
  purple: '#8B4AFF', accentDim: '#ebfc66', accent: '#DFFF40',
  dark: '#0f0a1e', card: '#1a1030',
};
const ALERT_KEYS = { subscriptions: 'gatedo_alert_subscriptions', reads: 'gatedo_alert_reads' };

// ─── Imagens locais da pasta assets/cards-home ────────────────────────────────
const HOME_IMGS = [
  '/assets/cards-home/gatedo-img1.webp',
  '/assets/cards-home/gatedo-img2.webp',
  '/assets/cards-home/gatedo-img3.webp',
  '/assets/cards-home/gatedo-img4.webp',
  '/assets/cards-home/gatedo-img5.webp',
  '/assets/cards-home/gatedo-img6.webp',
  '/assets/cards-home/gatedo-img7.webp',
  '/assets/cards-home/gatedo-img8.webp',
];

// ─── Módulos ATIVOS (5 disponíveis) ──────────────────────────────────────────
const STUDIO_TOOLS = [
  {
    id: 'tutor-cat-montage', slug: 'tutor-cat',
    title: 'Tutor + Gato', subtitle: 'Você e seu gato numa cena mágica',
    category: 'Montagem', coinsCost: 10, xpReward: 25,
    isActive: true, isLocked: false, emoji: '📸', outputType: 'image',
    gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 25%,rgba(249,115,22,0.88) 72%,rgba(236,72,153,0.96) 100%)',
    coverImg: HOME_IMGS[0],
  },
  {
    id: 'cat-style-portrait', slug: 'portrait',
    title: 'Estilos', subtitle: 'Arte, aquarela, Pixar, anime',
    category: 'Arte', coinsCost: 8, xpReward: 4,
    isActive: true, isLocked: false, emoji: '🎨', outputType: 'image',
    gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 25%,rgba(99,102,241,0.88) 72%,rgba(139,74,255,0.96) 100%)',
    coverImg: HOME_IMGS[1],
  },
  {
    id: 'cat-sticker', slug: 'sticker',
    title: 'Sticker', subtitle: 'Seu gato vira sticker em segundos',
    category: 'Arte', coinsCost: 3, xpReward: 2,
    isActive: true, isLocked: false, emoji: '✨', outputType: 'image',
    gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 25%,rgba(139,74,255,0.88) 72%,rgba(236,72,153,0.96) 100%)',
    coverImg: HOME_IMGS[2],
  },
  {
    id: 'read-cat-mind', slug: 'mind-reader',
    title: 'Mente do Gato', subtitle: 'O que ele está pensando agora?',
    category: 'Insight', coinsCost: 25, xpReward: 35,
    isActive: true, isLocked: false, emoji: '🔮', outputType: 'image',
    gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 25%,rgba(139,74,255,0.88) 72%,rgba(75,64,198,0.96) 100%)',
    coverImg: HOME_IMGS[3],
  },
  {
    id: 'cat-dance', slug: 'dance',
    title: 'Dancinhas', subtitle: 'Trends virais com seu gato',
    category: 'Vídeo IA', coinsCost: 30, xpReward: 10,
    isActive: true, isLocked: false, emoji: '💃', outputType: 'video',
    gradient: 'linear-gradient(180deg,rgba(0,0,0,0) 25%,rgba(236,72,153,0.88) 72%,rgba(249,115,22,0.96) 100%)',
    coverImg: HOME_IMGS[4],
  },
];

// ─── Módulos BLOQUEADOS (em breve) ────────────────────────────────────────────
const LOCKED_MODULES = [
  {
    id: 'cat-voice', slug: 'cat-voice',
    title: 'Voz do Gato', subtitle: 'Seu gato fala de verdade',
    category: 'Vídeo IA', coinsCost: 50, xpReward: 70,
    isLocked: true, emoji: '🎙️', outputType: 'video',
    overlayColor: '#10b981', coverImg: HOME_IMGS[5],
  },
  {
    id: 'animated-story', slug: 'animated-story',
    title: 'Histórias', subtitle: 'Animação com o gato protagonista',
    category: 'Storytelling', coinsCost: 80, xpReward: 100,
    isLocked: true, emoji: '📖', outputType: 'video',
    overlayColor: '#f59e0b', coverImg: HOME_IMGS[6],
  },
  {
    id: 'meme-maker', slug: 'meme-maker',
    title: 'Meme Maker', subtitle: 'Memes gateiros automáticos',
    category: 'Humor', coinsCost: 15, xpReward: 30,
    isLocked: true, emoji: '😂', outputType: 'image',
    overlayColor: '#f97316', coverImg: HOME_IMGS[7],
  },
  {
    id: 'vogue-cat', slug: 'vogue-cat',
    title: 'Vogue Cat', subtitle: 'Seu gato na capa da revista',
    category: 'Editorial', coinsCost: 30, xpReward: 45,
    isLocked: true, emoji: '📰', outputType: 'image',
    overlayColor: '#ec4899', coverImg: HOME_IMGS[0],
  },
  {
    id: 'cat-id-card', slug: 'cat-id-card',
    title: 'RG do Gato', subtitle: 'Cartão estilizado do perfil',
    category: 'Card', coinsCost: 12, xpReward: 18,
    isLocked: true, emoji: '🪪', outputType: 'image',
    overlayColor: '#0ea5e9', coverImg: HOME_IMGS[1],
  },
];

const CHALLENGES = [
  { id: 1, emoji: '🎨', title: 'Semana do Gato Artista', xp: 300, progress: 0, total: 3, daysLeft: 4 },
  { id: 2, emoji: '📸', title: 'Tutor + Gato Challenge',  xp: 200, progress: 0, total: 2, daysLeft: 7 },
  { id: 3, emoji: '🏆', title: 'Galeria dos Campeões',    xp: 500, progress: 0, total: 5, daysLeft: 12 },
];

const MODULE_EMOJIS = {
  'tutor-cat': '📸', portrait: '🎨', sticker: '✨',
  'mind-reader': '🔮', dance: '💃',
  'cat-voice': '🎙️', 'animated-story': '📖', 'meme-maker': '😂',
  'vogue-cat': '📰', 'cat-id-card': '🪪',
};

// ─── Chips ────────────────────────────────────────────────────────────────────
function CoinChip({ amount }) {
  return (
    <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{ background: 'rgba(223,255,64,0.13)', border: '1px solid rgba(223,255,64,0.28)' }}>
      <PawPrint size={9} color={C.accentDim} fill={C.accentDim} />
      <span className="text-[9px] font-black" style={{ color: C.accentDim }}>{amount} pts</span>
    </div>
  );
}
function XPChip({ amount }) {
  return (
    <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{ background: 'rgba(139,74,255,0.18)', border: '1px solid rgba(139,74,255,0.28)' }}>
      <Zap size={9} color={C.purple} fill={C.purple} />
      <span className="text-[9px] font-black" style={{ color: '#cbb1ff' }}>{amount} XPT</span>
    </div>
  );
}

// ─── PetPickerRow ─────────────────────────────────────────────────────────────
// Substitui o botão genérico "Escolher gato" por um carrossel visual de pets
function PetPickerRow({ pets, selected, onSelect, onAddCat }) {
  const navigate = useNavigate();

  // Nenhum gato cadastrado
  if (pets.length === 0) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/cat-new')}
        className="w-full flex items-center gap-3 p-3 rounded-[22px] border mb-5"
        style={{ background: 'rgba(139,74,255,0.08)', borderColor: 'rgba(139,74,255,0.22)' }}>
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(139,74,255,0.14)', border: '1.5px dashed rgba(139,74,255,0.35)' }}>
          <Plus size={18} style={{ color: C.purple }} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[8px] font-black text-white/35 uppercase tracking-widest mb-0.5">Studio</p>
          <p className="text-sm font-black text-white">Cadastre seu gato para começar</p>
        </div>
        <ChevronRight size={14} className="text-white/25" />
      </motion.button>
    );
  }

  // 1 ou mais gatos — mostra carrossel horizontal
  return (
    <div className="mb-5">
      <p className="text-[8px] font-black text-white/30 uppercase tracking-[3px] mb-2.5 px-0.5">
        Criando com
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {pets.map(pet => {
          const active = selected?.id === pet.id;
          return (
            <motion.button
              key={pet.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => onSelect(pet)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5"
              style={{ minWidth: 60 }}>
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-2xl overflow-hidden"
                  style={{
                    border: active
                      ? `2px solid ${C.accent}`
                      : '2px solid rgba(255,255,255,0.10)',
                    boxShadow: active ? `0 0 16px ${C.accent}55` : 'none',
                    transition: 'all 0.18s',
                  }}>
                  {pet.photoUrl
                    ? <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                    : (
                      <div className="w-full h-full flex items-center justify-center"
                        style={{ background: 'rgba(139,74,255,0.18)' }}>
                        <PawPrint size={16} className="text-white/35" />
                      </div>
                    )
                  }
                </div>
                {active && (
                  <motion.div
                    layoutId="pet-active-dot"
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-3.5 h-1.5 rounded-full"
                    style={{ background: C.accent }}
                  />
                )}
              </div>
              <span
                className="text-[8px] font-black max-w-[56px] truncate text-center"
                style={{ color: active ? C.accentDim : 'rgba(255,255,255,0.40)' }}>
                {pet.name}
              </span>
            </motion.button>
          );
        })}

        {/* Botão adicionar novo gato */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/cat-new')}
          className="flex-shrink-0 flex flex-col items-center gap-1.5"
          style={{ minWidth: 60 }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              border: '1.5px dashed rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.04)',
            }}>
            <Plus size={15} className="text-white/30" />
          </div>
          <span className="text-[8px] font-black text-white/20">Novo</span>
        </motion.button>
      </div>
    </div>
  );
}

// ─── BetaBanner ───────────────────────────────────────────────────────────────
const BETA_DISMISSED_KEY = 'gatedo_studio_beta_dismissed';
function BetaBanner({ onSaibaMais }) {
  const [min, setMin] = useState(() => {
    try { return !!localStorage.getItem(BETA_DISMISSED_KEY); } catch { return false; }
  });
  const dismiss = () => { setMin(true); try { localStorage.setItem(BETA_DISMISSED_KEY, '1'); } catch {} };
  const expand  = () => { setMin(false); try { localStorage.removeItem(BETA_DISMISSED_KEY); } catch {} };

  if (min) return (
    <motion.button
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} whileTap={{ scale: 0.96 }}
      onClick={expand}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-[22px]"
      style={{ background: 'linear-gradient(135deg,rgba(45,22,96,0.7),rgba(26,13,51,0.7))', border: '1px solid rgba(223,255,64,0.18)', backdropFilter: 'blur(8px)' }}>
      <Sparkles size={13} color={C.accentDim} />
      <div className="flex-1 text-left min-w-0">
        <p className="text-[9px] font-black text-white/45 uppercase tracking-widest leading-none mb-0.5">Studio Beta</p>
        <p className="text-xs font-black text-white leading-none truncate">Em expansão — <span style={{ color: C.accentDim }}>fundadores primeiro</span></p>
      </div>
      <span className="text-[8px] font-black px-2 py-1 rounded-full shrink-0"
        style={{ background: 'rgba(223,255,64,0.12)', color: C.accentDim, border: '1px solid rgba(223,255,64,0.22)' }}>
        Expandir
      </span>
    </motion.button>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="relative rounded-[26px] overflow-hidden"
      style={{ background: 'linear-gradient(145deg,#1a0d33 0%,#2d1660 55%,#1a0d33 100%)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 10px 36px rgba(139,74,255,0.22)' }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(223,255,64,0.4),transparent)' }} />
      <div className="relative z-10 px-5 pt-4 pb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
          style={{ background: 'rgba(223,255,64,0.09)', border: '1px solid rgba(223,255,64,0.18)' }}>
          <Sparkles size={8} color={C.accentDim} fill={C.accentDim} />
          <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: C.accentDim }}>Beta · Prioridade Fundadores</span>
        </div>
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-base font-black text-white leading-tight tracking-tight flex-1">
            O <span style={{ color: C.accentDim }}>GATEDO Studio</span> está em expansão
          </h3>
          <button onClick={dismiss}
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <X size={12} className="text-white/50" />
          </button>
        </div>
        <p className="text-[10px] text-white/50 font-medium leading-relaxed mb-3">
          Os módulos criativos estão sendo liberados por fases. Fundadores terão prioridade nos acessos e testes.
        </p>
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-[16px] mb-4"
          style={{ background: 'rgba(223,255,64,0.06)', border: '1px solid rgba(223,255,64,0.13)' }}>
          <span className="text-lg shrink-0">👑</span>
          <div>
            <p className="text-[9px] font-black text-white/80 leading-tight">Fundadores entram primeiro</p>
            <p className="text-[8px] text-white/40 font-medium leading-relaxed">Mais voz nas features, acessos prioritários e melhores condições.</p>
          </div>
        </div>
        <button onClick={onSaibaMais}
          className="w-full py-3 rounded-[18px] font-black text-xs uppercase tracking-wider text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#936cff,#682adb)', boxShadow: '0 4px 16px rgba(139,74,255,0.3)' }}>
          <Crown size={13} /> Ver prioridade dos fundadores
        </button>
      </div>
    </motion.div>
  );
}

// ─── ComingSoonModal ──────────────────────────────────────────────────────────
function ComingSoonModal({ tool, onClose }) {
  if (!tool) return null;
  const handleNotify = () => {
    try {
      const subs  = JSON.parse(localStorage.getItem(ALERT_KEYS.subscriptions) || '[]');
      const reads = JSON.parse(localStorage.getItem(ALERT_KEYS.reads) || '[]');
      if (!subs.includes(tool.slug)) localStorage.setItem(ALERT_KEYS.subscriptions, JSON.stringify([...subs, tool.slug]));
      localStorage.setItem(ALERT_KEYS.reads, JSON.stringify(reads.filter(s => s !== tool.slug)));
      window.dispatchEvent(new Event('gatedo-alerts-updated'));
    } catch {}
    onClose();
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}>
      <motion.div
        initial={{ y: 60, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 60 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-sm rounded-[36px] p-7 relative overflow-hidden"
        style={{ background: C.card, border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}>
          <X size={14} className="text-white/55" />
        </button>
        {tool.coverImg && (
          <img src={tool.coverImg}
            className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale" alt="" />
        )}
        <div className="relative z-10">
          <div className="text-5xl mb-4">{tool.emoji}</div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: C.accentDim }}>Em breve</p>
          <h3 className="text-xl font-black text-white mb-2 tracking-tight">{tool.title}</h3>
          <p className="text-sm text-white/50 font-medium mb-5 leading-relaxed">{tool.subtitle}</p>
          <div className="flex items-center gap-2 p-3 rounded-2xl mb-5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <CoinChip amount={tool.coinsCost} /><XPChip amount={tool.xpReward} />
          </div>
          <div className="rounded-2xl p-3 mb-4"
            style={{ background: 'rgba(223,255,64,0.06)', border: '1px solid rgba(223,255,64,0.13)' }}>
            <p className="text-[10px] font-black text-white/85">👑 Fundadores entram na frente</p>
            <p className="text-[9px] text-white/40 font-medium mt-1">Este módulo será liberado por fases, com prioridade para fundadores e testadores iniciais.</p>
          </div>
          <button onClick={handleNotify}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider"
            style={{ background: `${C.purple}20`, color: C.purple, border: `1.5px solid ${C.purple}40` }}>
            🔔 Avisar quando lançar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── ActiveModuleCard ─────────────────────────────────────────────────────────
// Carrossel vertical com imagens de assets/cards-home
function ActiveModuleCard({ tool, onPress }) {
  const [hovered, setHovered] = useState(false);
  const W = 152, H = Math.round(W * 1.52);
  return (
    <motion.button whileTap={{ scale: 0.95 }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      onClick={() => onPress(tool)}
      className="flex-shrink-0 rounded-[24px] overflow-hidden relative text-left focus:outline-none"
      style={{
        width: W, height: H,
        boxShadow: hovered ? '0 14px 36px rgba(139,74,255,0.5)' : '0 6px 24px rgba(0,0,0,0.45)',
      }}>
      {/* Imagem de fundo da pasta assets/cards-home */}
      <motion.img
        src={tool.coverImg}
        alt={tool.title}
        className="absolute inset-0 w-full h-full object-cover"
        animate={{ scale: hovered ? 1.07 : 1, filter: hovered ? 'brightness(1.12)' : 'brightness(0.88)' }}
        transition={{ duration: 0.35 }}
      />
      {/* Overlay escuro base */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.22)' }} />
      {/* Gradiente de cor do módulo */}
      <div className="absolute inset-0" style={{ background: tool.gradient || 'transparent', opacity: 0.78 }} />

      {/* Badge Disponível */}
      <div className="absolute top-3 left-3">
        <motion.span
          animate={{ opacity: hovered ? 1 : 0.85, scale: hovered ? 1.06 : 1 }}
          className="text-[7px] font-black px-2 py-0.5 rounded-full inline-block"
          style={{ background: '#DFFF40', color: '#1a1a00' }}>
          ✦ Disponível
        </motion.span>
      </div>

      {/* Badge tipo de output */}
      {tool.outputType === 'video' && (
        <div className="absolute top-3 right-10">
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(236,72,153,0.55)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            Vídeo
          </span>
        </div>
      )}

      {/* Botão play */}
      <motion.div
        animate={{ scale: hovered ? 1.12 : 1, opacity: hovered ? 1 : 0.75 }}
        transition={{ type: 'spring', stiffness: 380, damping: 20 }}
        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.30)' }}>
        <Play size={11} className="text-white ml-0.5" />
      </motion.div>

      {/* Shimmer hover */}
      {hovered && (
        <motion.div
          initial={{ x: '-100%' }} animate={{ x: '200%' }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.10) 50%,transparent 60%)' }}
        />
      )}

      {/* Info bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <span className="text-xl">{tool.emoji}</span>
        <h4 className="font-black text-white text-sm leading-tight mt-0.5 mb-0.5">{tool.title}</h4>
        <p className="text-[9px] font-medium mb-2 leading-snug" style={{ color: 'rgba(255,255,255,0.72)' }}>{tool.subtitle}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{ background: 'rgba(223,255,64,0.18)', border: '1px solid rgba(223,255,64,0.35)' }}>
            <PawPrint size={8} color={C.accentDim} fill={C.accentDim} />
            <span className="text-[8px] font-black" style={{ color: C.accentDim }}>{tool.coinsCost} pts</span>
          </div>
          <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{ background: 'rgba(139,74,255,0.22)', border: '1px solid rgba(139,74,255,0.32)' }}>
            <Zap size={8} color="#cbb1ff" />
            <span className="text-[8px] font-black" style={{ color: '#cbb1ff' }}>+{tool.xpReward} XPT</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─── LockedModuleCard (carrossel visual compacto) ─────────────────────────────
// Agora mais visual: card vertical pequeno com overlay de cor + imagem real
function LockedModuleCard({ tool, onPress }) {
  const [hovered, setHovered] = useState(false);
  const color = tool.overlayColor || '#8B4AFF';
  const W = 130, H = 160;
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      onClick={() => onPress(tool)}
      className="flex-shrink-0 rounded-[20px] overflow-hidden relative text-left focus:outline-none"
      style={{
        width: W, height: H,
        boxShadow: hovered ? `0 10px 28px ${color}45` : '0 4px 16px rgba(0,0,0,0.45)',
        border: hovered ? `1px solid ${color}55` : '1px solid rgba(255,255,255,0.06)',
        transition: 'box-shadow 0.2s, border 0.2s',
      }}>
      {/* Imagem de fundo */}
      <motion.img
        src={tool.coverImg}
        alt={tool.title}
        className="absolute inset-0 w-full h-full object-cover"
        animate={{
          scale: hovered ? 1.08 : 1,
          filter: 'grayscale(55%) brightness(0.55)',
        }}
        transition={{ duration: 0.3 }}
      />
      {/* Overlay de cor */}
      <div className="absolute inset-0"
        style={{ background: `linear-gradient(160deg,${color}60 0%,transparent 55%)` }} />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(0deg,rgba(15,10,30,0.95) 0%,rgba(15,10,30,0.35) 60%,transparent 100%)' }} />

      {/* Cadeado centralizado */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale: hovered ? 1.12 : 1 }}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', border: `1px solid ${color}45` }}>
          <Lock size={14} style={{ color }} />
        </motion.div>
      </div>

      {/* Badge em breve */}
      <div className="absolute top-2.5 left-2.5">
        <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.45)', backdropFilter: 'blur(4px)' }}>
          Em breve
        </span>
      </div>

      {/* Info bottom */}
      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
        <span className="text-base leading-none block mb-1">{tool.emoji}</span>
        <p className="text-[10px] font-black text-white leading-tight">{tool.title}</p>
        <p className="text-[8px] mt-0.5 leading-snug line-clamp-1"
          style={{ color: `${color}99` }}>
          {tool.category}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Mini card de criação recente ─────────────────────────────────────────────
function RecentCreationCard({ asset, onClick }) {
  const [hovered, setHovered]     = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);

  const imgUrl = asset.outputImageUrl || asset.resultUrl || asset.url
    || asset.imageUrl || asset.outputUrl || asset.thumbnailUrl
    || asset.image    || asset.output    || '';

  const emoji  = MODULE_EMOJIS[asset.moduleKey || asset.toolId] || '🐱';
  const showImg = !!imgUrl && !imgError;

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      className="flex-shrink-0 rounded-[20px] overflow-hidden relative focus:outline-none"
      style={{
        width: 110, height: 110,
        boxShadow: hovered ? '0 8px 24px rgba(139,74,255,0.4)' : '0 4px 14px rgba(0,0,0,0.4)',
        background: 'linear-gradient(135deg,rgba(139,74,255,0.18),rgba(236,72,153,0.12))',
      }}>
      <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-25 select-none pointer-events-none">
        {emoji}
      </div>
      {showImg && (
        <motion.img
          key={imgUrl} src={imgUrl} alt="" loading="lazy"
          onLoad={() => setImgLoaded(true)} onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: imgLoaded ? 1 : 0 }}
          animate={{ scale: hovered ? 1.1 : 1 }} transition={{ duration: 0.3 }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-1.5 left-2 text-base leading-none">{emoji}</div>
      <div className="absolute bottom-1.5 right-1.5 opacity-35 pointer-events-none">
        <img src="/assets/App_gatedo_logo1.webp" alt="" className="w-4 h-4 object-contain" />
      </div>
      {hovered && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.52)' }}>
          <div className="flex flex-col items-center gap-1">
            <Globe2 size={16} className="text-white" />
            <span className="text-[8px] font-black text-white">Publicar</span>
          </div>
        </motion.div>
      )}
    </motion.button>
  );
}

// ─── DesafioSection ───────────────────────────────────────────────────────────
function DesafioSection() {
  return (
    <div className="space-y-5">
      <div className="rounded-[28px] p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1C0A2E,#2D1B4E)', border: `1.5px solid ${C.purple}35` }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent,${C.purple}60,transparent)` }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} color={C.accentDim} />
            <p className="text-[9px] font-black uppercase tracking-[3px]" style={{ color: C.accentDim }}>Desafios da Comunigato</p>
          </div>
          <h2 className="text-lg font-black text-white mb-1 leading-tight">Acompanhe os desafios e ganhe recompensas extras</h2>
          <p className="text-[10px] text-white/45 font-medium leading-relaxed">Complete desafios criativos, acumule XPT extra e apareça no ranking da comunidade.</p>
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-[14px] w-fit"
            style={{ background: 'rgba(223,255,64,0.08)', border: '1px solid rgba(223,255,64,0.18)' }}>
            <Flame size={11} color={C.accentDim} />
            <span className="text-[9px] font-black" style={{ color: C.accentDim }}>Em breve — fique ligado!</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {CHALLENGES.map((ch, i) => {
          const pct = Math.min(100, Math.round((ch.progress / ch.total) * 100));
          return (
            <motion.div key={ch.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-[22px] p-4 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{ch.emoji}</span>
                  <div>
                    <p className="text-sm font-black text-white leading-tight">{ch.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{ background: `${C.purple}20`, color: '#cbb1ff' }}>+{ch.xp} XPT</span>
                      <div className="flex items-center gap-1">
                        <Clock size={9} className="text-white/30" />
                        <span className="text-[8px] text-white/30 font-bold">{ch.daysLeft}d restantes</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-black text-white/30">{ch.progress}/{ch.total}</p>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full mt-1 inline-block"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.30)' }}>Em breve</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] text-white/30 font-bold uppercase tracking-wider">Progresso</span>
                  <span className="text-[8px] font-black text-white/25">{pct}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct || 4}%` }}
                    transition={{ duration: 0.9, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg,${C.purple},${C.accentDim})`, opacity: pct > 0 ? 1 : 0.25 }}
                  />
                </div>
                <p className="text-[8px] text-white/18 font-medium mt-1">Disponível quando os módulos forem liberados</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-[20px] p-4 flex items-center gap-3"
        style={{ background: 'rgba(139,74,255,0.08)', border: '1px solid rgba(139,74,255,0.18)' }}>
        <Trophy size={16} color={C.purple} className="shrink-0" />
        <div>
          <p className="text-xs font-black text-white">Ranking de criadores em breve</p>
          <p className="text-[9px] text-white/40 font-medium mt-0.5">Os top criadores do Studio terão destaque na Comunigato.</p>
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function Studio() {
  const navigate = useNavigate();
  const touch    = useSensory();
  const { user } = useContext(AuthContext);
  const { points: contextPoints, xp } = useGamification();

  const [resolvedPoints,    setResolvedPoints]    = useState(0);
  const [pets,              setPets]              = useState([]);
  const [selectedPet,       setSelectedPet]       = useState(null);
  const [comingSoonTool,    setComingSoonTool]    = useState(null);
  const [activeSection,     setActiveSection]     = useState('criar');
  const [alertsBadgeCount,  setAlertsBadgeCount]  = useState(0);
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);
  const [recentCreations,   setRecentCreations]   = useState([]);
  const [recentLoading,     setRecentLoading]     = useState(true);

  useEffect(() => {
    api.get('/pets').then(r => {
      const list = Array.isArray(r.data) ? r.data.filter(p => !p.isMemorial) : [];
      setPets(list);
      if (list.length === 1) setSelectedPet(list[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    if (contextPoints > 0) { setResolvedPoints(contextPoints); return; }
    api.get(`/gamification/points/${user.id}`)
      .then(r => setResolvedPoints(r.data?.points ?? 0))
      .catch(() => setResolvedPoints(contextPoints || 0));
  }, [user?.id, contextPoints]);

  const loadRecent = () => {
    setRecentLoading(true);
    api.get('/studio/creations', { params: { limit: 8 } })
      .then(r => setRecentCreations(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRecentCreations([]))
      .finally(() => setRecentLoading(false));
  };
  useEffect(() => { loadRecent(); }, []);

  useEffect(() => {
    const load = () => {
      try {
        const subs  = JSON.parse(localStorage.getItem(ALERT_KEYS.subscriptions) || '[]');
        const reads = JSON.parse(localStorage.getItem(ALERT_KEYS.reads) || '[]');
        setAlertsBadgeCount(subs.filter(s => !reads.includes(s)).length);
      } catch { setAlertsBadgeCount(0); }
    };
    load();
    window.addEventListener('focus', load);
    window.addEventListener('gatedo-alerts-updated', load);
    return () => {
      window.removeEventListener('focus', load);
      window.removeEventListener('gatedo-alerts-updated', load);
    };
  }, []);

  useEffect(() => {
    const refresh = () => { setGalleryRefreshKey(k => k + 1); loadRecent(); };
    window.addEventListener('gatedo-social-published', refresh);
    window.addEventListener('gatedo-studio-created', refresh);
    return () => {
      window.removeEventListener('gatedo-social-published', refresh);
      window.removeEventListener('gatedo-studio-created', refresh);
    };
  }, []);

  // Navegação para módulo ativo
  const handleToolOpen = (tool) => {
    touch();
    if (tool.isLocked || tool.isComingSoon) { setComingSoonTool(tool); return; }
    navigate(`/studio/${tool.slug}`, { state: { studioTool: tool, selectedPet } });
  };
  const handleLockedTool = (tool) => { touch(); setComingSoonTool(tool); };

  const TABS = [
    { id: 'criar',   label: 'Criar' },
    { id: 'galeria', label: 'Minha Galeria' },
    { id: 'desafio', label: 'Desafios 🔥' },
  ];

  return (
    <div className="min-h-screen pb-32 pt-6 px-5 font-sans text-white overflow-x-hidden"
      style={{ background: C.dark }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => { touch(); navigate(-1); }}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-white/10"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <img src="/assets/logo_gatedo_full.webp" alt="Gatedo"
            className="h-5 w-auto object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          <span className="text-sm font-black tracking-wide" style={{ color: C.accentDim }}>Studio</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => navigate('/alerts')}
            className="relative w-10 h-10 flex items-center justify-center rounded-full border border-white/10"
            style={{ background: 'rgba(255,255,255,0.06)' }}>
            <Bell size={15} className="text-white/70" />
            {alertsBadgeCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[8px] font-black flex items-center justify-center border-2 border-[#0f0a1e]">
                {alertsBadgeCount > 9 ? '9+' : alertsBadgeCount}
              </span>
            )}
          </button>
          <CoinChip amount={resolvedPoints} />
          <XPChip amount={xp} />
        </div>
      </div>

      {/* ── Pet Picker Visual ── */}
      <PetPickerRow
        pets={pets}
        selected={selectedPet}
        onSelect={setSelectedPet}
        onAddCat={() => navigate('/cat-new')}
      />

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-5 overflow-x-auto -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button key={t.id}
            onClick={() => { touch(); setActiveSection(t.id); }}
            className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all"
            style={
              activeSection === t.id
                ? { background: C.accentDim, color: '#1a1a00' }
                : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }
            }>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeSection}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
          className="space-y-6">

          {activeSection === 'criar' && (
            <>
              <BetaBanner onSaibaMais={() => navigate('/clube')} />

              {/* Últimas criações */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-[3px]">Últimas criações</p>
                  <button onClick={() => { touch(); setActiveSection('galeria'); }}
                    className="text-[8px] font-black flex items-center gap-1" style={{ color: C.accentDim }}>
                    Ver galeria <ChevronRight size={10} />
                  </button>
                </div>
                {recentLoading ? (
                  <div className="flex gap-2.5">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-shrink-0 rounded-[20px] animate-pulse"
                        style={{ width: 110, height: 110, background: 'rgba(255,255,255,0.06)' }} />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2.5 overflow-x-auto -mx-5 px-5 pb-1" style={{ scrollbarWidth: 'none' }}>
                    {recentCreations.length === 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="flex-shrink-0 rounded-[20px] flex flex-col items-center justify-center gap-1.5 px-4"
                        style={{ width: 200, height: 110, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                        <span className="text-2xl">🎨</span>
                        <p className="text-[9px] font-black text-white/30 text-center leading-snug">Suas criações aparecerão aqui</p>
                      </motion.div>
                    )}
                    {recentCreations.map((asset, i) => (
                      <motion.div key={asset.id || i}
                        initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 22 }}>
                        <RecentCreationCard asset={asset} onClick={() => { touch(); setActiveSection('galeria'); }} />
                      </motion.div>
                    ))}
                    {/* Criar nova */}
                    <motion.button
                      initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: recentCreations.length * 0.04 }}
                      whileTap={{ scale: 0.92 }} onClick={() => handleToolOpen(STUDIO_TOOLS[0])}
                      className="flex-shrink-0 rounded-[20px] flex flex-col items-center justify-center gap-2 border border-dashed"
                      style={{ width: 110, height: 110, background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.12)' }}>
                      <Sparkles size={18} style={{ color: C.accentDim }} />
                      <span className="text-[8px] font-black text-white/40">Criar nova</span>
                    </motion.button>
                  </div>
                )}
              </div>

              {/* ── Módulos ATIVOS ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-[3px]">Criar agora</p>
                  <span className="text-[8px] font-black px-2 py-0.5 rounded-full"
                    style={{ background: '#DFFF4018', color: C.accentDim, border: '1px solid #DFFF4030' }}>
                    ✦ {STUDIO_TOOLS.length} disponíveis
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2" style={{ scrollbarWidth: 'none' }}>
                  {STUDIO_TOOLS.map((tool, i) => (
                    <motion.div key={tool.id}
                      initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.06 }}>
                      <ActiveModuleCard tool={tool} onPress={handleToolOpen} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ── Módulos BLOQUEADOS — carrossel visual ── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-[3px]">Em breve</p>
                  <button onClick={() => navigate('/alerts')}
                    className="text-[8px] font-black px-2 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    🔔 Novidades
                  </button>
                </div>
                <div className="flex gap-2.5 overflow-x-auto -mx-5 px-5 pb-2" style={{ scrollbarWidth: 'none' }}>
                  {LOCKED_MODULES.map((tool, i) => (
                    <motion.div key={tool.id}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}>
                      <LockedModuleCard tool={tool} onPress={handleLockedTool} />
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-[20px] p-3.5 flex items-center gap-3"
                style={{ background: 'rgba(223,255,64,0.04)', border: '1px solid rgba(223,255,64,0.09)' }}>
                <Crown size={14} color={C.accentDim} className="shrink-0" />
                <p className="text-[9px] text-white/35 font-bold leading-relaxed">
                  Os módulos do Studio são liberados por fases. Fundadores têm prioridade de acesso, testes e melhores condições.
                </p>
              </div>
            </>
          )}

          {activeSection === 'galeria' && <StudioGallery refreshTrigger={galleryRefreshKey} />}
          {activeSection === 'desafio' && <DesafioSection />}

        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {comingSoonTool && (
          <ComingSoonModal tool={comingSoonTool} onClose={() => setComingSoonTool(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}