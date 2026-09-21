import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Palette, Zap, PawPrint, ChevronRight,
  X, Upload, Check, Heart, Play,
  AlertCircle, ChevronLeft
} from 'lucide-react';
import useSensory from '../hooks/useSensory';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useGamification } from '../context/GamificationContext';

// ─── PALETA ───────────────────────────────────────────────────────────────────
const C = {
  purple: '#8B4AFF',
  purpleDark: '#682adb',
  accent: '#DFFF40',
  accentDim: '#ebfc66',
  dark: '#0f0a1e',
  card: '#1a1030',
};

// ─── CATÁLOGO ────────────────────────────────────────────────────────────────
const STUDIO_TOOLS = [
  {
    id: 'cat-sticker',
    slug: 'cat-sticker',
    title: 'Sticker',
    subtitle: 'Seu gato vira sticker em segundos',
    coinsCost: 3,
    xpReward: 2,
    publishable: true,
    isActive: true,
    isComingSoon: false,
    emoji: '✨',
    gradient: 'linear-gradient(135deg, #8B4AFF 0%, #ec4899 100%)',
    badge: 'Leve',
    outputType: 'image',
    description: 'Crie stickers rápidos do seu gato para postar, salvar e compartilhar.',
    inputsRequired: ['foto do gato'],
  },
  {
    id: 'cat-style-portrait',
    slug: 'cat-style-portrait',
    title: 'Estilos',
    subtitle: 'Arte, aquarela, Pixar, anime e mais',
    coinsCost: 8,
    xpReward: 4,
    publishable: true,
    isActive: true,
    isComingSoon: false,
    emoji: '🎨',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8B4AFF 100%)',
    badge: 'Popular',
    outputType: 'image',
    description: 'Transforme a foto do seu gato em obra de arte.',
    inputsRequired: ['foto do gato'],
  },
  {
    id: 'cat-id-card',
    slug: 'cat-id-card',
    title: 'RG do Gato',
    subtitle: 'Cartão estilizado do perfil do seu gato',
    coinsCost: 12,
    xpReward: 18,
    publishable: true,
    isActive: true,
    isComingSoon: false,
    emoji: '🪪',
    gradient: 'linear-gradient(135deg, #0ea5e9 0%, #8B4AFF 100%)',
    badge: null,
    outputType: 'image',
    description: 'Gera um card bonito e compartilhável com identidade do seu gato.',
    inputsRequired: ['foto do gato'],
  },
  {
    id: 'read-cat-mind',
    slug: 'read-cat-mind',
    title: 'Mente do Gato',
    subtitle: 'O que seu gato está pensando agora?',
    coinsCost: 25,
    xpReward: 35,
    publishable: true,
    isActive: true,
    isComingSoon: false,
    emoji: '🧠',
    gradient: 'linear-gradient(135deg, #8B4AFF 0%, #4B40C6 100%)',
    badge: 'Destaque',
    outputType: 'image',
    description: 'Gera um card divertido com pensamentos, humor e personalidade do seu gato.',
    inputsRequired: ['foto do gato'],
  },
  {
    id: 'tutor-cat-montage',
    slug: 'tutor-cat-montage',
    title: 'Tutor + Gato',
    subtitle: 'Você e seu gato numa cena mágica',
    coinsCost: 10,
    xpReward: 25,
    publishable: true,
    isActive: true,
    isComingSoon: false,
    emoji: '📸',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
    badge: null,
    outputType: 'image',
    description: 'Envie uma foto sua e do seu gato. A IA cria uma montagem criativa dos dois juntos.',
    inputsRequired: ['foto do gato', 'foto sua'],
  },
  {
    id: 'cat-dance',
    slug: 'cat-dance',
    title: 'Dancinhas',
    subtitle: 'Seu gato dançando em trends virais',
    coinsCost: 40,
    xpReward: 80,
    publishable: true,
    isActive: true,
    isComingSoon: false,
    emoji: '🕺',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f59e0b 100%)',
    badge: 'Novo',
    outputType: 'video',
    description: 'Envie uma foto do seu gato e escolha um estilo de dança.',
    inputsRequired: ['foto do gato'],
  },

  {
    id: 'cat-voice',
    slug: 'cat-voice',
    title: 'Voz do Gato',
    subtitle: 'Seu gato fala de verdade',
    coinsCost: 50,
    xpReward: 70,
    publishable: true,
    isActive: false,
    isComingSoon: true,
    emoji: '🎙️',
    gradient: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
    outputType: 'video',
  },
  {
    id: 'animated-story',
    slug: 'animated-story',
    title: 'Histórias',
    subtitle: 'Animação com o gato como protagonista',
    coinsCost: 80,
    xpReward: 100,
    publishable: true,
    isActive: false,
    isComingSoon: true,
    emoji: '📖',
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    outputType: 'video',
  },
  {
    id: 'meme-maker',
    slug: 'meme-maker',
    title: 'Meme Maker',
    subtitle: 'Memes gateiros automáticos',
    coinsCost: 15,
    xpReward: 30,
    publishable: true,
    isActive: false,
    isComingSoon: true,
    emoji: '😂',
    gradient: 'linear-gradient(135deg, #facc15 0%, #f97316 100%)',
    outputType: 'image',
  },
  {
    id: 'vogue-cat',
    slug: 'vogue-cat',
    title: 'Vogue Cat',
    subtitle: 'Seu gato na capa da revista',
    coinsCost: 30,
    xpReward: 45,
    publishable: true,
    isActive: false,
    isComingSoon: true,
    emoji: '📰',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #8B4AFF 100%)',
    outputType: 'image',
  },
];

