import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale,
  Stethoscope,
  Pill,
  Syringe,
  Bug,
  ShieldPlus,
  ClipboardList,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  X,
  PawPrint,
  Utensils,
  Check,
} from 'lucide-react';
import api from '../../../services/api';
import { extractWeightSeries, computeWeightAlerts } from '../../../utils/weightAlerts';
import OfferCard from '../../offers/OfferCard';

const C = {
  purple: '#8B4AFF',
  purpleDark: '#4B40C6',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
};

// ─── Metadados por tipo de marco ───────────────────────────────────────────
export const MARCO_TYPES = {
  CONSULTATION: { label: 'Consulta', icon: Stethoscope, color: '#6366F1', openTab: 'SAUDE' },
  IACONSULT: { label: 'Consulta (IA)', icon: Stethoscope, color: '#8B4AFF', openTab: 'SAUDE' },
  MEDICATION: { label: 'Medicação', icon: Pill, color: '#F59E0B', openTab: 'SAUDE' },
  MEDICINE: { label: 'Medicação', icon: Pill, color: '#F59E0B', openTab: 'SAUDE' },
  VACCINE: { label: 'Vacina', icon: Syringe, color: '#EC4899', openTab: 'IMUNIZANTES' },
  VERMIFUGE: { label: 'Vermífugo', icon: Bug, color: '#3B82F6', openTab: 'IMUNIZANTES' },
  PARASITE: { label: 'Antipulgas', icon: Bug, color: '#8B4AFF', openTab: 'IMUNIZANTES' },
  SURGERY: { label: 'Cirurgia', icon: ShieldPlus, color: '#EF4444', openTab: 'SAUDE' },
  EXAM: { label: 'Exame', icon: ClipboardList, color: '#14B8A6', openTab: 'SAUDE' },
  WEIGHT: { label: 'Peso', icon: Scale, color: '#10B981', openTab: null },
  PROTOCOL: { label: 'Protocolo', icon: ClipboardList, color: '#8B4AFF', openTab: null },
};

export const PERIODS = [
  { id: 3, label: '3 meses' },
  { id: 6, label: '6 meses' },
  { id: 12, label: '12 meses' },
  { id: 'all', label: 'Tudo' },
];

// ─── Monta a lista unificada de marcos ──────────────────────────────────────
export function buildMarcos(healthRecords = [], weightSeries = [], protocolEnrollments = []) {
  const weightIds = new Set(weightSeries.map((w) => w.id));

  const healthMarcos = (healthRecords || [])
    .filter((r) => r?.date && !weightIds.has(r.id))
    .map((r) => ({
      id: r.id,
      type: r.type,
      date: new Date(r.date),
      text: r.ongoing ? `${r.title} (em andamento)` : r.title,
    }));

  const weightMarcos = weightSeries.map((w) => ({
    id: w.id,
    type: 'WEIGHT',
    date: w.date,
    text: `${w.weight} kg registrados`,
  }));

  // Observação de cada dia de protocolo (simples ou "rico") vira um marco.
  const protocolMarcos = (protocolEnrollments || []).flatMap((enrollment) => {
    const protocolTitle = enrollment.protocol?.title || 'Protocolo';

    const simpleMarcos = (enrollment.logs || [])
      .filter((log) => log.note && log.completedAt)
      .map((log) => ({
        id: log.id,
        type: 'PROTOCOL',
        date: new Date(log.completedAt),
        text: `Dia ${log.dayNumber} · ${protocolTitle}: ${log.note}`,
      }));

    // Protocolo "rico" (spec-driven): cada registro salvo tem seu próprio
    // rótulo de marco (__marco), vindo do marco_timeline do spec.
    const richMarcos = (enrollment.logs || []).flatMap((log) =>
      (log.entries || [])
        .filter((entry) => entry.data?.__marco)
        .map((entry) => ({
          id: entry.id,
          type: 'PROTOCOL',
          date: new Date(entry.createdAt),
          text: `${entry.data.__marco} · ${protocolTitle}`,
        })),
    );

    return [...simpleMarcos, ...richMarcos];
  });

  return [...healthMarcos, ...weightMarcos, ...protocolMarcos].sort((a, b) => b.date - a.date);
}

