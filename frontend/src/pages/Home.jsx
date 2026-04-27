import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Palette, BookOpen, ShoppingBag, ChevronUp, X, ChevronDown,
  LayoutDashboard, Users, PawPrint, FileText, DollarSign,
  Eye, Handshake, Store, Pill, Syringe, Brain, Zap,
  CheckCircle, ChevronRight, Sparkles, Crown,
  Heart, Play, Gamepad2, Wand2, Flame, Lock, Globe,
  TrendingUp, Shield, Stethoscope,
} from 'lucide-react';
import Header from '../components/Header';
import QuickActions from '../components/QuickActions';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

// ─── Local image imports ───────────────────────────────────────────────────
import img1  from '../assets/cards-home/gatedo-img1.webp';
import img2  from '../assets/cards-home/gatedo-img2.webp';
import img3  from '../assets/cards-home/gatedo-img3.webp';
import img4  from '../assets/cards-home/gatedo-img4.webp';
import img5  from '../assets/cards-home/gatedo-img5.webp';
import img6  from '../assets/cards-home/gatedo-img6.webp';
import img7  from '../assets/cards-home/gatedo-img7.webp';
import img8  from '../assets/cards-home/gatedo-img8.webp';
import img9  from '../assets/cards-home/gatedo-img9.webp';
import img10 from '../assets/cards-home/gatedo-img10.webp';
import img11 from '../assets/cards-home/gatedo-img11.webp';
import img12 from '../assets/cards-home/gatedo-img12.webp';
import img13 from '../assets/cards-home/gatedo-img13.webp';
import img14 from '../assets/cards-home/gatedo-img14.webp';
import img15 from '../assets/cards-home/gatedo-img15.webp';

const C = { purple: '#8B4AFF', accent: '#e7ff60', accentDim: '#ebfc66', bg: 'var(--gatedo-light-bg)' };

