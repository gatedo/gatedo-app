import React, { useState } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ShoppingBag, MessageCircle, Heart, Stethoscope, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useSensory from '../hooks/useSensory';

// ─── IMAGENS ──────────────────────────────────────────────────────────────────
const IMG_STORE    = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=75";
const IMG_SOCIAL   = "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=400&q=75";
const IMG_VET      = "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=400&q=75";
const IMG_ONG      = "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=400&q=75";
const IMG_MEMORIAL = "/assets/juju_memo.webp";

// ─── PALETA ────────────────────────────────────────────────────────────────────
const CARDS = [
  {
    id: 'store',
    title: 'Store',
    subtitle: 'Mimos & Produtos',
    icon: ShoppingBag,
    path: '/store',
    from: '#FF6B35',
    to: '#FF9F1C',
    glow: 'rgba(255,107,53,0.55)',
    img: IMG_STORE,
    accent: '#FFD166',
    rotate: '-8deg',
    translateX: '18px',
    translateY: '10px',
  },
  {
    id: 'social',
    title: 'Social',
    subtitle: 'ComuniGato',
    icon: MessageCircle,
    path: '/comunigato',
    from: '#4CC9F0',
    to: '#4361EE',
    glow: 'rgba(67,97,238,0.50)',
    img: IMG_SOCIAL,
    accent: '#C8E7FF',
    rotate: '10deg',
    translateX: '-12px',
    translateY: '14px',
  },
  {
    id: 'vets',
    title: 'Vets',
    subtitle: 'Voluntários',
    icon: Stethoscope,
    path: '/vets',
    from: '#06D6A0',
    to: '#1B9AAA',
    glow: 'rgba(6,214,160,0.50)',
    img: IMG_VET,
    accent: '#B7FFE8',
    rotate: '-6deg',
    translateX: '15px',
    translateY: '8px',
  },
  {
    id: 'ong',
    title: 'Ajude',
    subtitle: 'Adote & ONGs',
    icon: Heart,
    path: '/ongs',
    from: '#F72585',
    to: '#FF6B9D',
    glow: 'rgba(247,37,133,0.50)',
    img: IMG_ONG,
    accent: '#FFD6E8',
    rotate: '12deg',
    translateX: '-10px',
    translateY: '12px',
  },
];

const MEMORIAL = {
  id: 'memorial',
  title: 'Das Estrelinhas',
  subtitle: 'Memorial',
  icon: Star,
  path: '/memorial',
  from: '#1a1a2e',
  to: '#16213e',
  glow: 'rgba(100,180,255,0.35)',
  img: IMG_MEMORIAL,
  accent: '#C8DDFF',
};

