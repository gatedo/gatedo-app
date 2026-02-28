import React, { useState, useEffect, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Palette, BookOpen, ShoppingBag, ChevronUp, X,
  LayoutDashboard, Users, PawPrint, FileText, DollarSign,
  Eye, Handshake, Store, Pill, Syringe, Brain, Zap,
  AlertCircle, CheckCircle, Clock, TrendingUp, ChevronRight,
  Heart, Sparkles, Activity
} from 'lucide-react';
import Header from '../components/Header';
import QuickActions from '../components/QuickActions';
import CatCard from '../components/CatCard';
import useSensory from '../hooks/useSensory';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const C = { purple: '#6158ca', accent: '#DFFF40', accentDim: '#ebfc66', bg: '#F4F3FF' };

const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
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
  { min: 0,    max: 99,   label: 'Gateiro Curioso',   emoji: '🐾' },
  { min: 100,  max: 299,  label: 'Gateiro Raiz',      emoji: '😺' },
  { min: 300,  max: 599,  label: 'Guardião Felino',   emoji: '🛡️' },
  { min: 600,  max: 999,  label: 'Especialista IA',   emoji: '🤖' },
  { min: 1000, max: 1999, label: 'Embaixador Gatedo', emoji: '👑' },
  { min: 2000, max: Infinity, label: 'Lenda Felina',  emoji: '✨' },
];
const getLevel = (pts) => LEVELS.find(l => pts >= l.min && pts <= l.max) || LEVELS[0];
const getNext  = (pts) => LEVELS.find(l => l.min > pts);

// ─── STAGGER CONTAINER ────────────────────────────────────────────────────────
const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 26 } },
};

