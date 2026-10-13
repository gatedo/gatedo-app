/**
 * Aba "Buscar ofertas" do admin da Loja: busca no Mercado Livre (conta
 * conectada) ou na API de afiliados da Shopee — sempre pelo backend — e
 * cadastra como RASCUNHO.
 */
import React, { useEffect, useState } from 'react';
import { AlertTriangle, BadgeCheck, Check, Loader2, Plus, RefreshCw, Search, SlidersHorizontal, Star } from 'lucide-react';
import api from '../../services/api';

const SHORT_NAME_MAX = 40;
const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const SOURCES = { ml: 'Mercado Livre', shopee: 'Shopee' };

export default function AdminStoreOfferSearch({ categoryOptions, onRegistered, mlResult }) {
  const [status, setStatus] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [filters, setFilters] = useState({ minRating: 4.7, minSales: 100, hideDog: true, hideMedicine: true });
  const [showFilters, setShowFilters] = useState(false);
  const [result, setResult] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [names, setNames] = useState({});
  const [saving, setSaving] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [connectingMl, setConnectingMl] = useState(false);
  const [source, setSource] = useState('shopee');

  useEffect(() => {
    api.get('/store-affiliate/status').then((r) => {
      setStatus(r.data);
      if (r.data?.defaultFilters) setFilters(r.data.defaultFilters);
      // Abre no ML quando ele está conectado e a Shopee ainda é mock.
      if (r.data?.mercadoLivre?.connected && r.data?.shopee?.mock) setSource('ml');
    }).catch(() => setStatus(null));
  }, []);

  const changeSource = (next) => {
    setSource(next);
    setResult(null);
    setError('');
  };

  useEffect(() => {
    if (!category && categoryOptions.length) setCategory(categoryOptions[0]);
  }, [categoryOptions, category]);

  const search = async (e) => {
    e?.preventDefault();
    if (keyword.trim().length < 2) return;
    setSearching(true);
    setError('');
    try {
      const r = await api.post(`/store-affiliate/${source}/search`, { keyword: keyword.trim(), filters });
      setResult(r.data);
      setNames(Object.fromEntries(r.data.offers.map((o) => [o.itemId, o.suggestedName])));
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao buscar ofertas.');
    } finally {
      setSearching(false);
    }
  };

  const register = async (offer) => {
    const name = (names[offer.itemId] || '').trim();
    if (!name) { alert('Dê um nome curto ao produto.'); return; }
    if (!category) { alert('Escolha a categoria.'); return; }
    setSaving((s) => ({ ...s, [offer.itemId]: true }));
    try {
      const r = await api.post(`/store-affiliate/${offer.source || source}/register`, { itemId: offer.itemId, name, categoryName: category, mlKind: offer.mlKind });
      onRegistered?.(r.data);
      setResult((prev) => ({
        ...prev,
        offers: prev.offers.map((o) => o.itemId === offer.itemId ? { ...o, registeredProduct: { id: r.data.id, status: 'draft' } } : o),
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao cadastrar.');
    } finally {
      setSaving((s) => ({ ...s, [offer.itemId]: false }));
    }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const r = await api.post('/store-affiliate/sync/run');
      alert(r.data?.skipped || `Atualizados ${r.data.updated} de ${r.data.checked} · ${r.data.alerts} alerta(s)${r.data.failed ? ` · ${r.data.failed} falha(s)` : ''}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Erro na sincronização.');
    } finally {
      setSyncing(false);
    }
  };

  const shopeeMock = status ? status.shopee?.mock : result?.mock;
  const mock = source === 'shopee' && shopeeMock;
  const ml = status?.mercadoLivre;

  // OAuth do ML: o backend devolve a URL de autorização; o ML volta em
  // /api/store-affiliate/ml/callback e o backend redireciona para cá.
  const connectMl = async () => {
    setConnectingMl(true);
    try {
      const { data } = await api.get('/store-affiliate/ml/connect');
      window.location.href = data.url;
    } catch (err) {
      alert(err.response?.data?.message || 'Não consegui iniciar a conexão com o Mercado Livre.');
      setConnectingMl(false);
    }
  };

  return (
    <div className="space-y-4">
      {mock && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[12px] font-bold text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-black">API Shopee não configurada</p>
            <p className="font-medium">Modo mock: as ofertas abaixo são exemplos. Defina SHOPEE_AFF_APP_ID e SHOPEE_AFF_SECRET no backend para buscar de verdade. O que for cadastrado agora entra marcado como mock.</p>
          </div>
        </div>
      )}

      {mlResult && (
        <div className={`rounded-2xl p-3 text-[12px] font-bold ${mlResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {mlResult.ok ? 'Mercado Livre conectado. Já dá para colar link/MLB no cadastro.' : `Mercado Livre: ${mlResult.msg || 'falha ao conectar.'}`}
        </div>
      )}

      {ml && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-yellow-200 bg-yellow-50 p-3 text-[12px] font-bold text-gray-700">
          <span>
            <span className="font-black">Mercado Livre:</span>{' '}
            {!ml.configured ? 'app não configurado (ML_CLIENT_ID / ML_CLIENT_SECRET no backend)'
              : ml.connected ? <span className="text-green-700">conta conectada ✓</span>
              : 'conta não conectada'}
          </span>
          {ml.configured && (
            <button onClick={connectMl} disabled={connectingMl}
              className="flex items-center gap-1.5 rounded-xl bg-yellow-400 px-3 py-2 text-[11px] font-black text-gray-900 disabled:opacity-50">
              {connectingMl ? <Loader2 size={12} className="animate-spin" /> : null}
              {ml.connected ? 'Reconectar Mercado Livre' : 'Conectar Mercado Livre'}
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2 bg-gray-100 p-1 rounded-2xl w-fit">
        {Object.entries(SOURCES).map(([key, label]) => (
          <button key={key} type="button" onClick={() => changeSource(key)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${source === key ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>
            {label}
            {key === 'ml' && ml && !ml.connected && <span className="ml-1 text-[10px] text-red-400">(desconectado)</span>}
            {key === 'shopee' && shopeeMock && <span className="ml-1 text-[10px] text-amber-500">(mock)</span>}
          </button>
        ))}
      </div>

      {source === 'ml' && (
        <p className="text-[11px] font-bold text-gray-400">
          Mercado Livre: a API não informa comissão de afiliado nem nota, então a lista segue a relevância do ML e os filtros de nota/vendas só valem quando o dado existe.
          Os links de afiliado continuam manuais (botão Compartilhar do ML).
        </p>
      )}

      <form onSubmit={search} className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[220px]">
          <label className="lbl">Buscar {source === 'ml' ? 'no Mercado Livre' : 'na Shopee'}</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} className="inp !pl-9" placeholder="fonte para gato, arranhador, churu…" />
          </div>
        </div>
        <div className="w-48">
          <label className="lbl">Categoria do cadastro</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="inp">
            {categoryOptions.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${showFilters ? 'border-[#8B4AFF] text-[#8B4AFF]' : 'border-gray-200 text-gray-500'}`}>
          <SlidersHorizontal size={14} /> Filtros
        </button>
        <button type="submit" disabled={searching || keyword.trim().length < 2 || (source === 'ml' && !ml?.connected)}
          className="bg-[#8B4AFF] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:brightness-110 disabled:opacity-40">
          {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Buscar
        </button>
      </form>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-gray-50 p-3 text-[12px] font-bold text-gray-600">
          <label className="flex items-center gap-2">Nota ≥
            <input type="number" step="0.1" min="0" max="5" value={filters.minRating}
              onChange={(e) => setFilters((f) => ({ ...f, minRating: Number(e.target.value) }))} className="flt w-20" />
          </label>
          <label className="flex items-center gap-2">Vendas ≥
            <input type="number" min="0" value={filters.minSales}
              onChange={(e) => setFilters((f) => ({ ...f, minSales: Number(e.target.value) }))} className="flt w-24" />
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={filters.hideDog} onChange={(e) => setFilters((f) => ({ ...f, hideDog: e.target.checked }))} />
            Esconder cão/dog/cachorro
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={filters.hideMedicine} onChange={(e) => setFilters((f) => ({ ...f, hideMedicine: e.target.checked }))} />
            Esconder medicamentos
          </label>
          <span className="text-gray-400 font-medium">Vale na próxima busca.</span>
        </div>
      )}

      {error && <p className="rounded-2xl bg-red-50 p-3 text-[12px] font-bold text-red-600">{error}</p>}

      {result && (
        <div className="flex items-center justify-between text-[12px] font-bold text-gray-400">
          <span>{result.offers.length} oferta(s) · {result.hidden} escondida(s) pelos filtros · {result.source === 'ml' ? 'ordem de relevância do Mercado Livre' : 'ordenado por comissão em R$'}</span>
        </div>
      )}

      {result && result.offers.length === 0 && (
        <div className="text-center py-12 text-gray-400 font-bold text-sm">Nenhuma oferta passou nos filtros.</div>
      )}

      {result?.offers.length > 0 && (
        <div className="overflow-x-auto rounded-[20px] border border-gray-100 bg-white">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-wide text-gray-400">
              <tr>
                <th className="p-3">Foto</th>
                <th className="p-3 min-w-[240px]">Nome</th>
                <th className="p-3">Preço</th>
                <th className="p-3">Comissão</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Nota</th>
                <th className="p-3">Vendas</th>
                <th className="p-3">Loja</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {result.offers.map((o) => {
                const name = names[o.itemId] ?? '';
                return (
                  <tr key={o.itemId} className="align-top">
                    <td className="p-3">
                      {o.images[0]
                        ? <img src={o.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover bg-gray-50" />
                        : <div className="h-14 w-14 rounded-xl bg-gray-100" />}
                    </td>
                    <td className="p-3">
                      {o.productLink
                        ? <a href={o.productLink} target="_blank" rel="noreferrer" className="line-clamp-2 text-gray-500 hover:text-[#8B4AFF] hover:underline" title={o.name}>{o.name}</a>
                        : <p className="line-clamp-2 text-gray-500" title={o.name}>{o.name}</p>}
                      <input value={name} maxLength={SHORT_NAME_MAX} disabled={!!o.registeredProduct}
                        onChange={(e) => setNames((n) => ({ ...n, [o.itemId]: e.target.value }))}
                        className="inp !py-1.5 mt-1.5 text-xs font-bold" placeholder="Nome curto" />
                      <p className={`mt-0.5 text-[10px] font-bold ${name.length > SHORT_NAME_MAX - 5 ? 'text-orange-500' : 'text-gray-300'}`}>{name.length}/{SHORT_NAME_MAX}</p>
                    </td>
                    <td className="p-3 font-black text-gray-700 whitespace-nowrap">{brl(o.price)}</td>
                    <td className="p-3 whitespace-nowrap">
                      {o.commissionValue === null ? <span className="text-gray-300 font-bold" title="A API do ML não informa comissão">—</span> : (
                        <>
                          <p className="font-black text-green-600">{brl(o.commissionValue)}</p>
                          <p className="text-gray-400 font-bold">{o.commissionPct}%</p>
                        </>
                      )}
                    </td>
                    <td className="p-3">
                      {o.commissionExtra === null ? <span className="text-gray-300 font-bold">—</span> : (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${o.commissionExtra ? 'bg-[#DFFF40] text-[#1a1a00]' : 'bg-gray-100 text-gray-500'}`}>
                          {o.commissionExtra ? 'EXTRA' : 'base'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap font-bold text-gray-600">
                      <span className="inline-flex items-center gap-0.5"><Star size={11} className="fill-yellow-400 text-yellow-400" />{o.rating ?? '—'}</span>
                    </td>
                    <td className="p-3 font-bold text-gray-600">{o.sales?.toLocaleString('pt-BR') ?? '—'}</td>
                    <td className="p-3">
                      {o.officialShop
                        ? <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-600"><BadgeCheck size={11} /> Oficial</span>
                        : <span className="text-[10px] font-bold text-gray-400">{o.shopName || '—'}</span>}
                    </td>
                    <td className="p-3">
                      {o.registeredProduct ? (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-green-50 px-3 py-2 text-[11px] font-black text-green-700 whitespace-nowrap">
                          <Check size={12} /> Cadastrado
                        </span>
                      ) : (
                        <button onClick={() => register(o)} disabled={saving[o.itemId] || !name.trim()}
                          className="inline-flex items-center gap-1 rounded-xl bg-[#8B4AFF] px-3 py-2 text-[11px] font-black text-white whitespace-nowrap disabled:opacity-40">
                          {saving[o.itemId] ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Cadastrar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-gray-50 p-3 text-[12px] text-gray-500">
        <p><span className="font-black">Rotina diária 7h:</span> atualiza preço e comissão dos produtos Shopee publicados e marca alerta (preço +15%, comissão caiu, saiu do ar). Nunca despublica.</p>
        <button onClick={runSync} disabled={syncing || shopeeMock}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[11px] font-black text-gray-600 disabled:opacity-40"
          title={mock ? 'Indisponível no modo mock' : 'Roda a atualização agora'}>
          <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} /> Rodar agora
        </button>
      </div>
    </div>
  );
}