// ─── LIQUID GLASS CARD ────────────────────────────────────────────────────────
function GlassCard({ card, onClick, full = false }) {
  const touch = useSensory();
  const [hovered, setHovered] = useState(false);
  const Icon = card.icon;

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useTransform(my, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotY = useTransform(mx, [-0.5, 0.5], ['-6deg', '6deg']);
  const springRotX = useSpring(rotX, { stiffness: 200, damping: 20 });
  const springRotY = useSpring(rotY, { stiffness: 200, damping: 20 });

  const handleMouse = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const handleLeave = () => { mx.set(0); my.set(0); };

  return (
    <motion.button
      className={`relative overflow-hidden text-left group w-full ${full ? 'h-[88px]' : 'h-[168px]'}`}
      style={{
        borderRadius: 28,
        perspective: 800,
        rotateX: full ? 0 : springRotX,
        rotateY: full ? 0 : springRotY,
        transformStyle: 'preserve-3d',
      }}
      whileTap={{ scale: 0.96 }}
      onMouseMove={full ? undefined : handleMouse}
      onMouseLeave={full ? undefined : handleLeave}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={() => { touch(); onClick?.(); }}
    >
      {/* ── BASE GRADIENT ── */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${card.from} 0%, ${card.to} 100%)`,
          borderRadius: 28,
        }}
      />

      {/* ── PHOTO LAYER ── */}
      <motion.div
        className="absolute inset-0"
        style={{ borderRadius: 28, overflow: 'hidden' }}
        animate={{ scale: hovered ? 1.12 : 1.04 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <img
          src={card.img}
          alt=""
          className="w-full h-full object-cover"
          style={{ mixBlendMode: 'luminosity', opacity: 0.32 }}
        />
      </motion.div>

      {/* ── NOISE GRAIN ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 28,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px',
          opacity: 0.07,
          mixBlendMode: 'overlay',
        }}
      />

      {/* ── LIQUID GLASS OVERLAY ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: 28 }}
        animate={{
          background: hovered
            ? `radial-gradient(ellipse at 60% 30%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 55%, transparent 80%)`
            : `radial-gradient(ellipse at 40% 20%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 55%, transparent 80%)`,
        }}
        transition={{ duration: 0.5 }}
      />

      {/* ── GLASS BORDER ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: 28,
          border: '1px solid rgba(255,255,255,0.25)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.08)`,
        }}
      />

      {/* ── GLOW ON HOVER ── */}
      <motion.div
        className="absolute -inset-1 pointer-events-none"
        style={{ borderRadius: 32, zIndex: -1 }}
        animate={{
          boxShadow: hovered
            ? `0 0 0 2px ${card.from}60, 0 20px 60px -8px ${card.glow}`
            : `0 8px 24px -4px ${card.glow.replace('0.55','0.25').replace('0.50','0.20').replace('0.35','0.15')}`,
        }}
        transition={{ duration: 0.4 }}
      />

      {/* ── OVERSIZED ICON (background) ── */}
      {!full && (
        <motion.div
          className="absolute pointer-events-none"
          style={{
            right: -10,
            bottom: -10,
            color: 'rgba(255,255,255,0.13)',
            filter: 'blur(1px)',
          }}
          animate={{
            rotate: hovered ? parseFloat(card.rotate) * 1.4 : parseFloat(card.rotate),
            x: hovered ? parseFloat(card.translateX) * 1.3 : parseFloat(card.translateX),
            y: hovered ? parseFloat(card.translateY) * 1.3 : parseFloat(card.translateY),
            scale: hovered ? 1.15 : 1,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <Icon size={110} strokeWidth={1.2} />
        </motion.div>
      )}

      {/* ── CONTENT ── */}
      {full ? (
        // MEMORIAL — horizontal layout
        <div className="relative z-10 flex items-center gap-4 px-5 h-full">
          {/* Icon pill */}
          <motion.div
            className="flex-shrink-0 relative"
            animate={{ rotate: hovered ? 15 : 0, scale: hovered ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          >
            <div
              className="w-11 h-11 rounded-[16px] flex items-center justify-center shadow-lg"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' }}
            >
              <Icon size={22} color="#C8DDFF" strokeWidth={2} />
            </div>
            {/* Glow dot */}
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-300"
              style={{ boxShadow: '0 0 8px 2px rgba(147,197,253,0.8)' }} />
          </motion.div>

          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[2.5px] text-white/45 mb-0.5">{card.subtitle}</p>
            <h4 className="font-black text-[18px] leading-none text-white">{card.title}</h4>
          </div>

          {/* Stars decoration */}
          <div className="flex-shrink-0 flex gap-1.5 opacity-50">
            {[12, 8, 10].map((s, i) => (
              <motion.div
                key={i}
                animate={{ opacity: hovered ? [0.4, 1, 0.4] : 0.4, y: hovered ? [0, -3, 0] : 0 }}
                transition={{ duration: 1.5, repeat: hovered ? Infinity : 0, delay: i * 0.2 }}
              >
                <Star size={s} color={card.accent} fill={card.accent} />
              </motion.div>
            ))}
          </div>

          {/* Oversized icon bg */}
          <motion.div
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgba(200,221,255,0.07)' }}
            animate={{ scale: hovered ? 1.15 : 1, rotate: hovered ? 8 : 0 }}
            transition={{ duration: 0.7 }}
          >
            <Icon size={90} strokeWidth={1} />
          </motion.div>
        </div>
      ) : (
        // SMALL CARDS — vertical layout
        <div className="relative z-10 flex flex-col justify-between p-4 h-full">
          {/* Icon pill */}
          <motion.div
            animate={{ rotate: hovered ? 8 : 0, scale: hovered ? 1.08 : 1, y: hovered ? -2 : 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 16 }}
            className="self-start"
          >
            <div
              className="w-11 h-11 rounded-[16px] flex items-center justify-center shadow-lg relative"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(10px)' }}
            >
              <Icon size={22} color="white" strokeWidth={2.2} />
              {/* inner shine */}
              <div className="absolute inset-0 rounded-[16px]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />
            </div>
          </motion.div>

          {/* Text */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[2px] mb-0.5"
              style={{ color: `${card.accent}99` }}>
              {card.subtitle}
            </p>
            <h4 className="font-black text-[20px] leading-none text-white"
              style={{ textShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
              {card.title}
            </h4>
          </div>
        </div>
      )}

      {/* ── SHIMMER ON HOVER ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: 28 }}
        initial={{ opacity: 0, x: '-100%' }}
        animate={hovered ? { opacity: 1, x: '200%' } : { opacity: 0, x: '-100%' }}
        transition={{ duration: 0.7, ease: 'easeInOut' }}
      >
        <div className="w-1/3 h-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)', transform: 'skewX(-15deg)' }} />
      </motion.div>
    </motion.button>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-3">
      {CARDS.map((card, i) => (
        <motion.div
          key={card.id}
          className="col-span-1"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.07, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
        >
          <GlassCard card={card} onClick={() => navigate(card.path)} />
        </motion.div>
      ))}

      <motion.div
        className="col-span-2"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: CARDS.length * 0.07, duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      >
        <GlassCard card={MEMORIAL} full onClick={() => navigate(MEMORIAL.path)} />
      </motion.div>
    </div>
  );
}