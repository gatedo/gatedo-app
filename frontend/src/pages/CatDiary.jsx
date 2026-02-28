/**
 * CatDiary.jsx — v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Diário do gato. Duas views:
 *   HISTÓRICO — lista entradas com stats de streak + distribuição de humor
 *   NOVO DIA  — humor + checklist + nota + XP ao salvar
 *
 * Integra com GamificationContext (earnXP) e api.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Flame, Check, Droplets, Utensils,
  Smile, Frown, Meh, Zap, Trash2, PenTool,
  BookOpen, Plus, Calendar, BarChart2, ChevronRight,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import useSensory from '../hooks/useSensory';
import api from '../services/api';

// ─── tenta importar gamification — silencioso se não disponível ───────────────
let useGamification = () => ({ earnXP: () => {}, incrementStat: () => {} });
try { ({ useGamification } = require('../context/GamificationContext')); } catch {}

const C = { primary: '#6158ca', accent: '#DFFF40' };

const MOODS = [
  { id: 'happy',   label: 'Feliz',    emoji: '😸', hex: '#16A34A', bg: '#F0FDF4', icon: Smile },
  { id: 'sleepy',  label: 'Preguiça', emoji: '😴', hex: '#2563EB', bg: '#EFF6FF', icon: Meh   },
  { id: 'zoomies', label: 'Zoomies',  emoji: '⚡', hex: '#D97706', bg: '#FFFBEB', icon: Zap   },
  { id: 'spicy',   label: 'Bravo',    emoji: '😾', hex: '#DC2626', bg: '#FFF5F5', icon: Frown },
];

const HABITS = [
  { id: 'Agua',     label: 'Água Fresca', emoji: '💧', icon: Droplets },
  { id: 'Banheiro', label: 'Caixa Limpa', emoji: '🪣', icon: Trash2  },
  { id: 'Comida',   label: 'Alimentou',   emoji: '🍽️', icon: Utensils },
  { id: 'Brincou',  label: 'Brincou',     emoji: '⚡', icon: Zap     },
];

const XP_REWARD = 50;

// ─── helpers ──────────────────────────────────────────────────────────────────
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

function calcStreak(entries) {
  if (!entries?.length) return 0;
  const dates = [...new Set(entries.map(e => new Date(e.date).toDateString()))]
    .sort((a, b) => new Date(b) - new Date(a));
  let streak = 0, expected = new Date();
  expected.setHours(0,0,0,0);
  for (const ds of dates) {
    const d = new Date(ds);
    if (Math.round((expected - d) / 86400000) <= 1) { streak++; expected = d; }
    else break;
  }
  return streak;
}

// ─── entry card ───────────────────────────────────────────────────────────────
function EntryCard({ entry }) {
  const m      = MOODS.find(x => x.id === entry.type) || MOODS[0];
  const habits = entry.content?.match(/Checklist: (.+?)\./)?.[1]?.split(', ') || [];
  const note   = entry.content?.replace(/Checklist: .+?\.\n?/, '').trim();
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-[18px] border"
      style={{ background: m.bg, borderColor: `${m.hex}20` }}>
      <div className="w-9 h-9 rounded-[14px] flex items-center justify-center text-lg flex-shrink-0 bg-white border"
        style={{ borderColor: `${m.hex}25` }}>{m.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-black" style={{ color: m.hex }}>{m.label}</span>
          <span className="text-[9px] text-gray-400 font-bold">{fmtDate(entry.date)}</span>
        </div>
        {habits.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-0.5">
            {habits.slice(0, 3).map(h => (
              <span key={h} className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-white/70 text-gray-500">{h}</span>
            ))}
            {habits.length > 3 && <span className="text-[7px] text-gray-400">+{habits.length-3}</span>}
          </div>
        )}
        {note
          ? <p className="text-[9px] text-gray-500 font-medium truncate">{note}</p>
          : <p className="text-[9px] text-gray-400 italic">Sem anotações</p>
        }
      </div>
    </div>
  );
}

// ─── view: histórico ──────────────────────────────────────────────────────────
function HistoryView({ catId, catName, catColor }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const streak = calcStreak(entries);

  useEffect(() => {
    api.get(`/diary-entries?petId=${catId}&limit=60`)
      .then(r => setEntries(Array.isArray(r.data) ? r.data : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [catId]);

  const counts = MOODS.map(m => ({ ...m, count: entries.filter(e => e.type === m.id).length }));
  const dominant = [...counts].sort((a,b) => b.count - a.count)[0];
  const filtered = filter === 'all' ? entries : entries.filter(e => e.type === filter);

  return (
    <div className="flex-1 overflow-y-auto pb-8">
      {/* Stats */}
      <div className="px-5 pt-4 pb-3 grid grid-cols-3 gap-2">
        <div className="bg-white rounded-[18px] p-3 border border-gray-100 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1 mb-0.5">
            <Flame size={13} className={streak > 0 ? 'text-orange-500 fill-orange-400' : 'text-gray-300'} />
            <span className="text-xl font-black text-gray-800">{streak}</span>
          </div>
          <p className="text-[8px] text-gray-400 font-black uppercase">Streak</p>
        </div>
        <div className="bg-white rounded-[18px] p-3 border border-gray-100 text-center shadow-sm">
          <span className="text-xl font-black text-gray-800 block mb-0.5">{entries.length}</span>
          <p className="text-[8px] text-gray-400 font-black uppercase">Registros</p>
        </div>
        <div className="rounded-[18px] p-3 border text-center shadow-sm"
          style={{ background: dominant?.count > 0 ? dominant.bg : '#F9FAFB',
                   borderColor: dominant?.count > 0 ? `${dominant.hex}25` : '#E5E7EB' }}>
          <span className="text-xl block mb-0.5">{dominant?.count > 0 ? dominant.emoji : '—'}</span>
          <p className="text-[8px] font-black uppercase"
            style={{ color: dominant?.count > 0 ? dominant.hex : '#9CA3AF' }}>
            {dominant?.count > 0 ? dominant.label : 'Nenhum'}
          </p>
        </div>
      </div>

      {/* Gráfico de barras */}
      {entries.length > 0 && (
        <div className="mx-5 mb-3 bg-white rounded-[18px] p-4 border border-gray-100 shadow-sm">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <BarChart2 size={10} /> Distribuição de humor
          </p>
          <div className="space-y-2">
            {counts.map(m => (
              <div key={m.id} className="flex items-center gap-2">
                <span className="text-sm w-5">{m.emoji}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: entries.length > 0 ? `${(m.count / entries.length) * 100}%` : '0%' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: m.hex }}
                  />
                </div>
                <span className="text-[9px] font-black text-gray-400 w-4 text-right">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtro de humor */}
      <div className="flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-hide">
        <button onClick={() => setFilter('all')}
          className="px-3 py-1.5 rounded-full text-[9px] font-black flex-shrink-0"
          style={filter === 'all'
            ? { background: catColor, color: 'white' }
            : { background: '#F4F3FF', color: '#6B7280' }}>
          ✨ Todos
        </button>
        {MOODS.map(m => (
          <button key={m.id} onClick={() => setFilter(m.id)}
            className="px-3 py-1.5 rounded-full text-[9px] font-black flex-shrink-0"
            style={filter === m.id
              ? { background: m.hex, color: 'white' }
              : { background: m.bg, color: m.hex }}>
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="px-5 space-y-2">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${catColor}30`, borderTopColor: catColor }} />
            <p className="text-xs text-gray-400 font-bold">Carregando...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(e => <EntryCard key={e.id} entry={e} />)
        ) : (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">{filter === 'all' ? '📔' : MOODS.find(m => m.id === filter)?.emoji}</span>
            <p className="text-sm font-black text-gray-400">Nenhum registro ainda</p>
            <p className="text-[10px] text-gray-300 max-w-[180px]">
              Registre o humor de {catName} diariamente para construir o histórico
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── view: novo registro ──────────────────────────────────────────────────────
function NewEntryView({ catId, catName, catColor, draftRef }) {
  const [mood,    setMood]    = useState('happy');
  const [habits,  setHabits]  = useState([]);
  const [note,    setNote]    = useState('');
  const touch = useSensory();

  const toggle = (id) => {
    touch('tap');
    setHabits(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const progress = (habits.length / HABITS.length) * 100;
  const currentMood = MOODS.find(m => m.id === mood);

  // Mantém draft no ref para o botão fixo acessar
  useEffect(() => {
    const habitsText = habits.length > 0
      ? `Checklist: ${habits.map(h => HABITS.find(r => r.id === h)?.label).join(', ')}.`
      : '';
    const fullContent = [habitsText, note].filter(Boolean).join('\n').trim();
    draftRef.current = {
      petId: catId,
      title: `Dia ${MOODS.find(m => m.id === mood)?.label}`,
      content: fullContent || 'Sem anotações.',
      type: mood,
      date: new Date(),
    };
  }, [mood, habits, note, catId]);

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-4 pb-40 space-y-5">

      {/* Data */}
      <div className="flex items-center gap-2">
        <Calendar size={13} className="text-gray-400" />
        <span className="text-xs font-black text-gray-400">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </span>
      </div>

      {/* Humor */}
      <section>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Smile size={13} style={{ color: catColor }} />
          Como {catName} está hoje?
        </p>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map(m => {
            const sel = mood === m.id;
            return (
              <motion.button key={m.id} whileTap={{ scale: 0.88 }}
                onClick={() => { setMood(m.id); touch(); }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-[20px] border-2 transition-all"
                style={sel
                  ? { background: m.bg, borderColor: m.hex, boxShadow: `0 4px 14px ${m.hex}30` }
                  : { background: '#F9FAFB', borderColor: 'transparent', opacity: 0.55 }
                }>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: sel ? 'white' : '#EFEFEF' }}>
                  {m.emoji}
                </div>
                <span className="text-[8px] font-black" style={{ color: sel ? m.hex : '#9CA3AF' }}>
                  {m.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Checklist */}
      <section className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm relative">
        <div className="absolute top-0 left-0 h-1 w-full bg-gray-100">
          <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }}
            className="h-full rounded-full" style={{ background: C.accent }} />
        </div>
        <div className="p-5 pt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Check size={13} style={{ color: catColor }} /> Checklist do dia
            </p>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${catColor}12`, color: catColor }}>
              {habits.length}/{HABITS.length}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {HABITS.map(h => {
              const done = habits.includes(h.id);
              return (
                <motion.button key={h.id} whileTap={{ scale: 0.96 }} onClick={() => toggle(h.id)}
                  className="p-3 rounded-[18px] flex items-center gap-2.5 border-2 transition-all"
                  style={done
                    ? { background: '#DFFF4018', borderColor: '#DFFF40', boxShadow: '0 2px 8px #DFFF4025' }
                    : { background: '#F9FAFB', borderColor: 'transparent' }
                  }>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: done ? '#DFFF40' : '#F0F0F0' }}>
                    {h.emoji}
                  </div>
                  <span className="text-[11px] font-bold" style={{ color: done ? '#374151' : '#9CA3AF' }}>
                    {h.label}
                  </span>
                  {done && <Check size={11} className="ml-auto flex-shrink-0" style={{ color: catColor }} />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Nota */}
      <section className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
          <PenTool size={13} style={{ color: catColor }} /> Observações
        </p>
        <textarea rows={3}
          placeholder={`Algo especial que ${catName} fez hoje?`}
          className="w-full text-sm font-medium text-gray-700 outline-none bg-transparent resize-none placeholder-gray-300"
          value={note} onChange={e => setNote(e.target.value)}
        />
      </section>

      {/* Preview da entrada */}
      <AnimatePresence>
        {(habits.length > 0 || note) && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-[16px] p-3.5 border flex items-center gap-3"
            style={{ background: currentMood?.bg, borderColor: `${currentMood?.hex}25` }}>
            <span className="text-2xl">{currentMood?.emoji}</span>
            <div>
              <p className="text-xs font-black" style={{ color: currentMood?.hex }}>
                {currentMood?.label}
                {habits.length > 0 && ` · ${habits.length} hábito${habits.length > 1 ? 's' : ''}`}
              </p>
              {note && <p className="text-[9px] text-gray-500 truncate">{note}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function CatDiary() {
  const navigate = useNavigate();
  const { id }   = useParams();
  const touch    = useSensory();
  const { earnXP, incrementStat } = useGamification();

  const [view,      setView]      = useState('history');
  const [catName,   setCatName]   = useState('');
  const [catColor,  setCatColor]  = useState(C.primary);
  const [loading,   setLoading]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [refresh,   setRefresh]   = useState(0);
  const draftRef = useRef(null);

  useEffect(() => {
    api.get(`/pets/${id}`)
      .then(r => {
        setCatName(r.data?.name || 'seu gato');
        const t = r.data?.themeColor;
        if (t?.startsWith('#')) setCatColor(t);
      })
      .catch(() => {});
  }, [id]);

  const handleSave = async () => {
    const draft = draftRef.current;
    if (!draft) return;
    setLoading(true);
    touch('success');
    try {
      await api.post('/diary-entries', draft);
      earnXP(XP_REWARD, 'Diário registrado');
      incrementStat('diaryCount');
      draftRef.current = null;
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setView('history');
        setRefresh(r => r + 1);
        touch('success');
      }, 1200);
    } catch {
      alert('Erro ao salvar diário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#F8F9FE' }}>

      {/* HEADER */}
      <div className="bg-white pt-10 pb-4 px-5 rounded-b-[32px] shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { touch(); view === 'new' ? setView('history') : navigate(-1); }}
            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-gray-800">Diário</h1>
            {catName && <p className="text-[10px] text-gray-400 font-bold">{catName}</p>}
          </div>
          {/* Streak badge no header */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full"
            style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <Flame size={13} className="text-orange-500 fill-orange-400" />
            <span className="text-xs font-black text-orange-600">
              {calcStreak([])}d
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'history', label: '📔 Histórico' },
            { id: 'new',     label: '✏️ Novo Dia'  },
          ].map(tab => (
            <button key={tab.id} onClick={() => setView(tab.id)}
              className="flex-1 py-2.5 rounded-[16px] text-xs font-black transition-all"
              style={view === tab.id
                ? { background: catColor, color: 'white', boxShadow: `0 4px 16px ${catColor}40` }
                : { background: '#F4F3FF', color: '#6B7280' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* XP hint quando na tela novo */}
      {view === 'new' && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="mx-5 mt-3 px-4 py-2 rounded-[14px] flex items-center gap-2"
          style={{ background: '#DFFF4012', border: '1px solid #DFFF4040' }}>
          <Zap size={12} fill={C.accent} style={{ color: catColor }} />
          <p className="text-[10px] font-black" style={{ color: catColor }}>
            +{XP_REWARD} XP ao salvar o registro de hoje
          </p>
        </motion.div>
      )}

      {/* Views */}
      <AnimatePresence mode="wait">
        {view === 'history' ? (
          <motion.div key={`hist-${refresh}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col">
            <HistoryView catId={id} catName={catName} catColor={catColor} />
          </motion.div>
        ) : (
          <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col">
            <NewEntryView catId={id} catName={catName} catColor={catColor} draftRef={draftRef} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão salvar fixo — só na tela novo */}
      <AnimatePresence>
        {view === 'new' && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-24 left-0 right-0 px-5 z-20"
          >
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleSave}
              disabled={loading || saved}
              className="w-full py-4 rounded-[24px] font-black text-base shadow-xl flex items-center justify-center gap-2 text-white"
              style={{
                background: saved ? '#16A34A' : `linear-gradient(135deg, ${catColor}, ${catColor}CC)`,
                boxShadow: `0 8px 28px ${catColor}45`,
                opacity: loading ? 0.85 : 1,
              }}
            >
              {saved ? (
                <><Check size={20} /> Salvo! +{XP_REWARD} XP 🎉</>
              ) : loading ? (
                'Salvando...'
              ) : (
                <><Zap size={17} fill="white" /> Salvar o Dia · +{XP_REWARD} XP</>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}