import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users, Cat, Activity, Target, Repeat, RefreshCw, Loader2, HeartPulse, BookHeart, Brain,
  FileText, Inbox, Building2, Lightbulb, PenLine, Megaphone, KeyRound, Filter, LineChart,
  AlertTriangle, CheckCircle2, ChevronRight, UserPlus, Sparkles,
} from 'lucide-react';
import api from '../../services/api';

const P = '#8B4AFF';
const INK = { primary: '#1F2937', secondary: '#6B7280', muted: '#9CA3AF' };
const STATUS = {
  good: { fg: '#047857', bg: '#ECFDF5', icon: CheckCircle2, label: 'Dentro do orçamento' },
  warning: { fg: '#B45309', bg: '#FFFBEB', icon: AlertTriangle, label: 'Atenção: acima de 80%' },
  critical: { fg: '#B91C1C', bg: '#FEF2F2', icon: AlertTriangle, label: 'Orçamento estourado' },
};

const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('pt-BR'));
const fmtPct = (n) => (n === null || n === undefined ? '—' : `${String(n).replace('.', ',')}%`);

function timeAgo(value) {
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} d`;
}

function Card({ title, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 ${className}`}>
      {title ? (
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            {Icon ? <Icon size={15} style={{ color: P }} /> : null}
            <h3 className="text-[12px] font-black uppercase tracking-[0.16em]" style={{ color: INK.secondary }}>{title}</h3>
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

function Kpi({ icon: Icon, label, value, sub, delta }) {
  const up = delta !== undefined && delta !== null && delta > 0;
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${P}12` }}>
          <Icon size={15} style={{ color: P }} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: INK.muted }}>{label}</p>
      </div>
      <p className="text-2xl font-black leading-none" style={{ color: INK.primary }}>{value}</p>
      {sub ? (
        <p className="text-[12px] font-bold mt-1.5" style={{ color: INK.secondary }}>
          {up ? <span style={{ color: STATUS.good.fg }}>▲ </span> : null}{sub}
        </p>
      ) : null}
    </div>
  );
}

// Uma série só (cadastros/dia): barras finas, topo arredondado, 2px de
// respiro, tooltip por barra e tabela alternativa. Sem legenda: o título
// nomeia a série.
function SignupsChart({ data }) {
  const [hover, setHover] = useState(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  const label = (iso) => {
    const [, m, d] = iso.split('-');
    return `${d}/${m}`;
  };

  return (
    <Card
      title="Cadastros · últimos 30 dias"
      icon={UserPlus}
      action={(
        <button type="button" onClick={() => setAsTable((v) => !v)} className="text-[10px] font-black uppercase tracking-wider" style={{ color: P }}>
          {asTable ? 'Ver gráfico' : 'Ver tabela'}
        </button>
      )}
    >
      <p className="text-3xl font-black leading-none mb-4" style={{ color: INK.primary }}>
        {fmt(total)} <span className="text-[12px] font-bold" style={{ color: INK.secondary }}>novos tutores</span>
      </p>

      {asTable ? (
        <div className="max-h-56 overflow-y-auto rounded-2xl border border-gray-100">
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50 sticky top-0">
              <tr><th className="text-left px-3 py-2 font-black" style={{ color: INK.secondary }}>Dia</th><th className="text-right px-3 py-2 font-black" style={{ color: INK.secondary }}>Cadastros</th></tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.date} className="border-t border-gray-50">
                  <td className="px-3 py-1.5" style={{ color: INK.primary }}>{label(d.date)}</td>
                  <td className="px-3 py-1.5 text-right font-bold" style={{ color: INK.primary }}>{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <div className="flex items-end h-40 border-b border-gray-200" style={{ gap: 2 }} onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <div
                key={d.date}
                className="flex-1 h-full flex items-end cursor-default"
                onMouseEnter={() => setHover(i)}
                onTouchStart={() => setHover(i)}
                role="img"
                aria-label={`${label(d.date)}: ${d.count} cadastros`}
              >
                <div
                  className="w-full"
                  style={{
                    height: d.count ? `${Math.max(4, (d.count / max) * 100)}%` : 2,
                    background: d.count ? P : '#E5E7EB',
                    borderRadius: '4px 4px 0 0',
                    opacity: hover === null || hover === i ? 1 : 0.45,
                    transition: 'opacity 120ms',
                  }}
                />
              </div>
            ))}
          </div>
          {hover !== null ? (
            <div
              className="absolute -top-2 pointer-events-none bg-[#1F2937] text-white rounded-xl px-2.5 py-1.5 text-[12px] font-bold shadow-lg whitespace-nowrap"
              style={{ left: `${((hover + 0.5) / data.length) * 100}%`, transform: 'translate(-50%, -100%)' }}
            >
              {label(data[hover].date)} · {data[hover].count} cadastro{data[hover].count === 1 ? '' : 's'}
            </div>
          ) : null}
          <div className="flex justify-between mt-1.5 text-[10px] font-bold" style={{ color: INK.muted }}>
            <span>{data[0] ? label(data[0].date) : ''}</span>
            <span>{data[15] ? label(data[15].date) : ''}</span>
            <span>hoje</span>
          </div>
        </div>
      )}
    </Card>
  );
}

function Metric({ icon: Icon, label, value, note, tone }) {
  return (
    <div className="rounded-2xl bg-gray-50 border border-gray-100 px-3.5 py-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} style={{ color: P }} />
        <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: INK.muted }}>{label}</p>
      </div>
      <p className="text-xl font-black leading-none" style={{ color: INK.primary }}>{value}</p>
      {note ? <p className="text-[10px] font-bold mt-1" style={{ color: tone || INK.secondary }}>{note}</p> : null}
    </div>
  );
}

function AiBudget({ budget }) {
  if (!budget) return null;
  const ratio = budget.ratioPercent;
  const state = ratio === null ? null : ratio >= 100 ? 'critical' : ratio >= 80 ? 'warning' : 'good';
  const st = state ? STATUS[state] : null;
  const StIcon = st?.icon;
  return (
    <div className="mt-3 rounded-2xl border border-gray-100 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: INK.muted }}>Gasto de IA no mês</p>
        {st ? (
          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full" style={{ background: st.bg, color: st.fg }}>
            <StIcon size={11} /> {st.label}
          </span>
        ) : null}
      </div>
      <p className="text-lg font-black mt-1" style={{ color: INK.primary }}>
        US$ {Number(budget.spend || 0).toFixed(2).replace('.', ',')}
        {budget.budget ? <span className="text-[12px] font-bold" style={{ color: INK.secondary }}> de US$ {Number(budget.budget).toFixed(2).replace('.', ',')}</span> : null}
      </p>
      {budget.budget ? (
        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden" role="meter" aria-valuenow={ratio} aria-valuemin={0} aria-valuemax={100} aria-label="Gasto de IA">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, ratio || 0)}%`, background: st ? st.fg : P }} />
        </div>
      ) : (
        <p className="text-[10px] font-bold mt-1" style={{ color: INK.muted }}>Sem teto definido (variável AI_MONTHLY_BUDGET).</p>
      )}
      <p className="text-[10px] font-bold mt-2" style={{ color: INK.secondary }}>
        {fmt(budget.questions)} perguntas · média de US$ {Number(budget.avgCostPerQuestion || 0).toFixed(4).replace('.', ',')} cada
      </p>
    </div>
  );
}

