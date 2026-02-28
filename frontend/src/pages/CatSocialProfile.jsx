/**
 * CatSocialProfile.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Bio social do gato — perfil semi-público que requer conta no Gatedo.
 *
 * ROTA sugerida: /gato/:catId  ou  /gato/:slug
 *
 * App.jsx:
 *   <Route path="/gato/:catId" element={<CatSocialProfile />} />
 *
 * Compartilhamento:
 *   URL pública: https://gatedo.com/gato/simba
 *   QR Code embutido (SVG, sem lib externa)
 *   Usuários sem conta veem teaser + CTA de cadastro
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Share2, QrCode, UserPlus, Check,
  Camera, Grid, Award, Activity, ChevronRight,
  MapPin, Sparkles, Shield, Star, Stethoscope,
  Brain, Flame, Crown, Copy, ExternalLink,
  PawPrint, BookOpen, Zap, Users
} from 'lucide-react';
import {
  useGamification, BADGES, RARITY_STYLES,
  getLevel, getLevelProgress, LEVELS, BadgeChip, LevelBadge,
} from '../context/GamificationContext';
import api from '../services/api';
import useSensory from '../hooks/useSensory';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK — substitua por dados da API
// ═══════════════════════════════════════════════════════════════════════════════

const MOCK_CAT = {
  id: 'simba-01',
  slug: 'simba',
  name: 'Simba',
  breed: 'SRD',
  age: '4 anos',
  gender: 'MALE',
  neutered: true,
  themeColor: '#F59E0B',
  photo: 'https://images.unsplash.com/photo-1495360019602-e001922271aa?w=600&q=80',
  personality: ['Curioso', 'Bagunceiro', 'Carinhoso', 'Dorminhoco'],
  bio: 'Rei indiscutível do sofá e terrorista oficial de vasos de planta. Manda em tudo mas finge que não.',
  tutor: {
    name: 'Carla Mendes',
    firstName: 'Carla',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b830?w=100&q=80',
    xp: 620,
    badges: ['IGENT_PIONEER', 'HEALTH_GUARDIAN', 'FIRST_MIADO', 'STREAK_7'],
    followers: 142,
    following: 89,
  },
  stats: {
    followers: 284,
    posts: 47,
    healthDays: 312,     // dias com algum registro de saúde
    consultCount: 8,     // consultas iGentVet
    studioCreations: 12, // criações no Studio
  },
  gallery: [
    { id: 'g1', type: 'studio', img: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=400&q=80', likes: 124, label: 'Retrato IA' },
    { id: 'g2', type: 'post',   img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80', likes: 89,  label: 'Jardim' },
    { id: 'g3', type: 'studio', img: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&q=80', likes: 56,  label: 'Vogue Cat' },
    { id: 'g4', type: 'post',   img: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400&q=80', likes: 231, label: 'Dormindo' },
    { id: 'g5', type: 'studio', img: 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=400&q=80', likes: 67,  label: 'RG Pet' },
    { id: 'g6', type: 'post',   img: 'https://images.unsplash.com/photo-1495360019602-e001922271aa?w=400&q=80', likes: 340, label: 'Pose' },
  ],
  healthTimeline: [
    { date: '2025-11', event: 'Vacinação V4 aplicada',         icon: '💉', color: '#10B981', type: 'vaccine'  },
    { date: '2025-10', event: 'iGentVet: alergia alimentar',   icon: '🧠', color: '#6158ca', type: 'igent'   },
    { date: '2025-09', event: 'Castração realizada',           icon: '🏥', color: '#0EA5E9', type: 'vet'     },
    { date: '2025-07', event: 'Check-up anual — Tudo ok!',     icon: '✅', color: '#34D399', type: 'checkup' },
    { date: '2025-04', event: 'Anti-pulgas trimestral',        icon: '🛡️', color: '#F59E0B', type: 'prevent' },
  ],
  achievements: ['IGENT_PIONEER', 'HEALTH_GUARDIAN', 'FIRST_MIADO', 'STREAK_7', 'CRIADOR_NATO', 'ARTISTA_GATEIRO'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// QR CODE — SVG puro, sem dependência externa
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * QRCodeDisplay — QR real usando qrcode-svg inline
 * Instale: npm install qrcode
 * Enquanto não instalado, usa canvas nativo ou SVG de fallback.
 */
