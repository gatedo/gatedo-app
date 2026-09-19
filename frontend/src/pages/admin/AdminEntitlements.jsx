import React, { useState } from 'react';
import { Search, Trash2, PlusCircle, KeyRound, Clock } from 'lucide-react';
import api from '../../services/api';

const C = { purple: '#8B4AFF', purpleDark: '#4B40C6' };

export default function AdminEntitlements() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [granting, setGranting] = useState(false);

  const search = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/entitlements/admin/search', { params: { email: email.trim() } });
      setResult(r.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erro ao buscar.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const grant = async () => {
    if (!email.trim() || !newProductId.trim()) return;
    setGranting(true);
    try {
      await api.post('/entitlements/admin/grant', { email: email.trim(), productId: newProductId.trim() });
      setNewProductId('');
      await search();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erro ao conceder.');
    } finally {
      setGranting(false);
    }
  };

  const revoke = async (userId, productId) => {
    if (!window.confirm(`Remover o acesso a "${productId}"?`)) return;
    try {
      await api.post('/entitlements/admin/revoke', { userId, productId });
      await search();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erro ao remover.');
    }
  };

  const revokePending = async (id) => {
    if (!window.confirm('Cancelar esta liberação pendente?')) return;
    try {
      await api.post('/entitlements/admin/revoke-pending', { id });
      await search();
    } catch {
      // silencioso
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-800">Produtos Liberados</h1>
        <p className="text-sm text-gray-400 font-medium mt-1">
          Conceda ou remova acesso a produtos por e-mail — usado pelo webhook da Kiwify e manualmente aqui.
        </p>
      </div>

      <form onSubmit={search} className="flex gap-2 max-w-lg">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
          <Search size={16} className="text-gray-300" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@tutor.com"
            type="email"
            className="flex-1 text-sm font-medium outline-none bg-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-3 rounded-2xl font-black text-white text-sm"
          style={{ background: `linear-gradient(135deg, ${C.purple} 0%, ${C.purpleDark} 100%)` }}
        >
          Buscar
        </button>
      </form>

      {error && <p className="text-sm font-bold text-red-500">{error}</p>}

      {result && (
        <div className="max-w-2xl space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            {result.user ? (
              <p className="text-sm font-bold text-gray-700">
                Conta encontrada: <span className="text-gray-900">{result.user.name}</span> ({result.user.email})
              </p>
            ) : (
              <p className="text-sm font-bold text-amber-600">
                Nenhuma conta com este e-mail ainda — liberações ficam pendentes até o primeiro login/cadastro.
              </p>
            )}
          </div>

          {/* Conceder manualmente */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex gap-2">
            <input
              value={newProductId}
              onChange={(e) => setNewProductId(e.target.value)}
              placeholder="id do produto (ex.: ebook-cuidados-basicos)"
              className="flex-1 text-sm font-medium outline-none bg-gray-50 rounded-xl px-3 py-2.5"
            />
            <button
              onClick={grant}
              disabled={granting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-black text-white text-xs"
              style={{ background: C.purple }}
            >
              <PlusCircle size={14} /> Conceder
            </button>
          </div>

          {/* Liberados */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-wide text-gray-400 mb-2">Produtos liberados</p>
            {result.granted.length === 0 && <p className="text-xs text-gray-400 font-medium">Nenhum ainda.</p>}
            <div className="space-y-1.5">
              {result.granted.map((g) => (
                <div key={g.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
                  <KeyRound size={14} className="text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-800 truncate">{g.productId}</p>
                    <p className="text-[10px] font-bold text-gray-400">
                      {g.source} · {new Date(g.grantedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button onClick={() => revoke(g.userId, g.productId)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pendentes */}
          {result.pending.length > 0 && (
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-gray-400 mb-2">Pendentes (sem conta ainda)</p>
              <div className="space-y-1.5">
                {result.pending.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <Clock size={14} className="text-amber-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-gray-800 truncate">{p.productId}</p>
                      <p className="text-[10px] font-bold text-gray-400">
                        {p.source} · criado em {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button onClick={() => revokePending(p.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
