/**
 * CatDiary.jsx — v4
 * ─────────────────────────────────────────────────────────────────────────────
 * Diário do gato:
 *   HISTÓRICO — lista entradas com streak + distribuição de humor
 *   NOVO DIA  — humor + checklist + nota + ganho XPG/XPT
 *
 * Regras atuais:
 * - Humor e nota são individuais do gato
 * - Checklist pode ser marcado como rotina compartilhada do lar
 * - Front exibe +5 XPG gato / +5 XPT tutor
 * - Se a premiação falhar, o diário continua salvo
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Flame,
  Check,
  Droplets,
  Utensils,
  Smile,
  Frown,
  Zap,
  Trash2,
  PenTool,
  Calendar,
  BarChart2,
  Sparkles,
  Heart,
  ShieldCheck,
  MoonStar,
  PawPrint,
  Cat,
  Shield,
  X,
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import useSensory from '../hooks/useSensory';
import api from '../services/api';

// ─── tenta importar gamification — silencioso se não disponível ───────────────
let useGamification = () => ({ earnXP: () => {}, incrementStat: () => {} });
try {
  ({ useGamification } = require('../context/GamificationContext'));
} catch {}

const C = { primary: '#8B4AFF', accent: '#DFFF40' };

const CAT_MOODS = [
  {
    id: 'happy',
    label: 'Feliz',
    emoji: '😸',
    hex: '#16A34A',
    bg: '#F0FDF4',
    icon: Smile,
    sub: 'carinhoso e leve',
  },
  {
    id: 'cuddly',
    label: 'Grudento',
    emoji: '🥹',
    hex: '#EC4899',
    bg: '#FDF2F8',
    icon: Heart,
    sub: 'querendo colo',
  },
  {
    id: 'sleepy',
    label: 'Sonolento',
    emoji: '😴',
    hex: '#2563EB',
    bg: '#EFF6FF',
    icon: MoonStar,
    sub: 'mais quietinho',
  },
  {
    id: 'zoomies',
    label: 'Arteiro',
    emoji: '😼',
    hex: '#D97706',
    bg: '#FFFBEB',
    icon: Zap,
    sub: 'correndo pela casa',
  },
  {
    id: 'curious',
    label: 'Curioso',
    emoji: '🧐',
    hex: '#7C3AED',
    bg: '#F5F3FF',
    icon: Sparkles,
    sub: 'explorando tudo',
  },
  {
    id: 'spicy',
    label: 'Arisco',
    emoji: '😾',
    hex: '#DC2626',
    bg: '#FFF5F5',
    icon: Frown,
    sub: 'mais reativo hoje',
  },
];

const HABITS = [
  { id: 'Agua', label: 'Água fresca', emoji: '💧', icon: Droplets, sub: 'água limpa disponível' },
  { id: 'Banheiro', label: 'Caixa limpa', emoji: '🪣', icon: Trash2, sub: 'caixa higienizada' },
  { id: 'Comida', label: 'Alimentação', emoji: '🍽️', icon: Utensils, sub: 'refeição em dia' },
  { id: 'Brincou', label: 'Brincadeira', emoji: '🧶', icon: Zap, sub: 'estímulo e movimento' },
  { id: 'Carinho', label: 'Afeto', emoji: '🤍', icon: Heart, sub: 'contato e vínculo' },
  { id: 'Observado', label: 'Observação', emoji: '👀', icon: ShieldCheck, sub: 'rotina monitorada' },
];

const TUTOR_XPT = 5;
const CAT_XPG = 5;

// ─── helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '';
  try {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff < 7) return `${diff}d atrás`;
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  } catch {
    return '';
  }
}

function calcStreak(entries) {
  if (!entries?.length) return 0;

  const dates = [...new Set(entries.map((e) => new Date(e.date).toDateString()))].sort(
    (a, b) => new Date(b) - new Date(a)
  );

  let streak = 0;
  let expected = new Date();
  expected.setHours(0, 0, 0, 0);

  for (const ds of dates) {
    const d = new Date(ds);
    const diff = Math.round((expected.getTime() - d.getTime()) / 86400000);

    if (diff <= 1) {
      streak++;
      expected = d;
    } else {
      break;
    }
  }

  return streak;
}

function parseDiaryContent(content = '') {
  const checklistMatch = content.match(/Checklist: (.+?)\./);
  const habits = checklistMatch?.[1]?.split(', ') || [];
  const shared = content.includes('[ROTINA_COMPARTILHADA]');
  const note = content
    .replace(/\[ROTINA_COMPARTILHADA\]\n?/g, '')
    .replace(/Checklist: .+?\.\n?/g, '')
    .trim();

  return { habits, note, shared };
}

function getCurrentUserId() {
  const possibleKeys = [
    'gatedo_user',
    'user',
    'auth_user',
    'gatedoUser',
  ];

  function isSameDay(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed?.id) return parsed.id;
      if (parsed?.user?.id) return parsed.user.id;
    } catch {}
  }

  return null;
}

// ─── avatar fallback ──────────────────────────────────────────────────────────
function CatAvatar({ src, alt, color, size = 'w-11 h-11', rounded = 'rounded-[14px]' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${size} ${rounded} flex items-center justify-center border shadow-sm`}
        style={{ background: `${color}12`, borderColor: `${color}20` }}
      >
        <Cat size={20} style={{ color }} />
      </div>
    );
  }

  return (
    <div className={`${size} ${rounded} overflow-hidden bg-gray-100 border border-gray-200 shadow-sm`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// ─── entry card ───────────────────────────────────────────────────────────────
function EntryCard({ entry }) {
  const mood = CAT_MOODS.find((x) => x.id === entry.type) || CAT_MOODS[0];
  const { habits, note, shared } = parseDiaryContent(entry.content);
  

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-[18px] border"
      style={{ background: mood.bg, borderColor: `${mood.hex}20` }}
    >
      <div
        className="w-10 h-10 rounded-[14px] flex items-center justify-center text-lg flex-shrink-0 bg-white border"
        style={{ borderColor: `${mood.hex}25` }}
      >
        {mood.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[11px] font-black" style={{ color: mood.hex }}>
            {mood.label}
          </span>
          <span className="text-[9px] text-gray-400 font-bold">{fmtDate(entry.date)}</span>
          {shared && (
            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-white/70 text-gray-500">
              rotina do lar
            </span>
          )}
        </div>

        {habits.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-1">
            {habits.slice(0, 4).map((h) => (
              <span
                key={h}
                className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-white/70 text-gray-500"
              >
                {h}
              </span>
            ))}
            {habits.length > 4 && <span className="text-[7px] text-gray-400">+{habits.length - 4}</span>}
          </div>
        )}

        {note ? (
          <p className="text-[9px] text-gray-500 font-medium truncate">{note}</p>
        ) : (
          <p className="text-[9px] text-gray-400 italic">Sem anotações</p>
        )}
      </div>
    </div>
  );
}

// ─── view: histórico ──────────────────────────────────────────────────────────
function HistoryView({ catId, catName, catColor, onEntriesChange }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const streak = calcStreak(entries);

  useEffect(() => {
    api
      .get(`/diary-entries?petId=${catId}&limit=60`)
      .then((r) => {
        const data = Array.isArray(r.data) ? r.data : [];
        setEntries(data);
        onEntriesChange?.(data);
      })
      .catch(() => {
        setEntries([]);
        onEntriesChange?.([]);
      })
      .finally(() => setLoading(false));
  }, [catId, onEntriesChange]);

  const counts = CAT_MOODS.map((m) => ({
    ...m,
    count: entries.filter((e) => e.type === m.id).length,
  }));

  const dominant = [...counts].sort((a, b) => b.count - a.count)[0];
  const filtered = filter === 'all' ? entries : entries.filter((e) => e.type === filter);

  return (
    <div className="flex-1 overflow-y-auto pb-[200px]">
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

        <div
          className="rounded-[18px] p-3 border text-center shadow-sm"
          style={{
            background: dominant?.count > 0 ? dominant.bg : '#F9FAFB',
            borderColor: dominant?.count > 0 ? `${dominant.hex}25` : '#E5E7EB',
          }}
        >
          <span className="text-xl block mb-0.5">{dominant?.count > 0 ? dominant.emoji : '—'}</span>
          <p
            className="text-[8px] font-black uppercase"
            style={{ color: dominant?.count > 0 ? dominant.hex : '#9CA3AF' }}
          >
            {dominant?.count > 0 ? dominant.label : 'Nenhum'}
          </p>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="mx-5 mb-3 bg-white rounded-[18px] p-4 border border-gray-100 shadow-sm">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <BarChart2 size={10} /> Distribuição de humor
          </p>

          <div className="space-y-2">
            {counts.map((m) => (
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

      <div className="flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-hide">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className="px-3 py-1.5 rounded-full text-[9px] font-black flex-shrink-0"
          style={filter === 'all' ? { background: catColor, color: 'white' } : { background: '#F4F3FF', color: '#6B7280' }}
        >
          ✨ Todos
        </button>

        {CAT_MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setFilter(m.id)}
            className="px-3 py-1.5 rounded-full text-[9px] font-black flex-shrink-0"
            style={filter === m.id ? { background: m.hex, color: 'white' } : { background: m.bg, color: m.hex }}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      <div className="px-5 space-y-2">
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3">
            <div
              className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${catColor}30`, borderTopColor: catColor }}
            />
            <p className="text-xs text-gray-400 font-bold">Carregando...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((e) => <EntryCard key={e.id} entry={e} />)
        ) : (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">{filter === 'all' ? '📔' : CAT_MOODS.find((m) => m.id === filter)?.emoji}</span>
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

function isSameDay(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── view: novo registro ──────────────────────────────────────────────────────
function NewEntryView({ catId, catName, catColor, catPhoto, draftRef }) {
  const [mood, setMood] = useState('happy');
  const [habits, setHabits] = useState([]);
  const [note, setNote] = useState('');
  const [sharedChecklist, setSharedChecklist] = useState(false);
  const touch = useSensory();

  const toggle = (id) => {
    touch('tap');
    setHabits((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const progress = (habits.length / HABITS.length) * 100;
  const currentMood = CAT_MOODS.find((m) => m.id === mood);

  useEffect(() => {
    const habitsText =
      habits.length > 0
        ? `Checklist: ${habits.map((h) => HABITS.find((r) => r.id === h)?.label).join(', ')}.`
        : '';

    const flags = [sharedChecklist ? '[ROTINA_COMPARTILHADA]' : ''].filter(Boolean).join('\n');
    const fullContent = [flags, habitsText, note].filter(Boolean).join('\n').trim();

    draftRef.current = {
      petId: catId,
      title: `Dia ${currentMood?.label}`,
      content: fullContent || 'Sem anotações.',
      type: mood,
      date: new Date(),
      meta: {
        sharedChecklist,
        habits,
        reward: { xpg: CAT_XPG, xpt: TUTOR_XPT },
      },
    };
  }, [mood, habits, note, catId, sharedChecklist, currentMood, draftRef]);

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-4 pb-[200px] space-y-5">
      <div className="flex items-center gap-3">
        <CatAvatar src={catPhoto} alt={catName} color={catColor} size="w-12 h-12" rounded="rounded-[16px]" />

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar size={13} />
            <span className="text-xs font-black">
              {new Date().toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
              })}
            </span>
          </div>
          <p className="text-[13px] font-black text-gray-700 mt-1 truncate">
            Livro de vida de {catName}
          </p>
        </div>
      </div>

      <section>
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
          <Cat size={13} style={{ color: catColor }} />
          Como {catName} está hoje?
        </p>

        <div className="grid grid-cols-3 gap-2">
          {CAT_MOODS.map((m) => {
            const sel = mood === m.id;
            return (
              <motion.button
                key={m.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  setMood(m.id);
                  touch();
                }}
                className="flex flex-col items-center gap-1.5 py-3 rounded-[20px] border-2 transition-all"
                style={
                  sel
                    ? { background: m.bg, borderColor: m.hex, boxShadow: `0 4px 14px ${m.hex}30` }
                    : { background: '#F9FAFB', borderColor: 'transparent', opacity: 0.72 }
                }
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-2xl"
                  style={{ background: sel ? 'white' : '#EFEFEF' }}
                >
                  {m.emoji}
                </div>
                <span className="text-[8px] font-black text-center" style={{ color: sel ? m.hex : '#9CA3AF' }}>
                  {m.label}
                </span>
                <span className="text-[7px] font-bold text-gray-400 text-center px-1">{m.sub}</span>
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm relative">
        <div className="absolute top-0 left-0 h-1 w-full bg-gray-100">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full rounded-full"
            style={{ background: C.accent }}
          />
        </div>

        <div className="p-5 pt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-wide flex items-center gap-2">
              <Check size={13} style={{ color: catColor }} />
              Checklist do dia
            </p>

            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ background: `${catColor}12`, color: catColor }}
            >
              {habits.length}/{HABITS.length}
            </span>
          </div>

          <div className="mb-4 rounded-[18px] border border-gray-100 bg-[#FAFBFF] px-3 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-gray-700 uppercase tracking-wide">
                Rotina compartilhada do lar
              </p>
              <p className="text-[9px] text-gray-400 font-bold mt-1">
                Use quando esse cuidado vale para todos os gatos do tutor
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSharedChecklist((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                sharedChecklist ? '' : 'bg-gray-200'
              }`}
              style={sharedChecklist ? { background: catColor } : undefined}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                  sharedChecklist ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {HABITS.map((h) => {
              const done = habits.includes(h.id);
              return (
                <motion.button
                  key={h.id}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => toggle(h.id)}
                  className="min-w-[152px] p-3 rounded-[18px] flex items-start gap-2.5 border-2 transition-all text-left"
                  style={
                    done
                      ? { background: '#DFFF4018', borderColor: '#DFFF40', boxShadow: '0 2px 8px #DFFF4025' }
                      : { background: '#F9FAFB', borderColor: 'transparent' }
                  }
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: done ? '#DFFF40' : '#F0F0F0' }}
                  >
                    {h.emoji}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black" style={{ color: done ? '#374151' : '#6B7280' }}>
                      {h.label}
                    </p>
                    <p className="text-[9px] font-medium text-gray-400 mt-0.5">{h.sub}</p>
                  </div>

                  {done && <Check size={11} className="flex-shrink-0 mt-0.5" style={{ color: catColor }} />}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-2">
          <PenTool size={13} style={{ color: catColor }} />
          Observações
        </p>

        <textarea
          rows={4}
          placeholder={`Algo especial que ${catName} fez hoje? Algum detalhe que merece ficar guardado?`}
          className="w-full text-sm font-medium text-gray-700 outline-none bg-transparent resize-none placeholder-gray-300"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </section>

      <AnimatePresence>
        {(habits.length > 0 || note) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-[16px] p-3.5 border flex items-center gap-3"
            style={{ background: currentMood?.bg, borderColor: `${currentMood?.hex}25` }}
          >
            <span className="text-2xl">{currentMood?.emoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-black" style={{ color: currentMood?.hex }}>
                {currentMood?.label}
                {habits.length > 0 && ` · ${habits.length} cuidado${habits.length > 1 ? 's' : ''}`}
                {sharedChecklist && ' · rotina do lar'}
              </p>
              {note ? <p className="text-[9px] text-gray-500 truncate">{note}</p> : null}
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
  const location = useLocation();
  const { id } = useParams();
  const touch = useSensory();
  const { earnXP, incrementStat } = useGamification();
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);

  const [view, setView] = useState('history');
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(C.primary);
  const [catPhoto, setCatPhoto] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [entries, setEntries] = useState([]);
  const draftRef = useRef(null);

  useEffect(() => {
    api
      .get(`/pets/${id}`)
      .then((r) => {
        setCatName(r.data?.name || 'seu gato');
        setCatPhoto(r.data?.photoUrl || '');
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
    const existingRes = await api.get(`/diary-entries?petId=${id}&limit=60`);
    const existingEntries = Array.isArray(existingRes.data) ? existingRes.data : [];

    const todayEntry = existingEntries.find((entry) => isSameDay(entry.date, new Date()));

    if (todayEntry?.id) {
      setDuplicateModalOpen(true);
      setLoading(false);
      return;
    }

    await api.post('/diary-entries', draft);

    const userId = getCurrentUserId();

    if (userId && id) {
      try {
        await api.post('/gamification/award-care', {
          userId,
          petId: id,
          tutorXp: TUTOR_XPT,
          petXp: CAT_XPG,
          reason: 'DIARY_ENTRY',
          meta: {
            sharedChecklist: Boolean(draft?.meta?.sharedChecklist),
            habits: draft?.meta?.habits || [],
            diaryType: draft?.type || null,
          },
        });
      } catch (xpErr) {
        console.warn('Diário salvo, mas premiação não aplicada:', xpErr);
        try {
          earnXP?.(TUTOR_XPT, 'Diário do tutor registrado');
          incrementStat?.('diaryCount');
        } catch {}
      }
    } else {
      try {
        earnXP?.(TUTOR_XPT, 'Diário do tutor registrado');
        incrementStat?.('diaryCount');
      } catch {}
    }

    draftRef.current = null;
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
      setView('history');
      setRefresh((r) => r + 1);
      touch('success');
    }, 1100);
  } catch (err) {
    console.error('Erro ao salvar diário:', err);
    alert('Erro ao salvar diário.');
  } finally {
    setLoading(false);
  }
};

  const streak = calcStreak(entries);

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#F8F9FE' }}>
      <div className="bg-white pt-10 pb-4 px-5 rounded-b-[32px] shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between mb-4 gap-3">
          <button
            type="button"
            onClick={() => {
              touch();

              if (view === 'new') {
                setView('history');
                return;
              }

              const returnTo = location.state?.returnTo || `/cat/${id}`;
              const restoreTab = location.state?.restoreTab || 'BIO';

              navigate(returnTo, {
                replace: true,
                state: {
                  restoreTab,
                  source: 'cat-diary-back',
                },
              });
            }}
            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>

          <div className="flex items-center gap-3 min-w-0 flex-1">
            <CatAvatar src={catPhoto} alt={catName} color={catColor} />

            <div className="min-w-0">
              <h1 className="text-lg font-black text-gray-800 leading-none">Diário</h1>
              {catName && <p className="text-[10px] text-gray-400 font-bold truncate">{catName}</p>}
            </div>
          </div>

          <div
            className="flex items-center gap-1 px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: '#FFF7ED', border: '1px solid #FED7AA' }}
          >
            <Flame size={13} className={streak > 0 ? 'text-orange-500 fill-orange-400' : 'text-gray-300'} />
            <span className="text-xs font-black text-orange-600">{streak}d</span>
          </div>
        </div>

        <div className="flex gap-2">
          {[
            { id: 'history', label: '📔 Histórico' },
            { id: 'new', label: '✏️ Novo Dia' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className="flex-1 py-2.5 rounded-[16px] text-xs font-black transition-all"
              style={
                view === tab.id
                  ? { background: catColor, color: 'white', boxShadow: `0 4px 16px ${catColor}40` }
                  : { background: '#F4F3FF', color: '#6B7280' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'new' && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-5 mt-3 px-4 py-2 rounded-[14px] flex items-center gap-2"
          style={{ background: '#DFFF4012', border: '1px solid #DFFF4040' }}
        >
          <PawPrint size={12} style={{ color: catColor }} />
          <p className="text-[10px] font-black text-gray-700">
            <span style={{ color: catColor }}>+{CAT_XPG} XPG</span> para o gato ·{' '}
            <span style={{ color: catColor }}>+{TUTOR_XPT} XPT</span> para o tutor
          </p>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {view === 'history' ? (
          <motion.div
            key={`hist-${refresh}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <HistoryView
              catId={id}
              catName={catName}
              catColor={catColor}
              onEntriesChange={setEntries}
            />
          </motion.div>
        ) : (
          <motion.div
            key="new"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col"
          >
            <NewEntryView
              catId={id}
              catName={catName}
              catColor={catColor}
              catPhoto={catPhoto}
              draftRef={draftRef}
            />
          </motion.div>
        )}
      </AnimatePresence>


      <AnimatePresence>
  {duplicateModalOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-[2px] flex items-center justify-center px-5"
      onClick={() => setDuplicateModalOpen(false)}
    >
      <motion.div
        initial={{ scale: 0.92, y: 18, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 18, opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-[28px] bg-white shadow-2xl border border-violet-100 overflow-hidden"
      >
        <div
          className="px-5 py-4 border-b"
          style={{
            background: `linear-gradient(135deg, ${catColor}18, ${catColor}08)`,
            borderColor: `${catColor}22`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-[16px] flex items-center justify-center"
                style={{
                  background: `${catColor}16`,
                  border: `1px solid ${catColor}25`,
                }}
              >
                <Calendar size={20} style={{ color: catColor }} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.18em]" style={{ color: catColor }}>
                  Dia já registrado
                </p>
                <h3 className="text-[18px] font-black text-gray-800 leading-tight">
                  Registro diário já concluído
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDuplicateModalOpen(false)}
              className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <div
            className="rounded-[20px] px-4 py-4 border"
            style={{
              background: '#FAFBFF',
              borderColor: `${catColor}18`,
            }}
          >
            <p className="text-[15px] leading-relaxed font-medium text-gray-700">
              Você já registrou o dia de{' '}
              <span className="font-black" style={{ color: catColor }}>
                {catName || 'seu gato'}
              </span>{' '}
              hoje.
            </p>

            <p className="text-[14px] leading-relaxed text-gray-500 mt-2">
              Volte amanhã e registre um novo dia para continuar construindo o livro de vida dele no GATEDO.
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setDuplicateModalOpen(false)}
              className="px-5 py-3 rounded-[18px] font-black text-white"
              style={{
                background: `linear-gradient(135deg, ${catColor}, ${catColor}CC)`,
                boxShadow: `0 8px 24px ${catColor}35`,
              }}
            >
              Entendi
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>

      <AnimatePresence>
  {view === 'new' && (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed left-0 right-0 bottom-[118px] z-30 flex justify-center px-5"
    >
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={loading || saved}
        className="w-full max-w-[460px] py-4 rounded-[22px] font-black text-[15px] shadow-xl flex items-center justify-center gap-2 text-white mx-auto"
        style={{
          background: saved ? '#16A34A' : `linear-gradient(135deg, ${catColor}, ${catColor}CC)`,
          boxShadow: `0 8px 28px ${catColor}45`,
          opacity: loading ? 0.85 : 1,
        }}
      >
        {saved ? (
          <>
            <Check size={18} /> Salvo! +{CAT_XPG} XPG · +{TUTOR_XPT} XPT
          </>
        ) : loading ? (
          'Salvando...'
        ) : (
          <>
            <Sparkles size={16} />
            Salvar o Dia · +{CAT_XPG} XPG · +{TUTOR_XPT} XPT
          </>
        )}
      </motion.button>
    </motion.div>
  )}
</AnimatePresence>
    </div>
  );
}