function QRCodeDisplay({ url, catName, themeColor }) {
  const canvasRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    // Tenta usar a lib qrcode se disponível
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      }).then(dataUrl => setQrDataUrl(dataUrl));
    }).catch(() => {
      // Fallback: QR decorativo determinístico baseado na URL
      // (substituir pelo import real quando: npm install qrcode)
    });
  }, [url]);

  // Gera padrão determinístico a partir da URL (fallback visual)
  const seed = url.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const cells = Array.from({ length: 25 }, (_, i) =>
    Array.from({ length: 25 }, (_, j) => {
      if (i < 7 && j < 7) return (i === 0 || i === 6 || j === 0 || j === 6) || (i > 1 && i < 5 && j > 1 && j < 5);
      if (i < 7 && j > 17) return (i === 0 || i === 6 || j === 18 || j === 24) || (i > 1 && i < 5 && j > 19 && j < 23);
      if (i > 17 && j < 7) return (i === 18 || i === 24 || j === 0 || j === 6) || (i > 19 && i < 23 && j > 1 && j < 5);
      return (i * 17 + j * 13 + seed + i * j) % 4 !== 0;
    })
  );

  return (
    <div className="relative flex flex-col items-center">
      <div className="w-32 h-32 bg-white rounded-2xl p-2.5 shadow-lg overflow-hidden">
        {qrDataUrl ? (
          <img src={qrDataUrl} className="w-full h-full" alt="QR Code" />
        ) : (
          <svg viewBox="0 0 25 25" className="w-full h-full" style={{ shapeRendering: 'crispEdges' }}>
            {cells.map((row, i) =>
              row.map((cell, j) =>
                cell ? <rect key={`${i}-${j}`} x={j} y={i} width={1} height={1} fill="#1a1a2e" /> : null
              )
            )}
            <rect x={10.5} y={10.5} width={4} height={4} rx={0.6} fill={themeColor} />
          </svg>
        )}
      </div>
      <p className="text-[9px] text-center font-bold text-gray-400 mt-1.5">
        gatedo.com/gato/{catName.toLowerCase()}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GATE DE AUTENTICAÇÃO — teaser para usuários sem conta
// ═══════════════════════════════════════════════════════════════════════════════

function AuthGate({ cat, onContinue }) {
  const navigate = useNavigate();
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: `linear-gradient(180deg, ${cat.themeColor}22 0%, rgba(0,0,0,0.95) 100%)` }}>
      {/* Teaser hero */}
      <div className="relative h-64 overflow-hidden">
        <img src={cat.photo} className="w-full h-full object-cover" style={{ filter: 'blur(8px) brightness(0.4)' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 mb-3"
            style={{ borderColor: cat.themeColor, boxShadow: `0 0 32px ${cat.themeColor}80` }}>
            <img src={cat.photo} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-black text-white">{cat.name}</h2>
          <p className="text-white/60 text-sm font-bold">{cat.breed} · de {cat.tutor.firstName}</p>
        </div>
      </div>
      {/* CTA */}
      <div className="flex-1 px-6 pt-6 pb-12">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: `${cat.themeColor}20`, border: `1px solid ${cat.themeColor}40` }}>
            <PawPrint size={12} style={{ color: cat.themeColor }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: cat.themeColor }}>
              Perfil Semi-Público
            </span>
          </div>
          <h3 className="text-xl font-black text-white mb-2">
            Conheça o mundo de <span style={{ color: cat.themeColor }}>{cat.name}</span>
          </h3>
          <p className="text-white/50 text-sm leading-relaxed">
            Para ver o perfil completo — galeria, conquistas e histórico de saúde — você precisa de uma conta gratuita no Gatedo.
          </p>
        </div>
        <div className="space-y-3">
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/register')}
            className="w-full py-4 rounded-[22px] font-black text-lg shadow-xl"
            style={{ background: cat.themeColor, color: '#1a1a00', boxShadow: `0 8px 32px ${cat.themeColor}60` }}>
            Criar conta gratuita
          </motion.button>
          <button onClick={() => navigate('/login')}
            className="w-full py-3 rounded-[22px] font-black text-sm border text-white/60 border-white/15">
            Já tenho conta — entrar
          </button>
          {/* Sneak peek de stats */}
          <div className="flex justify-around pt-4">
            {[
              { n: cat.stats.followers, label: 'seguidores' },
              { n: cat.stats.posts,     label: 'posts' },
              { n: cat.stats.consultCount, label: 'consultas IA' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-black text-white">{s.n}</p>
                <p className="text-[9px] text-white/40 font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARE SHEET
// ═══════════════════════════════════════════════════════════════════════════════

function ShareSheet({ cat, onClose }) {
  const [copied, setCopied] = useState(false);
  const url = `https://gatedo.com/gato/${cat.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const nativeShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${cat.name} no Gatedo`, text: cat.bio, url })
        .catch(() => {});
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-[32px] px-6 pt-5 pb-10">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0" style={{ border: `2px solid ${cat.themeColor}` }}>
            <img src={cat.photo} className="w-full h-full object-cover" />
          </div>
          <div>
            <h3 className="font-black text-gray-800 text-lg">{cat.name}</h3>
            <p className="text-[11px] text-gray-400 font-bold">{url}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <QRCodeDisplay url={url} catName={cat.slug} themeColor={cat.themeColor} />
        </div>

        {/* Ações */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.96 }} onClick={copyLink}
            className="flex items-center justify-center gap-2 py-3.5 rounded-[18px] font-black text-sm border transition-all"
            style={copied
              ? { background: '#F0FDF4', borderColor: '#86EFAC', color: '#16A34A' }
              : { background: '#F9FAFB', borderColor: '#E5E7EB', color: '#374151' }
            }>
            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar link</>}
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={nativeShare}
            className="flex items-center justify-center gap-2 py-3.5 rounded-[18px] font-black text-sm text-white"
            style={{ background: `linear-gradient(135deg, ${cat.themeColor}, ${cat.themeColor}cc)`,
              boxShadow: `0 4px 16px ${cat.themeColor}50` }}>
            <Share2 size={16} /> Compartilhar
          </motion.button>
        </div>
        <p className="text-center text-[10px] text-gray-400 font-bold">
          Escaneie o QR para abrir no celular
        </p>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEÇÕES DO PERFIL