// ─── PULSE: bloco de saúde hoje ───────────────────────────────────────────────
function PulseSection({ cats, userId }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);   // { type, catName, catId, catPhoto, label, value, urgent, path }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cats.length) { setLoading(false); return; }
    const active = cats.filter(c => !c.isMemorial && !c.isArchived);
    let mounted = true;

    const build = async () => {
      const found = [];
      const now = new Date();

      await Promise.all(active.slice(0, 4).map(async (cat) => {
        try {
          // Tratamentos
          const tRes = await api.get(`/treatments?petId=${cat.id}`);
          const schedules = (tRes.data || []).filter(s => s.active);
          for (const s of schedules) {
            if (s.overdueCount > 0) {
              found.push({
                type: 'overdue', urgent: true,
                catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl,
                label: s.title,
                value: `${s.overdueCount} dose${s.overdueCount > 1 ? 's' : ''} atrasada${s.overdueCount > 1 ? 's' : ''}`,
                path: `/cat/${cat.id}`,
              });
            } else if (s.nextDose) {
              const diff = new Date(s.nextDose.scheduledAt) - now;
              if (diff > 0 && diff <= 4 * 3600000) {
                found.push({
                  type: 'upcoming',
                  catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl,
                  label: s.title,
                  value: `em ${timeUntil(s.nextDose.scheduledAt)} (${fmtTime(s.nextDose.scheduledAt)})`,
                  path: `/cat/${cat.id}`,
                });
              }
            }
          }
        } catch {}

        try {
          // Vacinas
          const vRes = await api.get(`/health-records?petId=${cat.id}`);
          const vaccines = (vRes.data || []).filter(r => r.type === 'VACCINE' && r.nextDueDate);
          for (const v of vaccines) {
            const days = Math.ceil((new Date(v.nextDueDate) - now) / 86400000);
            if (days < 0) {
              found.push({
                type: 'vaccine_overdue', urgent: true,
                catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl,
                label: v.title || 'Vacina',
                value: `Vencida há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`,
                path: `/cat/${cat.id}/health-new`,
              });
            } else if (days <= 14) {
              found.push({
                type: 'vaccine_due',
                catId: cat.id, catName: cat.name, catPhoto: cat.photoUrl,
                label: v.title || 'Vacina',
                value: `Vence em ${days} dia${days !== 1 ? 's' : ''}`,
                path: `/cat/${cat.id}/health-new`,
              });
            }
          }
        } catch {}
      }));

      if (mounted) {
        // Urgentes primeiro
        found.sort((a, b) => (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0));
        setItems(found.slice(0, 5));
        setLoading(false);
      }
    };

    build();
    return () => { mounted = false; };
  }, [cats]);

  if (loading) return (
    <div className="space-y-2">
      {[1,2].map(i => <div key={i} className="h-16 rounded-[20px] bg-gray-100 animate-pulse" />)}
    </div>
  );

  if (items.length === 0) return (
    <motion.div variants={fadeUp}
      className="flex items-center gap-3 bg-white rounded-[20px] px-4 py-3.5 border border-green-100 shadow-sm">
      <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
        <CheckCircle size={18} className="text-green-500" />
      </div>
      <div>
        <p className="font-black text-gray-800 text-sm">Tudo em dia! 🎉</p>
        <p className="text-[10px] font-bold text-gray-400">Nenhum alerta de saúde hoje</p>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const isOverdue = item.type === 'overdue' || item.type === 'vaccine_overdue';
        const isVaccine = item.type === 'vaccine_due' || item.type === 'vaccine_overdue';
        const Icon = isVaccine ? Syringe : Pill;
        const color = isOverdue ? '#DC2626' : C.purple;
        const bg    = isOverdue ? '#FEF2F2' : '#F4F3FF';
        const border= isOverdue ? '#FECACA' : `${C.purple}20`;

        return (
          <motion.button key={i} variants={fadeUp}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] border text-left transition-all active:scale-[0.98]"
            style={{ background: bg, borderColor: border }}>

            {/* Cat avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden"
                style={{ border: `2px solid ${color}30` }}>
                {item.catPhoto
                  ? <img src={item.catPhoto} className="w-full h-full object-cover" alt="" />
                  : <div className="w-full h-full flex items-center justify-center text-base"
                      style={{ background: `${color}15` }}>🐱</div>
                }
              </div>
              {isOverdue && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                  <span className="text-[6px] text-white font-black">!</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <Icon size={10} style={{ color }} className="flex-shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-wider truncate" style={{ color }}>
                  {item.catName} · {item.label}
                </p>
              </div>
              <p className="text-xs font-bold text-gray-600 truncate">{item.value}</p>
            </div>

            <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── ÚLTIMO INSIGHT IGENTVET ──────────────────────────────────────────────────
function LastInsight({ cats }) {
  const navigate = useNavigate();
  const [insight, setInsight] = useState(null);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    const active = cats.filter(c => !c.isMemorial && !c.isArchived);
    if (!active.length) { setLoaded(true); return; }

    let best = null;
    let count = 0;
    const check = () => { count++; if (count === active.length) setLoaded(true); };

    active.slice(0, 3).forEach(async (cat) => {
      try {
        const res = await api.get(`/igent/sessions?petId=${cat.id}`);
        const sessions = res.data || [];
        if (sessions.length > 0) {
          const last = sessions[0];
          if (!best || new Date(last.date) > new Date(best.date)) {
            best = { ...last, catName: cat.name, catPhoto: cat.photoUrl, catId: cat.id };
            setInsight(best);
          }
        }
      } catch {} finally { check(); }
    });
  }, [cats]);

  if (!loaded) return <div className="h-24 rounded-[24px] bg-gray-100 animate-pulse" />;
  if (!insight) return null;

  const isUrgent = insight.isUrgent;
  const daysAgo = Math.floor((Date.now() - new Date(insight.date).getTime()) / 86400000);
  const when = daysAgo === 0 ? 'Hoje' : daysAgo === 1 ? 'Ontem' : `${daysAgo} dias atrás`;

  return (
    <motion.div variants={fadeUp}
      onClick={() => navigate(`/cat/${insight.catId}`)}
      className="w-full rounded-[24px] overflow-hidden border cursor-pointer active:scale-[0.98] transition-all"
      style={{
        background: isUrgent
          ? 'linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%)'
          : `linear-gradient(135deg, ${C.purple}08 0%, ${C.purple}03 100%)`,
        borderColor: isUrgent ? '#FECACA' : `${C.purple}18`,
      }}>

      <div className="px-4 py-3.5 flex items-start gap-3">
        {/* Brain icon */}
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: isUrgent ? '#FEE2E2' : `${C.purple}12` }}>
          <Brain size={18} style={{ color: isUrgent ? '#DC2626' : C.purple }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[9px] font-black uppercase tracking-wider"
              style={{ color: isUrgent ? '#DC2626' : C.purple }}>
              iGentVet · {insight.catName} · {when}
            </p>
            {isUrgent && (
              <span className="text-[7px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                🔴 Urgente
              </span>
            )}
          </div>
          <p className="font-black text-gray-800 text-xs leading-snug truncate">
            {insight.symptomLabel}
          </p>
          {insight.analysisText && (
            <p className="text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-2 leading-relaxed">
              {insight.analysisText.slice(0, 90)}{insight.analysisText.length > 90 ? '...' : ''}
            </p>
          )}
        </div>
        <ChevronRight size={14} className="text-gray-300 flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  );
}

