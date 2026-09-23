import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, HeartHandshake, Megaphone } from 'lucide-react';
import api from '../../services/api';

const C = { purple: '#8B4AFF' };

const TABS = [
  { id: 'PENDING', label: 'Pendentes' },
  { id: 'APPROVED', label: 'Aprovadas' },
  { id: 'REJECTED', label: 'Rejeitadas' },
];

export default function AdminOng() {
  const [tab, setTab] = useState('PENDING');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/admin/ong/applications', { params: { status: tab } }),
      api.get('/admin/ong/transfer-stats'),
      api.get('/admin/ong/suggestions'),
    ])
      .then(([apps, s, sug]) => {
        setList(Array.isArray(apps.data) ? apps.data : []);
        setStats(s.data);
        setSuggestions(Array.isArray(sug.data) ? sug.data : []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]); // eslint-disable-line

  const markSeen = async (id) => {
    await api.post(`/admin/ong/suggestions/${id}/seen`);
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status: 'SEEN' } : s)));
  };

  const approve = async (id) => {
    await api.post(`/admin/ong/${id}/approve`);
    load();
  };

  const reject = async (id) => {
    const reason = window.prompt('Motivo da rejeição (opcional):') || undefined;
    await api.post(`/admin/ong/${id}/reject`, { reason });
    load();
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <HeartHandshake size={20} style={{ color: C.purple }} />
        <h1 className="text-xl font-black text-gray-900">ONGs parceiras</h1>
      </div>
      <p className="text-[12px] font-medium text-gray-500 mb-5">Aprovação de contas ONG e acompanhamento de transferências de tutoria.</p>

      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Convites gerados', value: stats.convitesGerados },
            { label: 'Convites aceitos', value: stats.convitesAceitos },
            { label: 'Adotantes únicos', value: stats.adotantesUnicos },
            { label: 'Retenção 7 dias', value: stats.retencao7dias != null ? `${Math.round(stats.retencao7dias * 100)}%` : '—' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-2xl font-black text-gray-800">{s.value}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-full text-[11px] font-black"
            style={tab === t.id ? { background: C.purple, color: '#fff' } : { background: '#F3F4F6', color: '#6B7280' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[12px] font-medium text-gray-400">Carregando...</p>
      ) : list.length === 0 ? (
        <p className="text-[12px] font-medium text-gray-400">Nenhuma solicitação nesse status.</p>
      ) : (
        <div className="space-y-2.5">
          {list.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-black text-gray-800">{app.name}</p>
                <p className="text-[11px] font-medium text-gray-500">{app.cnpjOuResponsavel} · {app.city || 'sem cidade'} · {app.instagram || 'sem instagram'}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-0.5">Conta: {app.user?.email} · pedido em {new Date(app.requestedAt).toLocaleDateString('pt-BR')}</p>
                {app.status === 'REJECTED' && app.rejectionReason && (
                  <p className="text-[10px] font-bold mt-1" style={{ color: '#DC2626' }}>Motivo: {app.rejectionReason}</p>
                )}
              </div>
              {app.status === 'PENDING' ? (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => approve(app.id)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#ECFDF5' }}>
                    <CheckCircle2 size={16} style={{ color: '#10B981' }} />
                  </button>
                  <button onClick={() => reject(app.id)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FEF2F2' }}>
                    <XCircle size={16} style={{ color: '#DC2626' }} />
                  </button>
                </div>
              ) : app.status === 'APPROVED' ? (
                <CheckCircle2 size={18} style={{ color: '#10B981' }} className="shrink-0" />
              ) : (
                <XCircle size={18} style={{ color: '#DC2626' }} className="shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-10 mb-4">
        <Megaphone size={18} style={{ color: C.purple }} />
        <h2 className="text-[15px] font-black text-gray-900">Sugestões das ONGs</h2>
        {suggestions.some((s) => s.status === 'NEW') && (
          <span className="text-[10px] font-black text-white rounded-full px-2 py-0.5" style={{ background: '#DC2626' }}>
            {suggestions.filter((s) => s.status === 'NEW').length} nova(s)
          </span>
        )}
      </div>

      {suggestions.length === 0 ? (
        <p className="text-[12px] font-medium text-gray-400">Nenhuma sugestão enviada ainda.</p>
      ) : (
        <div className="space-y-2.5">
          {suggestions.map((s) => (
            <div key={s.id} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-start gap-3"
              style={s.status === 'NEW' ? { borderColor: '#F1E9FF', background: '#FAF8FF' } : undefined}>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-gray-700 leading-relaxed">{s.message}</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1.5">
                  {s.user?.ongProfile?.name || s.user?.name || s.user?.email} · {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {s.status === 'NEW' && (
                <button onClick={() => markSeen(s.id)} className="shrink-0 text-[10px] font-black px-2.5 py-1.5 rounded-lg" style={{ background: '#F3F4F6', color: '#6B7280' }}>
                  Marcar como visto
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