// ═══════════════════════════════════════════════════════════════════════════════

function GalleryTab({ cat, isOwner = true }) {
  const [uploading, setUploading]     = useState(false);
  const [featured, setFeatured]       = useState(0); // index da foto destaque
  const [localGallery, setLocalGallery] = useState(cat.gallery || []);
  const fileRef                        = useRef(null);
  const MAX_PHOTOS                     = 9;
  const canUpload                      = isOwner && localGallery.length < MAX_PHOTOS;

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || localGallery.length >= MAX_PHOTOS) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('gallery', file);
      const r = await api.patch(`/pets/${cat.id}`, form);
      setLocalGallery(r.data.gallery || localGallery);
    } catch {
      // fallback: preview local
      const url = URL.createObjectURL(file);
      setLocalGallery(prev => [...prev, url]);
    } finally {
      setUploading(false);
    }
  };

  const handleSetFeatured = (idx) => { setFeatured(idx); };

  // Monta grid: photos reais (strings URL) + slot de upload
  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => localGallery[i] || null);

  return (
    <div className="px-4 pt-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-black text-gray-700">Galeria</p>
          <p className="text-[9px] text-gray-400 font-bold">{localGallery.length}/{MAX_PHOTOS} fotos</p>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-gray-400 font-bold">Toque 2s → destaque</span>
            {canUpload && (
              <motion.button whileTap={{ scale: 0.92 }} onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-[10px]"
                style={{ background: cat.themeColor, color: '#1a1a00' }}>
                {uploading ? <span className="animate-spin">⏳</span> : <><Camera size={11} /> Adicionar</>}
              </motion.button>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {/* Grid 3x3 estilo tinder */}
      <div className="grid grid-cols-3 gap-1.5">
        {slots.map((photoUrl, i) => {
          const isFeatured = i === featured;
          const isEmpty = !photoUrl;

          if (isEmpty) {
            return (
              <motion.button key={i}
                onClick={() => canUpload && fileRef.current?.click()}
                className="aspect-square rounded-[14px] flex flex-col items-center justify-center border-2 border-dashed transition-all"
                style={{ borderColor: canUpload ? `${cat.themeColor}40` : '#E5E7EB',
                  background: canUpload ? `${cat.themeColor}06` : '#F9FAFB' }}>
                {canUpload && i === localGallery.length ? (
                  <><Camera size={18} style={{ color: cat.themeColor }} className="mb-1" />
                    <span className="text-[8px] font-black" style={{ color: cat.themeColor }}>Adicionar</span></>
                ) : (
                  <span className="text-gray-200 text-2xl">·</span>
                )}
              </motion.button>
            );
          }

          return (
            <motion.div key={i}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="relative aspect-square rounded-[14px] overflow-hidden cursor-pointer group"
              onContextMenu={e => { e.preventDefault(); handleSetFeatured(i); }}
              onClick={() => isOwner && handleSetFeatured(i)}
            >
              <img src={photoUrl} className="w-full h-full object-cover transition-transform group-active:scale-105" />

              {/* Overlay destaque */}
              {isFeatured && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: `${cat.themeColor}30`, backdropFilter: 'blur(0px)' }}>
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                    style={{ background: cat.themeColor }}>
                    <Star size={8} fill="#1a1a00" color="#1a1a00" />
                    <span className="text-[7px] font-black" style={{ color: '#1a1a00' }}>Destaque</span>
                  </div>
                </div>
              )}

              {/* Overlay hover — toque longo marca destaque */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
                opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                <p className="text-[7px] font-black text-white/70">
                  {isFeatured ? '⭐ Destaque' : 'Toque para destacar'}
                </p>
              </div>

              {/* Badge destaque no canto */}
              {isFeatured && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: cat.themeColor }}>
                  <Star size={9} fill="#1a1a00" color="#1a1a00" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legenda */}
      <p className="text-center text-[9px] text-gray-400 font-bold mt-3">
        {localGallery.length === MAX_PHOTOS
          ? '📸 Galeria completa — remova uma foto para adicionar nova'
          : `${MAX_PHOTOS - localGallery.length} slots disponíveis`}
      </p>
    </div>
  );
}

function AchievementsTab({ cat }) {
  const tutorLvl = getLevel(cat.tutor.xp);
  const tutorProg = getLevelProgress(cat.tutor.xp);

  // Agrupa badges por eixo
  const axisMeta = {
    intel:  { label: 'Inteligência', icon: Brain,   color: '#6158ca', desc: 'Integração com iGentVet' },
    social: { label: 'Comunidade',   icon: Users,   color: '#EC4899', desc: 'Engajamento social'       },
    create: { label: 'Criação',      icon: Sparkles, color: '#F59E0B', desc: 'Uso do Studio'           },
    streak: { label: 'Consistência', icon: Flame,   color: '#F97316', desc: 'Streaks e retenção'       },
  };

  const earnedByAxis = Object.keys(axisMeta).reduce((acc, axis) => {
    acc[axis] = cat.achievements
      .filter(k => BADGES[k]?.axis === axis)
      .map(k => ({ key: k, ...BADGES[k] }));
    return acc;
  }, {});

  const allBadges = Object.values(BADGES);
  const lockedByAxis = Object.keys(axisMeta).reduce((acc, axis) => {
    acc[axis] = allBadges
      .filter(b => b.axis === axis && !cat.achievements.includes(
        Object.keys(BADGES).find(k => BADGES[k] === b)
      ))
      .slice(0, 2); // mostra só 2 bloqueados por eixo
    return acc;
  }, {});

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">
      {/* Tutor level card */}
      <div className="rounded-[24px] p-4 border"
        style={{ background: `${tutorLvl.color}08`, borderColor: `${tutorLvl.color}25` }}>
        <div className="flex items-center gap-3 mb-3">
          <img src={cat.tutor.avatar} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-800">{cat.tutor.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base">{tutorLvl.emoji}</span>
              <span className="text-[10px] font-black" style={{ color: tutorLvl.color }}>{tutorLvl.name}</span>
              <span className="text-[9px] text-orange-500 font-black">🔥 7d streak</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-black" style={{ color: tutorLvl.color }}>{cat.tutor.xp.toLocaleString()}</p>
            <p className="text-[8px] text-gray-400 font-bold">XP total</p>
          </div>
        </div>
        {/* XP bar */}
        <div className="flex justify-between text-[8px] font-bold text-gray-400 mb-1">
          <span>{tutorLvl.name}</span>
          {LEVELS.find(l => l.rank === tutorLvl.rank + 1) && (
            <span>{LEVELS.find(l => l.rank === tutorLvl.rank + 1)?.name}</span>
          )}
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${tutorProg}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${tutorLvl.color}80, ${tutorLvl.color})` }} />
        </div>
        <p className="text-[9px] text-gray-400 font-bold mt-1.5 text-center">
          {cat.achievements.length} badges conquistados ·{' '}
          {Object.keys(BADGES).length - cat.achievements.length} restantes
        </p>
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Brain,     n: cat.stats.consultCount,    label: 'Consultas IA', color: '#6158ca' },
          { icon: Sparkles,  n: cat.stats.studioCreations, label: 'Criações',     color: '#F59E0B' },
          { icon: Activity,  n: cat.stats.healthDays,      label: 'Dias saudável',color: '#34D399' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-[18px] p-3 border border-gray-100 shadow-sm text-center">
              <Icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
              <p className="text-xl font-black text-gray-800">{s.n}</p>
              <p className="text-[8px] text-gray-400 font-bold leading-tight">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Badges por eixo */}
      {Object.entries(axisMeta).map(([axis, meta]) => {
        const AxisIcon = meta.icon;
        const earned = earnedByAxis[axis] || [];
        const locked = lockedByAxis[axis] || [];
        if (earned.length === 0 && locked.length === 0) return null;
        return (
          <div key={axis}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${meta.color}15` }}>
                <AxisIcon size={13} style={{ color: meta.color }} />
              </div>
              <div>
                <p className="text-xs font-black text-gray-700">{meta.label}</p>
                <p className="text-[9px] text-gray-400 font-medium">{meta.desc}</p>
              </div>
              <span className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full"
                style={{ background: `${meta.color}15`, color: meta.color }}>
                {earned.length} conquistados
              </span>
            </div>
            <div className="space-y-2">
              {earned.map(b => {
                const r = RARITY_STYLES[b.rarity] || RARITY_STYLES.common;
                return (
                  <motion.div key={b.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-[18px]"
                    style={{ background: r.bg, border: `1.5px solid ${r.border}`, boxShadow: r.shadow }}>
                    <span className="text-xl">{b.emoji}</span>
                    <div className="flex-1">
                      <p className="text-xs font-black text-gray-800">{b.name}</p>
                      <p className="text-[9px] text-gray-400">{b.desc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black px-1.5 py-0.5 rounded"
                        style={{ background: `${meta.color}15`, color: meta.color }}>
                        {r.label}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              {locked.slice(0, 1).map(b => (
                <div key={b.name} className="flex items-center gap-3 p-3 rounded-[18px] opacity-40 grayscale"
                  style={{ background: '#F9FAFB', border: '1.5px solid #E5E7EB' }}>
                  <span className="text-xl">{b.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs font-black text-gray-600">{b.name}</p>
                    <p className="text-[9px] text-gray-400">{b.desc}</p>
                  </div>
                  <span className="text-[8px] font-black text-gray-400">🔒</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HealthTab({ cat }) {
  return (
    <div className="px-4 pt-4 pb-6 space-y-4">
      {/* Health score visual */}
      <div className="rounded-[24px] p-5 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1.5px solid #86EFAC' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-green-600 mb-1">iGentVet Score</p>
            <h3 className="text-3xl font-black text-green-700">98<span className="text-lg">/100</span></h3>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: '#BBF7D0', border: '3px solid #4ADE80' }}>
            <span className="text-2xl">😸</span>
          </div>
        </div>
        <p className="text-[11px] text-green-600 font-bold leading-snug">
          {cat.name} está saudável e com vacinação em dia. Próxima consulta recomendada em Jan 2026.
        </p>
        <div className="mt-3 flex gap-2 flex-wrap">
          {['Vacinação ✓', 'Castração ✓', 'Anti-pulgas ✓', 'Peso ideal ✓'].map(t => (
            <span key={t} className="text-[8px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">{t}</span>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
          <Activity size={14} style={{ color: cat.themeColor }} /> Histórico de Saúde
        </h3>
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100" />
          <div className="space-y-3">
            {cat.healthTimeline.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start gap-4 pl-1">
                {/* Dot */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{ background: `${item.color}18`, border: `2px solid ${item.color}50` }}>
                  <span className="text-xs">{item.icon}</span>
                </div>
                <div className="flex-1 bg-white rounded-[16px] px-3 py-2.5 border border-gray-100 shadow-sm">
                  <p className="text-xs font-black text-gray-800">{item.event}</p>
                  <p className="text-[9px] text-gray-400 font-bold mt-0.5">{item.date}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mt-3 text-center">
          <p className="text-[10px] text-gray-400 font-bold">{cat.stats.consultCount} consultas iGentVet registradas</p>
        </div>
      </div>

      {/* CTA iGentVet */}
      <motion.button whileTap={{ scale: 0.97 }}
        className="w-full flex items-center gap-3 p-4 rounded-[22px]"
        style={{ background: 'linear-gradient(135deg, #6158ca, #4B40C6)' }}>
        <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <Brain size={18} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/60">iGentVet IA</p>
          <p className="text-sm font-black text-white">Consultar sobre {cat.name}</p>
        </div>
        <ChevronRight size={16} className="text-white/60" />
      </motion.button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE RAIZ
// ═══════════════════════════════════════════════════════════════════════════════

export default function CatSocialProfile() {
  const { catId } = useParams();
  const navigate  = useNavigate();
  const touch     = useSensory();
  const { earnXP } = useGamification();

  const [cat, setCat]             = useState(MOCK_CAT); // substitua por fetch real
  const [loading, setLoading]     = useState(true);
  const [isLoggedIn]              = useState(true);  // substitua pelo auth context
  const [following, setFollowing] = useState(false);
  const [followCount, setFollowCount] = useState(cat.stats.followers);
  const [showShare, setShowShare] = useState(false);
  const [activeTab, setActiveTab] = useState('galeria');
  const scrollRef                 = useRef(null);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);

  // Fetch real
  useEffect(() => {
    if (!catId) return;
    setLoading(true);
    api.get(`/pets/${catId}/social-profile`)
      .then(r => { if (r.data) setCat(r.data); })
      .catch(err => console.error('Erro ao carregar perfil social:', err))
      .finally(() => setLoading(false));
  }, [catId]);

  const handleFollow = () => {
    touch('success');
    setFollowing(f => !f);
    setFollowCount(c => following ? c - 1 : c + 1);
    if (!following) earnXP(5, 'Novo seguidor');
  };

  const TABS = [
    { id: 'galeria',     label: 'Galeria',      icon: Grid    },
    { id: 'conquistas',  label: 'Conquistas',   icon: Award   },
    { id: 'saude',       label: 'Saúde',        icon: Activity},
  ];

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: '#F4F3FF' }}>
      <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center animate-pulse">
        <span className="text-2xl">🐱</span>
      </div>
      <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Carregando perfil...</p>
    </div>
  );

  if (!cat) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: '#F4F3FF' }}>
      <span className="text-4xl">😿</span>
      <p className="font-black text-gray-500">Perfil não encontrado</p>
    </div>
  );

  if (!isLoggedIn) return <AuthGate cat={cat} onContinue={() => {}} />;

  return (
    <div className="min-h-screen font-sans" style={{ background: '#F4F3FF' }}>

      {/* ── SHARE SHEET ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showShare && <ShareSheet cat={cat} onClose={() => setShowShare(false)} />}
      </AnimatePresence>

      {/* ── HERO FULL-BLEED ──────────────────────────────────────────────────── */}
      <div className="relative" style={{ height: 340 }}>
        {/* Foto de fundo */}
        <img src={cat.photo} className="absolute inset-0 w-full h-full object-cover" />

        {/* Gradiente tema */}
        <div className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, ${cat.themeColor}30 0%, rgba(0,0,0,0.85) 100%)` }} />

        {/* Noise texture overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
            backgroundSize: '180px' }} />

        {/* Botões superiores */}
        <div className="absolute top-0 left-0 right-0 px-4 pt-12 flex items-center justify-between z-10">
          <button onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowShare(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Share2 size={17} className="text-white" />
            </button>
            <button onClick={() => setShowShare(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <QrCode size={17} className="text-white" />
            </button>
          </div>
        </div>

        {/* Identidade do gato — bottom do hero */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 z-10">
          {/* Chips de personalidade */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {cat.personality.map(p => (
              <span key={p} className="text-[8px] font-black px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {p}
              </span>
            ))}
          </div>

          <div className="flex items-end justify-between">
            <div>
              {/* Level badge */}
              <div className="flex items-center gap-1.5 mb-1">
                {(() => {
                  const lvl = getLevel(cat.tutor.xp);
                  return (
                    <span className="text-xs px-2 py-0.5 rounded-full font-black"
                      style={{ background: `${lvl.color}30`, color: lvl.color, border: `1px solid ${lvl.color}50` }}>
                      {lvl.emoji} {lvl.name}
                    </span>
                  );
                })()}
              </div>
              <h1 className="text-4xl font-black text-white leading-none mb-0.5"
                style={{ textShadow: `0 2px 20px ${cat.themeColor}60` }}>
                {cat.name}
              </h1>
              <div className="flex items-center gap-1.5">
                <span className="text-white/70 text-sm font-bold">{cat.breed}</span>
                <span className="text-white/30">·</span>
                <span className="text-white/70 text-sm font-bold">{cat.age}</span>
                {cat.neutered && <span className="text-white/50 text-sm font-bold">· ✂ Castrado</span>}
              </div>
            </div>

            {/* Follow button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleFollow}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-black text-sm transition-all"
              style={following
                ? { background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }
                : { background: cat.themeColor, color: '#1a1a00', boxShadow: `0 4px 16px ${cat.themeColor}60` }
              }>
              {following ? <><Check size={14} /> Seguindo</> : <><UserPlus size={14} /> Seguir</>}
            </motion.button>
          </div>
        </div>
      </div>

      {/* ── STATS BAR ───────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center px-5 py-3 gap-2">
          {/* Tutor avatar + info */}
          <img src={cat.tutor.avatar} className="w-8 h-8 rounded-full object-cover border-2 flex-shrink-0"
            style={{ borderColor: cat.themeColor }} />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-gray-700 truncate">
              de <span style={{ color: cat.themeColor }}>{cat.tutor.firstName}</span>
            </p>
            <div className="flex items-center gap-1">
              {cat.tutor.badges.slice(0, 2).map(k => (
                <span key={k} className="text-[9px]">{BADGES[k]?.emoji}</span>
              ))}
              <span className="text-[8px] text-gray-400 font-bold">{cat.tutor.badges.length} badges</span>
            </div>
          </div>
          <div className="flex gap-4">
            {[
              { n: followCount, label: 'seguidores' },
              { n: cat.stats.posts, label: 'posts' },
              { n: cat.stats.consultCount, label: 'iGent' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-sm font-black text-gray-800">{s.n}</p>
                <p className="text-[8px] text-gray-400 font-bold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bio */}
        <div className="px-5 pb-3">
          <p className="text-xs text-gray-600 font-medium leading-relaxed italic">"{cat.bio}"</p>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-gray-100">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => { touch(); setActiveTab(tab.id); }}
                className="flex-1 flex flex-col items-center gap-0.5 py-2.5 relative transition-all">
                <Icon size={16} style={{ color: active ? cat.themeColor : '#9CA3AF' }} />
                <span className="text-[9px] font-black" style={{ color: active ? cat.themeColor : '#9CA3AF' }}>
                  {tab.label}
                </span>
                {active && (
                  <motion.div layoutId="cat-tab-indicator"
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                    style={{ background: cat.themeColor }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTEÚDO ────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
          {activeTab === 'galeria'    && <GalleryTab      cat={cat} isOwner={true} />}
          {activeTab === 'conquistas' && <AchievementsTab cat={cat} />}
          {activeTab === 'saude'      && <HealthTab        cat={cat} />}
        </motion.div>
      </AnimatePresence>

      {/* ── FOOTER QR + SHARE ────────────────────────────────────────────────── */}
      <div className="px-4 py-6">
        <div className="rounded-[28px] overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1C1C2E, #2D1B4E)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
          <div className="p-5 flex items-center gap-4">
            <QRCodeDisplay url={`https://gatedo.com/gato/${cat.slug}`} catName={cat.slug} themeColor={cat.themeColor} />
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Perfil do Gatedo</p>
              <h3 className="text-lg font-black text-white mb-1">{cat.name}</h3>
              <p className="text-[10px] text-white/40 font-bold mb-3">de {cat.tutor.firstName}</p>
              <motion.button whileTap={{ scale: 0.96 }} onClick={() => setShowShare(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-[14px] font-black text-xs"
                style={{ background: cat.themeColor, color: '#1a1a00', boxShadow: `0 4px 16px ${cat.themeColor}50` }}>
                <Share2 size={13} /> Compartilhar
              </motion.button>
            </div>
          </div>
          <div className="px-5 pb-4">
            <p className="text-[9px] text-white/25 font-bold text-center">
              Escaneie o QR Code para abrir o perfil · gatedo.com/gato/{cat.slug}
            </p>
          </div>
        </div>
      </div>

      {/* Padding bottom para BottomNav */}
      <div className="h-24" />
    </div>
  );
}