function PendingRow({ icon: Icon, label, count, onClick }) {
  const has = count > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-colors hover:bg-gray-50 border border-gray-100"
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: has ? `${P}12` : '#F3F4F6' }}>
        <Icon size={15} style={{ color: has ? P : INK.muted }} />
      </div>
      <p className="flex-1 text-[13px] font-bold" style={{ color: has ? INK.primary : INK.muted }}>{label}</p>
      <span
        className="min-w-[28px] text-center text-[12px] font-black px-2 py-0.5 rounded-full"
        style={has ? { background: P, color: '#fff' } : { background: '#F3F4F6', color: INK.muted }}
      >
        {count}
      </span>
      <ChevronRight size={14} style={{ color: INK.muted }} />
    </button>
  );
}

const ACTIVITY_ICON = { user: UserPlus, pet: Cat, igent: Brain, igent_urgent: AlertTriangle };

export default function AdminOverview({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: d } = await api.get('/analytics/overview');
      setData(d);
    } catch (err) {
      setError(err?.response?.data?.message || 'Não foi possível carregar a visão geral.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const go = (tab) => onNavigate?.(tab);

  const weekDelta = useMemo(() => {
    if (!data) return {};
    const k = data.kpis;
    return {
      users: `${k.users.thisWeek >= 0 ? '+' : ''}${fmt(k.users.thisWeek)} esta semana (ant.: ${fmt(k.users.prevWeek)})`,
      pets: `${k.pets.thisWeek >= 0 ? '+' : ''}${fmt(k.pets.thisWeek)} esta semana (ant.: ${fmt(k.pets.prevWeek)})`,
    };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin" style={{ color: P }} size={28} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-[28px] border border-gray-100 p-8 text-center">
        <AlertTriangle className="mx-auto mb-2" style={{ color: STATUS.warning.fg }} />
        <p className="font-black" style={{ color: INK.primary }}>{error}</p>
        <button type="button" onClick={load} className="mt-4 px-4 py-2 rounded-xl text-white text-sm font-black" style={{ background: P }}>Tentar de novo</button>
      </div>
    );
  }

  const { kpis, product, pending, activity, signups30d } = data;
  const pendingTotal = pending.feedbackNew + pending.ongPending + pending.ongSuggestionsNew;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black" style={{ color: INK.primary }}>Visão geral</h2>
          <p className="text-[12px] font-bold" style={{ color: INK.muted }}>
            Atualizado {timeAgo(data.generatedAt) === 'agora' ? 'agora' : `há ${timeAgo(data.generatedAt)}`}
            {pendingTotal ? ` · ${pendingTotal} pendência${pendingTotal === 1 ? '' : 's'} esperando você` : ' · nada pendente'}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-100 shadow-sm text-[12px] font-black disabled:opacity-60"
          style={{ color: P }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {/* 1 — números que importam com o app gratuito */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi icon={Users} label="Tutores" value={fmt(kpis.users.total)} sub={weekDelta.users} delta={kpis.users.thisWeek - kpis.users.prevWeek} />
        <Kpi icon={Cat} label="Gatos ativos" value={fmt(kpis.pets.total)} sub={weekDelta.pets} delta={kpis.pets.thisWeek - kpis.pets.prevWeek} />
        <Kpi icon={Activity} label="Ativos em 7 dias" value={fmt(kpis.active7d)} sub={`${fmtPct(kpis.users.total ? Math.round((kpis.active7d / kpis.users.total) * 1000) / 10 : null)} da base`} />
        <Kpi
          icon={Target}
          label="Ativação (30 dias)"
          value={fmtPct(kpis.activation.withPetPercent)}
          sub={`cadastraram gato · ${fmtPct(kpis.activation.withRecordPercent)} já fizeram registro (${fmt(kpis.activation.newUsers30d)} novos)`}
        />
        <Kpi
          icon={Repeat}
          label="Retenção semana 1"
          value={fmtPct(kpis.retentionW1.percent)}
          sub={`${fmt(kpis.retentionW1.retained)} de ${fmt(kpis.retentionW1.eligible)} voltaram após 7 dias`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 2 — cadastros */}
        <div className="lg:col-span-2">
          <SignupsChart data={signups30d} />
        </div>

        {/* 4 — pendências */}
        <Card title="Pendências" icon={Inbox}>
          <div className="space-y-2">
            <PendingRow icon={Inbox} label="Mensagens e sugestões novas" count={pending.feedbackNew} onClick={() => go('feedback')} />
            <PendingRow icon={Building2} label="ONGs aguardando aprovação" count={pending.ongPending} onClick={() => go('ong')} />
            <PendingRow icon={Lightbulb} label="Indicações de ONG novas" count={pending.ongSuggestionsNew} onClick={() => go('ong')} />
            <PendingRow icon={PenLine} label="Guias em rascunho" count={pending.guideDrafts} onClick={() => go('guides')} />
            <PendingRow icon={Megaphone} label="Comunicados no ar" count={pending.activeNotices} onClick={() => go('notices')} />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* 3 — saúde do produto */}
        <Card title="Uso do produto · 7 dias" icon={HeartPulse} className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <Metric icon={HeartPulse} label="Registros de saúde" value={fmt(product.healthRecords7d)} />
            <Metric icon={BookHeart} label="Entradas no diário" value={fmt(product.diary7d)} />
            <Metric
              icon={Brain}
              label="Análises iGentVet"
              value={fmt(product.igent7d)}
              note={product.igentUrgent7d ? `${product.igentUrgent7d} urgente${product.igentUrgent7d === 1 ? '' : 's'}` : 'nenhuma urgente'}
              tone={product.igentUrgent7d ? STATUS.critical.fg : INK.secondary}
            />
            <Metric icon={FileText} label="Laudos IA salvos" value={fmt(product.reports7d)} />
          </div>
          <AiBudget budget={product.aiBudget} />
        </Card>

        {/* 5 — atividade recente */}
        <Card title="Atividade recente" icon={Sparkles}>
          {activity.length === 0 ? (
            <p className="text-[12px] font-bold" style={{ color: INK.muted }}>Nada por aqui ainda.</p>
          ) : (
            <ul className="space-y-2.5">
              {activity.map((a, i) => {
                const Icon = ACTIVITY_ICON[a.type] || Sparkles;
                const urgent = a.type === 'igent_urgent';
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: urgent ? STATUS.critical.bg : `${P}10` }}>
                      <Icon size={13} style={{ color: urgent ? STATUS.critical.fg : P }} />
                    </div>
                    <p className="flex-1 text-[12px] leading-snug" style={{ color: INK.primary }}>{a.text}</p>
                    <span className="text-[10px] font-bold flex-shrink-0" style={{ color: INK.muted }}>{timeAgo(a.at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      {/* 6 — atalhos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Megaphone, label: 'Novo comunicado', tab: 'notices' },
          { icon: KeyRound, label: 'Liberar acesso', tab: 'entitlements' },
          { icon: Filter, label: 'Funil de ativação', tab: 'funil' },
          { icon: LineChart, label: 'Analytics completo', tab: 'analytics' },
        ].map((s) => (
          <button
            key={s.tab}
            type="button"
            onClick={() => go(s.tab)}
            className="flex items-center gap-2.5 rounded-2xl bg-white border border-gray-100 shadow-sm px-4 py-3.5 text-left hover:border-[#8B4AFF40] transition-colors"
          >
            <s.icon size={16} style={{ color: P }} />
            <span className="text-[12px] font-black" style={{ color: INK.primary }}>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
