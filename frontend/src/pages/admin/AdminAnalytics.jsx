import React, { useEffect, useState } from 'react';
import { UserPlus, Activity, Repeat, ClipboardList, Bot, ClipboardCheck } from 'lucide-react';
import api from '../../services/api';

const C = { purple: '#8B4AFF' };

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} style={{ color: C.purple }} />
        <h2 className="text-sm font-black text-gray-800">{title}</h2>
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

export default function AdminAnalytics() {
  const [signups, setSignups] = useState([]);
  const [activation, setActivation] = useState(null);
  const [retention, setRetention] = useState([]);
  const [records, setRecords] = useState([]);
  const [igentUsage, setIgentUsage] = useState([]);
  const [protocolConv, setProtocolConv] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/signups').then((r) => setSignups(r.data)).catch(() => {}),
      api.get('/analytics/activation').then((r) => setActivation(r.data)).catch(() => {}),
      api.get('/analytics/retention').then((r) => setRetention(r.data)).catch(() => {}),
      api.get('/analytics/records').then((r) => setRecords(r.data)).catch(() => {}),
      api.get('/analytics/igent-usage').then((r) => setIgentUsage(r.data)).catch(() => {}),
      api.get('/analytics/protocol-conversion').then((r) => setProtocolConv(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const totalCost = igentUsage.reduce((acc, u) => acc + (u.estimatedCostUsd || 0), 0);
  const totalQuestions = igentUsage.reduce((acc, u) => acc + (u.questions || 0), 0);

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Analytics do Produto</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">Cadastro, ativação, retenção, uso e custo — tudo num lugar só.</p>
      </div>

      {loading && <p className="text-sm font-medium text-gray-400">Carregando...</p>}

      <Section icon={UserPlus} title="Cadastros por dia e origem (últimos 60 dias)">
        <Table
          columns={[
            { key: 'date', label: 'Data' },
            { key: 'source', label: 'Origem' },
            { key: 'count', label: 'Cadastros' },
          ]}
          rows={signups}
        />
      </Section>

      <Section icon={Activity} title="Ativação — cadastrou o primeiro gato?">
        {activation && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-gray-800">{activation.totalUsers}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Usuários</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-emerald-600">{activation.activationRatePercent}%</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Ativados</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-gray-800">{activation.notActivated}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Não ativados</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xl font-black text-gray-800">
                {activation.avgHoursToActivate != null ? `${activation.avgHoursToActivate}h` : '—'}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Tempo médio</p>
            </div>
          </div>
        )}
      </Section>

      <Section icon={Repeat} title="Retenção D7 e D30 por coorte de cadastro (semana)">
        <p className="text-[10px] font-medium text-gray-400 mb-3">
          Retido = último login registrado aconteceu 7 (ou 30) dias ou mais depois do cadastro.
        </p>
        <Table
          columns={[
            { key: 'cohortWeekStart', label: 'Semana' },
            { key: 'totalUsers', label: 'Usuários' },
            { key: 'd7', label: 'D7', render: (r) => (r.d7RetentionPercent != null ? `${r.d7RetentionPercent}% (${r.d7Eligible})` : '—') },
            { key: 'd30', label: 'D30', render: (r) => (r.d30RetentionPercent != null ? `${r.d30RetentionPercent}% (${r.d30Eligible})` : '—') },
          ]}
          rows={retention}
        />
      </Section>

      <Section icon={ClipboardList} title="Registros por tipo e por usuário">
        <Table
          columns={[
            { key: 'name', label: 'Tutor' },
            { key: 'peso', label: 'Peso' },
            { key: 'vacina', label: 'Vacina' },
            { key: 'vermifugo', label: 'Vermífugo' },
            { key: 'antipulgas', label: 'Antipulgas' },
            { key: 'medicacao', label: 'Medicação' },
            { key: 'consulta', label: 'Consulta' },
            { key: 'cirurgia', label: 'Cirurgia' },
            { key: 'exame', label: 'Exame' },
            { key: 'diario', label: 'Diário' },
            { key: 'total', label: 'Total' },
          ]}
          rows={records}
        />
      </Section>

      <Section icon={Bot} title="Perguntas ao iGentVet por usuário e custo estimado">
        <div className="flex gap-4 mb-3">
          <p className="text-xs font-bold text-gray-500">
            Total: <span className="text-gray-800">{totalQuestions} perguntas</span>
          </p>
          <p className="text-xs font-bold text-gray-500">
            Custo estimado total: <span className="text-gray-800">US$ {totalCost.toFixed(4)}</span>
          </p>
        </div>
        <Table
          columns={[
            { key: 'name', label: 'Tutor' },
            { key: 'questions', label: 'Perguntas' },
            { key: 'totalTokens', label: 'Tokens' },
            { key: 'estimatedCostUsd', label: 'Custo (US$)', render: (r) => r.estimatedCostUsd.toFixed(4) },
          ]}
          rows={igentUsage}
        />
      </Section>

      <Section icon={ClipboardCheck} title="Conversão por produto — protocolos">
        <Table
          columns={[
            { key: 'title', label: 'Protocolo' },
            { key: 'enrolled', label: 'Inscritos' },
            { key: 'completed', label: 'Concluíram' },
            { key: 'completionRatePercent', label: '% Conclusão', render: (r) => `${r.completionRatePercent}%` },
            { key: 'resolved', label: 'Resolveram' },
            { key: 'resolvedRatePercent', label: '% Resolvidos', render: (r) => `${r.resolvedRatePercent}%` },
          ]}
          rows={protocolConv}
          emptyLabel="Nenhum protocolo publicado ainda."
        />
      </Section>
    </div>
  );
}
