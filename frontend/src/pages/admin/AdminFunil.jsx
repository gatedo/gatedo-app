import React, { useEffect, useState } from 'react';
import { Filter, GitBranch, Repeat, DollarSign, Globe2 } from 'lucide-react';
import api from '../../services/api';

const C = { purple: '#8B4AFF' };
const PERIODS = [
  { value: '', label: 'Tudo' },
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
];

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: C.purple }} />
          <h2 className="text-sm font-black text-gray-800">{title}</h2>
        </div>
        {subtitle && <p className="text-[11px] font-medium text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Table({ columns, rows, emptyLabel = 'Sem dados ainda.' }) {
  if (!rows || rows.length === 0) {
    return <p className="text-xs font-medium text-gray-400 py-4 text-center">{emptyLabel}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-400 font-black uppercase tracking-wide text-[10px] border-b border-gray-100">
            {columns.map((c) => (
              <th key={c.key} className="py-2 pr-4">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 last:border-0">
              {columns.map((c) => (
                <td key={c.key} className="py-2 pr-4 font-bold text-gray-700 whitespace-nowrap">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminFunil() {
  const [days, setDays] = useState('30');
  const [utmSource, setUtmSource] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [funnel, setFunnel] = useState([]);
  const [retention, setRetention] = useState([]);
  const [monetization, setMonetization] = useState(null);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { days: days || undefined, utmSource: utmSource || undefined, utmCampaign: utmCampaign || undefined };
    Promise.all([
      api.get('/events/funnel', { params }).then((r) => setFunnel(r.data)).catch(() => setFunnel([])),
      api.get('/events/retention').then((r) => setRetention(r.data)).catch(() => setRetention([])),
      api.get('/events/monetization', { params: { days: days || undefined } }).then((r) => setMonetization(r.data)).catch(() => setMonetization(null)),
      api.get('/events/sources', { params: { days: days || undefined } }).then((r) => setSources(r.data)).catch(() => setSources([])),
    ]).finally(() => setLoading(false));
  }, [days, utmSource, utmCampaign]);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Funil de Ativação</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">
          Visitante → cadastro → gato → primeira pesagem → selo. Números, sem enfeite.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <Filter size={14} className="text-gray-400" />
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setDays(p.value)}
            className="px-3 py-1.5 rounded-full text-[11px] font-black"
            style={days === p.value ? { background: C.purple, color: '#fff' } : { background: '#F4F3FF', color: '#6b7280' }}
          >
            {p.label}
          </button>
        ))}
        <input
          value={utmSource}
          onChange={(e) => setUtmSource(e.target.value)}
          placeholder="utm_source"
          className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-gray-100 outline-none"
        />
        <input
          value={utmCampaign}
          onChange={(e) => setUtmCampaign(e.target.value)}
          placeholder="utm_campaign"
          className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-gray-100 outline-none"
        />
      </div>

      {loading && <p className="text-sm font-medium text-gray-400">Carregando...</p>}

      <Section icon={GitBranch} title="Funil de ativação" subtitle="Visitante LP não conta ainda — a LP (gatedo.com) não está integrada.">
        <Table
          columns={[
            { key: 'label', label: 'Etapa' },
            { key: 'count', label: 'Pessoas' },
            { key: 'percentOfPrevious', label: '% da etapa anterior', render: (r) => (r.percentOfPrevious != null ? `${r.percentOfPrevious}%` : '—') },
            { key: 'percentOfFirst', label: '% do topo', render: (r) => (r.percentOfFirst != null ? `${r.percentOfFirst}%` : '—') },
          ]}
          rows={funnel}
        />
      </Section>

      <Section icon={Repeat} title="Retenção D1, D7 e D30" subtitle="Por semana de cadastro. Retido = login registrado N+ dias depois do cadastro.">
        <Table
          columns={[
            { key: 'cohortWeekStart', label: 'Semana' },
            { key: 'totalUsers', label: 'Cadastros' },
            { key: 'd1', label: 'D1', render: (r) => (r.d1 != null ? `${r.d1}% (${r.d1Eligible})` : '—') },
            { key: 'd7', label: 'D7', render: (r) => (r.d7 != null ? `${r.d7}% (${r.d7Eligible})` : '—') },
            { key: 'd30', label: 'D30', render: (r) => (r.d30 != null ? `${r.d30}% (${r.d30Eligible})` : '—') },
          ]}
          rows={retention}
        />
      </Section>

      <Section icon={DollarSign} title="Monetização">
        {monetization && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-gray-800">{monetization.protocolViewed}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Viu protocolo</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-gray-800">{monetization.checkoutClicks}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Clicou comprar</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-emerald-600">{monetization.purchases}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Comprou</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-gray-800">{monetization.checkoutToPurchasePercent != null ? `${monetization.checkoutToPurchasePercent}%` : '—'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Clique → compra</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-gray-800">{monetization.pixClicks}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Clique no Pix</p>
            </div>
          </div>
        )}
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-wide mb-2">Cliques na loja por bloco</p>
        <Table
          columns={[
            { key: 'block', label: 'Bloco' },
            { key: 'count', label: 'Cliques' },
          ]}
          rows={monetization?.storeClicksByBlock}
        />
      </Section>

      <Section icon={Globe2} title="Origem — cadastros e ativação por UTM">
        <Table
          columns={[
            { key: 'source', label: 'utm_source' },
            { key: 'campaign', label: 'utm_campaign' },
            { key: 'signups', label: 'Cadastros' },
            { key: 'activated', label: 'Ativados (1ª pesagem)' },
          ]}
          rows={sources}
        />
      </Section>
    </div>
  );
}
