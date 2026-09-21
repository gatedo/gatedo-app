import React, { useEffect, useState } from 'react';
import { Search, Save, Loader2, ChevronLeft, ChevronDown, ChevronUp, Sparkles, KeyRound, Send } from 'lucide-react';
import api from '../../services/api';
import BlockEditor from '../../components/content/BlockEditor';
import { makeBlock, BLOCK_TYPES } from '../../components/content/blockTypes';

const C = { purple: '#8B4AFF' };
const fieldCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-700 outline-none focus:border-[#8B4AFF]';
const labelCls = 'text-[9px] font-black uppercase tracking-wide text-gray-400 mb-1 block';
const helpCls = 'text-[10px] text-gray-400 font-medium mt-1 leading-relaxed';

function centsToReais(cents) {
  return cents == null ? '' : (Number(cents) / 100).toFixed(2).replace('.', ',');
}
function reaisToCents(value) {
  const n = parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

// ── Venda & Acesso — o que falta pra sair de "Em breve" pra "Comprar acesso":
// 1) produto_externo_id (dentro do spec) monta o link de checkout da Kiwify;
// 2) entitlementProductId (coluna do Protocol) é o que o webhook da Kiwify
//    precisa bater pra liberar sozinho quando alguém compra de verdade.
// São dois IDs DIFERENTES no painel da Kiwify — o do link de pagamento (oferta)
// e o do produto em si.
function AccessEditor({ spec, setSpec, access, setAccess, slug }) {
  const [grantEmail, setGrantEmail] = useState('');
  const [granting, setGranting] = useState(false);
  const [grantMsg, setGrantMsg] = useState('');

  const grantForTest = async () => {
    if (!grantEmail.trim() || !access.entitlementProductId) return;
    setGranting(true);
    setGrantMsg('');
    try {
      await api.post('/entitlements/admin/grant', { email: grantEmail.trim(), productId: access.entitlementProductId });
      setGrantMsg('Liberado! Esse e-mail já consegue abrir o protocolo.');
      setGrantEmail('');
    } catch {
      setGrantMsg('Não foi possível liberar — confere o e-mail e o ID do produto.');
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="rounded-[20px] border border-gray-100 bg-white shadow-sm p-4 space-y-3 mb-4">
      <p className="text-[10px] font-black uppercase tracking-wide text-gray-400">Venda & acesso</p>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setAccess((a) => ({ ...a, status: a.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }))}
          className="px-3 py-1.5 rounded-full text-[10px] font-black"
          style={access.status === 'PUBLISHED' ? { background: '#ECFDF5', color: '#10B981' } : { background: '#F3F4F6', color: '#9CA3AF' }}>
          {access.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
        </button>
        <button type="button" onClick={() => setAccess((a) => ({ ...a, requiresFounder: !a.requiresFounder }))}
          className="px-3 py-1.5 rounded-full text-[10px] font-black"
          style={access.requiresFounder ? { background: '#F4F3FF', color: C.purple } : { background: '#F3F4F6', color: '#9CA3AF' }}>
          {access.requiresFounder ? 'Exige plano Founder' : 'Não exige Founder'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Subtítulo (tela de venda)</label>
          <input className={fieldCls} value={spec?.subtitulo || ''} onChange={(e) => setSpec((s) => ({ ...s, subtitulo: e.target.value }))} />
        </div>
        <div>
          <label className={labelCls}>Preço (R$)</label>
          <input className={fieldCls} value={centsToReais(spec?.preco_centavos)}
            onChange={(e) => setSpec((s) => ({ ...s, preco_centavos: reaisToCents(e.target.value) }))} placeholder="27,00" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Promessa (frase de venda)</label>
        <textarea className={fieldCls} rows={2} value={spec?.promessa || ''} onChange={(e) => setSpec((s) => ({ ...s, promessa: e.target.value }))} />
      </div>

      <div>
        <label className={labelCls}>ID do link de pagamento Kiwify</label>
        <input className={fieldCls} value={spec?.produto_externo_id || ''} onChange={(e) => setSpec((s) => ({ ...s, produto_externo_id: e.target.value }))}
          placeholder="ex.: 8f2a1c9b-..." />
        <p className={helpCls}>É o código que aparece em pay.kiwify.com.br/&lt;este código&gt; — sem isso o botão fica "Em breve".</p>
      </div>

      <div>
        <label className={labelCls}>ID do produto Kiwify (libera sozinho após compra)</label>
        <input className={fieldCls} value={access.entitlementProductId || ''} onChange={(e) => setAccess((a) => ({ ...a, entitlementProductId: e.target.value }))}
          placeholder="product_id, ou o nome exato do produto na Kiwify" />
        <p className={helpCls}>É diferente do ID do link acima — é o produto em si, o mesmo valor que o webhook da Kiwify manda quando alguém compra.</p>
      </div>

      {access.entitlementProductId && (
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <KeyRound size={11} className="text-gray-400" />
            <p className="text-[9px] font-black uppercase tracking-wide text-gray-400">Liberar manualmente (teste, sem comprar)</p>
          </div>
          <div className="flex items-center gap-1.5">
            <input className={fieldCls} placeholder="email@do-tutor.com" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} />
            <button type="button" onClick={grantForTest} disabled={granting || !grantEmail.trim()}
              className="shrink-0 p-2.5 rounded-xl text-white" style={{ background: C.purple }}>
              {granting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
          {grantMsg && <p className="text-[10px] font-bold mt-1.5" style={{ color: grantMsg.startsWith('Liberado') ? '#10B981' : '#EF4444' }}>{grantMsg}</p>}
        </div>
      )}
    </div>
  );
}

function DayEditor({ dia, index, onUpdate }) {
  const [open, setOpen] = useState(false);
  const set = (patch) => onUpdate(index, { ...dia, ...patch });
  const hasBlocks = Array.isArray(dia.corpo);

  const convertToBlocks = () => {
    const block = makeBlock(BLOCK_TYPES.TEXT);
    block.markdown = typeof dia.corpo === 'string' ? dia.corpo : '';
    set({ corpo: [block] });
  };

  return (
    <div className="rounded-[20px] border border-gray-100 bg-white shadow-sm overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between px-4 py-3.5">
        <div className="text-left min-w-0">
          <p className="text-[9px] font-black uppercase tracking-wide text-gray-400">Dia {dia.numero ?? index + 1}</p>
          <p className="text-[13px] font-black text-gray-700 truncate">{dia.titulo || 'Sem título'}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-300 shrink-0" /> : <ChevronDown size={16} className="text-gray-300 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">
          <div>
            <label className={labelCls}>Título do dia</label>
            <input className={fieldCls} value={dia.titulo || ''} onChange={(e) => set({ titulo: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Tarefa de hoje (resumo curto)</label>
            <input className={fieldCls} value={dia.tarefa || ''} onChange={(e) => set({ tarefa: e.target.value })} />
          </div>
          <div>
            <label className={labelCls}>Por quê (opcional)</label>
            <textarea className={fieldCls} rows={2} value={dia.porque || ''} onChange={(e) => set({ porque: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls} style={{ marginBottom: 0 }}>Conteúdo do dia</label>
              {!hasBlocks && (
                <button type="button" onClick={convertToBlocks} className="flex items-center gap-1 text-[10px] font-black" style={{ color: C.purple }}>
                  <Sparkles size={11} /> Converter em blocos editáveis
                </button>
              )}
            </div>
            {hasBlocks ? (
              <BlockEditor blocks={dia.corpo} onChange={(corpo) => set({ corpo })} />
            ) : (
              <textarea className={fieldCls} rows={4} value={dia.corpo || ''} onChange={(e) => set({ corpo: e.target.value })} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProtocolEditor() {
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState('');
  const [editingSlug, setEditingSlug] = useState(null);
  const [spec, setSpec] = useState(null);
  const [access, setAccess] = useState({ status: 'DRAFT', requiresFounder: false, entitlementProductId: '', summary: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadList = () => {
    setLoadingList(true);
    api.get('/admin/content/protocols').then((r) => setList(r.data || [])).finally(() => setLoadingList(false));
  };

  useEffect(() => { loadList(); }, []);

  const openEdit = async (slug) => {
    setError('');
    const res = await api.get(`/admin/content/protocols/${slug}`);
    setSpec(res.data.spec || {});
    setAccess({
      status: res.data.status || 'DRAFT',
      requiresFounder: !!res.data.requiresFounder,
      entitlementProductId: res.data.entitlementProductId || '',
      summary: res.data.summary || '',
    });
    setEditingSlug(slug);
  };

  const updateDay = (index, nextDia) => {
    setSpec((s) => {
      const dias = [...(s.dias || [])];
      dias[index] = nextDia;
      return { ...s, dias };
    });
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await Promise.all([
        api.patch(`/admin/content/protocols/${editingSlug}/spec`, { spec }),
        api.patch(`/admin/content/protocols/${editingSlug}/access`, access),
      ]);
      setEditingSlug(null);
      loadList();
    } catch (e) {
      setError(e?.response?.data?.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = list.filter((p) => p.title?.toLowerCase().includes(search.toLowerCase()));

  if (editingSlug) {
    const dias = Array.isArray(spec?.dias) ? spec.dias : [];
    return (
      <div className="max-w-2xl">
        <button onClick={() => setEditingSlug(null)} className="flex items-center gap-1.5 text-[12px] font-black text-gray-400 mb-4">
          <ChevronLeft size={15} /> Voltar
        </button>

        <h2 className="text-lg font-black text-gray-800 mb-1">{spec?.titulo || editingSlug}</h2>
        <p className="text-[11px] font-bold text-gray-400 mb-4">{dias.length} dias · edite título, tarefa e conteúdo de cada dia</p>

        <AccessEditor spec={spec} setSpec={setSpec} access={access} setAccess={setAccess} slug={editingSlug} />

        {dias.length === 0 ? (
          <p className="text-[12px] text-gray-400 font-bold mb-4">
            Este protocolo não tem a estrutura de "dias" esperada — não é possível editar por aqui ainda.
          </p>
        ) : (
          <div className="space-y-2.5 mb-5">
            {dias.map((dia, i) => (
              <DayEditor key={dia.numero ?? i} dia={dia} index={i} onUpdate={updateDay} />
            ))}
          </div>
        )}

        {error && <p className="text-[12px] font-bold text-red-500 mb-3">{error}</p>}

        <button onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-white text-sm"
          style={{ background: saving ? '#9ca3af' : C.purple }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Salvando...' : 'Salvar protocolo'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-5">
        <h2 className="text-lg font-black text-gray-800">Protocolos</h2>
        <p className="text-[11px] font-bold text-gray-400">{list.length} protocolos</p>
      </div>

      <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 border border-gray-100 shadow-sm mb-4">
        <Search size={15} className="text-gray-300" />
        <input className="flex-1 outline-none text-[13px] font-medium" placeholder="Buscar protocolo..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loadingList ? (
        <p className="text-[12px] text-gray-400 font-bold">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <button key={p.id} onClick={() => openEdit(p.slug)}
              className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm text-left">
              <div className="min-w-0">
                <p className="text-[13px] font-black text-gray-700 truncate">{p.title}</p>
                <p className="text-[10px] font-bold text-gray-400">{p.totalDays} dias · {p.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-[12px] text-gray-400 font-bold">Nenhum protocolo encontrado.</p>}
        </div>
      )}
    </div>
  );
}