const fmtTime  = (d) => d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
const timeUntil = (d) => {
  if (!d) return null;
  const diff = new Date(d).getTime() - Date.now();
  if (diff < 0) return 'Atrasada';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}min`;
};

const LEVELS = [
  { min: 0,    max: 99,       label: 'Gateiro Curioso',   emoji: '🐾', abbr: 'N1' },
  { min: 100,  max: 299,      label: 'Gateiro Raiz',      emoji: '😺', abbr: 'N2' },
  { min: 300,  max: 599,      label: 'Guardião Felino',   emoji: '🛡️', abbr: 'N3' },
  { min: 600,  max: 999,      label: 'Tutor de Rotina',   emoji: '🤖', abbr: 'N4' },
  { min: 1000, max: 1999,     label: 'Embaixador Gatedo', emoji: '👑', abbr: 'N5' },
  { min: 2000, max: Infinity, label: 'Lenda Felina',      emoji: '✨', abbr: 'N6' },
];
const getLevel = (pts) => LEVELS.find(l => pts >= l.min && pts <= l.max) || LEVELS[0];
const getNext  = (pts) => LEVELS.find(l => l.min > pts);

const stagger = { visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
};

// ─── Studio data ───────────────────────────────────────────────────────────
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
const ACHADINHOS_FALLBACK = [
  { id: 1, name: 'Bebedouro Fonte',    price: '89',  tag: '🔥 Top',         img: img7 },
  { id: 2, name: 'Cama Nuvem',         price: '129', tag: '⭐ Novo',         img: img8 },
  { id: 3, name: 'Arranhador Premium', price: '59',  tag: '💜 Mais querido', img: img9 },
];
const GAMES = [
  { id: 'bugs',   name: 'Bichinhos',    emoji: '🐞', desc: 'Joaninhas, abelhas e borboletas',        color: '#22c55e', img: '/assets/catgames/insetos.webp',     gradient: 'linear-gradient(90deg,rgba(13,99,47,0.69) 0%,rgba(22,163,74,0.21) 100%)',    badge: '🔥 Popular'  },
  { id: 'ocean',  name: 'Fundo do Mar', emoji: '🐠', desc: 'Peixinhos e criaturas marinhas',         color: '#0ea5e9', img: '/assets/catgames/fundo-mar.webp',   gradient: 'linear-gradient(90deg,rgba(12,61,107,0.92) 0%,rgba(2,133,199,0.18) 100%)',  badge: '🌊 Novo'     },
  { id: 'garden', name: 'Jardim',        emoji: '🌼', desc: 'Flores, folhas e lagartos no jardim',   color: '#f59e0b', img: '/assets/catgames/jardim.webp',      gradient: 'linear-gradient(90deg,rgba(74,55,40,0.92) 0%,rgba(217,119,6,0.5) 100%)',   badge: null          },
  { id: 'space',  name: 'Espaço',        emoji: '⭐', desc: 'Estrelas, cometas e OVNIs',             color: '#a78bfa', img: '/assets/catgames/gato-espaco.webp', gradient: 'linear-gradient(90deg,rgba(10,10,26,0.95) 0%,rgba(124,58,237,0.5) 100%)',  badge: '✨ Destaque' },
];

// ─── Wiki slider topics ────────────────────────────────────────────────────
const WIKI_SLIDES = [
  { label: 'Raças',         emoji: '🐱', color: '#8B4AFF', img: img12, desc: 'Descubra raças' },
  { label: 'Curiosidades',  emoji: '💡', color: '#F59E0B', img: img13, desc: 'Fatos incríveis' },
  { label: 'Comportamento', emoji: '🧠', color: '#10B981', img: img14, desc: 'Entenda seu gato' },
  { label: 'Cultura',       emoji: '🌍', color: '#EC4899', img: img15, desc: 'Gatos no mundo' },
];

// ─── CARE_ITEMS: subs with per-item targetTab matching ProfileHeader NAV_ITEMS
const CARE_ITEMS = [
  {
    tab: 'health', label: 'Saúde', emoji: '🩺', color: '#10B981', bg: '#F0FDF4', border: '#A7F3D0',
    targetTab: 'SAUDE',
    desc: 'Acompanhe consultas, exames e histórico de saúde do seu gato.',
    subs: [
      { label: 'Histórico médico',   targetTab: 'SAUDE'     },
      { label: 'Consultas',          targetTab: 'SAUDE'     },
      { label: 'Peso & Crescimento', targetTab: 'EVOLUCAO'  },
      { label: 'Urgências',          targetTab: 'SAUDE'     },
    ],
  },
  {
    tab: 'vaccines', label: 'Vacinas', emoji: '💉', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE',
    targetTab: 'IMUNIZANTES',
    desc: 'Calendário de vacinas, parasitários e lembretes automáticos.',
    subs: [
      { label: 'Calendário',   targetTab: 'IMUNIZANTES' },
      { label: 'Reforços',     targetTab: 'IMUNIZANTES' },
      { label: 'Antirrábica',  targetTab: 'IMUNIZANTES' },
      { label: 'Parasitários', targetTab: 'IMUNIZANTES' },
    ],
  },
  {
    tab: 'feeding', label: 'Nutrição', emoji: '🥣', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A',
    targetTab: 'EVOLUCAO',
    desc: 'Alimentação ideal para cada fase da vida do seu gato.',
    subs: [
      { label: 'Evolução de peso', targetTab: 'EVOLUCAO' },
      { label: 'Porções',          targetTab: 'EVOLUCAO' },
      { label: 'Hidratação',       targetTab: 'EVOLUCAO' },
      { label: 'Suplementos',      targetTab: 'EVOLUCAO' },
    ],
  },
  {
    tab: 'treatment', label: 'Remédios', emoji: '💊', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA',
    targetTab: 'SAUDE',
    desc: 'Controle de medicamentos, doses e horários de tratamento.',
    subs: [
      { label: 'Tratamentos ativos', targetTab: 'SAUDE'       },
      { label: 'Doses e alertas',    targetTab: 'SAUDE'       },
      { label: 'Docs e receitas',    targetTab: 'DOCUMENTOS'  },
      { label: 'Dados preditivos',   targetTab: 'SAUDE'       },
    ],
  },
  {
    tab: 'wellbeing', label: 'Bem-estar', emoji: '🌿', color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8',
    targetTab: 'COMPORTAMENTO',
    desc: 'Comportamento, estresse, sono e qualidade de vida.',
    subs: [
      { label: 'Humor',          targetTab: 'COMPORTAMENTO' },
      { label: 'Comportamento',  targetTab: 'COMPORTAMENTO' },
      { label: 'Sono',           targetTab: 'COMPORTAMENTO' },
      { label: 'Enriquecimento', targetTab: 'COMPORTAMENTO' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GamifLevelPill — compact strip shown above "Meus Gatos"
// ─────────────────────────────────────────────────────────────────────────────
function GamifLevelPill({ userId }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    api.get(`/gamification/points/${userId}`).then(r => setData(r.data)).catch(() => {});
  }, [userId]);

  if (!data) return null;

  const pts   = data.points || 0;
  const level = getLevel(pts);
  const next  = getNext(pts);
  const pct   = next ? Math.round(((pts - level.min) / (next.min - level.min)) * 100) : 100;

  return (
    <motion.button
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => window.dispatchEvent(new CustomEvent('open-gamif-drawer'))}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-[16px] mb-3"
      style={{ background: `linear-gradient(135deg,${C.purple}15 0%,${C.purple}06 100%)`, border: `1px solid ${C.purple}20` }}
    >
      <span className="text-base">{level.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: C.purple }}>
            {level.abbr} · {level.label}
          </p>
          <p className="text-[9px] font-black" style={{ color: C.purple }}>{pts.toLocaleString('pt-BR')} XP</p>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: `${C.purple}18` }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full" style={{ background: C.purple }}
          />
        </div>
      </div>
      <ChevronRight size={12} style={{ color: C.purple }} className="shrink-0" />
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CatsRail
// ─────────────────────────────────────────────────────────────────────────────
function CatsRail({ cats, loading, onAdd }) {
  const navigate = useNavigate();
  const touch    = useSensory();
  const active   = cats.filter(c => !c.isMemorial && !c.isArchived);
  const memorial = cats.filter(c => c.isMemorial || c.isArchived);

  if (loading) return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {[1, 2, 3].map(i => <div key={i} className="flex-shrink-0 w-28 h-36 rounded-[22px] bg-gray-100 animate-pulse" />)}
    </div>
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {active.map((cat, i) => (
        <motion.button key={cat.id}
          initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
          onClick={() => { touch(); navigate(`/cat/${cat.id}`); }}
          className="flex-shrink-0 w-28 rounded-[22px] overflow-hidden relative cursor-pointer active:scale-95 transition-all"
          style={{ height: 140 }}>
          <div className="w-full h-full">
            {cat.photoUrl
              ? <img src={cat.photoUrl} className="w-full h-full object-cover" alt={cat.name} />
              : <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: `${C.purple}12` }}>🐱</div>}
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.65) 40%,transparent 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="font-black text-white text-sm leading-none truncate">{cat.name}</p>
            <p className="text-[9px] text-white/60 font-bold mt-0.5 truncate">{cat.breed || 'SRD'}</p>
          </div>
          {cat.themeColor && <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: cat.themeColor }} />}
        </motion.button>
      ))}
      {memorial.map(cat => (
        <motion.button key={cat.id} onClick={() => { touch(); navigate(`/cat/${cat.id}`); }}
          className="flex-shrink-0 w-28 rounded-[22px] overflow-hidden relative cursor-pointer opacity-50" style={{ height: 140 }}>
          <div className="w-full h-full">
            {cat.photoUrl
              ? <img src={cat.photoUrl} className="w-full h-full object-cover grayscale" alt={cat.name} />
              : <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-100">🐱</div>}
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.65) 40%,transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="font-black text-white text-sm leading-none truncate">{cat.name}</p>
            <p className="text-[9px] text-white/50 font-bold">In memoriam</p>
          </div>
        </motion.button>
      ))}
      <motion.button whileTap={{ scale: 0.95 }} onClick={() => { touch(); onAdd(); }}
        className="flex-shrink-0 w-28 rounded-[22px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 bg-white/60"
        style={{ height: 140 }}>
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
          <Plus size={18} className="text-gray-300" />
        </div>
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-wider text-center px-2">Novo gato</p>
      </motion.button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CuidadosCard — bloco unificado com:
//   1. Header com seletor de gato de referência
//   2. Alertas inline (PulseSection)
//   3. Tabs com endpoints espelhando ProfileHeader NAV_ITEMS
//   4. Painel expansível (desdobrar)
//   5. Strip iGentVet com barra dinâmica health score + XPG do gato
// ─────────────────────────────────────────────────────────────────────────────
function CuidadosCard({ cats }) {
  const navigate   = useNavigate();
  const touch      = useSensory();
  const activeCats = cats.filter(c => !c.isMemorial && !c.isArchived);

  // Seletor de gato de referência
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [showCatPicker, setShowCatPicker]  = useState(false);

  // Resolve gato selecionado (default = primeiro ativo)
  const selectedCat = activeCats.find(c => c.id === selectedCatId) || activeCats[0] || null;

  // Dados dinâmicos do gato selecionado
  const catXpg         = Number(selectedCat?.xpg ?? selectedCat?.petXp ?? selectedCat?.xp ?? 0);
  const catHealthScore = Number(selectedCat?.healthScore ?? selectedCat?.wellness ?? 0);
  const catLevel       = Number(selectedCat?.petLevel ?? selectedCat?.level ?? 1);

  // Deriva health score visual se API não retornar (0–100)
  const healthPct = catHealthScore > 0
    ? Math.min(catHealthScore, 100)
    : Math.min(60 + catLevel * 4, 100); // fallback estimado

  const healthColor = healthPct >= 75 ? '#10B981' : healthPct >= 45 ? '#F59E0B' : '#EF4444';

  const [expanded, setExpanded]         = useState(null);
  const [alerts, setAlerts]             = useState([]);
  const [alertLoading, setAlertLoading] = useState(true);

  useEffect(() => {
    if (!cats.length) { setAlertLoading(false); return; }
    let mounted = true;
    const active = cats.filter(c => !c.isMemorial && !c.isArchived);

    const build = async () => {
      const found = [];
      const now   = new Date();
      await Promise.all(active.slice(0, 4).map(async (cat) => {
        try {
          const tRes = await api.get(`/treatments?petId=${cat.id}`);
          for (const s of (tRes.data || []).filter(s => s.active)) {
            if (s.overdueCount > 0)
              found.push({ type: 'overdue', urgent: true, catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl, label: s.title, value: `${s.overdueCount} dose${s.overdueCount > 1 ? 's' : ''} atrasada${s.overdueCount > 1 ? 's' : ''}`, path: `/cat/${cat.id}` });
            else if (s.nextDose) {
              const diff = new Date(s.nextDose.scheduledAt) - now;
              if (diff > 0 && diff <= 4 * 3600000)
                found.push({ type: 'upcoming', catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl, label: s.title, value: `em ${timeUntil(s.nextDose.scheduledAt)} (${fmtTime(s.nextDose.scheduledAt)})`, path: `/cat/${cat.id}` });
            }
          }
        } catch { }
        try {
          const vRes = await api.get(`/health-records?petId=${cat.id}`);
          for (const v of (vRes.data || []).filter(r => r.type === 'VACCINE' && r.nextDueDate)) {
            const days = Math.ceil((new Date(v.nextDueDate) - now) / 86400000);
            if (days < 0)
              found.push({ type: 'vaccine_overdue', urgent: true, catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl, label: v.title || 'Vacina', value: `Vencida há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`, path: `/cat/${cat.id}` });
            else if (days <= 14)
              found.push({ type: 'vaccine_due', catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl, label: v.title || 'Vacina', value: `Vence em ${days} dia${days !== 1 ? 's' : ''}`, path: `/cat/${cat.id}` });
          }
        } catch { }
      }));
      if (mounted) {
        found.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
        setAlerts(found.slice(0, 3));
        setAlertLoading(false);
      }
    };
    build();
    return () => { mounted = false; };
  }, [cats]);

  // Navigate to cat profile with specific ProfileHeader tab
  const goToTab = (targetTab, catOverride) => {
    touch();
    const cat = catOverride || selectedCat;
    if (targetTab === null) { navigate('/igent-vet'); return; }
    if (cat) navigate(`/cat/${cat.id}`, { state: { openTab: targetTab } });
    else navigate('/cats');
  };

  const handleIcon = (item) => { touch(); setExpanded(prev => prev === item.tab ? null : item.tab); };

  if (!selectedCat) return (
    <motion.div variants={fadeUp}
      className="bg-white rounded-[28px] border border-gray-100 p-4 flex items-center gap-4 shadow-sm cursor-pointer"
      onClick={() => navigate('/cat-new')}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${C.purple}10` }}>
        <PawPrint size={20} style={{ color: C.purple }} />
      </div>
      <div className="flex-1">
        <p className="font-black text-gray-800 text-sm">Cadastre seu primeiro gato</p>
        <p className="text-[10px] text-gray-400 font-bold">Saúde, vacinas, alimentação e muito mais</p>
      </div>
      <ChevronRight size={15} className="text-gray-300 shrink-0" />
    </motion.div>
  );

  const expandedItem = CARE_ITEMS.find(c => c.tab === expanded);

  return (
    <motion.div variants={fadeUp} className="rounded-[28px] overflow-hidden border border-gray-100 bg-white shadow-sm">

      {/* ── Header com seletor de gato ── */}
      <div className="px-4 pt-3.5 pb-3 flex items-center justify-between border-b border-gray-50">
        <div className="flex items-center gap-2">
          <Heart size={13} style={{ color: C.purple }} fill={C.purple} />
          <p className="text-[10px] font-black text-gray-700 uppercase tracking-wider">Cuidados</p>
        </div>

        {/* Cat selector button */}
        <div className="relative">
          <button
            onClick={() => setShowCatPicker(p => !p)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all"
            style={{ background: `${C.purple}10`, border: `1px solid ${C.purple}20` }}>
            {selectedCat.photoUrl
              ? <img src={selectedCat.photoUrl} alt={selectedCat.name} className="w-5 h-5 rounded-full object-cover" />
              : <span className="text-sm">🐱</span>}
            <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: C.purple }}>{selectedCat.name}</span>
            <ChevronDown size={10} style={{ color: C.purple }} />
          </button>

          <AnimatePresence>
            {showCatPicker && activeCats.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 z-50 rounded-[18px] overflow-hidden shadow-xl border border-gray-100 bg-white min-w-[140px]">
                {activeCats.map(cat => (
                  <button key={cat.id}
                    onClick={() => { setSelectedCatId(cat.id); setShowCatPicker(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left">
                    {cat.photoUrl
                      ? <img src={cat.photoUrl} alt={cat.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      : <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: `${C.purple}12` }}>🐱</div>}
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-800 truncate">{cat.name}</p>
                      <p className="text-[8px] text-gray-400 font-bold truncate">{cat.breed || 'SRD'}</p>
                    </div>
                    {cat.id === selectedCat.id && (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: C.purple }}>
                        <span className="text-[7px] text-white font-black">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── 1. Alertas inline ── */}
      {!alertLoading && alerts.length > 0 && (
        <div className="px-3 pt-2.5 space-y-1.5">
          {alerts.map((item, i) => {
            const isOverdue = item.type === 'overdue' || item.type === 'vaccine_overdue';
            const isVaccine = item.type === 'vaccine_due' || item.type === 'vaccine_overdue';
            const Icon   = isVaccine ? Syringe : Pill;
            const color  = isOverdue ? '#DC2626' : C.purple;
            const bg     = isOverdue ? '#FEF2F2' : '#FFF7ED';
            const border = isOverdue ? '#FECACA' : '#FED7AA';
            return (
              <motion.button key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[16px] border text-left active:scale-[0.98]"
                style={{ background: bg, borderColor: border }}>
                <div className="relative shrink-0">
                  <div className="w-7 h-7 rounded-xl overflow-hidden" style={{ border: `2px solid ${color}30` }}>
                    {item.catPhoto
                      ? <img src={item.catPhoto} className="w-full h-full object-cover" alt="" />
                      : <div className="w-full h-full flex items-center justify-center text-sm" style={{ background: `${color}15` }}>🐱</div>}
                  </div>
                  {isOverdue && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border border-white flex items-center justify-center">
                      <span className="text-[5px] text-white font-black">!</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <Icon size={9} style={{ color }} className="shrink-0" />
                    <p className="text-[9px] font-black uppercase tracking-wide truncate" style={{ color }}>{item.catName} · {item.label}</p>
                  </div>
                  <p className="text-[10px] font-bold text-gray-600 truncate">{item.value}</p>
                </div>
                <ChevronRight size={12} className="text-gray-300 shrink-0" />
              </motion.button>
            );
          })}
        </div>
      )}

      {/* ── 2. Tab icons — espelham ProfileHeader NAV_ITEMS ── */}
      <div className="flex gap-0 overflow-x-auto px-2 py-3" style={{ scrollbarWidth: 'none' }}>
        {CARE_ITEMS.map((item) => {
          const isActive = expanded === item.tab;
          return (
            <motion.button key={item.tab} whileTap={{ scale: 0.92 }} onClick={() => handleIcon(item)}
              className="flex flex-col items-center gap-1.5 px-3 shrink-0 transition-all" style={{ minWidth: 60 }}>
              <motion.div
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg relative"
                style={{
                  background: isActive ? item.color : item.bg,
                  border: `2px solid ${isActive ? item.color : item.border}`,
                  boxShadow: isActive ? `0 4px 14px ${item.color}40` : 'none',
                }}>
                {item.emoji}
                {isActive && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center"
                    style={{ background: item.color }}>
                    <span className="text-[5px] text-white font-black">✓</span>
                  </motion.div>
                )}
              </motion.div>
              <span className="text-[8px] font-black text-center leading-tight"
                style={{ color: isActive ? item.color : '#6B7280', maxWidth: 48 }}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* ── 3. Expandable panel — cada chip navega ao targetTab correto ── */}
      <AnimatePresence>
        {expandedItem && (
          <motion.div key={expandedItem.tab}
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden', borderTop: `1px solid ${expandedItem.border}` }}>
            <div className="px-4 py-3" style={{ background: expandedItem.bg }}>
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed mb-2.5">{expandedItem.desc}</p>
              <div className="flex flex-wrap gap-2">
                {expandedItem.subs.map(sub => (
                  <motion.button key={sub.label} whileTap={{ scale: 0.95 }}
                    onClick={() => goToTab(sub.targetTab)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black transition-all"
                    style={{ background: 'white', color: expandedItem.color, border: `1.5px solid ${expandedItem.border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    {sub.label} <ChevronRight size={9} strokeWidth={3} />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4. iGentVet strip com barra dinâmica health score + XPG ── */}
      <motion.button whileTap={{ scale: 0.99 }} onClick={() => { touch(); navigate('/igent-vet'); }}
        className="w-full text-left"
        style={{ background: 'linear-gradient(135deg,#1a1428 0%,#2D2657 100%)' }}>

        {/* Health score + XPG bars */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-4">
          {/* Health score */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">Saúde</span>
              <span className="text-[8px] font-black" style={{ color: healthColor }}>{healthPct}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${healthPct}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className="h-full rounded-full"
                style={{ background: healthColor, boxShadow: `0 0 6px ${healthColor}80` }} />
            </div>
          </div>

          {/* XPG */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[7px] font-black text-white/50 uppercase tracking-widest">XPG</span>
              <span className="text-[8px] font-black" style={{ color: C.accentDim }}>{catXpg.toLocaleString('pt-BR')}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((catXpg / Math.max(catLevel * 120, 1)) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.45 }}
                className="h-full rounded-full relative overflow-hidden"
                style={{ background: C.accent }}>
                <motion.div animate={{ x: ['-100%','200%'] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="absolute inset-0" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)' }} />
              </motion.div>
            </div>
          </div>
        </div>

        {/* CTA row */}
        <div className="flex items-center gap-3 px-4 pb-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
            <Brain size={14} style={{ color: C.accent }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Agente IA · Acompanhamento</p>
            <p className="text-xs font-black text-white">iGentVet — ao longo da vida dos seus gatos</p>
          </div>
          <div className="px-2.5 py-1.5 rounded-full font-black text-[8px] shrink-0" style={{ background: C.accent, color: C.purple }}>
            Consultar →
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WikiMiniSlider — mini image slider linked to gatedopedia
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
      {/* Slide images — crossfade */}
      {WIKI_SLIDES.map((s, i) => (
        <motion.div
          key={s.label}
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <img src={s.img} alt={s.label} className="w-full h-full object-cover" />
        </motion.div>
      ))}

      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg,rgba(10,8,30,0.78) 0%,rgba(30,22,60,0.55) 100%)' }}
      />

      {/* Color tint from active slide */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: `linear-gradient(180deg, transparent 30%, ${slideColor}60 100%)`,
        }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-3">
        <div className="flex items-center gap-1">
          <Sparkles size={9} className="text-white/60" />
          <p className="text-[7px] font-black text-white/60 uppercase tracking-widest">Mini Tour</p>
        </div>

        {/* Slide title */}
        <div>
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xl">{slide?.emoji}</span>
                <p className="font-black text-white text-sm leading-none">{slide?.label}</p>
              </div>
              <p className="text-[8px] text-white/55 font-bold">{slide?.desc}</p>
            </motion.div>
          </AnimatePresence>

          {/* Dot indicators */}
          <div className="flex gap-1 mt-2">
            {WIKI_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(i);
                }}
                className="rounded-full transition-all"
                style={{
                  width: i === current ? 14 : 5,
                  height: 5,
                  background: i === current ? slideColor : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DiscoveryGrid
//   Row 1: [studio] [comunigato]  — studio primeiro
//   Row 2: [gatedopedia] [wiki mini slider]
// ─────────────────────────────────────────────────────────────────────────────
function DiscoveryGrid() {
  const navigate = useNavigate();
  const touch    = useSensory();

  return (
    <div className="space-y-3">
      {/* Row 1 — studio | comunigato */}
      <div className="grid grid-cols-2 gap-3">

        {/* Studio — first */}
        <motion.button variants={fadeUp}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          onClick={() => { touch(); navigate('/studio'); }}
          className="relative overflow-hidden rounded-[24px] text-left group"
          style={{ height: 148 }}>

          {/* Background image overlay — img11 */}
          <img src={img11} alt="Studio" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

          {/* Rich gradient overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg,rgba(236,72,153,0.85) 0%,rgba(139,74,255,0.75) 55%,rgba(30,10,60,0.9) 100%)' }} />

          {/* Sheen on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.12) 0%,transparent 60%)' }} />

          <div className="relative z-10 h-full flex flex-col justify-between p-4">
            <div className="flex items-center justify-between">
              {/* Big icon on hover */}
              <motion.div
                whileHover={{ scale: 1.15 }}
                className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm"
                style={{ border: '1.5px solid rgba(255,255,255,0.3)' }}>
                <Palette size={20} className="text-white" />
              </motion.div>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
                <Lock size={7} className="text-white/80" />
                <span className="text-[7px] font-black text-white/80">beta</span>
              </div>
            </div>
            <div>
              <p className="text-[8px] font-black text-pink-200/80 uppercase tracking-widest mb-0.5">Criativo</p>
              <h3 className="font-black text-white text-xl leading-none tracking-tight drop-shadow">studio</h3>
            </div>
          </div>
        </motion.button>

        {/* Comunigato — second */}
        <motion.button variants={fadeUp}
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          onClick={() => { touch(); navigate('/comunigato'); }}
          className="relative overflow-hidden rounded-[24px] text-left group"
          style={{ height: 148 }}>

          {/* Background overlay */}
          <img src={img10} alt="Comunigato" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg,rgba(6,182,212,0.88) 0%,rgba(8,145,178,0.75) 55%,rgba(10,40,60,0.92) 100%)' }} />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.10) 0%,transparent 60%)' }} />

          <div className="relative z-10 h-full flex flex-col justify-between p-4">
            <motion.div
              whileHover={{ scale: 1.15 }}
              className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm"
              style={{ border: '1.5px solid rgba(255,255,255,0.3)' }}>
              <Globe size={20} className="text-white" />
            </motion.div>
            <div>
              <p className="text-[8px] font-black text-cyan-200/80 uppercase tracking-widest mb-0.5">Comunidade</p>
              <h3 className="font-black text-white text-xl leading-none tracking-tight drop-shadow">comunigato</h3>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Row 2 — gatedopedia | wiki mini slider */}
      <div className="flex gap-3">

        {/* Gatedopedia — orange, wide */}
        <motion.button variants={fadeUp}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 22 }}
          onClick={() => { touch(); navigate('/wiki'); }}
          className="relative overflow-hidden rounded-[24px] text-left group"
          style={{ flex: 3, height: 120 }}>

          <img src={img9} alt="Gatedopedia" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(145deg,rgba(249,115,22,0.88) 0%,rgba(234,88,12,0.8) 50%,rgba(60,20,0,0.92) 100%)' }} />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.10) 0%,transparent 50%)' }} />

          <div className="relative z-10 h-full flex flex-col justify-between p-4">
            <motion.div
              whileHover={{ scale: 1.15 }}
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

        {/* Wiki mini image slider */}
        <WikiMiniSlider onNavigate={() => { touch(); navigate('/wiki'); }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Achadinhos
// ─────────────────────────────────────────────────────────────────────────────
function Achadinhos() {
  const navigate  = useNavigate();
  const touch     = useSensory();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products').then(r => {
      const all = r.data || [];
      const featured = all.filter(p => p.featured || p.isFeatured || p.highlight);
      setItems(featured.length > 0 ? featured.slice(0, 6) : all.slice(0, 6));
    }).catch(() => setItems(ACHADINHOS_FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const getGradient = (i) => {
    const grads = [
      'linear-gradient(180deg,transparent 40%,rgba(6,182,212,0.85) 100%)',
      'linear-gradient(180deg,transparent 40%,rgba(139,74,255,0.85) 100%)',
      'linear-gradient(180deg,transparent 40%,rgba(236,72,153,0.85) 100%)',
      'linear-gradient(180deg,transparent 40%,rgba(16,185,129,0.85) 100%)',
      'linear-gradient(180deg,transparent 40%,rgba(245,158,11,0.85) 100%)',
      'linear-gradient(180deg,transparent 40%,rgba(99,102,241,0.85) 100%)',
    ];
    return grads[i % grads.length];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame size={13} style={{ color: C.purple }} />
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Seus Gatos Vão Amar</h2>
        </div>
        <button onClick={() => { touch(); navigate('/store'); }}
          className="text-[9px] font-black uppercase tracking-wider" style={{ color: C.purple }}>
          Ver loja →
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {loading
          ? [1, 2, 3].map(i => <div key={i} className="flex-shrink-0 rounded-[22px] animate-pulse" style={{ width: 148, height: 188, background: 'rgba(139,74,255,0.06)' }} />)
          : items.map((item, i) => (
          <motion.button key={item.id || i}
            initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => { touch(); navigate('/store'); }}
            className="flex-shrink-0 rounded-[22px] overflow-hidden relative text-left"
            style={{ width: 148, height: 208, boxShadow: '0 4px 16px rgba(0,0,0,0.14)' }}>
            {item.images?.[0] || item.img
              ? <img src={item.images?.[0] || item.img} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
              : <div className="absolute inset-0 flex items-center justify-center text-4xl" style={{ background: 'rgba(139,74,255,0.08)' }}>🐱</div>}
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.08)' }} />
            <div className="absolute inset-0" style={{ background: item.gradient || getGradient(i) }} />
            {(item.tag || item.badge) && (
              <div className="absolute top-2.5 left-2.5">
                <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-white/90 text-gray-700">{item.tag || item.badge}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="font-black text-white text-sm leading-tight mb-1 line-clamp-2">{item.name}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-black text-white text-sm">
                  {item.price ? `R$ ${parseFloat(item.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : item.priceLabel || ''}
                </span>
                {(item.oldPrice || item.comparePrice) && (
                  <span className="text-[9px] text-white/55 font-bold line-through">
                    {item.oldPrice || `R$ ${parseFloat(item.comparePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                )}
              </div>
              {(item.externalLink || item.affiliateUrl || item.link) && (
                <motion.a href={item.externalLink || item.affiliateUrl || item.link}
                  target="_blank" rel="noreferrer noopener"
                  whileTap={{ scale: 0.95 }}
                  onClick={e => { e.stopPropagation(); touch(); }}
                  className="flex items-center justify-center gap-1 w-full py-1.5 rounded-full font-black text-[10px] uppercase tracking-wide"
                  style={{ background: '#DFFF40', color: '#1a1a00' }}>
                  <ShoppingBag size={10} /> Comprar
                </motion.a>
              )}
            </div>
          </motion.button>
        ))}
        <motion.button whileTap={{ scale: 0.96 }} onClick={() => { touch(); navigate('/store'); }}
          className="flex-shrink-0 rounded-[22px] border-2 border-dashed flex flex-col items-center justify-center gap-2"
          style={{ width: 96, height: 188, borderColor: 'rgba(139,74,255,0.3)', background: 'rgba(139,74,255,0.04)' }}>
          <ShoppingBag size={18} style={{ color: C.purple }} />
          <p className="text-[8px] font-black uppercase tracking-wide text-center px-2" style={{ color: C.purple }}>Ver loja</p>
        </motion.button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GatedoClubeBanner — banner standalone
// ─────────────────────────────────────────────────────────────────────────────
function GatedoClubeBanner() {
  const navigate = useNavigate();
  const touch    = useSensory();
  return (
    <motion.button variants={fadeUp} whileTap={{ scale: 0.97 }}
      onClick={() => { touch(); navigate('/clube'); }}
      className="w-full relative overflow-hidden rounded-[24px] px-5 py-4 flex items-center gap-4 text-left"
      style={{ background: 'linear-gradient(135deg, #936cff 0%, #8b4dff 50%, #682adb 100%)' }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }}>
        <Crown size={22} style={{ color: C.accentDim }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Fase Fundadora</p>
        <p className="font-black text-white text-sm leading-tight mt-0.5">Gatedo Clube · Vagas abertas</p>
      </div>
      <div className="flex-shrink-0 px-4 py-2 rounded-full font-black text-[10px]" style={{ background: C.accentDim, color: '#682adb' }}>
        Ver planos →
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StudioSlider
// ─────────────────────────────────────────────────────────────────────────────
function StudioSlider() {
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
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={13} style={{ color: C.purple }} />
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Studio · Prioridade Fundadores</h2>
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

        <motion.button whileTap={{ scale: 0.96 }} onClick={() => { touch(); navigate('/clube'); }}
          className="flex-shrink-0 rounded-[22px] border-2 border-dashed flex flex-col items-center justify-center gap-2"
          style={{ width: 110, height: 196, borderColor: `${C.purple}30`, background: `${C.purple}06` }}>
          <div className="w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: `${C.purple}40` }}>
            <Crown size={16} style={{ color: C.purple }} />
          </div>
          <p className="text-[8px] font-black uppercase tracking-wide text-center px-2" style={{ color: C.purple }}>Prioridade Fundadores</p>
        </motion.button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EntertainmentCard
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
// Home — block order exactly as in print
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const touch    = useSensory();
  const { user } = useContext(AuthContext);

  const [cats, setCats]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const isAdmin    = user?.email === 'diegobocktavares@gmail.com' || user?.role === 'ADMIN';
  const activeCount = cats.filter(c => !c.isMemorial && !c.isArchived).length;

  useEffect(() => {
    api.get('/pets')
      .then(r => {
        const sorted = (r.data || []).sort((a, b) => {
          const aMemo = a.isMemorial || a.isArchived ? 1 : 0;
          const bMemo = b.isMemorial || b.isArchived ? 1 : 0;
          if (aMemo !== bMemo) return aMemo - bMemo;
          return (a.healthRecords?.some(r => r.type === 'MEDICINE') ? 0 : 1) -
                 (b.healthRecords?.some(r => r.type === 'MEDICINE') ? 0 : 1);
        });
        setCats(sorted);
      })
      .finally(() => setLoading(false));
  }, []);

  const adminRoutes = [
    { label: 'Geral',      icon: LayoutDashboard, path: '/admin'           },
    { label: 'Users',      icon: Users,           path: '/admin/users'     },
    { label: 'Cats',       icon: PawPrint,        path: '/admin/cats'      },
    { label: 'Conteúdo',   icon: FileText,        path: '/admin/content'   },
    { label: 'Financeiro', icon: DollarSign,      path: '/admin/financial' },
    { label: 'Overview',   icon: Eye,             path: '/admin/overview'  },
    { label: 'Partners',   icon: Handshake,       path: '/admin/partners'  },
    { label: 'Loja',       icon: Store,           path: '/admin/store'     },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="pb-36 min-h-screen"
      style={{ background: C.bg, fontFamily: "'Nunito', sans-serif" }}>

      <Header />

      <motion.div className="px-4 space-y-5 max-w-[800px] mx-auto"
        variants={stagger} initial="hidden" animate="visible">

        {/* 1 ─ Meus Gatos (com level pill de gamificação acima) ─────── */}
        <motion.section variants={fadeUp}>
          {/* Compact gamif level strip — "nivel atual gamificação tutor" */}
          {user?.id && <GamifLevelPill userId={user.id} />}

          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tighter leading-none">Meus Gatos</h2>
              {activeCount > 0 && (
                <p className="text-[10px] font-black mt-0.5" style={{ color: C.purple }}>
                  {activeCount} ativo{activeCount !== 1 ? 's' : ''} · toque para o perfil
                </p>
              )}
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => { touch(); navigate('/cats'); }}
              className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider"
              style={{ background: C.accentDim, color: C.purple }}>
              Caixinha
            </motion.button>
          </div>
          <CatsRail cats={cats} loading={loading} onAdd={() => navigate('/cat-new')} />
        </motion.section>

        {/* 2 ─ CUIDADOS — bloco único com alertas + tabs + desdobrar ── */}
        <motion.section variants={fadeUp}>
          <CuidadosCard cats={cats} />
        </motion.section>

        {/* 3 ─ Discovery grid: comunigato · studio · gatedopedia · mini carrossel */}
        <motion.section variants={fadeUp}>
          <DiscoveryGrid />
        </motion.section>

        {/* 4 ─ Seus Gatos Vão Amar ─────────────────────────────────── */}
        <motion.section variants={fadeUp}>
          <Achadinhos />
        </motion.section>

        {/* 5 ─ Gatedo Clube — banner standalone ───────────────────────  */}
        <motion.section variants={fadeUp}>
          <GatedoClubeBanner />
        </motion.section>

        {/* 6 ─ Studio slider ───────────────────────────────────────── */}
        <motion.section variants={fadeUp}>
          <StudioSlider />
        </motion.section>

        {/* 7 ─ Entretenimento ──────────────────────────────────────── */}
        <motion.section variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <Gamepad2 size={13} style={{ color: C.purple }} />
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Entretenimento</h2>
          </div>
          <EntertainmentCard />
        </motion.section>

        {/* 8 ─ Ações Rápidas ───────────────────────────────────────── */}
        <motion.section variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Ações Rápidas</h2>
          </div>
          <QuickActions />
        </motion.section>

        <div className="h-4" />
      </motion.div>

      {/* Admin panel */}
      {isAdmin && (
        <>
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] w-24 flex justify-center">
            <motion.button onClick={() => { touch(); setIsAdminOpen(true); }}
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
              className="text-[#8B4AFF] px-4 py-1.5 rounded-t-2xl shadow-lg border-x border-t border-white/50 flex flex-col items-center group active:scale-95"
              style={{ background: C.accentDim }}>
              <ChevronUp size={16} strokeWidth={4} className="group-hover:-translate-y-1 transition-transform" />
            </motion.button>
          </div>
          <AnimatePresence>
            {isAdminOpen && (
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-x-0 bottom-0 z-[200] rounded-t-[40px] shadow-[0_-15px_40px_rgba(0,0,0,0.15)] p-8 max-h-[70vh] overflow-y-auto"
                style={{ background: C.accentDim }}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter" style={{ color: C.purple }}>Gatedo Admin</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${C.purple}60` }}>Painel de Controle</p>
                  </div>
                  <button onClick={() => setIsAdminOpen(false)} className="p-2 rounded-full" style={{ background: `${C.purple}15`, color: C.purple }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3 pb-8">
                  {adminRoutes.map(route => (
                    <button key={route.path} onClick={() => { touch(); navigate(route.path); setIsAdminOpen(false); }}
                      className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm active:scale-95 border border-gray-50">
                      <route.icon size={18} style={{ color: C.purple }} />
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tight text-center">{route.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
