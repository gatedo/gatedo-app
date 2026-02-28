/**
 * BioModule.jsx — v3
 * ─────────────────────────────────────────────────────────────────────────────
 * Aba Bio do CatProfile. Exibe:
 *   1. Banner do Perfil Social — cor tema sólida, totalmente clicável
 *   2. Bio + personalidade (com botão editar)
 *   3. Diário Recente — últimas 3 entradas do CatDiary
 *   4. Skills RPG — grid melhorado com destaque do ponto forte + edição
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart, Star, Zap, Shield, Target, Smile,
  Edit3, ChevronRight, Globe, QrCode,
  BookOpen, Plus, Palette, Check,
} from 'lucide-react';
import EditBioModal from './EditBioModal';
import api from '../../../services/api';

// ─── COR TEMA ─────────────────────────────────────────────────────────────────
// Paleta rápida (mesma do EditProfileModal)
const QUICK_COLORS = [
  '#6158ca','#8B5CF6','#EC4899','#F97316',
  '#F59E0B','#EF4444','#34D399','#10B981',
  '#06B6D4','#60A5FA','#A78BFA','#F472B6',
  '#FB923C','#4ADE80','#94A3B8','#1C1C2E',
];

const BREED_COLORS = {
  'Persa': '#A78BFA', 'Siamês': '#60A5FA', 'Maine Coon': '#F59E0B',
  'Ragdoll': '#EC4899', 'Bengal': '#F97316', 'Birmanês': '#8B5CF6',
  'SRD': '#34D399', 'default': '#6158ca',
};
const getThemeColor = (cat) => {
  const t = cat?.themeColor;
  // Aceita só hex real — ignora strings de classe Tailwind antigas (bg-[...])
  if (t && t.startsWith('#')) return t;
  return BREED_COLORS[cat?.breed] || BREED_COLORS.default;
};

// ─── MOOD MAP (espelha CatDiary.jsx) ─────────────────────────────────────────
const MOOD_MAP = {
  happy:   { emoji: '😸', label: 'Feliz',    color: '#16A34A', bg: '#F0FDF4' },
  sleepy:  { emoji: '😴', label: 'Preguiça', color: '#2563EB', bg: '#EFF6FF' },
  zoomies: { emoji: '⚡', label: 'Zoomies',  color: '#D97706', bg: '#FFFBEB' },
  spicy:   { emoji: '😾', label: 'Bravo',    color: '#DC2626', bg: '#FFF5F5' },
};

// ─── SKILLS ───────────────────────────────────────────────────────────────────
const SKILL_DEFS = [
  { id: 'skillSocial',    label: 'Social',    icon: Heart,   hex: '#FB7185', default: '80' },
  { id: 'skillDocile',    label: 'Dócil',     icon: Smile,   hex: '#F472B6', default: '95' },
  { id: 'skillCuriosity', label: 'Curioso',   icon: Star,    hex: '#FBBF24', default: '90' },
  { id: 'skillIndep',     label: 'Indep.',    icon: Shield,  hex: '#FB923C', default: '60' },
  { id: 'skillEnergy',    label: 'Energia',   icon: Zap,     hex: '#818CF8', default: '75' },
  { id: 'skillAgility',   label: 'Agilidade', icon: Target,  hex: '#A78BFA', default: '85' },
];

function fmtDate(d) {
  if (!d) return '';
  try {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff < 7)  return `${diff}d atrás`;
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch { return ''; }
}

// ─── SKILL BAR ────────────────────────────────────────────────────────────────
function SkillBar({ skill, cat }) {
  const val = parseInt(cat?.[skill.id] || skill.default, 10);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <skill.icon size={12} style={{ color: skill.hex }} />
          <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{skill.label}</span>
        </div>
        <span className="text-[10px] font-black" style={{ color: skill.hex }}>{val}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${val}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.05 }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${skill.hex}80, ${skill.hex})` }}
        />
      </div>
    </div>
  );
}

// ─── DIARY CARD ───────────────────────────────────────────────────────────────
function DiaryCard({ entry }) {
  const mood  = MOOD_MAP[entry.type] || MOOD_MAP.happy;
  const habits = entry.content?.match(/Checklist: (.+?)\./)?.[1] || '';
  const note   = entry.content?.replace(/Checklist: .+?\.\n?/, '').trim();

  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 px-3 py-2.5 rounded-[16px] border"
      style={{ background: mood.bg, borderColor: `${mood.color}20` }}
    >
      <div className="w-8 h-8 rounded-[12px] flex items-center justify-center text-base flex-shrink-0 bg-white border"
        style={{ borderColor: `${mood.color}25` }}>
        {mood.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-black" style={{ color: mood.color }}>{mood.label}</span>
          <span className="text-[9px] text-gray-400 font-bold">{fmtDate(entry.date)}</span>
        </div>
        {habits && (
          <div className="flex gap-1 flex-wrap mb-0.5">
            {habits.split(', ').slice(0, 3).map(h => (
              <span key={h} className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-white/70 text-gray-500">{h}</span>
            ))}
          </div>
        )}
        {note && <p className="text-[9px] text-gray-500 font-medium leading-snug truncate">{note}</p>}
      </div>
    </motion.div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function BioModule({ cat, refreshCat, navigate }) {
  const themeColor                    = getThemeColor(cat);
  const [isEditOpen, setIsEditOpen]       = useState(false);
  const [showPicker, setShowPicker]         = useState(false);
  const [savingColor, setSavingColor]       = useState(false);
  const [diary, setDiary]             = useState([]);
  const [diaryLoading, setDiaryLoading] = useState(true);

  useEffect(() => {
    if (!cat?.id) return;
    api.get(`/diary-entries?petId=${cat.id}&limit=3`)
      .then(r => setDiary(Array.isArray(r.data) ? r.data.slice(0, 3) : []))
      .catch(() => setDiary([]))
      .finally(() => setDiaryLoading(false));
  }, [cat?.id]);

  const applyColor = async (hex) => {
    setSavingColor(true);
    try {
      await api.patch(`/pets/${cat.id}`, { themeColor: hex });
      setShowPicker(false);
      if (refreshCat) refreshCat();
    } catch { /* silencioso */ }
    finally { setSavingColor(false); }
  };

  // Skill com maior valor
  const topSkill = SKILL_DEFS.reduce((best, s) => {
    const v = parseInt(cat?.[s.id] || s.default, 10);
    return v > parseInt(cat?.[best.id] || best.default, 10) ? s : best;
  }, SKILL_DEFS[0]);
  const topVal = parseInt(cat?.[topSkill.id] || topSkill.default, 10);

  return (
    <div className="space-y-4 pb-20">

      {/* ══ 0. BARRA PERSONALIZAÇÃO ═════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Perfil</p>
        <div className="relative">
          <button
            onClick={() => setShowPicker(s => !s)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black transition-all"
            style={showPicker
              ? { background: themeColor, color: 'white' }
              : { background: `${themeColor}18`, color: themeColor }
            }
          >
            <Palette size={11} />
            Personalizar
          </button>

          <AnimatePresence>
            {showPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -6 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-10 z-50 bg-white rounded-[20px] p-4 shadow-2xl border border-gray-100"
                style={{ width: 214 }}
              >
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Cor do perfil
                </p>
                <div className="grid grid-cols-8 gap-2 mb-2">
                  {QUICK_COLORS.map(hex => (
                    <button key={hex} onClick={() => applyColor(hex)} disabled={savingColor}
                      className="w-6 h-6 rounded-full transition-all hover:scale-125 flex items-center justify-center"
                      style={{
                        background: hex,
                        boxShadow: themeColor === hex ? `0 0 0 2px white, 0 0 0 3.5px ${hex}` : 'none',
                        transform: themeColor === hex ? 'scale(1.2)' : 'scale(1)',
                      }}>
                      {themeColor === hex && <Check size={9} color="white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
                <p className="text-[8px] text-gray-400 font-medium text-center">
                  {savingColor ? 'Aplicando...' : 'Toque para aplicar instantaneamente'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══ 1. BANNER PERFIL SOCIAL ══════════════════════════════════════ */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(`/gato/${cat.id}`)}
        className="w-full text-left rounded-[24px] overflow-hidden relative"
        style={{
          background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}CC 100%)`,
          boxShadow: `0 8px 28px ${themeColor}45`,
        }}
      >
        {/* Textura pontilhada sutil */}
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }} />

        <div className="relative z-10 flex items-center gap-4 px-5 py-4">
          {/* Foto */}
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-[16px] overflow-hidden border-2 border-white/40 shadow-lg">
              <img src={cat?.photoUrl || '/placeholder-cat.png'} alt={cat?.name}
                className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow">
              <Globe size={10} style={{ color: themeColor }} />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black uppercase tracking-widest text-white/60 mb-0.5">Perfil Social</p>
            <p className="text-base font-black text-white leading-tight">{cat?.name}</p>
            <p className="text-[10px] text-white/55 font-bold truncate">
              gatedo.com/gato/{cat?.name?.toLowerCase()}
            </p>
          </div>

          {/* CTA pill */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/30 bg-white/15 flex-shrink-0">
            <span className="text-[10px] font-black text-white">Ver</span>
            <ChevronRight size={11} className="text-white" />
          </div>
        </div>

        {/* Strip */}
        <div className="relative z-10 flex items-center justify-between px-5 py-2 border-t border-white/10"
          style={{ background: 'rgba(0,0,0,0.10)' }}>
          <span className="text-[8px] font-bold text-white/50">
            📸 Galeria · 🏆 Conquistas · 🧠 Histórico de Saúde
          </span>
          <div className="flex items-center gap-1">
            <QrCode size={9} className="text-white/50" />
            <span className="text-[8px] font-black text-white/50">QR</span>
          </div>
        </div>
      </motion.button>

      {/* ══ 2. BIO + PERSONALIDADE ════════════════════════════════════════ */}
      {(cat?.bio || cat?.personality?.length > 0) && (
        <section className="bg-white rounded-[22px] px-5 py-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Sobre</p>
            <button onClick={() => setIsEditOpen(true)}
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: `${themeColor}15` }}>
              <Edit3 size={12} style={{ color: themeColor }} />
            </button>
          </div>
          {cat?.bio && (
            <p className="text-sm text-gray-600 leading-relaxed font-medium mb-3">"{cat.bio}"</p>
          )}
          {cat?.personality?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {cat.personality.map(p => (
                <span key={p} className="text-[9px] font-black px-2.5 py-1 rounded-full"
                  style={{ background: `${themeColor}12`, color: themeColor, border: `1px solid ${themeColor}25` }}>
                  {p}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ══ 3. DIÁRIO RECENTE ════════════════════════════════════════════ */}
      <section className="bg-white rounded-[22px] overflow-hidden shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[10px] flex items-center justify-center"
              style={{ background: `${themeColor}15` }}>
              <BookOpen size={13} style={{ color: themeColor }} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-700 leading-none">Diário</p>
              <p className="text-[8px] text-gray-400 font-bold">Últimos registros</p>
            </div>
          </div>
          <button onClick={() => navigate(`/cat/${cat.id}/diary`)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black"
            style={{ background: `${themeColor}12`, color: themeColor }}>
            <Plus size={10} /> Novo dia
          </button>
        </div>

        <div className="px-4 pb-4 space-y-2">
          {diaryLoading ? (
            <div className="py-4 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: `${themeColor}30`, borderTopColor: themeColor }} />
            </div>
          ) : diary.length > 0 ? (
            <>
              {diary.map(e => <DiaryCard key={e.id} entry={e} />)}
              <button onClick={() => navigate(`/cat/${cat.id}/diary`)}
                className="w-full pt-2 text-center text-[9px] font-black"
                style={{ color: themeColor }}>
                Ver histórico completo →
              </button>
            </>
          ) : (
            <div className="py-5 flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">📔</span>
              <p className="text-xs font-black text-gray-400">Nenhum registro ainda</p>
              <p className="text-[9px] text-gray-300 font-medium">
                Registre o humor e hábitos do {cat?.name} diariamente
              </p>
              <button onClick={() => navigate(`/cat/${cat.id}/diary`)}
                className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-black"
                style={{ background: themeColor, color: 'white' }}>
                <Plus size={12} /> Começar diário
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══ 4. ATRIBUTOS RPG ════════════════════════════════════════════ */}
      <section className="bg-white rounded-[22px] overflow-hidden shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[10px] flex items-center justify-center"
              style={{ background: `${themeColor}15` }}>
              <Star size={13} style={{ color: themeColor }} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-700 leading-none">Atributos</p>
              <p className="text-[8px] text-gray-400 font-bold">Personalidade em dados</p>
            </div>
          </div>
          <button onClick={() => setIsEditOpen(true)}
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: `${themeColor}15` }}>
            <Edit3 size={12} style={{ color: themeColor }} />
          </button>
        </div>

        {/* Destaque: maior skill */}
        <div className="mx-4 mb-3 px-4 py-3 rounded-[16px] flex items-center gap-3"
          style={{ background: `${topSkill.hex}10`, border: `1px solid ${topSkill.hex}25` }}>
          <div className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0"
            style={{ background: `${topSkill.hex}18` }}>
            <topSkill.icon size={20} style={{ color: topSkill.hex }} />
          </div>
          <div className="flex-1">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Ponto forte</p>
            <p className="text-sm font-black leading-none mt-0.5" style={{ color: topSkill.hex }}>
              {topSkill.label}
            </p>
          </div>
          <p className="text-2xl font-black" style={{ color: topSkill.hex }}>{topVal}%</p>
        </div>

        {/* Todas as skills */}
        <div className="px-4 pb-4 space-y-3">
          {SKILL_DEFS.map(s => <SkillBar key={s.id} skill={s} cat={cat} />)}
        </div>
      </section>

      {/* Modal edição */}
      <AnimatePresence>
        {isEditOpen && (
          <EditBioModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)}
            cat={cat} onSave={refreshCat} />
        )}
      </AnimatePresence>
    </div>
  );
}