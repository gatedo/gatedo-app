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
} from 'lucide-react';
import api from '../../../services/api';

const C = {
  purple: '#8B4AFF',
  purpleDark: '#4B40C6',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
};

// ─── Metadados por tipo de marco ───────────────────────────────────────────
const MARCO_TYPES = {
  CONSULTATION: { label: 'Consulta', icon: Stethoscope, color: '#6366F1', openTab: 'SAUDE' },
  IACONSULT: { label: 'Consulta (IA)', icon: Stethoscope, color: '#8B4AFF', openTab: 'SAUDE' },
  MEDICATION: { label: 'Medicação', icon: Pill, color: '#F59E0B', openTab: 'SAUDE' },
  MEDICINE: { label: 'Medicação', icon: Pill, color: '#F59E0B', openTab: 'SAUDE' },
  VACCINE: { label: 'Vacina', icon: Syringe, color: '#EC4899', openTab: 'IMUNIZANTES' },
  VERMIFUGE: { label: 'Vermífugo', icon: Bug, color: '#3B82F6', openTab: 'IMUNIZANTES' },
  PARASITE: { label: 'Antipulgas', icon: Bug, color: '#8B4AFF', openTab: 'IMUNIZANTES' },
  SURGERY: { label: 'Cirurgia', icon: ShieldPlus, color: '#EF4444', openTab: 'SAUDE' },
  EXAM: { label: 'Exame', icon: ClipboardList, color: '#14B8A6', openTab: 'SAUDE' },
  WEIGHT: { label: 'Peso', icon: Scale, color: '#10B981', openTab: 'EVOLUCAO' },
  PROTOCOL: { label: 'Protocolo', icon: ClipboardList, color: '#8B4AFF', openTab: null },
};

const PERIODS = [
  { id: 3, label: '3 meses' },
  { id: 6, label: '6 meses' },
  { id: 12, label: '12 meses' },
  { id: 'all', label: 'Tudo' },
];

const WEIGHT_TITLE_RE = /check-in de peso[:\s]*([\d.,]+)\s*kg/i;

// ─── Extrai série de peso a partir dos check-ins já registrados ────────────
function extractWeightSeries(healthRecords = []) {
  return healthRecords
    .filter((r) => r?.type === 'EXAM' && WEIGHT_TITLE_RE.test(r.title || ''))
    .map((r) => {
      const match = r.title.match(WEIGHT_TITLE_RE);
      const weight = parseFloat(String(match?.[1] || '').replace(',', '.'));
      return { id: r.id, date: new Date(r.date), weight };
    })
    .filter((p) => Number.isFinite(p.weight) && p.weight > 0)
    .sort((a, b) => a.date - b.date);
}

// ─── Monta a lista unificada de marcos ──────────────────────────────────────
function buildMarcos(healthRecords = [], weightSeries = [], protocolEnrollments = []) {
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

function formatDate(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMonthLabel(d) {
  return d.toLocaleDateString('pt-BR', { month: 'long' });
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

function formatWeightDelta(series) {
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

// ─── Regras fixas de leitura de padrão (sem IA) ─────────────────────────────
function computeWeightAlerts(series) {
  if (series.length < 2) return [];

  const latest = series[series.length - 1];
  const alerts = [];

  const baselineWithin = (days) => {
    const cutoff = new Date(latest.date.getTime() - days * 86400000);
    const candidates = series.filter((p) => p.date >= cutoff && p.date < latest.date);
    return candidates[0] || null;
  };

  const pctChange = (base) => ((latest.weight - base.weight) / base.weight) * 100;

  const b90 = baselineWithin(90);
  const b180 = baselineWithin(180);

  let droppped = false;
  if (b90) {
    const pct = pctChange(b90);
    if (pct <= -5) {
      alerts.push({
        type: 'drop',
        rule: 'Queda de 5% ou mais em 90 dias',
        message: `O peso caiu ${Math.abs(pct).toFixed(0)}% desde ${formatMonthLabel(b90.date)}.`,
      });
      droppped = true;
    }
  }
  if (!droppped && b180) {
    const pct = pctChange(b180);
    if (pct <= -8) {
      alerts.push({
        type: 'drop',
        rule: 'Queda de 8% ou mais em 180 dias',
        message: `O peso caiu ${Math.abs(pct).toFixed(0)}% desde ${formatMonthLabel(b180.date)}.`,
      });
    }
  }
  if (b180) {
    const pct = pctChange(b180);
    if (pct >= 15) {
      alerts.push({
        type: 'rise',
        rule: 'Alta de 15% ou mais em 180 dias',
        message: `O peso subiu ${pct.toFixed(0)}% desde ${formatMonthLabel(b180.date)}.`,
      });
    }
  }

  return alerts;
}

// ─── Gráfico SVG de peso, sem biblioteca ────────────────────────────────────
function WeightChart({ series }) {
  const W = 320;
  const H = 140;
  const PAD_X = 20;
  const PAD_Y = 22;

  const weights = series.map((p) => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const minDate = series[0].date.getTime();
  const maxDate = series[series.length - 1].date.getTime();
  const dateRange = maxDate - minDate || 1;

  const xFor = (d) => PAD_X + ((d.getTime() - minDate) / dateRange) * (W - PAD_X * 2);
  const yFor = (w) => H - PAD_Y - ((w - minW) / range) * (H - PAD_Y * 2);

  const points = series.map((p) => `${xFor(p.date)},${yFor(p.weight)}`).join(' ');
  const last = series[series.length - 1];
  const lastX = xFor(last.date);
  const lastY = yFor(last.weight);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 150 }} preserveAspectRatio="xMidYMid meet">
      <line x1={PAD_X} y1={H - PAD_Y} x2={W - PAD_X} y2={H - PAD_Y} stroke="#EDEBFB" strokeWidth="1" />
      <polyline
        points={points}
        fill="none"
        stroke={C.purple}
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
            r={isLast ? 5 : 3}
            fill={isLast ? C.purple : '#fff'}
            stroke={C.purple}
            strokeWidth={isLast ? 0 : 2}
          />
        );
      })}
      <text
        x={Math.min(Math.max(lastX, 24), W - 24)}
        y={Math.max(lastY - 12, 12)}
        textAnchor="middle"
        fontSize="12"
        fontWeight="900"
        fill={C.purpleDark}
      >
        {last.weight}kg
      </text>
    </svg>
  );
}

// ─── Modal rápido de registro de peso (mesmo fluxo do FAB) ──────────────────
function QuickWeightModal({ cat, onClose, onSaved }) {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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
      onClose();
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

  const { deltaLabel, periodLabel, isDrop, isRise } = formatWeightDelta(weightSeries);

  return (
    <div className="bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-black uppercase tracking-[3px] text-[#8B4AFF]">Curva de peso</p>
        <button onClick={onOpenQuickWeight} className="text-[11px] font-black" style={{ color: C.purple }}>
          + Pesar
        </button>
      </div>
      <p
        className="text-3xl font-black tracking-tight mb-3"
        style={{ color: isDrop ? C.red : isRise ? C.amber : C.green }}
      >
        {deltaLabel}
        <span className="text-sm font-bold text-gray-400 ml-1.5">em {periodLabel}</span>
      </p>
      <WeightChart series={weightSeries} />
    </div>
  );
}

// ─── Bloco 2 — Marcos ────────────────────────────────────────────────────────
function MarcosBlock({ marcos, onOpenTab }) {
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
function PatternBlock({ alerts }) {
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