const ACTIVE_TOOLS = STUDIO_TOOLS.filter(t => t.isActive);
const COMING_TOOLS = STUDIO_TOOLS.filter(t => t.isComingSoon);

const TOOL_ROUTE_MAP = {
  'cat-sticker': '/studio/sticker',
  'cat-style-portrait': '/studio/portrait',
  'cat-id-card': '/studio/id',
  'read-cat-mind': '/studio/magazine',
  'tutor-cat-montage': '/studio/portrait',
  'cat-dance': '/creative',
};

const GALLERY_ITEMS = [
  { id: 1, type: 'image', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80', tool: 'Estilos', likes: '12k', author: 'Aline' },
  { id: 2, type: 'image', img: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=400&q=80', tool: 'Mente', likes: '8.5k', author: 'Marcos' },
  { id: 3, type: 'image', img: 'https://images.unsplash.com/photo-1495360019602-e001922271aa?auto=format&fit=crop&w=400&q=80', tool: 'Tutor+Gato', likes: '5k', author: 'Carla' },
  { id: 4, type: 'video', img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=400&q=80', tool: 'Dancinha', likes: '22k', author: 'Felipe' },
];

// ─── SUBCOMPONENTES ──────────────────────────────────────────────────────────
function CoinChip({ amount, size = 'sm' }) {
  const sz = size === 'lg'
    ? { icon: 14, text: 'text-sm', pad: 'px-3 py-1.5' }
    : { icon: 10, text: 'text-[9px]', pad: 'px-2 py-0.5' };

  return (
    <div
      className={`flex items-center gap-1 rounded-full ${sz.pad}`}
      style={{ background: 'rgba(223,255,64,0.12)', border: '1px solid rgba(223,255,64,0.25)' }}
    >
      <PawPrint size={sz.icon} color={C.accentDim} fill={C.accentDim} />
      <span className={`${sz.text} font-black`} style={{ color: C.accentDim }}>
        {amount} pts
      </span>
    </div>
  );
}

function XPChip({ amount, size = 'sm' }) {
  const sz = size === 'lg'
    ? { icon: 14, text: 'text-sm', pad: 'px-3 py-1.5' }
    : { icon: 10, text: 'text-[9px]', pad: 'px-2 py-0.5' };

  return (
    <div
      className={`flex items-center gap-1 rounded-full ${sz.pad}`}
      style={{ background: 'rgba(139,74,255,0.16)', border: '1px solid rgba(139,74,255,0.25)' }}
    >
      <Zap size={sz.icon} color={C.purple} fill={C.purple} />
      <span className={`${sz.text} font-black`} style={{ color: '#cbb1ff' }}>
        {amount} XP
      </span>
    </div>
  );
}

function ComingSoonModal({ tool, onClose }) {
  if (!tool) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 60 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-sm rounded-[36px] p-7 relative overflow-hidden"
        style={{ background: C.card, border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <X size={14} className="text-white/60" />
        </button>

        <div className="text-5xl mb-4">{tool.emoji}</div>
        <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: C.accentDim }}>
          Em breve
        </p>
        <h3 className="text-xl font-black text-white mb-2 tracking-tight">{tool.title}</h3>
        <p className="text-sm text-white/50 font-medium mb-5 leading-relaxed">{tool.subtitle}</p>

        <div
          className="flex items-center justify-between p-3 rounded-2xl mb-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <CoinChip amount={tool.coinsCost} />
          <div className="flex items-center gap-1" style={{ color: C.accentDim }}>
            <Zap size={11} fill={C.accentDim} />
            <span className="text-[9px] font-black">+{tool.xpReward} XP</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider"
          style={{ background: `${C.purple}20`, color: C.purple, border: `1.5px solid ${C.purple}40` }}
        >
          Avisar quando lançar
        </button>
      </motion.div>
    </motion.div>
  );
}

function PetSelectorModal({ pets, selectedPet, onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[310] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 60 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-sm rounded-[36px] p-6"
        style={{ background: C.card, border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/40">Escolha o gato</p>
            <h3 className="text-base font-black text-white">Para qual perfil vai essa criação?</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <X size={14} className="text-white/60" />
          </button>
        </div>

        <div className="space-y-2">
          {pets.map((pet) => {
            const active = selectedPet?.id === pet.id;
            return (
              <button
                key={pet.id}
                onClick={() => {
                  onSelect(pet);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-[20px] border text-left"
                style={{
                  background: active ? `${C.purple}18` : 'rgba(255,255,255,0.04)',
                  borderColor: active ? `${C.purple}50` : 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                  {pet.photoUrl
                    ? <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><PawPrint size={18} className="text-white/30" /></div>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white">{pet.name}</p>
                  <p className="text-[10px] text-white/40 font-bold">{pet.breed || 'SRD'}</p>
                </div>
                {active && <Check size={16} color={C.accentDim} />}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ToolDetailModal({ tool, walletPoints, selectedPet, onChoosePet, onClose, onContinue, onGoClube }) {
  if (!tool) return null;
  const canAfford = walletPoints >= tool.coinsCost;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, scale: 0.94 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm rounded-[36px] overflow-hidden relative"
        style={{ background: C.card, border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="h-32 relative flex items-end p-5" style={{ background: tool.gradient }}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <X size={14} className="text-white" />
          </button>
          <div>
            <span className="text-3xl">{tool.emoji}</span>
            <h3 className="text-xl font-black text-white tracking-tight mt-1">{tool.title}</h3>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-white/60 font-medium leading-relaxed">{tool.description}</p>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(223,255,64,0.06)', border: '1px solid rgba(223,255,64,0.15)' }}>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">Custo</p>
              <CoinChip amount={tool.coinsCost} size="lg" />
            </div>
            <div className="rounded-2xl p-3 text-center" style={{ background: 'rgba(139,74,255,0.08)', border: `1px solid ${C.purple}20` }}>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">XP</p>
              <div className="flex items-center justify-center gap-1">
                <Zap size={14} fill={C.accentDim} color={C.accentDim} />
                <span className="text-sm font-black" style={{ color: C.accentDim }}>+{tool.xpReward}</span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Gato vinculado</p>
            <button
              onClick={onChoosePet}
              className="w-full flex items-center gap-3 p-3 rounded-[20px] border"
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                {selectedPet?.photoUrl
                  ? <img src={selectedPet.photoUrl} alt={selectedPet.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><PawPrint size={18} className="text-white/30" /></div>}
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-black text-white">{selectedPet?.name || 'Escolher gato'}</p>
                <p className="text-[9px] text-white/40 font-bold">
                  {selectedPet ? 'A criação e o post serão vinculados a este perfil' : 'Obrigatório para gerar e publicar'}
                </p>
              </div>
              <ChevronRight size={14} className="text-white/30" />
            </button>
          </div>

          <div>
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-2">Entradas necessárias</p>
            <div className="space-y-1.5">
              {tool.inputsRequired?.map((inp, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${C.purple}25` }}>
                    <Upload size={10} color={C.purple} />
                  </div>
                  <p className="text-[10px] font-bold text-white/60 capitalize">{inp}</p>
                </div>
              ))}
            </div>
          </div>

          {!canAfford && (
            <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={14} color="#ef4444" />
              <div>
                <p className="text-[10px] font-black text-red-400">Saldo insuficiente</p>
                <p className="text-[9px] text-white/40 font-bold">Você tem {walletPoints} pts — precisa de {tool.coinsCost}</p>
              </div>
            </div>
          )}

          {!selectedPet && (
            <div className="rounded-2xl p-3 flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <AlertCircle size={14} color="#f59e0b" />
              <div>
                <p className="text-[10px] font-black text-amber-400">Escolha um gato antes de continuar</p>
                <p className="text-[9px] text-white/40 font-bold">A criação e a publicação precisam ficar no perfil certo</p>
              </div>
            </div>
          )}

          {canAfford ? (
            <button
              disabled={!selectedPet}
              onClick={() => onContinue(tool)}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all"
              style={{
                background: !selectedPet ? 'rgba(255,255,255,0.06)' : tool.gradient,
                color: !selectedPet ? 'rgba(255,255,255,0.3)' : 'white',
                cursor: !selectedPet ? 'not-allowed' : 'pointer',
              }}
            >
              Continuar para o módulo
            </button>
          ) : (
            <button
              onClick={onGoClube}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider"
              style={{ background: 'linear-gradient(135deg,#936cff,#682adb)', color: 'white' }}
            >
              Comprar moedas no Clube
            </button>
          )}

          <p className="text-center text-[9px] text-white/30 font-bold">
            O débito real acontece quando a geração for executada no módulo
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ActiveToolCard({ tool, isLarge, onPress }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={() => onPress(tool)}
      className={`${isLarge ? 'col-span-2' : 'col-span-1'} rounded-[28px] relative overflow-hidden text-left border border-white/5`}
      style={{
        background: tool.gradient,
        minHeight: isLarge ? 180 : 156,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
      <div className="absolute -right-2 -bottom-4 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />

      <div className="relative z-10 p-5 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="text-3xl">{tool.emoji}</span>
          <div className="flex flex-col items-end gap-1">
            {tool.badge && (
              <span className="text-[8px] font-black px-2 py-0.5 rounded-full" style={{ background: C.accentDim, color: '#1a1a00' }}>
                {tool.badge}
              </span>
            )}
            <CoinChip amount={tool.coinsCost} />
          </div>
        </div>

        <div>
          <h4 className="font-black text-white text-base leading-tight mb-0.5">{tool.title}</h4>
          <p className="text-[10px] text-white/60 font-medium leading-snug">{tool.subtitle}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Zap size={9} fill={C.accentDim} color={C.accentDim} />
            <span className="text-[8px] font-black" style={{ color: C.accentDim }}>
              +{tool.xpReward} XP ao concluir
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function BannerCarousel({ tools, onPress }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!tools.length) return;
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % tools.length), 4000);
    return () => clearInterval(timerRef.current);
  }, [tools.length]);

  const go = (dir) => {
    clearInterval(timerRef.current);
    setIdx(i => (i + dir + tools.length) % tools.length);
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % tools.length), 4000);
  };

  if (!tools.length) return null;
  const tool = tools[idx];

  return (
    <div className="relative rounded-[28px] overflow-hidden mb-5" style={{ height: 190, background: tool.gradient, boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
      <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />

      <AnimatePresence mode="wait">
        <motion.div
          key={tool.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-0 p-6 flex flex-col justify-between z-10"
        >
          <div>
            {tool.badge && (
              <span className="text-[8px] font-black px-2 py-1 rounded-full" style={{ background: C.accentDim, color: '#1a1a00' }}>
                {tool.badge}
              </span>
            )}
          </div>

          <div>
            <p className="text-4xl mb-2">{tool.emoji}</p>
            <h3 className="text-xl font-black text-white tracking-tight leading-tight mb-1">{tool.title}</h3>
            <p className="text-[11px] text-white/60 font-medium mb-4">{tool.subtitle}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onPress(tool)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-black text-xs uppercase tracking-wider"
                style={{ background: C.accentDim, color: '#1a1a00' }}
              >
                Abrir
                <ChevronRight size={13} strokeWidth={3} />
              </button>
              <CoinChip amount={tool.coinsCost} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={() => go(-1)}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-20"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <ChevronLeft size={15} className="text-white" />
      </button>

      <button
        onClick={() => go(1)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-20"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <ChevronRight size={15} className="text-white" />
      </button>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
        {tools.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              clearInterval(timerRef.current);
              setIdx(i);
            }}
            className="rounded-full transition-all"
            style={{ width: i === idx ? 16 : 5, height: 5, background: i === idx ? C.accentDim : 'rgba(255,255,255,0.3)' }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function Studio() {
  const navigate = useNavigate();
  const touch = useSensory();

  const { user } = useContext(AuthContext);
  const {
    points: contextPoints,
    xp,
    level,
  } = useGamification();

  const [resolvedPoints, setResolvedPoints] = useState(0);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);

  const [selectedTool, setSelectedTool] = useState(null);
  const [comingSoonTool, setComingSoonTool] = useState(null);
  const [showPetSelector, setShowPetSelector] = useState(false);

  const [activeSection, setActiveSection] = useState('criar');

  useEffect(() => {
    api.get('/pets')
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : [];
        setPets(list);
        if (list.length === 1) setSelectedPet(list[0]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    if (contextPoints > 0) {
      setResolvedPoints(contextPoints);
      return;
    }

    api.get(`/gamification/points/${user.id}`)
      .then((r) => {
        const pts = r.data?.points ?? 0;
        setResolvedPoints(pts);
      })
      .catch(() => {
        setResolvedPoints(contextPoints || 0);
      });
  }, [user?.id, contextPoints]);

  const handleToolPress = (tool) => {
    touch();
    if (tool.isComingSoon) {
      setComingSoonTool(tool);
      return;
    }
    setSelectedTool(tool);
  };

  const handleContinueToModule = (tool) => {
    const route = TOOL_ROUTE_MAP[tool.slug] || '/studio/portrait';

    navigate(route, {
      state: {
        studioTool: {
          id: tool.id,
          slug: tool.slug,
          title: tool.title,
          cost: tool.coinsCost,
          xpReward: tool.xpReward,
          outputType: tool.outputType,
          publishable: tool.publishable,
        },
        selectedPet: selectedPet
          ? {
              id: selectedPet.id,
              name: selectedPet.name,
              breed: selectedPet.breed,
              photoUrl: selectedPet.photoUrl,
            }
          : null,
      },
    });
  };

  const goClube = () => {
    navigate('/clube?from=studio&reason=points');
  };

  const SECTIONS = [
    { id: 'criar', label: 'Criar' },
    { id: 'galeria', label: 'Galeria' },
    { id: 'desafio', label: 'Desafio 🔥' },
  ];

  return (
    <div className="min-h-screen pb-32 pt-6 px-5 font-sans text-white overflow-x-hidden" style={{ background: C.dark }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            touch();
            navigate(-1);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-white/10"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <ArrowLeft size={18} />
        </button>

        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <Palette size={14} style={{ color: C.accentDim }} />
          <span className="text-sm font-black tracking-wide">
            GATEDO <span style={{ color: C.accentDim }}>STUDIO</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <CoinChip amount={resolvedPoints} />
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <XPChip amount={xp} />
          </div>
        </div>
      </div>

      <div
        className="mb-5 rounded-[22px] p-3 border"
        style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] text-white/35 font-bold">
              XP total: {xp} • nível atual: {level?.name || 'Filhote'}
            </p>
        </div>
      </div>

      <div className="mb-5">
        <button
          onClick={() => setShowPetSelector(true)}
          className="w-full flex items-center gap-3 p-3 rounded-[22px] border"
          style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
            {selectedPet?.photoUrl
              ? <img src={selectedPet.photoUrl} alt={selectedPet.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><PawPrint size={18} className="text-white/30" /></div>}
          </div>
          <div className="flex-1 text-left">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-0.5">Perfil vinculado</p>
            <p className="text-sm font-black text-white">{selectedPet?.name || 'Escolher gato antes de criar'}</p>
            <p className="text-[9px] text-white/35 font-bold">
              Toda criação e publicação vai para o perfil deste gato
            </p>
          </div>
          <ChevronRight size={15} className="text-white/30" />
        </button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto -mx-5 px-5" style={{ scrollbarWidth: 'none' }}>
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => {
              touch();
              setActiveSection(s.id);
            }}
            className="px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all flex-shrink-0"
            style={activeSection === s.id
              ? { background: C.accentDim, color: '#1a1a00' }
              : { background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {activeSection === 'criar' && (
            <div className="space-y-4">
              <BannerCarousel tools={ACTIVE_TOOLS} onPress={handleToolPress} />

              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[3px]">Ferramentas disponíveis</p>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: `${C.purple}20`, color: C.purple }}>
                  {ACTIVE_TOOLS.length} ativas
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {ACTIVE_TOOLS.map((tool, i) => (
                  <ActiveToolCard key={tool.id} tool={tool} isLarge={i === 0} onPress={handleToolPress} />
                ))}
              </div>

              <div>
                <p className="text-[9px] font-black text-white/40 uppercase tracking-[3px] mb-3 mt-2">Em breve</p>
                <div className="grid grid-cols-3 gap-2.5">
                  {COMING_TOOLS.map(tool => (
                    <motion.button
                      key={tool.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleToolPress(tool)}
                      className="rounded-[22px] p-4 flex flex-col items-center gap-2 text-center border border-white/06"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <span className="text-2xl opacity-60">{tool.emoji}</span>
                      <p className="text-[9px] font-black text-white/40 leading-tight">{tool.title}</p>
                      <div className="text-[7px] font-black px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                        {tool.coinsCost} pts
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="rounded-[22px] p-4 flex items-center gap-3" style={{ background: 'rgba(223,255,64,0.05)', border: '1px solid rgba(223,255,64,0.1)' }}>
                <PawPrint size={16} fill={C.accentDim} color={C.accentDim} className="shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-white/70">Saldo com fallback do TutorProfile</p>
                  <p className="text-[9px] text-white/35 font-bold">Se o contexto vier zerado, o Studio busca os pontos pelo user.id</p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'galeria' && (
            <div>
              <p className="text-[9px] font-black text-white/40 uppercase tracking-[3px] mb-4">
                Criações da Comunidade
              </p>
              <div className="columns-2 gap-3 space-y-3">
                {GALLERY_ITEMS.map(item => (
                  <motion.div
                    key={item.id}
                    whileTap={{ scale: 0.98 }}
                    className="break-inside-avoid rounded-[20px] overflow-hidden border border-white/08 relative group cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <img src={item.img} className="w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                    <div className="absolute inset-0 flex flex-col justify-end p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                      <span className="text-[7px] font-black px-1.5 py-0.5 rounded-full mb-1.5 w-fit" style={{ background: `${C.purple}40`, color: C.accentDim }}>
                        Studio · {item.tool}
                      </span>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1" style={{ color: C.accentDim }}>
                          <Heart size={9} fill="currentColor" />
                          <span className="text-[9px] font-black">{item.likes}</span>
                        </div>
                        <span className="text-[8px] text-white/50 font-bold">{item.author}</span>
                      </div>
                    </div>
                    {item.type === 'video' && (
                      <div className="absolute top-2 right-2 rounded-full p-1.5 border border-white/20" style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <Play size={9} className="text-white" fill="white" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'desafio' && (
            <div className="space-y-4">
              <div
                className="rounded-[28px] p-5 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg,#1C0A2E,#2D1B4E)', border: '1.5px solid rgba(139,74,255,0.3)' }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-20 translate-x-10" style={{ background: 'radial-gradient(circle, rgba(139,74,255,0.2), transparent 70%)' }} />
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: C.purple }}>Desafio da Semana</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl">🎭</span>
                        <h2 className="text-base font-black text-white">Semana do Gato Artista</h2>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black" style={{ color: C.accentDim }}>+300 XP</p>
                      <p className="text-[9px] text-white/40">4 dias</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed mb-4">
                    Crie 3 conteúdos diferentes usando 2 ferramentas distintas do Studio.
                  </p>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '33%' }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg,${C.purple}80,${C.purple})` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {selectedTool && (
          <ToolDetailModal
            tool={selectedTool}
            walletPoints={resolvedPoints}
            selectedPet={selectedPet}
            onChoosePet={() => setShowPetSelector(true)}
            onClose={() => setSelectedTool(null)}
            onContinue={(tool) => {
              setSelectedTool(null);
              handleContinueToModule(tool);
            }}
            onGoClube={() => {
              setSelectedTool(null);
              goClube();
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {comingSoonTool && (
          <ComingSoonModal tool={comingSoonTool} onClose={() => setComingSoonTool(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPetSelector && (
          <PetSelectorModal
            pets={pets}
            selectedPet={selectedPet}
            onSelect={setSelectedPet}
            onClose={() => setShowPetSelector(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}