// ─── GAMIFICAÇÃO RESUMO ───────────────────────────────────────────────────────
function GamifStrip({ userId }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!userId) return;
    api.get(`/gamification/points/${userId}`)
      .then(r => setData(r.data))
      .catch(() => {});
  }, [userId]);

  if (!data) return null;

  const pts   = data.points || 0;
  const level = getLevel(pts);
  const next  = getNext(pts);
  const pct   = next ? Math.round(((pts - level.min) / (next.min - level.min)) * 100) : 100;

  return (
    <motion.div variants={fadeUp}
      onClick={() => window.dispatchEvent(new CustomEvent('open-gamif-drawer'))}
      className="rounded-[24px] px-4 py-3.5 cursor-pointer active:scale-[0.98] transition-all flex items-center gap-3"
      style={{ background: `linear-gradient(135deg, ${C.purple} 0%, #4B40C6 100%)` }}>

      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
        style={{ background: 'rgba(255,255,255,0.15)' }}>
        {level.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-black text-white/70 uppercase tracking-wider">{level.label}</p>
          <p className="text-[10px] font-black" style={{ color: C.accent }}>{pts.toLocaleString('pt-BR')} pts</p>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: C.accent }}
          />
        </div>
        {next && (
          <p className="text-[9px] text-white/50 font-bold mt-1">
            {next.min - pts} pts para {next.emoji} {next.label}
          </p>
        )}
      </div>

      <ChevronRight size={14} className="text-white/40 flex-shrink-0" />
    </motion.div>
  );
}

// ─── CAT CARDS COMPACTOS (horizontal scroll) ──────────────────────────────────
function CatsRail({ cats, loading, onAdd }) {
  const navigate = useNavigate();
  const touch    = useSensory();
  const active   = cats.filter(c => !c.isMemorial && !c.isArchived);
  const memorial = cats.filter(c =>  c.isMemorial || c.isArchived);

  if (loading) return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
      {[1,2,3].map(i => (
        <div key={i} className="flex-shrink-0 w-32 h-40 rounded-[22px] bg-gray-100 animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
      {active.map((cat, i) => (
        <motion.button
          key={cat.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => { touch(); navigate(`/cat/${cat.id}`); }}
          className="flex-shrink-0 w-32 rounded-[22px] overflow-hidden relative cursor-pointer active:scale-95 transition-all"
          style={{ height: 152 }}>

          {/* Foto */}
          <div className="w-full h-full">
            {cat.photoUrl
              ? <img src={cat.photoUrl} className="w-full h-full object-cover" alt={cat.name} />
              : <div className="w-full h-full flex items-center justify-center text-5xl"
                  style={{ background: `${C.purple}12` }}>🐱</div>
            }
          </div>

          {/* Overlay gradiente */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 40%, transparent 100%)' }} />

          {/* Info */}
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="font-black text-white text-sm leading-none truncate">{cat.name}</p>
            <p className="text-[9px] text-white/60 font-bold mt-0.5 truncate">{cat.breed || 'SRD'}</p>
          </div>

          {/* Badge themeColor */}
          {cat.themeColor && (
            <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white"
              style={{ background: cat.themeColor }} />
          )}
        </motion.button>
      ))}

      {/* Memorial (acinzentados) */}
      {memorial.map((cat) => (
        <motion.button key={cat.id}
          onClick={() => { touch(); navigate(`/cat/${cat.id}`); }}
          className="flex-shrink-0 w-32 rounded-[22px] overflow-hidden relative cursor-pointer opacity-50"
          style={{ height: 152 }}>
          <div className="w-full h-full">
            {cat.photoUrl
              ? <img src={cat.photoUrl} className="w-full h-full object-cover grayscale" alt={cat.name} />
              : <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-100">🐱</div>
            }
          </div>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 40%, transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-2.5">
            <p className="font-black text-white text-sm leading-none truncate">{cat.name}</p>
            <p className="text-[9px] text-white/50 font-bold">In memoriam</p>
          </div>
        </motion.button>
      ))}

      {/* Adicionar */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => { touch(); onAdd(); }}
        className="flex-shrink-0 w-32 rounded-[22px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 bg-white/60 hover:border-[#6158ca] hover:bg-white transition-all"
        style={{ height: 152 }}>
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
          <Plus size={18} className="text-gray-300" />
        </div>
        <p className="text-[9px] font-black text-gray-300 uppercase tracking-wider text-center px-2">
          Novo gato
        </p>
      </motion.button>
    </div>
  );
}

// ─── DISCOVERY CARDS (Wiki + Studio) ─────────────────────────────────────────
function DiscoveryCards() {
  const navigate = useNavigate();
  const touch    = useSensory();

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Wiki */}
      <motion.button variants={fadeUp} whileTap={{ scale: 0.96 }}
        onClick={() => { touch(); navigate('/wiki'); }}
        className="relative overflow-hidden rounded-[24px] h-40 p-4 cursor-pointer text-left"
        style={{ background: 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=60)', backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'luminosity' }} />
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">Enciclopédia</p>
            <h3 className="font-black text-white text-base leading-tight">Gatedo<br/><span className="text-cyan-200">Pédia</span></h3>
          </div>
        </div>
      </motion.button>

      {/* Studio */}
      <motion.button variants={fadeUp} whileTap={{ scale: 0.96 }}
        onClick={() => { touch(); navigate('/studio'); }}
        className="relative overflow-hidden rounded-[24px] h-40 p-4 cursor-pointer text-left"
        style={{ background: 'linear-gradient(135deg, #6158ca 0%, #f97316 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=400&q=60)', backgroundSize: 'cover', backgroundPosition: 'center', mixBlendMode: 'luminosity' }} />
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Palette size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[8px] font-black text-white/60 uppercase tracking-widest">Criativo</p>
            <h3 className="font-black text-white text-base leading-tight">Gatedo<br/><span className="text-[#ebfc66]">Studio</span></h3>
          </div>
        </div>
      </motion.button>

      {/* iGentVet — full width */}
      <motion.button variants={fadeUp} whileTap={{ scale: 0.96 }}
        onClick={() => { touch(); navigate('/igent-vet'); }}
        className="col-span-2 relative overflow-hidden rounded-[24px] h-20 px-5 cursor-pointer text-left flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, #1a1428 0%, #2D2657 100%)' }}>
        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
          <Brain size={20} style={{ color: C.accent }} />
        </div>
        <div className="flex-1">
          <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Agente IA</p>
          <p className="font-black text-white text-sm">iGentVet — Consultar agora</p>
        </div>
        <div className="flex-shrink-0 px-3 py-1.5 rounded-full font-black text-[10px]"
          style={{ background: C.accent, color: C.purple }}>
          Analisar →
        </div>
        {/* Stars */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white opacity-20"
            style={{ width: (i%2)+1, height: (i%2)+1, top: `${(i*23)%80}%`, right: `${60 + i*7}px` }} />
        ))}
      </motion.button>
    </div>
  );
}

