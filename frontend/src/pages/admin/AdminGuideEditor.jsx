import React, { useEffect, useState } from 'react';
import { Search, Plus, Save, Loader2, ChevronLeft, ExternalLink, Image as ImageIcon, Check } from 'lucide-react';
import api from '../../services/api';
import BlockEditor, { ImageUploadField } from '../../components/content/BlockEditor';
import { guideGradient, guideVisual } from '../../utils/guideVisuals';

const C = { purple: '#8B4AFF' };
const fieldCls = 'w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-medium text-gray-700 outline-none focus:border-[#8B4AFF]';
const labelCls = 'text-[12px] font-black uppercase tracking-wide text-gray-400 mb-1 block';

const EMPTY = {
  slug: '', title: '', theme: '', categoryId: '', excerpt: '', coverUrl: '', body: '',
  blocks: [], tags: [], urgency: '', vejaTambem: [], perguntaIgentvet: '', status: 'DRAFT',
};

function slugify(text) {
  return String(text || '')
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function AdminGuideEditor() {
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // slug being edited, or 'new'
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadList = () => {
    setLoadingList(true);
    api.get('/admin/content/guides').then((r) => setList(r.data || [])).finally(() => setLoadingList(false));
  };

  useEffect(() => {
    loadList();
    api.get('/admin/content/guide-categories').then((r) => setCategories(r.data || [])).catch(() => setCategories([]));
  }, []);

  const openNew = () => { setForm(EMPTY); setEditing('new'); setError(''); };

  const openEdit = async (slug) => {
    setError('');
    const res = await api.get(`/admin/content/guides/${slug}`);
    const entry = res.data;
    setForm({
      slug: entry.slug, title: entry.title, theme: entry.theme || '',
      categoryId: entry.categoryId || '', excerpt: entry.excerpt || '', coverUrl: entry.coverUrl || '', body: entry.body || '',
      blocks: Array.isArray(entry.blocks) ? entry.blocks : [],
      tags: entry.tags || [], urgency: entry.urgency || '', vejaTambem: entry.vejaTambem || [],
      perguntaIgentvet: entry.perguntaIgentvet || '', status: entry.status || 'DRAFT',
    });
    setEditing(slug);
  };

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    if (!form.title.trim()) { setError('Título é obrigatório.'); return; }
    const slug = editing === 'new' ? (form.slug.trim() || slugify(form.title)) : form.slug;
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, slug, theme: form.theme || form.title };
      if (editing === 'new') await api.post('/admin/content/guides', payload);
      else await api.patch(`/admin/content/guides/${slug}`, payload);
      setEditing(null);
      loadList();
    } catch (e) {
      setError(e?.response?.data?.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = list.filter((g) => g.title?.toLowerCase().includes(search.toLowerCase()) || g.slug?.includes(search.toLowerCase()));
  const [showCategories, setShowCategories] = useState(false);

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="flex items-center gap-1.5 text-[12px] font-black text-gray-400 mb-4">
          <ChevronLeft size={15} /> Voltar
        </button>

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-800">{editing === 'new' ? 'Novo verbete' : form.title}</h2>
          {editing !== 'new' && (
            <a href={`/guia/${form.slug}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[12px] font-black" style={{ color: C.purple }}>
              Ver no app <ExternalLink size={12} />
            </a>
          )}
        </div>

        <div className="space-y-4 bg-white rounded-[22px] border border-gray-100 p-5 shadow-sm mb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Título</label>
              <input className={fieldCls} value={form.title} onChange={(e) => set({ title: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Slug {editing !== 'new' && '(fixo)'}</label>
              <input className={fieldCls} value={form.slug} disabled={editing !== 'new'}
                placeholder={slugify(form.title) || 'gerado do título'} onChange={(e) => set({ slug: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Categoria</label>
              <select className={fieldCls} value={form.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
                <option value="">Sem categoria</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Urgência</label>
              <select className={fieldCls} value={form.urgency || ''} onChange={(e) => set({ urgency: e.target.value || null })}>
                <option value="">Nenhuma</option>
                <option value="ROTINA">Rotina</option>
                <option value="ATENCAO">Atenção</option>
                <option value="EMERGENCIA">Emergência</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Resumo curto</label>
            <input className={fieldCls} value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} />
          </div>

          <ImageUploadField
            label="Banner do verbete"
            hint="Aparece no topo do artigo e como miniatura na lista. Sem imagem, usa o banner da categoria (ou o degradê dela)."
            url={form.coverUrl}
            aspect="16 / 7"
            onChange={(coverUrl) => set({ coverUrl })}
          />

          <div>
            <label className={labelCls}>Texto do verbete (usado quando não há blocos abaixo)</label>
            <textarea className={fieldCls} rows={8} value={form.body} onChange={(e) => set({ body: e.target.value })} />
            <div className="mt-2 rounded-xl bg-[#F8F7FF] border border-[#8B4AFF14] px-3 py-2.5 text-[12px] text-gray-500 leading-relaxed">
              <p className="font-black text-gray-600 mb-1">Formatação disponível</p>
              <p><code>## Subtítulo</code> · <code>**negrito**</code> · <code>==marca-texto==</code> · <code>&gt; frase em destaque</code></p>
              <p><code>- item</code> para lista · <code>1. passo</code> para passos numerados</p>
              <p><code>**O que fazer:** texto</code> no começo do parágrafo vira uma caixa de destaque verde</p>
              <p>Deixe uma linha em branco entre parágrafos.</p>
            </div>
          </div>

          <div>
            <label className={labelCls}>Pergunta sugerida ao iGentVet</label>
            <input className={fieldCls} value={form.perguntaIgentvet} onChange={(e) => set({ perguntaIgentvet: e.target.value })} />
          </div>

          <div className="flex items-center gap-3">
            <label className={labelCls} style={{ marginBottom: 0 }}>Publicado</label>
            <button type="button" onClick={() => set({ status: form.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' })}
              className="px-3 py-1 rounded-full text-[10px] font-black"
              style={form.status === 'PUBLISHED' ? { background: '#ECFDF5', color: '#10B981' } : { background: '#F3F4F6', color: '#9CA3AF' }}>
              {form.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}
            </button>
          </div>
        </div>

        <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mb-2">Conteúdo rico</p>
        <BlockEditor blocks={form.blocks} onChange={(blocks) => set({ blocks })} />

        {error && <p className="text-[12px] font-bold text-red-500 mt-3">{error}</p>}

        <button onClick={save} disabled={saving}
          className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-white text-sm"
          style={{ background: saving ? '#9ca3af' : C.purple }}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Salvando...' : 'Salvar verbete'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-black text-gray-800">Guia / Biblioteca</h2>
          <p className="text-[12px] font-bold text-gray-400">{list.length} verbetes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCategories((v) => !v)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[12px] font-black border border-gray-200 bg-white" style={{ color: C.purple }}>
            <ImageIcon size={14} /> {showCategories ? 'Fechar categorias' : 'Banners das categorias'}
          </button>
          <button onClick={openNew} className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[12px] font-black text-white" style={{ background: C.purple }}>
            <Plus size={14} /> Novo verbete
          </button>
        </div>
      </div>

      {showCategories ? (
        <CategoryManager
          categories={categories}
          onSaved={(updated) => setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))}
        />
      ) : null}

      <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 border border-gray-100 shadow-sm mb-4">
        <Search size={15} className="text-gray-300" />
        <input className="flex-1 outline-none text-[13px] font-medium" placeholder="Buscar verbete..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loadingList ? (
        <p className="text-[12px] text-gray-400 font-bold">Carregando...</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => (
            <button key={g.id} onClick={() => openEdit(g.slug)}
              className="w-full flex items-center gap-3 bg-white rounded-2xl px-3 py-2.5 border border-gray-100 shadow-sm text-left">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={g.coverUrl || g.category?.coverUrl ? undefined : { background: guideGradient(g.categoryId) }}>
                {g.coverUrl || g.category?.coverUrl
                  ? <img src={g.coverUrl || g.category?.coverUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-lg">{guideVisual(g.categoryId).emoji}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-black text-gray-700 truncate">{g.title}</p>
                <p className="text-[10px] font-bold text-gray-400">{g.category?.nome || g.theme} · {g.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'} {Array.isArray(g.blocks) && g.blocks.length > 0 ? '· com blocos' : ''}</p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-[12px] text-gray-400 font-bold">Nenhum verbete encontrado.</p>}
        </div>
      )}
    </div>
  );
}

// Banner, nome e descrição de cada categoria do Almanaque.
function CategoryManager({ categories, onSaved }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
      {categories.map((cat) => <CategoryCard key={cat.id} category={cat} onSaved={onSaved} />)}
    </div>
  );
}

function CategoryCard({ category, onSaved }) {
  const [form, setForm] = useState({ nome: category.nome || '', descricao: category.descricao || '', coverUrl: category.coverUrl || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dirty = form.nome !== (category.nome || '') || form.descricao !== (category.descricao || '') || form.coverUrl !== (category.coverUrl || '');

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/content/guide-categories/${category.id}`, form);
      onSaved(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      alert(e?.response?.data?.message || 'Não foi possível salvar a categoria.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 space-y-3">
        <ImageUploadField
          label={`Banner · ${category.id}`}
          url={form.coverUrl}
          aspect="16 / 7"
          onChange={(coverUrl) => setForm((f) => ({ ...f, coverUrl }))}
        />
        {!form.coverUrl ? (
          <div className="h-10 rounded-xl flex items-center justify-end pr-3 text-xl -mt-1" style={{ background: guideGradient(category.id) }}>
            <span className="text-[10px] font-black text-white/90 mr-auto pl-3">Sem banner: usa este degradê</span>
            {guideVisual(category.id).emoji}
          </div>
        ) : null}
        <input className={fieldCls} value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome" />
        <textarea className={fieldCls} rows={2} value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Descrição curta" />
        <button
          type="button"
          onClick={save}
          disabled={!dirty || saving}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-black text-white disabled:opacity-40"
          style={{ background: saved ? '#10B981' : C.purple }}
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saving ? 'Salvando...' : saved ? 'Salvo' : 'Salvar categoria'}
        </button>
      </div>
    </div>
  );
}
