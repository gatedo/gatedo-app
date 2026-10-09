/**
 * CatDiary.jsx — v5
 * ─────────────────────────────────────────────────────────────────────────────
 * Diário do gato = a história de saúde dele, num lugar só:
 *   HISTÓRICO — linha do tempo unificada (GET /diary-entries/journal):
 *               check-ins, dias de protocolo, "Aconteceu de novo", início e
 *               fim de protocolo + resumo de sinais dos últimos 30 dias e
 *               resumo pronto pra levar ao veterinário.
 *   NOVO DIA  — protocolo em andamento primeiro ("Hoje no protocolo"), depois
 *               o check-in: sinais de saúde, humor (opcional), cuidados, nota.
 *
 * Regras:
 * - A Home manda fazer ("O que precisa de você hoje"); o diário mostra o que
 *   aconteceu. Dia de protocolo concluído aparece aqui sozinho — o tutor
 *   nunca registra a mesma coisa duas vezes.
 * - Sinais moram em DiaryEntry.occurrences (chaves em utils/diarySignals.js).
 *   São eles que alimentam o motor de ofertas e o contexto do iGentVet.
 * - XP igual ao de antes: backend credita ao salvar; aqui é só exibição.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Sparkles,
  Heart,
  ShieldCheck,
  MoonStar,
  PawPrint,
  Cat,
  X,
  Stethoscope,
  ClipboardList,
  PlusCircle,
  ChevronRight,
  AlertTriangle,
  Copy,
  Share2,
  Activity,
  Flag,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import useSensory from '../hooks/useSensory';
import api from '../services/api';
import OfferCard from '../components/offers/OfferCard';
import RegistroAvulsoModal from '../components/protocol/RegistroAvulsoModal';
import { DIARY_SIGNALS, SIGNAL_BY_KEY } from '../utils/diarySignals';

// ─── tenta importar gamification — silencioso se não disponível ───────────────
let useGamification = () => ({ earnXP: () => {}, incrementStat: () => {} });
try {
  ({ useGamification } = require('../context/GamificationContext'));
} catch {}

const C = { primary: '#8B4AFF', accent: '#DFFF40' };
const RED = { hex: '#DC2626', bg: '#FEF2F2', border: '#FECACA' };

const CAT_MOODS = [
  { id: 'happy', label: 'Feliz', emoji: '😸', hex: '#16A34A', bg: '#F0FDF4', icon: Smile, sub: 'carinhoso e leve' },
  { id: 'cuddly', label: 'Grudento', emoji: '🥹', hex: '#EC4899', bg: '#FDF2F8', icon: Heart, sub: 'querendo colo' },
  { id: 'sleepy', label: 'Sonolento', emoji: '😴', hex: '#2563EB', bg: '#EFF6FF', icon: MoonStar, sub: 'mais quietinho' },
  { id: 'zoomies', label: 'Arteiro', emoji: '😼', hex: '#D97706', bg: '#FFFBEB', icon: Zap, sub: 'correndo pela casa' },
  { id: 'curious', label: 'Curioso', emoji: '🧐', hex: '#7C3AED', bg: '#F5F3FF', icon: Sparkles, sub: 'explorando tudo' },
  { id: 'spicy', label: 'Arisco', emoji: '😾', hex: '#DC2626', bg: '#FFF5F5', icon: Frown, sub: 'mais reativo hoje' },
];
const MOOD_BY_ID = Object.fromEntries(CAT_MOODS.map((m) => [m.id, m]));

const HABITS = [
  { id: 'Agua', label: 'Água fresca', emoji: '💧', icon: Droplets, sub: 'água limpa disponível' },
  { id: 'Banheiro', label: 'Caixa limpa', emoji: '🪣', icon: Trash2, sub: 'caixa higienizada' },
  { id: 'Comida', label: 'Alimentação', emoji: '🍽️', icon: Utensils, sub: 'refeição em dia' },
  { id: 'Brincou', label: 'Brincadeira', emoji: '🧶', icon: Zap, sub: 'estímulo e movimento' },
  { id: 'Carinho', label: 'Afeto', emoji: '🤍', icon: Heart, sub: 'contato e vínculo' },
  { id: 'Observado', label: 'Observação', emoji: '👀', icon: ShieldCheck, sub: 'rotina monitorada' },
];

// XP baixo — mantém o mesmo valor de backend/src/gamification/xp.config.ts (XP_TIERS.BAIXO).
// O backend credita automaticamente ao salvar (POST /diary-entries); estes números são só de exibição.
const TUTOR_XPT = 3;
const CAT_XPG = 3;

const EMPTY_NOTE = 'Sem anotações.';

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

// Streak conta só check-ins — é a mesma régua do backend (gamification.service).
function calcStreak(dates) {
  if (!dates?.length) return 0;

  const days = [...new Set(dates.map((d) => new Date(d).toDateString()))].sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  let expected = new Date();
  expected.setHours(0, 0, 0, 0);

  for (const ds of days) {
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
  const raw = content || '';
  const checklistMatch = raw.match(/Checklist: (.+?)\./);
  const habits = checklistMatch?.[1]?.split(', ') || [];
  const shared = raw.includes('[ROTINA_COMPARTILHADA]');
  const note = raw
    .replace(/\[ROTINA_COMPARTILHADA\]\n?/g, '')
    .replace(/Checklist: .+?\.\n?/g, '')
    .replace(EMPTY_NOTE, '')
    .trim();
  return { habits, note, shared };
}

function isSameDay(dateA, dateB) {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
      <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} />
    </div>
  );
}

function SignalChip({ signalKey, count }) {
  const sig = SIGNAL_BY_KEY[signalKey];
  if (!sig) return null;
  return (
    <span
      className="inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full"
      style={{ background: RED.bg, color: RED.hex, border: `1px solid ${RED.border}` }}
    >
      <span>{sig.emoji}</span>
      {sig.label}
      {count > 1 && <span className="opacity-70">· {count}x</span>}
    </span>
  );
}

// ─── cards do histórico ───────────────────────────────────────────────────────
function CheckinCard({ item }) {
  const mood = item.mood ? MOOD_BY_ID[item.mood] : null;
  const { habits, note, shared } = parseDiaryContent(item.content);
  const signals = (item.occurrences || []).filter((k) => SIGNAL_BY_KEY[k]);
  const hasSignals = signals.length > 0;
  const tone = hasSignals ? { hex: RED.hex, bg: '#FFF8F8' } : mood ? mood : { hex: '#16A34A', bg: '#F7FEF9' };

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-[18px] border" style={{ background: tone.bg, borderColor: `${tone.hex}22` }}>
      <div
        className="w-10 h-10 rounded-[14px] flex items-center justify-center text-lg flex-shrink-0 bg-white border"
        style={{ borderColor: `${tone.hex}25` }}
      >
        {hasSignals ? '🩺' : mood ? mood.emoji : '✅'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-[12px] font-black" style={{ color: tone.hex }}>
            {hasSignals ? `${signals.length} sinal${signals.length > 1 ? 'is' : ''} de atenção` : 'Tudo normal'}
          </span>
          <span className="text-[9px] text-gray-400 font-bold">{fmtDate(item.date)}</span>
          {mood && (
            <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-white/80" style={{ color: mood.hex }}>
              {mood.emoji} {mood.label}
            </span>
          )}
          {shared && <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-white/70 text-gray-500">rotina do lar</span>}
        </div>

        {hasSignals && (
          <div className="flex gap-1 flex-wrap mb-1.5">
            {signals.map((k) => (
              <SignalChip key={k} signalKey={k} />
            ))}
          </div>
        )}

        {habits.length > 0 && (
          <div className="flex gap-1 flex-wrap mb-1">
            {habits.slice(0, 4).map((h) => (
              <span key={h} className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-white/70 text-gray-500">
                {h}
              </span>
            ))}
            {habits.length > 4 && <span className="text-[7px] text-gray-400">+{habits.length - 4}</span>}
          </div>
        )}

        {note && <p className="text-[10px] text-gray-600 font-medium line-clamp-2">{note}</p>}
      </div>
    </div>
  );
}

function ProtocolItemCard({ item, onOpen }) {
  const cfg = {
    'protocol-day': {
      icon: <CheckCircle2 size={17} style={{ color: C.primary }} />,
      title: `Dia ${item.dayNumber} de ${item.totalDays} concluído`,
      sub: item.dayTitle,
      bg: '#F7F4FF',
      hex: C.primary,
    },
    'protocol-event': {
      icon: <PlusCircle size={17} style={{ color: RED.hex }} />,
      title: item.label,
      sub: item.detail,
      bg: '#FFF8F8',
      hex: RED.hex,
    },
    'protocol-start': {
      icon: <Flag size={17} style={{ color: C.primary }} />,
      title: 'Começou o protocolo',
      sub: null,
      bg: '#F7F4FF',
      hex: C.primary,
    },
    'protocol-end': {
      icon: <ClipboardList size={17} style={{ color: '#16A34A' }} />,
      title:
        item.status === 'INTERROMPIDO_EMERGENCIA'
          ? 'Protocolo interrompido (emergência)'
          : item.resolved === true
            ? 'Protocolo concluído · resolveu'
            : item.resolved === false
              ? 'Protocolo concluído · não resolveu'
              : 'Protocolo concluído',
      sub: null,
      bg: '#F4FDF7',
      hex: '#16A34A',
    },
  }[item.kind];
  if (!cfg) return null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left flex items-start gap-3 px-4 py-3 rounded-[18px] border"
      style={{ background: cfg.bg, borderColor: `${cfg.hex}22` }}
    >
      <div
        className="w-10 h-10 rounded-[14px] flex items-center justify-center flex-shrink-0 bg-white border"
        style={{ borderColor: `${cfg.hex}25` }}
      >
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-[8px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-white" style={{ color: C.primary }}>
            {item.protocolTitle}
          </span>
          <span className="text-[9px] text-gray-400 font-bold">{fmtDate(item.date)}</span>
        </div>
        <p className="text-[12px] font-black" style={{ color: cfg.hex }}>
          {cfg.title}
        </p>
        {cfg.sub && <p className="text-[10px] text-gray-500 font-medium truncate">{cfg.sub}</p>}
        {item.note && <p className="text-[10px] text-gray-500 font-medium line-clamp-2 mt-0.5">{item.note}</p>}
      </div>
      <ChevronRight size={14} className="text-gray-300 mt-3 flex-shrink-0" />
    </button>
  );
}

// ─── resumo pro veterinário ───────────────────────────────────────────────────
function buildVetSummary({ catName, journal }) {
  const since = Date.now() - 30 * 86400000;
  const recent = (journal?.items || []).filter((i) => new Date(i.date).getTime() >= since);
  const checkins = recent.filter((i) => i.kind === 'checkin');
  const lines = [];

  lines.push(`Resumo de ${catName} · últimos 30 dias (GATEDO)`);
  lines.push('');
  lines.push(`Check-ins registrados: ${checkins.length}`);

  const signals = journal?.signals30d || [];
  lines.push('');
  lines.push('Sinais observados pelo tutor:');
  if (signals.length === 0) {
    lines.push('- Nenhum sinal alterado marcado');
  } else {
    for (const s of signals) {
      lines.push(`- ${s.label}: ${s.count}x (último em ${new Date(s.lastAt).toLocaleDateString('pt-BR')})`);
    }
  }

  const protocolLines = [];
  const seen = new Set();
  for (const p of journal?.activeProtocols || []) {
    seen.add(p.slug);
    protocolLines.push(`- ${p.title}: em andamento, dia ${p.dayNumber} de ${p.totalDays}`);
  }
  for (const i of recent) {
    if (i.kind === 'protocol-end' && !seen.has(i.slug)) {
      seen.add(i.slug);
      const r = i.resolved === true ? 'resolveu' : i.resolved === false ? 'não resolveu' : 'concluído';
      protocolLines.push(`- ${i.protocolTitle}: ${i.status === 'INTERROMPIDO_EMERGENCIA' ? 'interrompido por emergência' : r}`);
    }
  }
  if (protocolLines.length) {
    lines.push('');
    lines.push('Protocolos guiados:');
    lines.push(...protocolLines);
  }

  const notes = checkins
    .map((c) => ({ date: c.date, note: parseDiaryContent(c.content).note }))
    .filter((c) => c.note)
    .slice(0, 5);
  if (notes.length) {
    lines.push('');
    lines.push('Anotações do tutor:');
    for (const n of notes) lines.push(`- ${new Date(n.date).toLocaleDateString('pt-BR')}: ${n.note}`);
  }

  lines.push('');
  lines.push('Registro feito pelo tutor. Não substitui exame clínico.');
  return lines.join('\n');
}

function VetSummaryModal({ catName, catColor, journal, onClose }) {
  const text = buildVetSummary({ catName, journal });
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const share = async () => {
    try {
      await navigator.share({ title: `Resumo de ${catName}`, text });
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-[460px] bg-white rounded-t-[28px] sm:rounded-[28px] p-5 pb-8 max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Stethoscope size={16} style={{ color: catColor }} />
            <p className="text-[13px] font-black text-gray-800">Resumo pro veterinário</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={15} className="text-gray-500" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 font-bold mb-3">
          Mostre na consulta ou mande por mensagem. Sai do que você registrou no diário e nos protocolos.
        </p>
        <pre className="flex-1 overflow-y-auto whitespace-pre-wrap text-[12px] leading-relaxed text-gray-700 bg-[#FAFBFF] border border-gray-100 rounded-[18px] p-4 font-sans">
          {text}
        </pre>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={copy}
            className="flex-1 py-3 rounded-[16px] font-black text-[12px] flex items-center justify-center gap-1.5"
            style={{ background: `${catColor}12`, color: catColor }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : 'Copiar'}
          </button>
          {canShare && (
            <button
              type="button"
              onClick={share}
              className="flex-1 py-3 rounded-[16px] font-black text-[12px] text-white flex items-center justify-center gap-1.5"
              style={{ background: `linear-gradient(135deg, ${catColor}, ${catColor}CC)` }}
            >
              <Share2 size={14} /> Compartilhar
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── view: histórico ──────────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all', label: '✨ Tudo' },
  { id: 'signals', label: '🩺 Sinais' },
  { id: 'protocols', label: '📋 Protocolos' },
  { id: 'checkins', label: '📔 Check-ins' },
];

function matchesFilter(item, filter) {
  if (filter === 'all') return true;
  if (filter === 'checkins') return item.kind === 'checkin';
  if (filter === 'protocols') return item.kind.startsWith('protocol');
  if (filter === 'signals') {
    return (item.kind === 'checkin' && item.occurrences?.some((k) => SIGNAL_BY_KEY[k])) || item.kind === 'protocol-event';
  }
  return true;
}

function HistoryView({ catName, catColor, journal, loading, onOpenProtocol, onNewDay }) {
  const [filter, setFilter] = useState('all');
  const [vetOpen, setVetOpen] = useState(false);

  const items = journal?.items || [];
  const signals = journal?.signals30d || [];
  const checkins = items.filter((i) => i.kind === 'checkin');
  const streak = calcStreak(checkins.map((c) => c.date));
  const signalTotal = signals.reduce((acc, s) => acc + s.count, 0);
  const filtered = items.filter((i) => matchesFilter(i, filter));

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
          <span className="text-xl font-black text-gray-800 block mb-0.5">{journal?.checkins30d ?? 0}</span>
          <p className="text-[8px] text-gray-400 font-black uppercase">Check-ins 30d</p>
        </div>

        <div
          className="rounded-[18px] p-3 border text-center shadow-sm"
          style={signalTotal > 0 ? { background: RED.bg, borderColor: RED.border } : { background: '#F4FDF7', borderColor: '#BBF7D0' }}
        >
          <span className="text-xl font-black block mb-0.5" style={{ color: signalTotal > 0 ? RED.hex : '#16A34A' }}>
            {signalTotal}
          </span>
          <p className="text-[8px] font-black uppercase" style={{ color: signalTotal > 0 ? RED.hex : '#16A34A' }}>
            Sinais 30d
          </p>
        </div>
      </div>

      {/* Sinais dos últimos 30 dias — o que interessa pro tutor e pro vet */}
      <div className="mx-5 mb-3 bg-white rounded-[18px] p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Activity size={10} /> Sinais dos últimos 30 dias
          </p>
          <button
            type="button"
            onClick={() => setVetOpen(true)}
            className="flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full"
            style={{ background: `${catColor}12`, color: catColor }}
          >
            <Stethoscope size={11} /> Resumo pro vet
          </button>
        </div>

        {signals.length > 0 ? (
          <div className="flex gap-1.5 flex-wrap">
            {signals.map((s) => (
              <SignalChip key={s.key} signalKey={s.key} count={s.count} />
            ))}
          </div>
        ) : (
          <p className="text-[12px] font-bold text-gray-500">
            {(journal?.checkins30d ?? 0) > 0
              ? `Nenhum sinal de atenção em ${catName}. Continue registrando: é assim que um padrão aparece cedo.`
              : `Faça o check-in de ${catName} pra começar a ver padrões aqui.`}
          </p>
        )}
        {signals.some((s) => s.alarm) && (
          <p className="mt-2.5 text-[10px] font-bold flex items-start gap-1.5" style={{ color: RED.hex }}>
            <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
            Tem sinal de alarme no período. Se ainda estiver acontecendo, procure um veterinário.
          </p>
        )}
      </div>

      <div className="flex gap-2 px-5 pb-3 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className="px-3 py-1.5 rounded-full text-[9px] font-black flex-shrink-0"
            style={filter === f.id ? { background: catColor, color: 'white' } : { background: '#F4F3FF', color: '#6B7280' }}
          >
            {f.label}
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
          filtered.map((item) =>
            item.kind === 'checkin' ? (
              <CheckinCard key={item.id} item={item} />
            ) : (
              <ProtocolItemCard key={item.id} item={item} onOpen={() => onOpenProtocol(item.slug)} />
            )
          )
        ) : (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <span className="text-4xl">📔</span>
            <p className="text-sm font-black text-gray-400">Nada por aqui ainda</p>
            <p className="text-[10px] text-gray-300 max-w-[200px]">
              Um check-in por dia leva 30 segundos e monta a história de saúde de {catName}.
            </p>
            <button
              type="button"
              onClick={onNewDay}
              className="mt-1 px-4 py-2 rounded-full text-[12px] font-black text-white"
              style={{ background: catColor }}
            >
              Fazer check-in
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {vetOpen && <VetSummaryModal catName={catName} catColor={catColor} journal={journal} onClose={() => setVetOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ─── "Hoje no protocolo" — sempre antes do check-in ──────────────────────────
function ProtocolTodayBlock({ protocols, catColor, onOpen, onAvulso }) {
  if (!protocols?.length) return null;
  return (
    <section className="space-y-2">
      <p className="text-[10px] font-black text-gray-500 uppercase tracking-wide flex items-center gap-2">
        <ClipboardList size={13} style={{ color: catColor }} />
        Hoje no protocolo
      </p>
      {protocols.map((p) => (
        <div key={p.enrollmentId} className="bg-white rounded-[22px] p-4 border shadow-sm" style={{ borderColor: `${C.primary}22` }}>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-[9px] font-black uppercase tracking-wide truncate" style={{ color: C.primary }}>
              {p.title}
            </p>
            <span className="text-[9px] font-black text-gray-400 flex-shrink-0">
              {p.dayNumber === 0 ? 'Triagem' : `Dia ${p.dayNumber} de ${p.totalDays}`}
            </span>
          </div>

          {p.doneToday ? (
            <p className="text-[12px] font-bold text-green-600 flex items-center gap-1.5 mb-3">
              <CheckCircle2 size={14} /> Dia de hoje feito. O próximo abre amanhã.
            </p>
          ) : (
            <p className="text-[13px] font-bold text-gray-800 leading-snug mb-3">{p.action}</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onOpen(p.slug)}
              className="flex-1 py-2.5 rounded-xl font-black text-[12px] text-white"
              style={{ background: `linear-gradient(135deg, ${C.primary} 0%, #4B40C6 100%)` }}
            >
              {p.doneToday || !p.unlocked ? 'Ver protocolo' : 'Abrir dia'}
            </button>
            {p.avulsoLabel && (
              <button
                type="button"
                onClick={() => onAvulso(p)}
                className="px-3.5 py-2.5 rounded-xl font-black text-[12px] flex items-center gap-1"
                style={{ background: RED.bg, color: RED.hex }}
              >
                <PlusCircle size={13} /> {p.avulsoLabel}
              </button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

// ─── view: novo registro ──────────────────────────────────────────────────────
function NewEntryView({ catId, catName, catColor, catPhoto, draftRef, activeProtocols, onOpenProtocol, onAvulso }) {
  const [mood, setMood] = useState(null);
  const [moodOpen, setMoodOpen] = useState(false);
  const [habits, setHabits] = useState([]);
  const [signals, setSignals] = useState([]);
  const [allNormal, setAllNormal] = useState(false);
  const [note, setNote] = useState('');
  const [sharedChecklist, setSharedChecklist] = useState(false);
  const touch = useSensory();

  const toggleHabit = (id) => {
    touch('tap');
    setHabits((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSignal = (key) => {
    touch('tap');
    setAllNormal(false);
    setSignals((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  };

  const markAllNormal = () => {
    touch('tap');
    setSignals([]);
    setAllNormal((v) => !v);
  };

  const progress = (habits.length / HABITS.length) * 100;
  const currentMood = mood ? MOOD_BY_ID[mood] : null;
  const alarms = signals.map((k) => SIGNAL_BY_KEY[k]).filter((s) => s?.alarm);
  const tips = signals.map((k) => SIGNAL_BY_KEY[k]).filter((s) => s?.tip && !s.alarm);

  useEffect(() => {
    const habitsText =
      habits.length > 0 ? `Checklist: ${habits.map((h) => HABITS.find((r) => r.id === h)?.label).join(', ')}.` : '';
    const flags = [sharedChecklist ? '[ROTINA_COMPARTILHADA]' : ''].filter(Boolean).join('\n');
    const fullContent = [flags, habitsText, note].filter(Boolean).join('\n').trim();

    const title = signals.length
      ? `Check-in · ${signals.map((k) => SIGNAL_BY_KEY[k]?.label).join(', ')}`
      : currentMood
        ? `Dia ${currentMood.label}`
        : 'Check-in · tudo normal';

    draftRef.current = {
      petId: catId,
      title,
      content: fullContent || EMPTY_NOTE,
      type: mood || 'checkin',
      date: new Date(),
      occurrences: signals,
      meta: {
        sharedChecklist,
        habits,
        reward: { xpg: CAT_XPG, xpt: TUTOR_XPT },
      },
    };
  }, [mood, habits, signals, note, catId, sharedChecklist, currentMood, draftRef]);

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-4 pb-[200px] space-y-5">
      <div className="flex items-center gap-3">
        <CatAvatar src={catPhoto} alt={catName} color={catColor} size="w-12 h-12" rounded="rounded-[16px]" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar size={13} />
            <span className="text-xs font-black">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </span>
          </div>
          <p className="text-[13px] font-black text-gray-700 mt-1 truncate">Check-in de {catName}</p>
        </div>
      </div>

      <ProtocolTodayBlock protocols={activeProtocols} catColor={catColor} onOpen={onOpenProtocol} onAvulso={onAvulso} />

      {/* Sinais de saúde — o coração do check-in */}
      <section className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-wide mb-1 flex items-center gap-2">
          <Stethoscope size={13} style={{ color: catColor }} />
          Como {catName} está hoje?
        </p>
        <p className="text-[10px] text-gray-400 font-bold mb-3">Marque só o que fugiu do normal.</p>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={markAllNormal}
          className="w-full mb-3 py-3 rounded-[16px] border-2 font-black text-[12px] flex items-center justify-center gap-2 transition-all"
          style={
            allNormal
              ? { background: '#F0FDF4', borderColor: '#16A34A', color: '#16A34A' }
              : { background: '#F9FAFB', borderColor: 'transparent', color: '#6B7280' }
          }
        >
          {allNormal ? <CheckCircle2 size={15} /> : <span>✅</span>} Tudo normal hoje
        </motion.button>

        <div className="flex gap-2 flex-wrap">
          {DIARY_SIGNALS.map((s) => {
            const active = signals.includes(s.key);
            return (
              <motion.button
                key={s.key}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => toggleSignal(s.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full border-2 transition-all"
                style={
                  active
                    ? { background: RED.bg, borderColor: RED.border, color: RED.hex }
                    : { background: '#F9FAFB', borderColor: 'transparent', color: '#6B7280' }
                }
              >
                <span className="text-sm">{s.emoji}</span>
                <span className="text-[12px] font-black">{s.label}</span>
                {active && <Check size={12} />}
              </motion.button>
            );
          })}
        </div>

        <AnimatePresence>
          {alarms.map((s) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-[16px] p-3 flex items-start gap-2"
              style={{ background: RED.hex, color: 'white' }}
            >
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <p className="text-[12px] font-bold leading-snug">{s.tip}</p>
            </motion.div>
          ))}
          {tips.map((s) => (
            <motion.p
              key={s.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-[10px] font-bold text-gray-500 flex items-start gap-1.5"
            >
              <span>{s.emoji}</span> {s.tip}
            </motion.p>
          ))}
        </AnimatePresence>
      </section>

      {/* Humor — opcional, fechado por padrão */}
      <section className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm">
        <button type="button" onClick={() => setMoodOpen((v) => !v)} className="w-full flex items-center justify-between">
          <p className="text-[10px] font-black text-gray-600 uppercase tracking-wide flex items-center gap-2">
            <Cat size={13} style={{ color: catColor }} />
            Humor <span className="text-gray-300 normal-case font-bold">(opcional)</span>
          </p>
          <span className="text-[10px] font-black" style={{ color: currentMood?.hex || '#9CA3AF' }}>
            {currentMood ? `${currentMood.emoji} ${currentMood.label}` : moodOpen ? 'fechar' : 'escolher'}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {moodOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 pt-3">
                {CAT_MOODS.map((m) => {
                  const sel = mood === m.id;
                  return (
                    <motion.button
                      key={m.id}
                      type="button"
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setMood(sel ? null : m.id);
                        touch();
                      }}
                      className="flex flex-col items-center gap-1 py-2.5 rounded-[18px] border-2 transition-all"
                      style={
                        sel
                          ? { background: m.bg, borderColor: m.hex, boxShadow: `0 4px 14px ${m.hex}30` }
                          : { background: '#F9FAFB', borderColor: 'transparent', opacity: 0.75 }
                      }
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-[8px] font-black text-center" style={{ color: sel ? m.hex : '#9CA3AF' }}>
                        {m.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
              Cuidados do dia <span className="text-gray-300 normal-case font-bold">(opcional)</span>
            </p>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: `${catColor}12`, color: catColor }}>
              {habits.length}/{HABITS.length}
            </span>
          </div>

          <div className="mb-4 rounded-[18px] border border-gray-100 bg-[#FAFBFF] px-3 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-gray-700 uppercase tracking-wide">Rotina compartilhada do lar</p>
              <p className="text-[9px] text-gray-400 font-bold mt-1">Use quando esse cuidado vale para todos os gatos do tutor</p>
            </div>
            <button
              type="button"
              onClick={() => setSharedChecklist((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${sharedChecklist ? '' : 'bg-gray-200'}`}
              style={sharedChecklist ? { background: catColor } : undefined}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${sharedChecklist ? 'left-6' : 'left-1'}`} />
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
                  onClick={() => toggleHabit(h.id)}
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
                    <p className="text-[12px] font-black" style={{ color: done ? '#374151' : '#6B7280' }}>
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
          placeholder={
            signals.length
              ? 'Conte o que viu: quantas vezes, desde quando, como estava. Isso vai pro resumo do veterinário.'
              : `Algo especial que ${catName} fez hoje? Algum detalhe que merece ficar guardado?`
          }
          className="w-full text-sm font-medium text-gray-700 outline-none bg-transparent resize-none placeholder-gray-300"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </section>
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

  // ?view=new abre direto no check-in (usado pelo item da Home).
  const [view, setView] = useState(() =>
    new URLSearchParams(location.search).get('view') === 'new' || location.state?.view === 'new' ? 'new' : 'history'
  );
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(C.primary);
  const [catPhoto, setCatPhoto] = useState('');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [journal, setJournal] = useState(null);
  const [journalLoading, setJournalLoading] = useState(true);
  const [postSaveOffer, setPostSaveOffer] = useState(null);
  const [avulsoProtocol, setAvulsoProtocol] = useState(null);
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

  const loadJournal = useCallback(() => {
    setJournalLoading(true);
    return api
      .get('/diary-entries/journal', { params: { petId: id, days: 90 } })
      .then((r) => setJournal(r.data || null))
      .catch(() => setJournal(null))
      .finally(() => setJournalLoading(false));
  }, [id]);

  useEffect(() => {
    loadJournal();
  }, [loadJournal]);

  const checkinDates = (journal?.items || []).filter((i) => i.kind === 'checkin').map((i) => i.date);
  const streak = calcStreak(checkinDates);

  const openProtocol = (slug) => {
    touch();
    navigate(`/protocolos/${slug}`, { state: { catId: id } });
  };

  // Pergunta ao motor único de oferta, sinal por sinal, se cabe um protocolo.
  // Card leve, nunca modal; some com um toque. Sinais de alarme ficam de fora.
  const askSignalOffer = async (occurrences) => {
    for (const key of occurrences) {
      if (SIGNAL_BY_KEY[key]?.alarm) continue;
      try {
        const r = await api.get('/offers/decide', { params: { surface: 'PAIN_DIARY', petId: id, trigger: key } });
        if (r.data?.offer) {
          setPostSaveOffer(r.data.offer);
          return;
        }
      } catch {}
    }
  };

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

      // XP é creditado automaticamente pelo backend ao salvar o registro
      // (gamif.onDiaryEntry, ver backend/src/controllers/diary.controller.ts).
      // Aqui só atualizamos os contadores locais/toasts otimistas da UI.
      try {
        earnXP?.(TUTOR_XPT, 'Diário do tutor registrado');
        incrementStat?.('diaryCount');
      } catch {}

      if (Array.isArray(draft.occurrences) && draft.occurrences.length) {
        askSignalOffer(draft.occurrences);
      }

      draftRef.current = null;
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
        setView('history');
        loadJournal();
        touch('success');
      }, 1100);
    } catch (err) {
      console.error('Erro ao salvar diário:', err);
      alert('Erro ao salvar diário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ background: '#F8F9FE' }}>
      <AnimatePresence>
        {postSaveOffer && (
          <div className="px-5 pt-3">
            <OfferCard offer={postSaveOffer} surface="PAIN_DIARY" petId={id} onDismiss={() => setPostSaveOffer(null)} />
          </div>
        )}
      </AnimatePresence>

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
            { id: 'new', label: '✏️ Check-in de hoje' },
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
          <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            <HistoryView
              catName={catName}
              catColor={catColor}
              journal={journal}
              loading={journalLoading}
              onOpenProtocol={openProtocol}
              onNewDay={() => setView('new')}
            />
          </motion.div>
        ) : (
          <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            <NewEntryView
              catId={id}
              catName={catName}
              catColor={catColor}
              catPhoto={catPhoto}
              draftRef={draftRef}
              activeProtocols={journal?.activeProtocols || []}
              onOpenProtocol={openProtocol}
              onAvulso={(p) => {
                touch();
                setAvulsoProtocol(p);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {avulsoProtocol && (
          <RegistroAvulsoModal
            spec={avulsoProtocol.avulsoSpec}
            slug={avulsoProtocol.slug}
            enrollmentId={avulsoProtocol.enrollmentId}
            catName={catName}
            onSaved={() => loadJournal()}
            onClose={() => setAvulsoProtocol(null)}
          />
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
                      style={{ background: `${catColor}16`, border: `1px solid ${catColor}25` }}
                    >
                      <Calendar size={20} style={{ color: catColor }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-black uppercase tracking-[0.18em]" style={{ color: catColor }}>
                        Dia já registrado
                      </p>
                      <h3 className="text-[18px] font-black text-gray-800 leading-tight">Check-in de hoje já feito</h3>
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
                <div className="rounded-[20px] px-4 py-4 border" style={{ background: '#FAFBFF', borderColor: `${catColor}18` }}>
                  <p className="text-[15px] leading-relaxed font-medium text-gray-700">
                    Você já registrou o dia de{' '}
                    <span className="font-black" style={{ color: catColor }}>
                      {catName || 'seu gato'}
                    </span>{' '}
                    hoje.
                  </p>
                  <p className="text-[14px] leading-relaxed text-gray-500 mt-2">
                    Se algo aconteceu de novo durante um protocolo, use o botão do protocolo. Amanhã tem um novo check-in.
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
                  Salvar check-in · +{CAT_XPG} XPG · +{TUTOR_XPT} XPT
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