// ─── COMPONENTE RAIZ ──────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const touch    = useSensory();
  const { user } = useContext(AuthContext);

  const [cats,        setCats]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const isAdmin = user?.email === 'diegobocktavares@gmail.com' || user?.role === 'ADMIN';
  const firstName = user?.name?.split(' ')[0] || 'Tutor';

  useEffect(() => {
    api.get('/pets')
      .then(r => {
        const sorted = (r.data || []).sort((a, b) => {
          const aMemo = a.isMemorial || a.isArchived ? 1 : 0;
          const bMemo = b.isMemorial || b.isArchived ? 1 : 0;
          if (aMemo !== bMemo) return aMemo - bMemo;
          const aUrgent = a.healthRecords?.some(r => r.type === 'MEDICINE') ? 0 : 1;
          const bUrgent = b.healthRecords?.some(r => r.type === 'MEDICINE') ? 0 : 1;
          return aUrgent - bUrgent;
        });
        setCats(sorted);
      })
      .catch(() => setCats([]))
      .finally(() => setLoading(false));
  }, []);

  const adminRoutes = [
    { label: 'Geral',      icon: LayoutDashboard, path: '/admin'            },
    { label: 'Users',      icon: Users,           path: '/admin/users'      },
    { label: 'Cats',       icon: PawPrint,        path: '/admin/cats'       },
    { label: 'Conteúdo',   icon: FileText,        path: '/admin/content'    },
    { label: 'Financeiro', icon: DollarSign,      path: '/admin/financial'  },
    { label: 'Overview',   icon: Eye,             path: '/admin/overview'   },
    { label: 'Partners',   icon: Handshake,       path: '/admin/partners'   },
    { label: 'Loja',       icon: Store,           path: '/admin/store'      },
  ];

  const activeCount = cats.filter(c => !c.isMemorial && !c.isArchived).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-36 min-h-screen"
      style={{ background: C.bg, fontFamily: "'Nunito', sans-serif" }}>

      <Header />

      <motion.div
        className="px-4 space-y-5 max-w-[800px] mx-auto"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >

        {/* ══ 1. PULSE — O QUE PRECISA DE ATENÇÃO HOJE ══ */}
        {(cats.length > 0) && (
          <motion.section variants={fadeUp}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={13} style={{ color: C.purple }} />
                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
                  Pulso de Hoje
                </h2>
              </div>
              <button onClick={() => navigate('/cats')}
                className="text-[9px] font-black uppercase tracking-wider"
                style={{ color: C.purple }}>
                Ver gatos →
              </button>
            </div>
            <PulseSection cats={cats} userId={user?.id} />
          </motion.section>
        )}

        {/* ══ 2. MEUS GATOS (rail horizontal) ══ */}
        <motion.section variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tighter leading-none">
                Meus Gatos
              </h2>
              {activeCount > 0 && (
                <p className="text-[10px] font-black mt-0.5" style={{ color: C.purple }}>
                  {activeCount} ativo{activeCount !== 1 ? 's' : ''} · toque para o perfil
                </p>
              )}
            </div>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => { touch(); navigate('/cats'); }}
              className="px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-wider"
              style={{ background: C.accentDim, color: C.purple }}>
              Caixinha
            </motion.button>
          </div>

          <CatsRail cats={cats} loading={loading} onAdd={() => navigate('/cat-new')} />
        </motion.section>

        {/* ══ 3. ÚLTIMO INSIGHT IA ══ */}
        {cats.length > 0 && (
          <motion.section variants={fadeUp}>
            <div className="flex items-center gap-2 mb-3">
              <Brain size={13} style={{ color: C.purple }} />
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
                Último Insight iGentVet
              </h2>
            </div>
            <LastInsight cats={cats} />
          </motion.section>
        )}

        {/* ══ 4. GAMIFICAÇÃO ══ */}
        {user?.id && (
          <motion.section variants={fadeUp}>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} style={{ color: C.purple }} />
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
                Seu Progresso
              </h2>
            </div>
            <GamifStrip userId={user.id} />
          </motion.section>
        )}

        {/* ══ 5. DISCOVERY (Wiki, Studio, iGentVet) ══ */}
        <motion.section variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={13} style={{ color: C.purple }} />
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">
              Universo Gatedo
            </h2>
          </div>
          <DiscoveryCards />
        </motion.section>

        {/* ══ 6. BANNER LOJA ══ */}
        <motion.div variants={fadeUp}
          whileTap={{ scale: 0.98 }}
          onClick={() => { touch(); navigate('/store'); }}
          className="rounded-[24px] p-5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
          <div className="flex justify-between items-center relative z-10">
            <div>
              <p className="text-[8px] font-black text-white/60 uppercase tracking-widest mb-0.5">Exclusivo</p>
              <h3 className="font-black text-white text-base flex items-center gap-2">
                Gatedo Shop <ShoppingBag size={16} style={{ color: C.accentDim }} />
              </h3>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Acessórios & Mimos</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <Sparkles size={22} style={{ color: C.accentDim }} />
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/5 blur-2xl" />
        </motion.div>

        {/* ══ 7. QUICK ACTIONS ══ */}
        <motion.section variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[3px]">Ações Rápidas</h2>
          </div>
          <QuickActions />
        </motion.section>

        <div className="h-4" />
      </motion.div>

      {/* ══ ADMIN PANEL ══ */}
      {isAdmin && (
        <>
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] w-24 flex justify-center">
            <motion.button
              onClick={() => { touch(); setIsAdminOpen(true); }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[#6158ca] px-4 py-1.5 rounded-t-2xl shadow-lg border-x border-t border-white/50 flex flex-col items-center group active:scale-95"
              style={{ background: C.accentDim }}>
              <ChevronUp size={16} strokeWidth={4} className="group-hover:-translate-y-1 transition-transform" />
            </motion.button>
          </div>

          <AnimatePresence>
            {isAdminOpen && (
              <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-x-0 bottom-0 z-[200] rounded-t-[40px] shadow-[0_-15px_40px_rgba(0,0,0,0.15)] p-8 max-h-[70vh] overflow-y-auto"
                style={{ background: C.accentDim }}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter" style={{ color: C.purple }}>Gatedo Admin</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${C.purple}60` }}>Painel de Controle</p>
                  </div>
                  <button onClick={() => setIsAdminOpen(false)}
                    className="p-2 rounded-full" style={{ background: `${C.purple}15`, color: C.purple }}>
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3 pb-8">
                  {adminRoutes.map(route => (
                    <button key={route.path}
                      onClick={() => { touch(); navigate(route.path); setIsAdminOpen(false); }}
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