export function formatDate(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDuration(days) {
  if (days < 30) return `${days} dia${days === 1 ? '' : 's'}`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  }
  const years = Math.round(days / 365);
  return `${years} ano${years === 1 ? '' : 's'}`;
}

export function formatWeightDelta(series) {
  const first = series[0];
  const last = series[series.length - 1];
  const deltaKg = last.weight - first.weight;
  const days = Math.max(1, Math.round((last.date - first.date) / 86400000));
  const periodLabel = formatDuration(days);

  let deltaLabel;
  if (Math.abs(deltaKg) < 0.01) {
    deltaLabel = 'Peso estável';
  } else if (Math.abs(deltaKg) < 1) {
    deltaLabel = `${deltaKg > 0 ? '+' : '−'}${Math.round(Math.abs(deltaKg) * 1000)} g`;
  } else {
    deltaLabel = `${deltaKg > 0 ? '+' : '−'}${Math.abs(deltaKg).toFixed(1)} kg`;
  }

  return { deltaLabel, periodLabel, isDrop: deltaKg < -0.01, isRise: deltaKg > 0.01 };
}

// ─── Gráfico SVG de peso, sem biblioteca — cartão escuro com eixos ──────────
export function WeightChart({ series }) {
  const W = 320;
  const H = 190;
  const PAD_L = 32;
  const PAD_R = 12;
  const PAD_T = 14;
  const PAD_B = 22;

  const weights = series.map((p) => p.weight);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const pad = Math.max((rawMax - rawMin) * 0.15, 0.1);
  const minW = rawMin - pad;
  const maxW = rawMax + pad;
  const range = maxW - minW || 1;

  const minDate = series[0].date.getTime();
  const maxDate = series[series.length - 1].date.getTime();
  const dateRange = maxDate - minDate || 1;

  const xFor = (d) => PAD_L + ((d.getTime() - minDate) / dateRange) * (W - PAD_L - PAD_R);
  const yFor = (w) => PAD_T + (1 - (w - minW) / range) * (H - PAD_T - PAD_B);

  const points = series.map((p) => `${xFor(p.date)},${yFor(p.weight)}`).join(' ');
  const last = series[series.length - 1];

  const gridValues = [rawMax, (rawMin + rawMax) / 2, rawMin];

  const maxLabels = 6;
  const xLabelStep = Math.max(1, Math.ceil(series.length / maxLabels));
  const xLabels = series
    .map((p, i) => ({ x: xFor(p.date), label: p.date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), i }))
    .filter(({ i }) => i === 0 || i === series.length - 1 || i % xLabelStep === 0);

  const { deltaLabel, isDrop, isRise } = formatWeightDelta(series);
  const alerts = computeWeightAlerts(series);
  const deltaColor = isDrop || isRise ? '#FB923C' : '#DFFF40';
  const lineColor = '#DFFF40';

  return (
    <div className="rounded-[24px] p-4" style={{ background: 'linear-gradient(160deg, #1a1030 0%, #2D2657 100%)' }}>
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[8px] font-black uppercase tracking-[2px]" style={{ color: 'rgba(255,255,255,0.42)' }}>
          Peso
        </span>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wide"
              style={{ background: 'rgba(251,146,60,0.16)', color: '#FB923C' }}>
              Padrão mudou
            </span>
          )}
          <span className="text-[12px] font-black" style={{ color: deltaColor }}>{deltaLabel}</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 170 }} preserveAspectRatio="xMidYMid meet">
        {gridValues.map((v, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yFor(v)} y2={yFor(v)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text x={PAD_L - 6} y={yFor(v) + 3} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.38)">
              {v.toFixed(1).replace('.', ',')}
            </text>
          </g>
        ))}

        <polyline
          points={points}
          fill="none"
          stroke={lineColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {series.map((p, i) => {
          const isLast = i === series.length - 1;
          return (
            <circle
              key={p.id || i}
              cx={xFor(p.date)}
              cy={yFor(p.weight)}
              r={isLast ? 6 : 3}
              fill={isLast ? '#FB923C' : '#1a1030'}
              stroke={isLast ? 'rgba(255,255,255,0.6)' : lineColor}
              strokeWidth={2}
            />
          );
        })}

        {xLabels.map(({ x, label, i }) => (
          <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.38)">
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Modal rápido de registro de peso (mesmo fluxo do FAB) ──────────────────
// Pós-sucesso: em vez de fechar na hora, pergunta ao módulo único de decisão
// (surface=POST_SUCCESS) se cabe um card leve — some com um toque, nunca modal.
export function QuickWeightModal({ cat, onClose, onSaved }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState(false);
  const [postOffer, setPostOffer] = useState(null);

  const save = async () => {
    const weightNum = parseFloat(String(value).replace(',', '.'));
    if (!weightNum || weightNum <= 0) {
      setError('Informe um peso válido.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await api.patch(`/pets/${cat.id}`, { weight: weightNum });
      await api.post('/health-records', {
        petId: cat.id,
        type: 'EXAM',
        title: `Check-in de Peso: ${weightNum}kg`,
        date: new Date(),
        notes: 'Peso registrado via Linha do tempo.',
      });
      await onSaved?.();
      setJustSaved(true);

      api.get('/offers/decide', { params: { surface: 'POST_SUCCESS', petId: cat.id, trigger: 'weight' } })
        .then((r) => {
          if (r.data?.offer) setPostOffer(r.data.offer);
          else onClose();
        })
        .catch(() => onClose());
    } catch {
      setError('Não foi possível registrar agora. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl"
      >
        {justSaved ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-gray-800 text-sm flex items-center gap-2">
                <Check size={16} className="text-green-500" /> Peso registrado!
              </p>
              <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
            </div>
            {postOffer && (
              <OfferCard offer={postOffer} surface="POST_SUCCESS" petId={cat.id} dismissible={false} />
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-gray-800 text-sm">Registrar peso de {cat?.name}</p>
              <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-2xl px-4 py-3 mb-2">
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-black text-gray-800 outline-none"
              />
              <span className="font-black text-gray-400 text-sm">kg</span>
            </div>
            {error && <p className="text-[11px] font-bold text-red-500 mb-2">{error}</p>}
            <button
              onClick={save}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl font-black text-white text-sm mt-2"
              style={{ background: saving ? '#9ca3af' : `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
            >
              {saving ? 'Salvando...' : 'Salvar pesagem'}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Bloco 1 — Curva de peso ─────────────────────────────────────────────────
function WeightBlock({ cat, weightSeries, onOpenQuickWeight }) {
  if (weightSeries.length < 2) {
    return (
      <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF] mb-1">Curva de peso</p>
        <div className="flex flex-col items-center text-center py-6">
          <Scale size={28} className="text-gray-300 mb-3" />
          <p className="text-sm font-black text-gray-700 mb-1">
            {weightSeries.length === 0 ? 'Ainda não há pesagens' : 'Só uma pesagem registrada'}
          </p>
          <p className="text-[12px] font-medium text-gray-400 leading-relaxed max-w-[240px] mb-4">
            Pese {cat?.name || 'seu gato'} hoje e de novo em 15 dias — aí a curva começa a aparecer.
          </p>
          <button
            onClick={onOpenQuickWeight}
            className="px-5 py-2.5 rounded-2xl font-black text-xs text-white"
            style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
          >
            Registrar peso agora
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF]">Curva de peso</p>
        <button onClick={onOpenQuickWeight} className="text-[11px] font-black" style={{ color: C.purple }}>
          + Pesar
        </button>
      </div>
      <WeightChart series={weightSeries} />
    </div>
  );
}

// ─── Bloco 2 — Marcos ────────────────────────────────────────────────────────
export function MarcosBlock({ marcos, onOpenTab }) {
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [period, setPeriod] = useState('all');

  const availableTypes = useMemo(
    () => [...new Set(marcos.map((m) => m.type))].filter((t) => MARCO_TYPES[t]),
    [marcos],
  );

  const filtered = useMemo(() => {
    let list = marcos;
    if (period !== 'all') {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - Number(period));
      list = list.filter((m) => m.date >= cutoff);
    }
    if (typeFilter !== 'ALL') {
      list = list.filter((m) => m.type === typeFilter);
    }
    return list;
  }, [marcos, typeFilter, period]);

  return (
    <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF] mb-3">Marcos</p>

      {/* Filtro por período */}
      <div className="flex gap-1.5 mb-2 overflow-x-auto no-scrollbar">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className="px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap shrink-0"
            style={
              period === p.id
                ? { background: C.purple, color: '#fff' }
                : { background: '#F4F3FF', color: C.purple }
            }
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Filtro por tipo */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setTypeFilter('ALL')}
          className="px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap shrink-0"
          style={typeFilter === 'ALL' ? { background: '#111827', color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}
        >
          Todos
        </button>
        {availableTypes.map((t) => {
          const meta = MARCO_TYPES[t];
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 rounded-full text-[10px] font-black whitespace-nowrap shrink-0"
              style={
                typeFilter === t
                  ? { background: meta.color, color: '#fff' }
                  : { background: `${meta.color}14`, color: meta.color }
              }
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-[12px] font-medium text-gray-400 py-6">
          Nenhum registro nesse filtro ainda.
        </p>
      ) : (
        <div className="space-y-1">
          {filtered.map((m) => {
            const meta = MARCO_TYPES[m.type] || { label: m.type, icon: PawPrint, color: '#9CA3AF', openTab: 'SAUDE' };
            const Icon = meta.icon;
            return (
              <button
                key={m.id}
                onClick={() => meta.openTab && onOpenTab?.(meta.openTab)}
                className="w-full flex items-center gap-3 py-2.5 text-left border-b border-gray-50 last:border-0"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${meta.color}16` }}
                >
                  <Icon size={16} style={{ color: meta.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-gray-700 truncate">{m.text}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    {meta.label} · {formatDate(m.date)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Bloco 3 — Leitura de padrão ─────────────────────────────────────────────
export function PatternBlock({ alerts }) {
  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF] mb-2">Leitura de padrão</p>
        <p className="text-[12px] font-medium text-gray-400 leading-relaxed">
          Nenhum padrão fora do esperado nas pesagens registradas até agora.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF] mb-3">Leitura de padrão</p>
      <div className="space-y-3">
        {alerts.map((a, i) => {
          const isDrop = a.type === 'drop';
          const color = isDrop ? C.red : C.amber;
          const Icon = isDrop ? TrendingDown : TrendingUp;
          return (
            <div
              key={i}
              className="rounded-[20px] p-4 flex gap-3"
              style={{ background: `${color}0D`, border: `1px solid ${color}30` }}
            >
              <Icon size={18} style={{ color }} className="shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[13px] font-black text-gray-800 mb-1">{a.message}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color }}>
                  {a.rule}
                </p>
                <p className="text-[11px] font-medium text-gray-500 leading-relaxed flex items-start gap-1.5">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5 text-gray-400" />
                  Isso não é diagnóstico — vale comentar com o veterinário na próxima consulta.
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Nutrição — dados reais do perfil (portado da antiga aba "Evolução") ────
// foodType é multi-select (EditProfileModal): array de rótulos já em
// português (Seca/Úmida/Natural/Mista/Outra) — só juntar, não remapear.
function normalizeFoodType(value) {
  if (!Array.isArray(value) || value.length === 0) return 'Não informado';
  return value.join(', ');
}

// feedFrequencyMode também já é salvo como rótulo em português
// (Livre, 2x ao dia, 3x ao dia, 4x ao dia, Outra) — exibir direto.
function normalizeFeedFrequency(value) {
  return value ? String(value) : 'Não informado';
}

function normalizeGender(value) {
  if (!value) return 'Gato';
  const v = String(value).toLowerCase();
  if (['male', 'macho', 'masculino'].includes(v)) return 'Macho';
  if (['female', 'fêmea', 'femea', 'feminino'].includes(v)) return 'Fêmea';
  return value;
}

function getWeightReference(cat) {
  const breed = String(cat?.breed || 'SRD').toUpperCase();
  let min = 3.2;
  let max = 5.5;
  if (breed.includes('MAINE')) { min = 6; max = 11; }
  else if (breed.includes('PERSA')) { min = 3; max = 5.5; }
  else if (breed.includes('BENGAL')) { min = 3.5; max = 6.5; }
  return { min, max };
}

function getNutritionStatus(cat) {
  const w = Number(cat?.weight || 0);
  const { min, max } = getWeightReference(cat);

  if (!w) {
    return { label: 'Pendente', msg: 'Registre o peso para ativar a leitura nutricional.', color: '#9CA3AF' };
  }
  if (w < min) {
    return { label: 'Subpeso', msg: `${cat?.name || 'O gato'} está abaixo da faixa estimada para o perfil atual.`, color: C.amber };
  }
  if (w > max) {
    return { label: 'Sobrepeso', msg: `${cat?.name || 'O gato'} está acima da faixa estimada para o perfil atual.`, color: '#EC4899' };
  }
  return { label: 'Peso ideal', msg: `${cat?.name || 'O gato'} está dentro da faixa esperada para o perfil atual.`, color: C.green };
}

function NutritionFieldCard({ label, value }) {
  return (
    <div className="rounded-[18px] border border-gray-100 bg-gray-50 px-3.5 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400 mb-1">{label}</p>
      <p className="text-[12px] font-black text-gray-700 leading-snug">{value || 'Não informado'}</p>
    </div>
  );
}

function NutritionBlock({ cat }) {
  const status = getNutritionStatus(cat);
  const genderLabel = normalizeGender(cat?.gender);

  return (
    <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF]">Nutrição</p>
        <span
          className="px-3 py-1 rounded-full text-[10px] font-black"
          style={{ background: `${status.color}18`, color: status.color }}
        >
          {status.label}
        </span>
      </div>
      <p className="text-[12px] font-medium text-gray-500 leading-relaxed mb-4">{status.msg}</p>

      <div className="grid grid-cols-2 gap-2.5">
        <NutritionFieldCard label="Marca principal" value={cat?.foodBrand} />
        <NutritionFieldCard label="Tipo de alimentação" value={normalizeFoodType(cat?.foodType)} />
        <NutritionFieldCard label="Frequência" value={normalizeFeedFrequency(cat?.feedFrequencyMode)} />
        <NutritionFieldCard label="Perfil biológico" value={`${genderLabel} · ${cat?.breed || 'SRD'}`} />
      </div>

      {cat?.feedFrequencyNotes ? (
        <div className="mt-3 rounded-[18px] bg-[#F4F3FF] border border-[#8B4AFF18] px-4 py-3">
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-gray-400 mb-1">Observações da rotina alimentar</p>
          <p className="text-[12px] font-medium text-gray-600 leading-relaxed">{cat.feedFrequencyNotes}</p>
        </div>
      ) : (
        <div className="mt-3 rounded-[18px] bg-amber-50 border border-amber-100 px-4 py-3 flex items-start gap-2">
          <Utensils size={13} className="text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
            Ainda não há observações nutricionais detalhadas registradas.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function TimelineModule({ cat, touch, refreshCat, onOpenTab }) {
  const [quickWeightOpen, setQuickWeightOpen] = useState(false);

  const weightSeries = useMemo(() => extractWeightSeries(cat?.healthRecords), [cat?.healthRecords]);
  const marcos = useMemo(
    () => buildMarcos(cat?.healthRecords, weightSeries, cat?.protocolEnrollments),
    [cat?.healthRecords, weightSeries, cat?.protocolEnrollments],
  );
  const alerts = useMemo(() => computeWeightAlerts(weightSeries), [weightSeries]);

  const openQuickWeight = () => {
    touch?.();
    setQuickWeightOpen(true);
  };

  return (
    <div className="space-y-4 pt-2">
      <WeightBlock cat={cat} weightSeries={weightSeries} onOpenQuickWeight={openQuickWeight} />
      <NutritionBlock cat={cat} />
      <MarcosBlock marcos={marcos} onOpenTab={onOpenTab} />
      <PatternBlock alerts={alerts} />

      <AnimatePresence>
        {quickWeightOpen && (
          <QuickWeightModal
            cat={cat}
            onClose={() => setQuickWeightOpen(false)}
            onSaved={refreshCat}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
